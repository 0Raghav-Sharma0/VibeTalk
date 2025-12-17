import { create } from "zustand";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios.js";
import {
  requestNotificationPermission,
  showSystemNotification,
} from "../utils/notifications";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL ||
      "https://blah-blah-3.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  /* ================= AUTH CHECK ================= */
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
    } catch {
      toast.error("Invalid credentials");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {}

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
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  /* ================= SOCKET ================= */
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;
    if (socket && socket.connected) return;

    const sock = io(BASE_URL, {
      query: { userId: authUser._id },
      auth: {
        token: localStorage.getItem("token"),
        userId: authUser._id,
        username: authUser.username || authUser.fullName || "User",
      },
      transports: ["websocket", "polling"],
    });

    sock.on("connect", () => {
      console.log("🟢 Connected:", sock.id);
      requestNotificationPermission();
    });

    sock.on("getOnlineUsers", (ids) => {
      set({ onlineUsers: Array.isArray(ids) ? ids : [] });
    });

    sock.on("incoming-call", ({ from, callType, callerName, offer }) => {
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        useVideoCallStore
          .getState()
          .setIncomingCall(from, offer, callType);

        showSystemNotification({
          title: `Incoming ${callType} call`,
          body: `${callerName || "Someone"} is calling you`,
          icon: "/phone-icon.png",
          onClick: () => window.focus(),
        });
      });
    });

    sock.on("call-failed", ({ reason }) => {
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        useVideoCallStore.getState().resetCallState();
        toast.error(reason || "Call failed");
      });
    });

    sock.on("call-rejected", () => {
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        useVideoCallStore.getState().resetCallState();
        toast.error("Call was rejected");
      });
    });

    /* 🔥 FIXED BLOCK */
    sock.on("call-ended", ({ by }) => {
      import("./useVideoCallStore").then(({ useVideoCallStore }) => {
        const { isCallActive } = useVideoCallStore.getState();

        if (!isCallActive) {
          console.log("⏸ Ignoring premature call-ended");
          return;
        }

        useVideoCallStore.getState().resetCallState();
      });
    });

    set({ socket: sock });
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (!s) return;
    s.removeAllListeners();
    s.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
