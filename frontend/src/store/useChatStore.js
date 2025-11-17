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

    unreadMessages: {},

    isMusicPlayerOpen: false,
    toggleMusicPlayer: () => {
        set((s) => ({ isMusicPlayerOpen: !s.isMusicPlayerOpen }));
    },

    /* ============================================================
       GET USERS
    ============================================================= */
    getUsers: async () => {
        set({ isUsersLoading: true });

        try {
            const res = await axiosInstance.get("/messages/users");

            set((state) => ({
                users: res.data.map((u) => {
                    const existing = state.users.find((x) => x._id === u._id);
                    return {
                        ...u,
                        hasNewMessage: existing ? existing.hasNewMessage : false,
                    };
                }),
            }));

        } catch {
            toast.error("Failed to load users");
        }

        set({ isUsersLoading: false });
    },

    /* ============================================================
       GET MESSAGES + EMIT SEEN (✓✓)
    ============================================================= */
    getMessages: async (userId) => {
        set({ isMessagesLoading: true });

        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });

            const socket = useAuthStore.getState().socket;
            const auth = useAuthStore.getState().authUser;

            socket.emit("msg-seen", {
                myId: auth._id,
                friendId: userId,
            });

        } catch {
            toast.error("Failed to load messages");
        }

        set({ isMessagesLoading: false });
    },

    /* ============================================================
       SEND MESSAGE + EMIT DELIVERED (✓)
    ============================================================= */
    sendMessage: async (msgData) => {
        const { selectedUser, messages } = get();
        const socket = useAuthStore.getState().socket;
        const auth = useAuthStore.getState().authUser;

        try {
            const res = await axiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                msgData
            );

            const saved = res.data;

            // Add message to UI instantly
            set({ messages: [...messages, saved] });

            // Emit delivered immediately
            socket.emit("msg-delivered", {
                messageId: saved._id,
                receiverId: selectedUser._id,
            });

        } catch {
            toast.error("Failed to send message");
        }
    },

    /* ============================================================
       ADD REACTION
    ============================================================= */
    addReaction: async (messageId, emoji) => {
        const auth = useAuthStore.getState().authUser;
        const socket = useAuthStore.getState().socket;

        try {
            const res = await axiosInstance.post(`/messages/reaction/${messageId}`, {
                userId: auth._id,
                emoji,
            });

            // Update my UI
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, reactions: res.data.data.reactions } : m
                ),
            }));

            // send to others
            socket.emit("sendReaction", {
                messageId,
                reactions: res.data.data.reactions,
            });

        } catch {
            toast.error("Failed to react");
        }
    },

    /* ============================================================
       SOCKET EVENTS
    ============================================================= */
    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        const auth = useAuthStore.getState().authUser;

        /* NEW MESSAGE */
        socket.off("newMessage");
        socket.on("newMessage", (msg) => {
            const { selectedUser, messages, users } = get();

            // If chatting with sender
            if (selectedUser && msg.senderId === selectedUser._id) {

                set({ messages: [...messages, msg] });

                // mark as delivered instantly
                socket.emit("msg-delivered", {
                    messageId: msg._id,
                    receiverId: auth._id,
                });

                return;
            }

            // Mark as unread
            set({
                users: users.map((u) =>
                    u._id === msg.senderId
                        ? { ...u, hasNewMessage: true }
                        : u
                ),
            });
        });

        /* REACTION UPDATE */
        socket.off("messageReaction");
        socket.on("messageReaction", ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, reactions } : m
                ),
            }));
        });

        /* DELIVERED ✓ */
        socket.off("msg-delivered-update");
        socket.on("msg-delivered-update", ({ messageId }) => {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, delivered: true } : m
                ),
            }));
        });

        /* SEEN ✓✓ */
        socket.off("msg-seen-update");
        socket.on("msg-seen-update", () => {
            set((state) => ({
                messages: state.messages.map((m) => ({
                    ...m,
                    delivered: true,
                    seen: true,
                })),
            }));
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("messageReaction");
        socket.off("msg-delivered-update");
        socket.off("msg-seen-update");
    },

    /* ============================================================
       SELECT USER
    ============================================================= */
    setSelectedUser: (selectedUser) => {
        if (!selectedUser) return set({ selectedUser: null });

        const { unreadMessages } = get();
        const updated = { ...unreadMessages };
        delete updated[selectedUser._id];

        set({ selectedUser, unreadMessages: updated });
    },
}));
