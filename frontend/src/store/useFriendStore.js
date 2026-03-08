import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
  pendingIncoming: [],
  pendingOutgoing: [],
  isPendingLoading: false,
  isSearching: false,
  searchResult: null,

  /* ============================================================
     FETCH PENDING REQUESTS
  ============================================================ */
  fetchPendingRequests: async () => {
    set({ isPendingLoading: true });
    try {
      const res = await axiosInstance.get("/friends/pending");
      set({
        pendingIncoming: res.data.incoming || [],
        pendingOutgoing: res.data.outgoing || [],
        isPendingLoading: false,
      });
    } catch {
      toast.error("Failed to load pending requests");
      set({ isPendingLoading: false });
    }
  },

  /* ============================================================
     SEARCH USER BY USERNAME
  ============================================================ */
  searchByUsername: async (username) => {
    if (!username?.trim()) return;
    set({ isSearching: true, searchResult: null });
    try {
      const res = await axiosInstance.get(`/friends/search?username=${encodeURIComponent(username.trim())}`);
      set({ searchResult: res.data, isSearching: false });
    } catch (err) {
      const msg = err.response?.data?.error || "User not found";
      toast.error(msg);
      set({ searchResult: null, isSearching: false });
    }
  },

  clearSearch: () => set({ searchResult: null }),

  /* ============================================================
     SEND FRIEND REQUEST
  ============================================================ */
  sendRequest: async (username) => {
    try {
      const res = await axiosInstance.post("/friends/request", { username: username.trim() });
      set((s) => ({
        pendingOutgoing: [res.data, ...s.pendingOutgoing],
        searchResult: null,
      }));
      toast.success("Friend request sent!");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send request");
      return false;
    }
  },

  /* ============================================================
     ACCEPT REQUEST
  ============================================================ */
  acceptRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/friends/accept/${requestId}`);
      set((s) => ({
        pendingIncoming: s.pendingIncoming.filter((r) => r._id !== requestId),
      }));
      useChatStore.getState().getUsers();
      toast.success("Friend added!");
      return true;
    } catch {
      toast.error("Failed to accept");
      return false;
    }
  },

  /* ============================================================
     REJECT REQUEST
  ============================================================ */
  rejectRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/friends/reject/${requestId}`);
      set((s) => ({
        pendingIncoming: s.pendingIncoming.filter((r) => r._id !== requestId),
      }));
      return true;
    } catch {
      toast.error("Failed to reject");
      return false;
    }
  },

  /* ============================================================
     REMOVE FRIEND
  ============================================================ */
  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);
      useChatStore.getState().getUsers();
      const { selectedUser } = useChatStore.getState();
      if (selectedUser?._id === friendId) {
        useChatStore.getState().setSelectedUser(null);
      }
      toast.success("Friend removed");
      return true;
    } catch {
      toast.error("Failed to remove friend");
      return false;
    }
  },

  /* ============================================================
     SOCKET HANDLERS (called from App / auth store)
  ============================================================ */
  onFriendRequestReceived: (data) => {
    get().fetchPendingRequests();
  },

  onFriendRequestAccepted: () => {
    get().fetchPendingRequests();
    useChatStore.getState().getUsers();
  },

  onFriendRemoved: () => {
    useChatStore.getState().getUsers();
  },
}));
