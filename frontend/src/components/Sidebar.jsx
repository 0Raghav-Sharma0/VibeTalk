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
    <aside className="h-full w-64 bg-base-200 border-r border-base-300 flex flex-col">

      {/* HEADER */}
      <div className="border-b border-base-300 px-5 py-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-base-content">
          Contacts
        </span>
      </div>

      {/* ONLINE TOGGLE */}
      <div className="px-5 py-3 flex items-center justify-between text-xs text-base-content/60">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlineOnly}
            onChange={(e) => setShowOnlineOnly(e.target.checked)}
            className="accent-primary"
          />
          Online Only
        </label>
        <span>{onlineUsers.length - 1} online</span>
      </div>

      {/* USERS LIST */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin scrollbar-thumb-base-300">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected = selectedUser?._id === user._id;

          return (
            <motion.button
              key={user._id}
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleUserSelect(user)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition
                ${
                  isSelected
                    ? "bg-primary/20 border border-primary/50"
                    : "hover:bg-base-300"
                }
                ${
                  user.hasNewMessage && !isSelected
                    ? "border border-secondary/50"
                    : ""
                }
              `}
            >
              {/* AVATAR */}
              <div className="relative">
                <img
                  src={user.profilePic || "/boy.png"}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover border border-base-300"
                />

                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-base-200" />
                )}
              </div>

              {/* USER INFO */}
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-base-content truncate">
                  {user.fullName}
                </p>
                <p
                  className={`text-xs ${
                    isOnline ? "text-success" : "text-base-content/60"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              {/* NEW BADGE */}
              {user.hasNewMessage && !isSelected && (
                <span className="badge badge-secondary badge-sm">
                  New
                </span>
              )}
            </motion.button>
          );
        })}

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
