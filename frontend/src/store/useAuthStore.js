// src/store/useAuthStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

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

  /* ============================================================
     CHECK AUTH (runs on refresh)
  ============================================================ */
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
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  /* ============================================================
     SIGNUP
  ============================================================ */
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

  /* ============================================================
     LOGIN
  ============================================================ */
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
      toast.error("Invalid credentials");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  /* ============================================================
     LOGOUT — FIXED (NO REFRESH NEEDED)
  ============================================================ */
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (err) {
      console.log("Logout error:", err);
    }

    localStorage.removeItem("token");

    // 🔥 Reset all auth-related state
    set({
      authUser: null,
      onlineUsers: [],
    });

    get().disconnectSocket();

    toast.success("Logged out");

    // Optional redirect
    window.location.href = "/login";
  },

  /* ============================================================
     UPDATE PROFILE
  ============================================================ */
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

  /* ============================================================
     SOCKET: CONNECT
  ============================================================ */
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // Avoid multiple connections
    if (get().socket && get().socket.connected) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    socket.on("getOnlineUsers", (ids) => set({ onlineUsers: ids }));

    set({ socket });
  },

  /* ============================================================
     SOCKET: DISCONNECT (FIX)
  ============================================================ */
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) socket.disconnect();
    set({ socket: null });
  },
}));