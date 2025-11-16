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

  // ---------------------------------------------------------
  // CHECK AUTH ON APP LOAD
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // SIGNUP
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------
  logout: async () => {
    await axiosInstance.post("/auth/logout");
    localStorage.removeItem("token");
    get().disconnectSocket();
    set({ authUser: null });
    toast.success("Logged out");
  },

  // ---------------------------------------------------------
  // UPDATE PROFILE
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // SOCKET CONNECT (REAL-TIME)
  // ---------------------------------------------------------
  connectSocket: () => {
    const { authUser, socket: existingSocket } = get();
    if (!authUser) return;

    // Already connected? -> Do not create another socket
    if (existingSocket && existingSocket.connected) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
      transports: ["websocket"],
      reconnection: true,
    });

    // Prevent duplicate listeners
    socket.off("getOnlineUsers");

    socket.on("getOnlineUsers", (ids) => {
      console.log("🔥 Online users updated:", ids);
      set({ onlineUsers: ids });
    });

    set({ socket });
  },

  // ---------------------------------------------------------
  // SOCKET DISCONNECT
  // ---------------------------------------------------------
  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.off("getOnlineUsers"); // cleanup listener
      socket.disconnect();
    }

    set({ socket: null, onlineUsers: [] });
  },
}));
