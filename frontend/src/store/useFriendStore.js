import { create } from "zustand";
import toast from "react-hot-toast";
import { friendApi } from "../services/friendApi.js";
import { getApiErrorMessage } from "../utils/apiError.js";
import { useChatStore } from "./useChatStore.js";

export const useFriendStore = create((set, get) => ({
  pendingIncoming: [],
  pendingOutgoing: [],
  isPendingLoading: false,
  isSearching: false,
  searchResult: null,

  fetchPendingRequests: async () => {
    set({ isPendingLoading: true });
    try {
      const res = await friendApi.getPending();
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

  searchByUsername: async (username) => {
    if (!username?.trim()) return;
    set({ isSearching: true, searchResult: null });
    try {
      const res = await friendApi.search(username);
      set({ searchResult: res.data, isSearching: false });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "User not found"));
      set({ searchResult: null, isSearching: false });
    }
  },

  clearSearch: () => set({ searchResult: null }),

  sendRequest: async (username) => {
    try {
      const res = await friendApi.sendRequest(username);
      set((s) => ({
        pendingOutgoing: [res.data, ...s.pendingOutgoing],
        searchResult: null,
      }));
      toast.success("Friend request sent!");
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send request"));
      return false;
    }
  },

  acceptRequest: async (requestId) => {
    try {
      await friendApi.accept(requestId);
      set((s) => ({
        pendingIncoming: s.pendingIncoming.filter((r) => r._id !== requestId),
      }));
      useChatStore.getState().getUsers({ force: true });
      toast.success("Friend added!");
      return true;
    } catch {
      toast.error("Failed to accept");
      return false;
    }
  },

  rejectRequest: async (requestId) => {
    try {
      await friendApi.reject(requestId);
      set((s) => ({
        pendingIncoming: s.pendingIncoming.filter((r) => r._id !== requestId),
      }));
      return true;
    } catch {
      toast.error("Failed to reject");
      return false;
    }
  },

  removeFriend: async (friendId) => {
    try {
      await friendApi.remove(friendId);
      useChatStore.getState().getUsers({ force: true });
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

  onFriendRequestReceived: () => get().fetchPendingRequests(),
  onFriendRequestAccepted: () => {
    get().fetchPendingRequests();
    useChatStore.getState().getUsers({ force: true });
  },
  onFriendRemoved: () => useChatStore.getState().getUsers({ force: true }),
}));
