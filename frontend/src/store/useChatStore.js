import { create } from "zustand";
import toast from "react-hot-toast";
import { messageApi } from "../services/messageApi.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { showSystemNotification } from "../utils/notifications.js";
import { normId, upsertMessage } from "../utils/messageHelpers.js";
import {
  onlineSetFromIds,
  patchUsersPresence,
  sameOnlineSet,
} from "../utils/presence.js";

function normalizeServerMessage(m) {
  return {
    ...m,
    _id: normId(m._id),
    senderId: normId(m.senderId),
    receiverId: normId(m.receiverId),
    pending: false,
  };
}

function mergeWithPending(serverMessages, currentMessages) {
  const serverClientIds = new Set(
    serverMessages.map((m) => m.clientMessageId).filter(Boolean)
  );
  const pending = currentMessages.filter(
    (m) =>
      m.pending &&
      m.clientMessageId &&
      !serverClientIds.has(m.clientMessageId)
  );
  let merged = [...serverMessages];
  for (const p of pending) {
    merged = upsertMessage(merged, p);
  }
  return merged;
}

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  usersHydrated: false,
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isLoadingOlder: false,
  hasMoreMessages: true,
  messagesNextCursor: null,

  unreadMessages: {},
  lastMessageAt: {},
  typing: {},

  updateUserLocally: (updatedUser) =>
    set((state) => ({
      users: state.users.map((u) =>
        normId(u._id) === normId(updatedUser._id) ? { ...u, ...updatedUser } : u
      ),
      selectedUser:
        state.selectedUser &&
        normId(state.selectedUser._id) === normId(updatedUser._id)
          ? { ...state.selectedUser, ...updatedUser }
          : state.selectedUser,
    })),

  touchLastMessage: (peerId, at) => {
    const id = normId(peerId);
    if (!id) return;
    const ts = at != null ? (typeof at === "number" ? at : new Date(at).getTime()) : Date.now();
    set({
      lastMessageAt: { ...get().lastMessageAt, [id]: ts },
    });
  },

  applyOnlineToUsers: (usersList, onlineIds) => {
    if (!Array.isArray(usersList)) return [];

    const onlineArray = Array.isArray(onlineIds)
      ? onlineIds
      : Object.keys(onlineIds || {});

    const onlineSet = new Set(onlineArray.map(normId));

    return usersList.map((u) => ({
      ...u,
      isOnline: onlineSet.has(normId(u._id)),
    }));
  },

  getUsers: async ({ silent = false, force = false } = {}) => {
    const { usersHydrated, users } = get();
    if (silent && usersHydrated && users.length > 0 && !force) {
      return;
    }

    const showLoader = !usersHydrated || (!silent && users.length === 0);
    if (showLoader) set({ isUsersLoading: true });

    try {
      const res = await messageApi.getSidebarUsers();
      const onlineUsers = useAuthStore.getState().onlineUsers;
      const withPresence = get().applyOnlineToUsers(res.data, onlineUsers);
      const lastMessageAt = { ...get().lastMessageAt };
      for (const u of withPresence) {
        const id = normId(u._id);
        if (u.lastMessageAt) {
          lastMessageAt[id] = new Date(u.lastMessageAt).getTime();
        }
      }
      set({
        users: withPresence,
        usersHydrated: true,
        lastMessageAt,
      });
    } catch {
      if (!silent) toast.error("Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId, { mergePending = false } = {}) => {
    const isInitial = !mergePending;
    if (isInitial) {
      set({ isMessagesLoading: true, hasMoreMessages: true, messagesNextCursor: null });
    }
    try {
      const res = await messageApi.getMessages(userId, { limit: 50 });
      const data = res.data;
      const msgs = Array.isArray(data) ? data : data?.messages || [];
      const hasMore = Array.isArray(data) ? false : (data?.hasMore ?? false);
      const nextCursor = Array.isArray(data) ? null : data?.nextCursor ?? null;

      const sorted = [...msgs]
        .map(normalizeServerMessage)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const finalMessages = mergePending
        ? mergeWithPending(sorted, get().messages)
        : sorted;

      const last = finalMessages[finalMessages.length - 1];
      if (last?.createdAt) {
        get().touchLastMessage(userId, last.createdAt);
      }

      set({
        messages: finalMessages,
        isMessagesLoading: false,
        hasMoreMessages: hasMore,
        messagesNextCursor: nextCursor,
      });
    } catch {
      toast.error("Failed to load messages");
      set({ isMessagesLoading: false });
    }
  },

  /** WhatsApp-style: after reconnect, pull messages newer than our latest local copy */
  refetchOpenChat: async () => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    const peerId = normId(selectedUser._id);
    const last = messages[messages.length - 1];
    const since = last?.createdAt;

    if (since) {
      try {
        const res = await messageApi.syncMessages(peerId, since);
        const incoming = (res.data?.messages || []).map(normalizeServerMessage);
        if (incoming.length === 0) return;

        let merged = get().messages;
        for (const m of incoming) {
          merged = upsertMessage(merged, m);
        }
        set({ messages: mergeWithPending(merged, get().messages) });
        return;
      } catch {
        /* full refetch below */
      }
    }

    await get().getMessages(peerId, { mergePending: true });
  },

  loadOlderMessages: async (userId) => {
    const { messagesNextCursor, isLoadingOlder, hasMoreMessages } = get();
    if (!hasMoreMessages || isLoadingOlder || !messagesNextCursor) return null;
    set({ isLoadingOlder: true });
    try {
      const res = await messageApi.getMessages(userId, {
        limit: 50,
        before: messagesNextCursor,
      });
      const data = res.data;
      const older = Array.isArray(data) ? data : data?.messages || [];
      const hasMore = Array.isArray(data) ? false : (data?.hasMore ?? false);
      const nextCursor = Array.isArray(data) ? null : data?.nextCursor ?? null;

      const merged = [...older, ...get().messages].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      set({
        messages: merged,
        isLoadingOlder: false,
        hasMoreMessages: hasMore,
        messagesNextCursor: nextCursor,
      });
      return older.length;
    } catch {
      set({ isLoadingOlder: false });
      return null;
    }
  },

  sendMessage: async (msgData) => {
    const { authUser, socket } = useAuthStore.getState();
    const { selectedUser, messages } = get();
    if (!selectedUser || !authUser) return;

    const clientMessageId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `temp-${Date.now()}`;

    const optimistic = {
      _id: clientMessageId,
      clientMessageId,
      senderId: normId(authUser._id),
      receiverId: normId(selectedUser._id),
      ...msgData,
      createdAt: new Date().toISOString(),
      delivered: false,
      seen: false,
      pending: true,
    };

    set({ messages: upsertMessage(messages, optimistic) });
    get().touchLastMessage(selectedUser._id, optimistic.createdAt);

    const payload = {
      senderId: normId(authUser._id),
      receiverId: normId(selectedUser._id),
      ...msgData,
      clientMessageId,
    };

    if (socket?.connected) {
      socket.emit("sendMessage", payload);
      return;
    }

    try {
      const res = await messageApi.sendMessage(normId(selectedUser._id), {
        ...msgData,
        clientMessageId,
      });
      const saved = normalizeServerMessage(res.data);
      set({
        messages: upsertMessage(get().messages, { ...saved, clientMessageId }),
      });
    } catch {
      toast.error("Could not send message. Check your connection.");
      set({
        messages: get().messages.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, pending: false, failed: true }
            : m
        ),
      });
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const onNewMessage = (msg) => {
      const { selectedUser, unreadMessages } = get();
      const { authUser } = useAuthStore.getState();
      const myId = normId(authUser?._id);
      const fromId = normId(msg.senderId);
      const peerId = normId(selectedUser?._id);

      const normalized = {
        ...msg,
        _id: normId(msg._id),
        senderId: fromId,
        receiverId: normId(msg.receiverId),
        pending: false,
      };

      const msgTime = normalized.createdAt || new Date().toISOString();
      get().touchLastMessage(fromId, msgTime);

      if (fromId === myId) {
        get().touchLastMessage(normalized.receiverId, msgTime);
        set({ messages: upsertMessage(get().messages, normalized) });
        return;
      }

      if (peerId && fromId === peerId) {
        set({ messages: upsertMessage(get().messages, normalized) });
        socket.emit("msg-seen", { myId, friendId: fromId });
        return;
      }

      set({
        unreadMessages: {
          ...unreadMessages,
          [fromId]: (unreadMessages[fromId] || 0) + 1,
        },
      });

      showSystemNotification({
        title: msg.senderName || "New Message",
        body:
          msg.text ||
          (msg.image && "Photo") ||
          (msg.video && "Video") ||
          (msg.file && "File"),
        icon: msg.senderAvatar || "/message-icon.png",
        onClick: () => window.focus(),
      });
    };

    const onMessageAck = ({ clientMessageId, messageId, status }) => {
      if (!clientMessageId) return;
      set({
        messages: get().messages.map((m) =>
          m.clientMessageId === clientMessageId
            ? {
                ...m,
                _id: normId(messageId),
                clientMessageId,
                pending: false,
                queued: status === "queued",
              }
            : m
        ),
      });
    };

    const onDelivered = ({ messageId }) => {
      const id = normId(messageId);
      set({
        messages: get().messages.map((m) =>
          normId(m._id) === id ? { ...m, delivered: true, pending: false } : m
        ),
      });
    };

    const onSeen = ({ by }) => {
      const { messages, selectedUser, authUser } = get();
      const myId = normId(authUser?._id);
      if (!selectedUser || normId(selectedUser._id) !== normId(by)) return;

      set({
        messages: messages.map((m) =>
          normId(m.senderId) === myId ? { ...m, seen: true, delivered: true } : m
        ),
      });
    };

    const onTyping = ({ senderId, isTyping }) => {
      const id = normId(senderId);
      set({
        typing: { ...get().typing, [id]: isTyping },
      });
    };

    socket.off("newMessage");
    socket.off("messageAck");
    socket.off("msg-delivered-update");
    socket.off("msg-seen-update");
    socket.off("typing");

    const onMessageError = async ({ error, clientMessageId }) => {
      if (clientMessageId) {
        const failed = get().messages.find(
          (m) => m.clientMessageId === clientMessageId
        );
        if (failed) {
          try {
            const { selectedUser } = get();
            const res = await messageApi.sendMessage(normId(selectedUser._id), {
              text: failed.text,
              image: failed.image,
              video: failed.video,
              file: failed.file,
              clientMessageId,
            });
            const saved = normalizeServerMessage(res.data);
            set({
              messages: upsertMessage(get().messages, {
                ...saved,
                clientMessageId,
              }),
            });
            return;
          } catch {
            /* fall through */
          }
        }
      }
      toast.error(error || "Failed to send message");
    };

    socket.off("message-error");
    socket.on("newMessage", onNewMessage);
    socket.on("messageAck", onMessageAck);
    socket.on("msg-delivered-update", onDelivered);
    socket.on("msg-seen-update", onSeen);
    socket.on("typing", onTyping);
    socket.on("message-error", onMessageError);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageAck");
    socket.off("msg-delivered-update");
    socket.off("msg-seen-update");
    socket.off("typing");
    socket.off("message-error");
  },

  setSelectedUser: async (user) => {
    const { authUser, socket } = useAuthStore.getState();

    if (!user) {
      set({
        selectedUser: null,
        messages: [],
        hasMoreMessages: true,
        messagesNextCursor: null,
      });
      return;
    }

    const uid = normId(user._id);

    set({
      selectedUser: { ...user, _id: uid },
      messages: [],
      isMessagesLoading: true,
      hasMoreMessages: true,
      messagesNextCursor: null,
      unreadMessages: {
        ...get().unreadMessages,
        [uid]: 0,
      },
    });

    try {
      const { useGroupStore } = await import("./useGroupStore.js");
      useGroupStore.getState().setSelectedGroup(null);
    } catch {}

    await get().getMessages(uid);

    if (socket && authUser) {
      socket.emit("msg-seen", {
        myId: normId(authUser._id),
        friendId: uid,
      });
    }
  },

  emitTyping: (isTyping) => {
    const { selectedUser } = get();
    const { authUser, socket } = useAuthStore.getState();
    if (socket && selectedUser && authUser) {
      socket.emit("typing", {
        senderId: normId(authUser._id),
        receiverId: normId(selectedUser._id),
        isTyping,
      });
    }
  },
}));

let lastOnlineSnapshot = useAuthStore.getState().onlineUsers;

useAuthStore.subscribe((state) => {
  const onlineIds = state.onlineUsers;
  if (sameOnlineSet(lastOnlineSnapshot, onlineIds)) return;
  lastOnlineSnapshot = onlineIds;

  const online = onlineSetFromIds(onlineIds);

  useChatStore.setState((s) => {
    const users = patchUsersPresence(s.users, onlineIds);
    const sel = s.selectedUser;
    let selectedUser = sel;
    if (sel) {
      const nextOnline = online.has(normId(sel._id));
      if (Boolean(sel.isOnline) !== nextOnline) {
        selectedUser = { ...sel, isOnline: nextOnline };
      }
    }
    if (users === s.users && selectedUser === sel) return s;
    return { users, selectedUser };
  });
});
