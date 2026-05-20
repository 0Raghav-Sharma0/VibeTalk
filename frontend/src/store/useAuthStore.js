import { create } from "zustand";
import toast from "react-hot-toast";
import { authApi } from "../services/authApi.js";
import { sameOnlineSet } from "../utils/presence.js";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  setCheckingAuth: (v) => set({ isCheckingAuth: v }),
  setOnlineUsers: (onlineUsers) =>
    set((state) => {
      const next = Array.isArray(onlineUsers)
        ? onlineUsers
        : Object.keys(onlineUsers || {});
      if (sameOnlineSet(state.onlineUsers, next)) return state;
      return { onlineUsers: next };
    }),
  setSocket: (socket) => set({ socket }),

  clearAuth: () => {
    const s = get().socket;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
    set({ authUser: null, socket: null, onlineUsers: [] });
  },

  syncUser: async (profile) => {
    try {
      const res = await authApi.sync(profile);
      set({ authUser: res.data });
    } catch (err) {
      console.warn("syncUser failed", err);
      set({ authUser: null });
      const msg = err.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else if (!err.response) {
        toast.error(
          "Signed in with Clerk but the API is unreachable. Check VITE_BACKEND_URL and that Render is running."
        );
      } else {
        toast.error("Could not sync your account with the server.");
      }
    }
  },

  patchAuthUser: (partial) =>
    set((state) =>
      state.authUser ? { authUser: { ...state.authUser, ...partial } } : state
    ),

  updateProfile: async (data, { silent = false } = {}) => {
    if (!silent) set({ isUpdatingProfile: true });
    try {
      const res = await authApi.updateProfile(data);
      set({ authUser: res.data });
      if (!silent) toast.success("Profile updated!");
      return res.data;
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || "Update failed");
      throw err;
    } finally {
      if (!silent) set({ isUpdatingProfile: false });
    }
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (!s) return;
    s.removeAllListeners();
    s.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
