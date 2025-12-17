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

  const { authUser, onlineUsers } = useAuthStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    if (isMusicPlayerOpen) toggleMusicPlayer();
    onClose?.();
  };

  const sortedUsers = [...users].sort((a, b) => {
    const ua = unreadMessages[a._id] || 0;
    const ub = unreadMessages[b._id] || 0;
    if (ua && !ub) return -1;
    if (ub && !ua) return 1;

    const oa = onlineUsers.includes(a._id);
    const ob = onlineUsers.includes(b._id);
    if (oa && !ob) return -1;
    if (ob && !oa) return 1;

    return (a.fullName || "").localeCompare(b.fullName || "");
  });

  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter(
        (u) =>
          onlineUsers.includes(u._id) ||
          (unreadMessages[u._id] || 0) > 0
      )
    : sortedUsers;

  const onlineCount = Math.max(
    0,
    onlineUsers.filter((id) => id !== authUser?._id).length
  );

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-72 bg-base-100 border-r border-gray-200 dark:border-base-300 flex flex-col">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/15">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-base-content">
                Conversations
              </h2>
              <p className="text-xs text-gray-600 dark:text-base-content/60">
                {filteredUsers.length} contacts
              </p>
            </div>
          </div>

          <span className="text-xs px-2 py-1 rounded-full font-medium bg-success/15 text-success">
            {onlineCount} online
          </span>
        </div>

        {/* FILTER */}
        <button
          onClick={() => setShowOnlineOnly((p) => !p)}
          className={`mt-3 text-xs px-3 py-1.5 rounded-md flex items-center gap-2
            ${
              showOnlineOnly
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-gray-600 dark:text-base-content/60 hover:bg-base-200 border border-transparent"
            }
          `}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              showOnlineOnly ? "bg-primary" : "bg-gray-400"
            }`}
          />
          Online only
        </button>
      </div>

      {/* USER LIST */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-base-300">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected = selectedUser?._id === user._id;
          const unread = unreadMessages[user._id] || 0;
          const isTyping = typing[user._id];

          return (
            <div
              key={user._id}
              className={`relative rounded-lg
                ${
                  isSelected
                    ? "bg-primary/15 border border-primary/30"
                    : unread
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-base-200 border border-transparent"
                }
              `}
            >
              {isSelected && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r" />
              )}

              <div
                onClick={() => handleUserSelect(user)}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                {/* AVATAR */}
                <div className="relative shrink-0">
                  <img
                    src={user.profilePic || "/boy.png"}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-base-300"
                  />
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full ring-2 ring-base-100" />
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        unread && !isSelected
                          ? "font-semibold text-gray-900 dark:text-base-content"
                          : "font-medium text-gray-800 dark:text-base-content"
                      }`}
                    >
                      {user.fullName || "Unknown User"}
                    </p>

                    {isTyping && (
                      <span className="text-xs text-primary font-medium animate-pulse">
                        typing
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs ${
                      isOnline
                        ? "text-success"
                        : "text-gray-500 dark:text-base-content/60"
                    }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>

                {/* UNREAD */}
                {unread > 0 && !isSelected && (
                  <span className="min-w-[22px] h-5 px-1.5 flex items-center justify-center text-xs rounded-full bg-primary text-white font-medium">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-base-content">
              {showOnlineOnly ? "No online users" : "No conversations"}
            </p>
            <p className="text-xs text-gray-500 dark:text-base-content/60">
              {showOnlineOnly
                ? "All contacts are offline"
                : "Start a conversation with someone"}
            </p>
          </div>
        )}
      </div>

      {/* CURRENT USER */}
      {authUser && (
        <div className="p-3 border-t border-gray-200 dark:border-base-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={authUser.profilePic || "/boy.png"}
                alt="You"
                className="w-9 h-9 rounded-full object-cover border border-primary/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full ring-2 ring-base-100" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900 dark:text-base-content">
                {authUser.fullName || "You"}
              </p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-success rounded-full" />
                Online
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
