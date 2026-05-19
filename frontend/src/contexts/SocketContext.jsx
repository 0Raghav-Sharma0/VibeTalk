import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx.socket;
};

export const useSocketStatus = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketStatus must be used within SocketProvider");
  return ctx.isConnected;
};

/**
 * Reuses the single authenticated chat socket (no second connection for Watch Party).
 */
export const SocketProvider = ({ children }) => {
  const socket = useAuthStore((s) => s.socket);
  const [isConnected, setIsConnected] = useState(Boolean(socket?.connected));

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
