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
        SEND MESSAGE - FIXED
  ============================================================ */
  sendMessage: async (msgData) => {
    const { authUser, socket } = useAuthStore.getState();
    const { selectedUser, messages } = get();

    if (!selectedUser) {
      console.warn("❌ No selectedUser in sendMessage");
      return;
    }

    if (!socket) {
      console.error("❌ No socket connection");
      toast.error("Not connected to server");
      return;
    }

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      ...msgData,
      createdAt: new Date().toISOString(),
      delivered: false,
      seen: false,
    };

    // Add to messages immediately for better UX
    set({ messages: [...messages, optimisticMessage] });

    // Send via socket
    const payload = {
      senderId: authUser._id,
      receiverId: selectedUser._id,
      ...msgData,
    };

    socket.emit("sendMessage", payload);
  },

  /* ============================================================
        SOCKET LISTENER: NEW MESSAGES + TYPING
  ============================================================ */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    
    if (!socket) {
      console.error("❌ No socket available for subscription");
      return;
    }

    /* ---- NEW MESSAGE ---- */
    socket.off("newMessage");
    socket.on("newMessage", (msg) => {
      const { selectedUser, messages, unreadMessages } = get();
      const { authUser } = useAuthStore.getState();

      // Remove optimistic message if it exists
      const filteredMessages = messages.filter(
  m => !String(m._id).startsWith("temp-") || m.senderId !== authUser._id
);


      // You sent it
      if (msg.senderId === authUser._id) {
        set({ messages: [...filteredMessages, msg] });
        return;
      }

      // Chat is open with this user → append normally
      if (selectedUser && selectedUser._id === msg.senderId) {
        set({ messages: [...filteredMessages, msg] });
        
        // Mark as seen automatically if chat is open
        if (socket) {
          socket.emit("msg-seen", {
            myId: authUser._id,
            friendId: msg.senderId,
          });
        }
      } else {
        // Add unread
        const updatedUnread = {
          ...unreadMessages,
          [msg.senderId]: (unreadMessages[msg.senderId] || 0) + 1,
        };
        set({ unreadMessages: updatedUnread });

        // Show notification
        showSystemNotification({
          title: msg.senderName || "New Message",
          body: msg.text || msg.image ? "📷 Photo" : msg.video ? "🎥 Video" : msg.file ? "📎 File" : "Sent you a message",
          icon: msg.senderAvatar || "/message_icon.png",
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

    /* ---- MESSAGE DELIVERED ---- */
    socket.off("msg-delivered-update");
    socket.on("msg-delivered-update", ({ messageId }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg._id === messageId ? { ...msg, delivered: true } : msg
      );
      set({ messages: updatedMessages });
    });

    /* ---- MESSAGE SEEN ---- */
    socket.off("msg-seen-update");
    socket.on("msg-seen-update", ({ by }) => {
      const { messages } = get();
      const { authUser } = useAuthStore.getState();
      
      // Mark all messages sent by me to this user as seen
      const updatedMessages = messages.map(msg => 
        msg.senderId === authUser._id && msg.receiverId === by 
          ? { ...msg, seen: true, delivered: true } 
          : msg
      );
      set({ messages: updatedMessages });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("msg-delivered-update");
      socket.off("msg-seen-update");
    }
  },

  /* ============================================================
        SELECT USER + RESET UNREAD
  ============================================================ */
  setSelectedUser: async (selectedUser) => {
  const { authUser, socket } = useAuthStore.getState();

  if (!selectedUser) {
    set({ selectedUser: null, messages: [] });
    return;
  }

  const { unreadMessages, getMessages } = get();

  const updatedUnread = { ...unreadMessages };
  delete updatedUnread[selectedUser._id];

  const online = useAuthStore.getState().onlineUsers || [];
  const isOnline = Array.isArray(online)
    ? online.includes(selectedUser._id)
    : false;

  set({
    selectedUser: { ...selectedUser, isOnline },
    unreadMessages: updatedUnread,
    isMessagesLoading: true,
  });

  // ✅ FETCH PERSISTED MESSAGES FROM DB
  await getMessages(selectedUser._id);

  // ✅ MARK AS SEEN
  if (socket && authUser) {
    socket.emit("msg-seen", {
      myId: authUser._id,
      friendId: selectedUser._id,
    });
  }
},


  /* ============================================================
        EMIT TYPING STATUS
  ============================================================ */
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