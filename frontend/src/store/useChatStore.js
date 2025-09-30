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
    newMessageFlag: false,
    unreadMessages: {},
    isMusicPlayerOpen: false,

    toggleMusicPlayer: () => {
        set((state) => ({ isMusicPlayerOpen: !state.isMusicPlayerOpen}))
    },

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");

            set((state) => ({
                users: res.data.map((user) => {
                    const existingUser = state.users.find((u) => u._id === user._id);
                    return {
                        ...user,
                        hasNewMessage: existingUser ? existingUser.hasNewMessage : false,
                    };
                }),
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },

    addReaction: async (messageId, emoji) => {
        const { authUser } = get();
        try {
            const res = await axiosInstance.post(`/messages/reaction/${messageId}`, {
                userId: authUser._id,
                emoji,
            });

            // ✅ Update reactions locally
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
                ),
            }));

            // ✅ Emit reaction update via WebSocket
            const socket = useAuthStore.getState().socket;
            socket.emit("sendReaction", { messageId, reactions: res.data.reactions });

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add reaction");
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;

        socket.off("newMessage");
        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages, users } = get();

            set((state) => {
                let updatedMessages = state.messages;
                let updatedUsers = state.users;

                if (selectedUser && newMessage.senderId === selectedUser._id) {
                    updatedMessages = [...messages, newMessage];
                } else {
                    updatedUsers = users.map((user) =>
                        user._id === newMessage.senderId
                            ? { ...user, hasNewMessage: true, lastMessageTime: new Date() }
                            : user
                    );

                    updatedUsers.sort((a, b) =>
                        a.hasNewMessage === b.hasNewMessage ? 0 : a.hasNewMessage ? -1 : 1
                    );
                }

                return { messages: updatedMessages, users: updatedUsers };
            });
        });

        // ✅ Listen for real-time reaction updates
        socket.off("reactionUpdated");
        socket.on("reactionUpdated", ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                ),
            }));
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("reactionUpdated");
    },

    setSelectedUser: (selectedUser) => {
        if (selectedUser) {
            const { unreadMessages } = get();
            const updatedUnread = { ...unreadMessages };
            delete updatedUnread[selectedUser._id]; // ⛔ This will throw an error if selectedUser is null
    
            set({ selectedUser, unreadMessages: updatedUnread });
        } else {
            set({ selectedUser: null }); // ✅ Safe handling when clearing selected user
        }
    },

    clearNewMessageFlag: () => set({ newMessageFlag: false }),
}));
