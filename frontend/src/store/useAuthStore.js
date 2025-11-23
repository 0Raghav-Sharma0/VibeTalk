// src/store/useAuthStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios.js";
import { requestNotificationPermission, showSystemNotification } from "../utils/notifications";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL || "https://blah-blah-3.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    try {
      const res = await axiosInstance.get("/auth/check-auth");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (err) {
      console.warn("checkAuth failed", err);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      localStorage.setItem("token", res.data.token);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Account created!");
      return true;
    } catch (err) {
      console.error("signup error", err);
      toast.error(err.response?.data?.message || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Logged in!");
      return true;
    } catch (err) {
      console.error("login error", err);
      toast.error("Invalid credentials");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (err) {
      console.warn("logout backend error:", err);
    }

    localStorage.removeItem("token");

    const s = get().socket;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }

    set({ authUser: null, socket: null, onlineUsers: [] });
    window.location.replace("/login");
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated!");
    } catch (err) {
      console.error("updateProfile error", err);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser) {
      console.warn("connectSocket: no authUser, skipping");
      return;
    }

    if (socket && socket.connected) {
      console.log("Socket already connected:", socket.id);
      return;
    }

    const sock = io(BASE_URL, {
      query: { userId: authUser._id },
      auth: {
        token: localStorage.getItem("token"),
        userId: authUser._id,
        username: authUser.username || authUser.fullName || "User"
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    sock.on("connect", () => {
      console.log("🟢 Connected to socket:", sock.id);
      requestNotificationPermission();
    });

    sock.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err?.message || err);
    });

    sock.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      set({ onlineUsers: [] });
    });

    // ============================================
    // EXISTING SOCKET LISTENERS
    // ============================================
    sock.off("getOnlineUsers");
    sock.on("getOnlineUsers", (ids) => {
      const safe = Array.isArray(ids) ? ids : [];
      set({ onlineUsers: safe });
    });

    sock.off("incoming-call");
    sock.on("incoming-call", ({ from, callType, callerName, offer }) => {
      console.log("📞 INCOMING CALL EVENT:", { from, callType, hasOffer: !!offer });
      
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        const { setIncomingCall } = useVideoCallStore.getState();
        setIncomingCall(from, offer, callType);
        
        showSystemNotification({
          title: `Incoming ${callType} call`,
          body: `${callerName || "Someone"} is calling you...`,
          icon: "/phone-icon.png",
          onClick: () => window.focus(),
        });
      });
    });

    sock.off("call-failed");
    sock.on("call-failed", ({ reason }) => {
      console.log("❌ CALL FAILED:", reason);
      
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        const { resetCallState } = useVideoCallStore.getState();
        resetCallState();
        toast.error(reason || "Call failed");
      });
    });

    sock.off("call-rejected");
    sock.on("call-rejected", ({ by }) => {
      console.log("❌ CALL REJECTED by:", by);
      
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        const { resetCallState } = useVideoCallStore.getState();
        resetCallState();
        toast.error("Call was rejected");
      });
    });

    sock.off("call-ended");
    sock.on("call-ended", ({ by }) => {
      console.log("📞 CALL ENDED by:", by);
      
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        const { resetCallState } = useVideoCallStore.getState();
        resetCallState();
      });
    });

    // ============================================
    // WATCH PARTY SOCKET LISTENERS (NEW)
    // ============================================
    
    // Note: These are handled in WatchPartyContext, but we ensure
    // the socket is properly configured to support them
    
    sock.off("watchparty:room-created");
    sock.off("watchparty:room-joined");
    sock.off("watchparty:participants-updated");
    sock.off("watchparty:state-synced");
    sock.off("watchparty:reaction-received");
    sock.off("watchparty:chat-received");
    sock.off("watchparty:error");

    // Watch party notification handlers (optional)
    sock.on("watchparty:room-created", (data) => {
      console.log("🎬 Watch party room created:", data.roomId);
    });

    sock.on("watchparty:error", (error) => {
      console.error("🎬 Watch party error:", error);
      toast.error(error.message || "Watch party error occurred");
    });

    set({ socket: sock });
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (!s) return;

    try {
      s.removeAllListeners();
      s.disconnect();
    } catch (err) {
      console.warn("disconnectSocket error", err);
    } finally {
      set({ socket: null, onlineUsers: [] });
    }
  },
}));