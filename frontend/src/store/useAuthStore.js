// src/store/useAuthStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios.js";

/**
 * Auth + Socket store
 *
 * Responsibilities:
 * - Manage authUser object (from /auth endpoints)
 * - Create / clean up a single socket connection (with userId query)
 * - Expose onlineUsers list for other stores to consume
 *
 * NOTE: The server expects socket handshake query { userId } (see backend/socket.js).
 */

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : import.meta.env.VITE_BACKEND_URL || "https://blah-blah-3.onrender.com";

export const useAuthStore = create((set, get) => ({
  /******************************
   * state
   ******************************/
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [], // array of userIds
  socket: null,

  /******************************
   * check auth (runs on app load)
   ******************************/
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    try {
      const res = await axiosInstance.get("/auth/check-auth");
      set({ authUser: res.data });
      // Connect socket after successful auth
      get().connectSocket();
    } catch (err) {
      console.warn("checkAuth failed", err);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  /******************************
   * signup
   ******************************/
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      localStorage.setItem("token", res.data.token);
      set({ authUser: res.data });

      // connect socket
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

  /******************************
   * login
   ******************************/
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
      set({ authUser: res.data });

      // connect socket
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

  /******************************
   * logout
   ******************************/
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (err) {
      console.warn("logout backend error (ignoring):", err);
    }

    // clear token + local state
    localStorage.removeItem("token");

    // reset store state and disconnect socket
    set({ authUser: null, onlineUsers: [] });
    get().disconnectSocket();

    toast.success("Logged out");
    // optional: redirect to login (your app already does this in logout flow)
    window.location.href = "/login";
  },

  /******************************
   * update profile
   ******************************/
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

  /******************************
   * SOCKET: connect
   *
   * - Ensures only one socket exists.
   * - Uses query: { userId } as your server expects.
   * - Sets minimal core listeners (getOnlineUsers/connect/disconnect).
   * - Other parts of app (chat, videocall) may also register listeners.
   ******************************/
  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser) {
      console.warn("connectSocket: no authUser, skipping");
      return;
    }

    // avoid duplicate socket connections
    if (socket && socket.connected) {
      console.log("Socket already connected:", socket.id);
      return;
    }

    // create socket
    const sock = io(BASE_URL, {
      query: { userId: authUser._id },
      transports: ["websocket"],
      // optional: automatic reconnection allowed by socket.io by default
    });

    // connection events
    sock.on("connect", () => {
      console.log("🟢 Connected to socket:", sock.id);
    });

    sock.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err?.message || err);
    });

    sock.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      // keep socket reference for potential reconnect attempts,
      // but mark onlineUsers empty until getOnlineUsers arrives again
      set({ onlineUsers: [] });
    });

    // server sends list of online userIds
    sock.off("getOnlineUsers"); // safety: remove duplicate listeners
    sock.on("getOnlineUsers", (ids) => {
      // ensure array
      const safe = Array.isArray(ids) ? ids : [];
      set({ onlineUsers: safe });
    });

    // Save socket reference in store
    set({ socket: sock });
  },

  /******************************
   * SOCKET: disconnect
   ******************************/
  disconnectSocket: () => {
    const s = get().socket;
    if (!s) return;

    try {
      s.off("getOnlineUsers");
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.disconnect();
    } catch (err) {
      console.warn("disconnectSocket error", err);
    } finally {
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
