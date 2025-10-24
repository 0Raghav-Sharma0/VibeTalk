import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// ✅ Use correct backend URL for both local and production
const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL || "https://blah-blah-3.onrender.com";

console.log("🔌 Socket connecting to:", BASE_URL);

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // ✅ Check if user already authenticated
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error.message);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ✅ Signup
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      const token = res.data.token;
      if (token) localStorage.setItem("token", token);

      set({ authUser: res.data });
      toast.success("Account created successfully 🎉");
      get().connectSocket();
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Signup failed. Please try again.";
      toast.error(errorMessage);
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ✅ Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      const token = res.data.token;
      if (token) localStorage.setItem("token", token);

      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      await get().checkAuth();
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage =
        error.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(errorMessage);
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ✅ Logout
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem("token");
      set({ authUser: null });
      toast.success("Logged out successfully");
      setTimeout(() => {
        get().disconnectSocket();
        window.location.href = "/login";
      }, 1200);
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed.");
    }
  },

  // ✅ Update Profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.post("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // ✅ Socket connection (with CORS-safe config)
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    console.log("⚡ Connecting socket to:", BASE_URL);

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
      transports: ["websocket", "polling"], // ✅ ensure compatibility on Render
      withCredentials: true, // ✅ allow cross-origin cookies
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.connect();

    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("connect_error", (err) =>
      console.error("❌ Socket connection error:", err.message)
    );

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      console.log("🔌 Socket disconnected");
      set({ socket: null });
    }
  },
}));
