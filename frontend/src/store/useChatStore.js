// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Unread badge storage: { userId: count }
  unreadMessages: {},

  // Typing indicator storage { userId: true/false }
  typing: {},

  /* ============================================================
     LOAD USERS
  ============================================================ */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ============================================================
     LOAD MESSAGES FOR CURRENT CHAT
  ============================================================ */
  getMessages: async (userId) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data, isMessagesLoading: false });
    } catch (error) {
      toast.error("Failed to load messages");
      set({ isMessagesLoading: false });
    }
  },

  /* ============================================================
     SEND MESSAGE (SOCKET)
  ============================================================ */
  sendMessage: async (messageData) => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    const { authUser } = useAuthStore.getState();

    socket.emit("sendMessage", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image || null,
      video: messageData.video || null,
    });
  },

  /* ============================================================
     SOCKET: LISTEN (NEW MESSAGES + TYPING)
  ============================================================ */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    /* NEW MESSAGES */
    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      const { selectedUser, messages, unreadMessages } = get();
      const { authUser } = useAuthStore.getState();

      if (msg.senderId === authUser._id) {
        set({ messages: [...messages, msg] });
        return;
      }

      if (selectedUser && selectedUser._id === msg.senderId) {
        set({ messages: [...messages, msg] });
        return;
      }

      const updatedUnread = {
        ...unreadMessages,
        [msg.senderId]: (unreadMessages[msg.senderId] || 0) + 1,
      };

      set({ unreadMessages: updatedUnread });
    });

    /* TYPING INDICATOR */
    socket.off("typing");
    socket.on("typing", ({ senderId, isTyping }) => {
      const typingMap = { ...get().typing };
      typingMap[senderId] = isTyping;

      set({ typing: typingMap });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("typing");
  },

  /* ============================================================
     SELECT USER (RESET UNREAD)
  ============================================================ */
  setSelectedUser: (selectedUser) => {
    if (!selectedUser) {
      set({ selectedUser: null, messages: [] });
      return;
    }

    const { unreadMessages } = get();
    const updatedUnread = { ...unreadMessages };
    delete updatedUnread[selectedUser._id];

    set({
      selectedUser,
      unreadMessages: updatedUnread,
      messages: [],
      isMessagesLoading: false,
    });
  },
}));
