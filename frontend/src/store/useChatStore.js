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

  unreadMessages: {},
  typing: {},

  /* ============================================================
        🔥 LOCAL USER UPDATE (PROFILE SYNC FIX)
  ============================================================ */
  updateUserLocally: (updatedUser) =>
    set((state) => ({
      users: state.users.map((u) =>
        u._id === updatedUser._id ? { ...u, ...updatedUser } : u
      ),
      selectedUser:
        state.selectedUser?._id === updatedUser._id
          ? { ...state.selectedUser, ...updatedUser }
          : state.selectedUser,
    })),

  /* ============================================================
        ✅ SAFE ONLINE MERGE
  ============================================================ */
  applyOnlineToUsers: (usersList, onlineIds) => {
    if (!Array.isArray(usersList)) return [];

    const onlineArray = Array.isArray(onlineIds)
      ? onlineIds
      : Object.keys(onlineIds || {});

    const onlineSet = new Set(onlineArray);

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

      set({
        users: get().applyOnlineToUsers(res.data, onlineUsers),
      });
    } catch {
      toast.error("Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ============================================================
        LOAD MESSAGES
  ============================================================ */
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({
        messages: res.data,
        isMessagesLoading: false,
      });
    } catch {
      toast.error("Failed to load messages");
      set({ isMessagesLoading: false });
    }
  },

  /* ============================================================
        SEND MESSAGE (OPTIMISTIC)
  ============================================================ */
  sendMessage: (msgData) => {
    const { authUser, socket } = useAuthStore.getState();
    const { selectedUser, messages } = get();
    if (!selectedUser || !socket) return;

    const tempId = `temp-${Date.now()}`;

    const optimistic = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      ...msgData,
      createdAt: new Date().toISOString(),
      delivered: false,
      seen: false,
    };

    set({ messages: [...messages, optimistic] });

    socket.emit("sendMessage", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
      ...msgData,
      tempId,
    });
  },

  /* ============================================================
        SOCKET SUBSCRIPTIONS
  ============================================================ */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      const { messages, selectedUser, unreadMessages } = get();
      const { authUser } = useAuthStore.getState();

      const cleaned = messages.filter(
        (m) =>
          !(
            m._id.startsWith("temp-") &&
            m.text === msg.text &&
            m.senderId === msg.senderId
          )
      );

      if (msg.senderId === authUser._id) {
        set({ messages: [...cleaned, msg] });
        return;
      }

      if (selectedUser?._id === msg.senderId) {
        set({ messages: [...cleaned, msg] });

        socket.emit("msg-seen", {
          myId: authUser._id,
          friendId: msg.senderId,
        });
      } else {
        set({
          unreadMessages: {
            ...unreadMessages,
            [msg.senderId]: (unreadMessages[msg.senderId] || 0) + 1,
          },
        });

        showSystemNotification({
          title: msg.senderName || "New Message",
          body:
            msg.text ||
            (msg.image && "📷 Photo") ||
            (msg.video && "🎥 Video") ||
            (msg.file && "📎 File"),
          icon: msg.senderAvatar || "/message_icon.png",
          onClick: () => window.focus(),
        });
      }
    });

    socket.off("typing");
    socket.on("typing", ({ senderId, isTyping }) => {
      set({
        typing: { ...get().typing, [senderId]: isTyping },
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("typing");
  },

  /* ============================================================
        SELECT USER
  ============================================================ */
  setSelectedUser: async (user) => {
    const { authUser, socket } = useAuthStore.getState();

    if (!user) {
      set({ selectedUser: null, messages: [] });
      return;
    }

    set({
      selectedUser: user,
      messages: [],
      isMessagesLoading: true,
    });

    await get().getMessages(user._id);

    if (socket && authUser) {
      socket.emit("msg-seen", {
        myId: authUser._id,
        friendId: user._id,
      });
    }
  },

  emitTyping: (isTyping) => {
    const { selectedUser } = get();
    const { authUser, socket } = useAuthStore.getState();
    if (socket && selectedUser && authUser) {
      socket.emit("typing", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
        isTyping,
      });
    }
  },
}));

/* ============================================================
        ✅ ONLINE STATUS SYNC (FINAL FIX)
============================================================ */
useAuthStore.subscribe(
  (onlineIds) => {
    const apply = useChatStore.getState().applyOnlineToUsers;

    const onlineArray = Array.isArray(onlineIds)
      ? onlineIds
      : Object.keys(onlineIds || {});

    const onlineSet = new Set(onlineArray);

    useChatStore.setState((state) => ({
      users: apply(state.users, onlineArray),
      selectedUser: state.selectedUser
        ? {
            ...state.selectedUser,
            isOnline: onlineSet.has(state.selectedUser._id),
          }
        : null,
    }));
  },
  (state) => state.onlineUsers
);
