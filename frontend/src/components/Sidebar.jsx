// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useMusicStore } from "../store/musicStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const Sidebar = ({ onClose }) => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadMessages,
    typing,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);

    if (isMusicPlayerOpen) toggleMusicPlayer();

    if (typeof onClose === "function") onClose();
  };

  /* ============================================================
      SORT USERS — UNREAD ON TOP (Telegram style)
  ============================================================ */
  const sortedUsers = [...users].sort((a, b) => {
    const unreadA = unreadMessages[a._id] || 0;
    const unreadB = unreadMessages[b._id] || 0;

    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadB > 0 && unreadA === 0) return 1;

    return 0;
  });

  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter(
        (user) =>
          onlineUsers.includes(user._id) ||
          (unreadMessages[user._id] && unreadMessages[user._id] > 0)
      )
    : sortedUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-72 bg-base-200 border-r border-base-300 flex flex-col">
      {/* Header */}
      <div className="border-b border-base-300 px-5 py-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-base-content">
          Contacts
        </span>
      </div>

      {/* Online Toggle */}
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
        <span>{Math.max(0, onlineUsers.length - 1)} online</span>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin scrollbar-thumb-base-300">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected = selectedUser?._id === user._id;

          const unread = unreadMessages[user._id] || 0;
          const isTyping = typing[user._id];

          return (
            <button
              key={user._id}
              onClick={() => handleUserSelect(user)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition
                ${
                  isSelected
                    ? "bg-primary/20 border border-primary/50"
                    : unread > 0
                    ? "bg-primary/10 border border-primary"
                    : "hover:bg-base-300"
                }
              `}
            >
              {/* Avatar */}
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

              {/* User Info */}
              <div className="flex-1 truncate">
                <p
                  className={`text-sm truncate ${
                    unread > 0 && !isSelected
                      ? "font-bold text-base-content"
                      : "font-medium text-base-content"
                  }`}
                >
                  {user.fullName}
                </p>

                {/* Typing Indicator */}
                {isTyping ? (
                  <p className="text-xs text-purple-500 font-medium animate-pulse">
                    typing…
                  </p>
                ) : (
                  <p
                    className={`text-xs ${
                      isOnline ? "text-success" : "text-base-content/60"
                    }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </p>
                )}
              </div>

              {/* Unread Badge */}
              {unread > 0 && !isSelected && (
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full animate-ping">
                  {unread}
                </span>
              )}
            </button>
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
