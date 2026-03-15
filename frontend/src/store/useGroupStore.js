import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { showSystemNotification } from "../utils/notifications";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  unreadGroupMessages: {},

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data || [], isGroupsLoading: false });
    } catch {
      toast.error("Failed to load groups");
      set({ isGroupsLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data || [], isGroupMessagesLoading: false });
    } catch {
      toast.error("Failed to load messages");
      set({ isGroupMessagesLoading: false });
    }
  },

  createGroup: async (name, memberIds) => {
    try {
      const res = await axiosInstance.post("/groups", { name, memberIds });
      set((s) => ({ groups: [res.data, ...s.groups] }));
      toast.success("Group created!");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create group");
      return null;
    }
  },

  sendGroupMessage: (msgData) => {
    const { authUser, socket } = useAuthStore.getState();
    const { selectedGroup, groupMessages } = get();
    if (!selectedGroup || !socket) return;

    const tempId = `temp-g-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      groupId: selectedGroup._id,
      senderId: authUser._id,
      senderName: authUser.fullName,
      senderAvatar: authUser.profilePic,
      ...msgData,
      createdAt: new Date().toISOString(),
    };

    set({ groupMessages: [...groupMessages, optimistic] });

    socket.emit("sendGroupMessage", {
      groupId: selectedGroup._id,
      senderId: authUser._id,
      ...msgData,
    });
  },

  setSelectedGroup: async (group) => {
    if (!group) {
      set({ selectedGroup: null, groupMessages: [] });
      return;
    }

    try {
      const { useChatStore } = await import("./useChatStore");
      useChatStore.getState().setSelectedUser(null);
    } catch {}

    set({
      selectedGroup: group,
      groupMessages: [],
      isGroupMessagesLoading: true,
      unreadGroupMessages: {
        ...get().unreadGroupMessages,
        [group._id]: 0,
      },
    });

    await get().getGroupMessages(group._id);
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newGroupMessage");
    socket.on("newGroupMessage", (msg) => {
      const { groupMessages, selectedGroup, unreadGroupMessages } = get();
      const { authUser } = useAuthStore.getState();

      const msgSenderId = msg.senderId?._id ?? msg.senderId;
      const isFromMe = String(msgSenderId) === String(authUser?._id);

      const cleaned = groupMessages.filter(
        (m) =>
          !(
            m._id?.startsWith?.("temp-g-") &&
            m.text === msg.text &&
            String(m.senderId) === String(msgSenderId)
          )
      );

      if (isFromMe) {
        set({ groupMessages: [...cleaned, msg] });
        return;
      }

      if (selectedGroup?._id === msg.groupId) {
        set({ groupMessages: [...cleaned, msg] });
      } else {
        set({
          unreadGroupMessages: {
            ...unreadGroupMessages,
            [msg.groupId]: (unreadGroupMessages[msg.groupId] || 0) + 1,
          },
        });
        showSystemNotification({
          title: msg.senderName || "New group message",
          body: msg.text || (msg.image && "📷 Photo") || (msg.video && "🎥 Video"),
          icon: msg.senderAvatar || "/message_icon.png",
          onClick: () => window.focus(),
        });
      }
    });

    socket.off("group-updated");
    socket.on("group-updated", ({ group, removed }) => {
      if (removed) {
        const { selectedGroup } = get();
        if (selectedGroup?._id === group._id) {
          get().setSelectedGroup(null);
        }
      }
      get().getGroups();
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newGroupMessage");
    socket.off("group-updated");
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      const { selectedGroup, groups } = get();
      const toStr = (id) => (id?.toString?.() || String(id || ""));
      const isViewingThisGroup = selectedGroup && toStr(selectedGroup._id) === toStr(groupId);

      set({
        groups: groups.filter((g) => toStr(g._id) !== toStr(groupId)),
        ...(isViewingThisGroup && { selectedGroup: null, groupMessages: [] }),
      });
      toast.success("Left group");
      return true;
    } catch {
      toast.error("Failed to leave group");
      return false;
    }
  },

  addMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { userId });
      set((s) => ({
        groups: s.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: s.selectedGroup?._id === groupId ? res.data : s.selectedGroup,
      }));
      toast.success("Member added");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add member");
      return false;
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
      const data = res.data;

      if (data?.deleted) {
        set((s) => ({
          groups: s.groups.filter((g) => g._id !== groupId),
          selectedGroup: s.selectedGroup?._id === groupId ? null : s.selectedGroup,
        }));
        get().setSelectedGroup(null);
      } else {
        set((s) => ({
          groups: s.groups.map((g) => (g._id === groupId ? data : g)),
          selectedGroup: s.selectedGroup?._id === groupId ? data : s.selectedGroup,
        }));
      }
      toast.success("Member removed");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove member");
      return false;
    }
  },
}));
