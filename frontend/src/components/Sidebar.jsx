import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useMusicStore } from "../store/musicStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    useChatStore.setState((state) => ({
      users: state.users.map((u) =>
        u._id === user._id ? { ...u, hasNewMessage: false } : u
      ),
    }));
    if (isMusicPlayerOpen) toggleMusicPlayer();
  };

  const filteredUsers = showOnlineOnly
    ? users.filter(
        (user) => onlineUsers.includes(user._id) || user.hasNewMessage
      )
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 bg-base-200/95 flex flex-col backdrop-blur-xl transition-all">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary hidden lg:block">
            Contacts
          </span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2 justify-between">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-xs checkbox-primary"
            />
            <span className="text-xs text-base-content/70">Online only</span>
          </label>
          <span className="text-xs text-base-content/50">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-fade">
        {filteredUsers.map((user) => (
          <motion.button
            key={user._id}
            onClick={() => handleUserSelect(user)}
            whileHover={{ scale: 1.02 }}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg mb-1 transition-all ${
              selectedUser?._id === user._id
                ? "bg-primary/20 ring-1 ring-primary/40"
                : "hover:bg-base-300"
            } ${user.hasNewMessage ? "border border-primary/40" : ""}`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={user.profilePic || "/boy.png"}
                alt={user.fullName}
                className="size-10 rounded-full object-cover border border-base-300"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full ring-2 ring-base-200" />
              )}
            </div>

            {/* User info */}
            <div className="hidden lg:block text-left truncate flex-1">
              <p className="text-sm font-medium text-base-content truncate">
                {user.fullName}
              </p>
              <p
                className={`text-xs ${
                  onlineUsers.includes(user._id)
                    ? "text-success"
                    : "text-base-content/50"
                }`}
              >
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </p>
            </div>

            {/* New message badge */}
            {user.hasNewMessage && selectedUser?._id !== user._id && (
              <span className="bg-primary text-primary-content text-[10px] px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </motion.button>
        ))}

        {filteredUsers.length === 0 && (
          <p className="text-center text-base-content/60 py-5 text-sm">
            No users found
          </p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
