// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { showSystemNotification } from "../utils/notifications";

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
        SAFE ONLINE MERGE
  ============================================================ */
  applyOnlineToUsers: (usersList, onlineIds) => {
    if (!Array.isArray(usersList)) return [];
    const safeOnlineIds = Array.isArray(onlineIds) ? onlineIds : [];
    const onlineSet = new Set(safeOnlineIds);

    return usersList.map((u) => ({
      ...u,
      isOnline: onlineSet.has(u._id),
    }));
  },

  /* ============================================================
        LOAD USERS
  ============================================================ */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");

      const onlineUsers = useAuthStore.getState().onlineUsers;
      const apply = get().applyOnlineToUsers;

      const merged = apply(res.data, onlineUsers);
      set({ users: merged });
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ============================================================
        LOAD MESSAGES
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
        SEND MESSAGE
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
        SOCKET LISTENER: NEW MESSAGES + TYPING
  ============================================================ */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    /* ---- NEW MESSAGE ---- */
    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      const { selectedUser, messages, unreadMessages } = get();
      const { authUser } = useAuthStore.getState();

      // You sent it
      if (msg.senderId === authUser._id) {
        set({ messages: [...messages, msg] });
        return;
      }

      // Chat is open with this user → append normally
      if (selectedUser && selectedUser._id === msg.senderId) {
        set({ messages: [...messages, msg] });
      } else {
        // Add unread
        const updatedUnread = {
          ...unreadMessages,
          [msg.senderId]: (unreadMessages[msg.senderId] || 0) + 1,
        };
        set({ unreadMessages: updatedUnread });

        // ⭐ ALWAYS show notification if message is from another user
        showSystemNotification({
          title: msg.senderName || "New Message",
          body: msg.text || "Sent you a message",
          icon: "/message_icon.png",
          onClick: () => window.focus(),
        });
      }
    });

    /* ---- TYPING ---- */
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
        SELECT USER + RESET UNREAD
  ============================================================ */
  setSelectedUser: (selectedUser) => {
    if (!selectedUser) {
      set({ selectedUser: null, messages: [] });
      return;
    }

    const { unreadMessages } = get();
    const updatedUnread = { ...unreadMessages };
    delete updatedUnread[selectedUser._id];

    const online = useAuthStore.getState().onlineUsers || [];
    const isOnline = Array.isArray(online)
      ? online.includes(selectedUser._id)
      : false;

    set({
      selectedUser: { ...selectedUser, isOnline },
      unreadMessages: updatedUnread,
      messages: [],
      isMessagesLoading: false,
    });
  },
}));

/* ============================================================
        REAL-TIME ONLINE LISTENER
============================================================ */
useAuthStore.subscribe(
  (onlineIds) => {
    const safeIds = Array.isArray(onlineIds) ? onlineIds : [];
    const apply = useChatStore.getState().applyOnlineToUsers;

    setTimeout(() => {
      useChatStore.setState((state) => {
        const updatedUsers = apply(state.users, safeIds);

        let updatedSelected = state.selectedUser;
        if (updatedSelected) {
          updatedSelected = {
            ...updatedSelected,
            isOnline: safeIds.includes(updatedSelected._id),
          };
        }

        return {
          users: updatedUsers,
          selectedUser: updatedSelected,
        };
      });
    });
  },
  (s) => s.onlineUsers
);
