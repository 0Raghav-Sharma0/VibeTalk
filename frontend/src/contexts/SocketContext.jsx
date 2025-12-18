// src/contexts/SocketContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return ctx.socket;
};

export const useSocketStatus = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocketStatus must be used within SocketProvider");
  }
  return ctx.isConnected;
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 🔒 Prevent double creation (React 18 StrictMode)
    if (socketRef.current) {
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    let socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_SOCKET_URI ||
      import.meta.env.VITE_BACKEND_URL;

    if (socketUrl?.endsWith("/api")) {
      socketUrl = socketUrl.slice(0, -4);
    }

    if (!socketUrl) {
      console.error("❌ No socket URL configured");
      return;
    }

    console.log("🔌 Initializing socket connection to:", socketUrl);

    const socket = io(socketUrl, {
      auth: {
        token,
        userId: user?._id,
        username: user?.username || user?.fullName || "Guest",
      },
      transports: ["websocket"], // 🔥 IMPORTANT
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      setIsConnected(false);

      // Auto-reconnect if server dropped us
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connect_error:", err.message);
      setIsConnected(false);
    });

    socket.on("reconnect", (attempt) => {
      console.log("🔄 Socket reconnected after", attempt, "attempts");
      setIsConnected(true);
    });

    socketRef.current = socket;

    // ❌ DO NOT CLEAN UP SOCKET HERE
    // React StrictMode WILL break calls
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
