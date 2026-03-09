import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Search, Check, X, Loader2, UsersRound } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import { useMusicStore } from "../store/musicStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";

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

  const {
    pendingIncoming,
    pendingOutgoing,
    fetchPendingRequests,
    searchByUsername,
    searchResult,
    isSearching,
    isPendingLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    clearSearch,
  } = useFriendStore();

  const { authUser, onlineUsers } = useAuthStore();
  const { isMusicPlayerOpen, toggleMusicPlayer } = useMusicStore();
  const { groups, getGroups, selectedGroup, setSelectedGroup, unreadGroupMessages } = useGroupStore();

  const [activeTab, setActiveTab] = useState("friends");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [addUsername, setAddUsername] = useState("");

  const toStrId = useCallback((id) => (id?.toString?.() || String(id || "")), []);
  const isUserOnline = useCallback(
    (userId) => onlineUsers.some((oid) => toStrId(oid) === toStrId(userId)),
    [onlineUsers, toStrId]
  );

  useEffect(() => {
    getUsers();
    fetchPendingRequests();
    getGroups();
  }, [getUsers, fetchPendingRequests, getGroups]);

  useEffect(() => {
    const onFocus = () => {
      getUsers();
      fetchPendingRequests();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [getUsers, fetchPendingRequests]);

  useEffect(() => {
    if (activeTab === "friends") {
      getUsers();
      fetchPendingRequests();
    }
  }, [activeTab, getUsers, fetchPendingRequests]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (addUsername.trim()) searchByUsername(addUsername);
  };

  const handleAddUsernameChange = (value) => {
    setAddUsername(value);
    if (!value.trim()) clearSearch();
  };

  const handleUserSelect = (user) => {
    setSelectedGroup(null);
    setSelectedUser(user);
    if (isMusicPlayerOpen) toggleMusicPlayer();
    onClose?.();
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    if (isMusicPlayerOpen) toggleMusicPlayer();
    onClose?.();
  };

  const friendsOnly = users.filter(
    (u) => toStrId(u._id) !== toStrId(authUser?._id)
  );

  const sortedUsers = [...friendsOnly].sort((a, b) => {
    const ua = unreadMessages[a._id] || 0;
    const ub = unreadMessages[b._id] || 0;
    if (ua && !ub) return -1;
    if (ub && !ua) return 1;

    const oa = isUserOnline(a._id);
    const ob = isUserOnline(b._id);
    if (oa && !ob) return -1;
    if (ob && !oa) return 1;

    return (a.fullName || "").localeCompare(b.fullName || "");
  });

  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter(
        (u) =>
          isUserOnline(u._id) ||
          (unreadMessages[u._id] || 0) > 0
      )
    : sortedUsers;

  const onlineCount = Math.max(
    0,
    onlineUsers.filter((id) => toStrId(id) !== toStrId(authUser?._id)).length
  );

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full flex flex-col min-h-0 sidebar-theme text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="relative px-3 py-3 border-b border-gray-200 dark:border-white/20 overflow-hidden shrink-0">
        <div className="relative flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-white/10 shrink-0 [&_svg]:stroke-[2.5]">
            <Users className="w-5 h-5 text-violet-600 dark:text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold truncate tracking-tight">
              Friends
            </h2>
            <p className="text-xs text-gray-600 dark:text-white/90 mt-0.5 flex items-center gap-1.5">
              <span className="font-medium">{filteredUsers.length} friends</span>
              <span className="text-gray-400 dark:text-white/60">·</span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
                {onlineCount} online
              </span>
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="relative mt-3 flex gap-1 p-1 rounded-xl bg-gray-200/80 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:focus-visible:ring-white/40 focus-visible:ring-offset-2 ${
              activeTab === "friends"
                ? "bg-white dark:bg-white/20 text-violet-700 dark:text-white shadow-md [&_svg]:stroke-[2.5]"
                : "text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/20"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Friends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:focus-visible:ring-white/40 focus-visible:ring-offset-2 ${
              activeTab === "groups"
                ? "bg-white dark:bg-white/20 text-violet-700 dark:text-white shadow-md [&_svg]:stroke-[2.5]"
                : "text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/20"
            }`}
          >
            <UsersRound className="w-4 h-4 shrink-0" />
            Groups
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("add");
              clearSearch();
              setAddUsername("");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:focus-visible:ring-white/40 focus-visible:ring-offset-2 ${
              activeTab === "add"
                ? "bg-white dark:bg-white/20 text-violet-700 dark:text-white shadow-md [&_svg]:stroke-[2.5]"
                : "text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/20"
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            Add
          </button>
        </div>

        {activeTab === "groups" && (
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="relative mt-2.5 w-full py-2 rounded-lg bg-violet-100 dark:bg-white/20 text-violet-700 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-violet-200 dark:hover:bg-white/30 transition-colors [&_svg]:stroke-[2.5]"
          >
            <UsersRound className="w-4 h-4" />
            Create Group
          </button>
        )}

        {activeTab === "friends" && (
          <button
            type="button"
            onClick={() => setShowOnlineOnly((p) => !p)}
            className={`relative mt-2.5 text-xs px-3 py-2 rounded-lg flex items-center gap-2 w-full transition-all font-semibold outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:focus-visible:ring-white/40 focus-visible:ring-offset-2 ${
              showOnlineOnly
                ? "bg-violet-100 dark:bg-white/20 text-violet-700 dark:text-white border border-violet-200 dark:border-white/30"
                : "text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                showOnlineOnly ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-gray-400 dark:bg-white/70"
              }`}
            />
            Online only
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
        {activeTab === "groups" ? (
          <>
            {groups.map((group) => {
              const isSelected = selectedGroup?._id === group._id;
              const unread = unreadGroupMessages[group._id] || 0;
              const adminCount = group.members?.filter((m) => m.role === "admin").length || 0;

              return (
                <div
                  key={group._id}
                  onClick={() => handleGroupSelect(group)}
                  className={`relative rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? "bg-violet-100 dark:bg-white/20 ring-1 ring-violet-200 dark:ring-white/40"
                      : "bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${isSelected ? "bg-violet-200 dark:bg-violet-500/30" : "bg-violet-100 dark:bg-white/10"}`}>
                      <UsersRound className={`w-4 h-4 ${isSelected ? "text-violet-600 dark:text-violet-400" : "text-violet-600 dark:text-white/90"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-violet-600 dark:text-violet-400" : "text-gray-900 dark:text-white"}`}>
                        {group.name}
                      </p>
                      <p className={`text-xs font-medium ${isSelected ? "text-violet-500 dark:text-violet-400/90" : "text-gray-600 dark:text-white/80"}`}>
                        {group.members?.length || 0} members · {adminCount} admin{adminCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {unread > 0 && !isSelected && (
                      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] rounded-lg bg-violet-500 dark:bg-white text-white dark:text-[#1e1c24] font-bold shrink-0">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {groups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-white/10 flex items-center justify-center mb-4">
                  <UsersRound className="w-7 h-7 text-violet-500 dark:text-white/80" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">No groups yet</p>
                <p className="text-sm text-gray-600 dark:text-white/80 mt-1 font-medium">Create a group to chat with friends</p>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 px-4 py-2 rounded-lg bg-violet-100 dark:bg-white/20 text-violet-700 dark:text-white font-semibold text-xs hover:bg-violet-200 dark:hover:bg-white/30 transition-colors"
                >
                  Create Group
                </button>
              </div>
            )}
          </>
        ) : activeTab === "friends" ? (
          <>
            {filteredUsers.map((user) => {
              const isOnline = isUserOnline(user._id);
              const isSelected = selectedUser?._id === user._id;
              const unread = unreadMessages[user._id] || 0;
              const isTyping = typing[user._id];

              return (
                <div
                  key={user._id}
                  className={`relative rounded-xl group transition-all duration-200 overflow-hidden
                    ${
                      isSelected
                        ? "bg-violet-100 dark:bg-white/20 ring-1 ring-violet-200 dark:ring-white/40"
                        : unread
                        ? "bg-violet-50 dark:bg-white/10 ring-1 ring-violet-200/50 dark:ring-white/25"
                        : "bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10"
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-violet-500 dark:bg-violet-400 rounded-r-full" />
                  )}

                  <div
                    onClick={() => handleUserSelect(user)}
                    className="relative flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <div className={`rounded-xl overflow-hidden ring-2 ${isSelected ? "ring-violet-400 dark:ring-violet-500" : "ring-violet-200 dark:ring-white/30"}`}>
                        <img
                          src={user.profilePic || "/boy.png"}
                          alt={user.fullName}
                          className="w-9 h-9 object-cover"
                        />
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full ring-2 ring-gray-100 dark:ring-[#1e1c24]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p
                          className={`text-sm truncate ${
                            isSelected ? "text-violet-600 dark:text-violet-400" : "text-gray-900 dark:text-white"
                          } ${unread && !isSelected ? "font-bold" : "font-semibold"}`}
                        >
                          {user.fullName || "Unknown User"}
                        </p>

                        {isTyping && (
                          <span className="text-xs text-violet-600 dark:text-violet-400 font-semibold animate-pulse shrink-0">
                            typing
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs font-semibold ${
                          isSelected
                            ? "text-violet-500 dark:text-violet-400/90"
                            : isOnline
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-500 dark:text-white/70"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>

                    {unread > 0 && !isSelected && (
                      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] rounded-lg bg-violet-500 dark:bg-white text-white dark:text-[#1e1c24] font-bold shrink-0">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFriend(user._id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-error/20 text-error/80 hover:text-error transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                    title="Remove friend"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-white/10 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-violet-500 dark:text-white/80" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {showOnlineOnly ? "No online friends" : "No friends yet"}
                </p>
                <p className="text-sm text-gray-600 dark:text-white/80 mt-1 font-medium">
                  {showOnlineOnly
                    ? "All friends are offline"
                    : "Add friends by username to start chatting"}
                </p>
              </div>
            )}
          </>
        ) : (
          /* ADD FRIENDS TAB */
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-white/70" />
                <input
                  type="text"
                  placeholder="Search by username"
                  value={addUsername}
                  onChange={(e) => handleAddUsernameChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:focus:ring-white/40 transition-all"
                />
              </div>
              {addUsername.trim().length >= 2 && (
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-violet-500 dark:bg-white text-white dark:text-[#1e1c24] text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-opacity hover:bg-violet-600 dark:hover:bg-white/90 shrink-0"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              )}
            </form>

            {searchResult && (
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-between gap-2.5 border border-gray-200 dark:border-white/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={searchResult.user?.profilePic || "/boy.png"}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-white/30"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{searchResult.user?.fullName}</p>
                    <p className="text-xs text-gray-600 dark:text-white/80 truncate font-medium">{searchResult.user?.email}</p>
                  </div>
                </div>
                {searchResult.status === "can_add" && (
                  <button
                    type="button"
                    onClick={() => sendRequest(searchResult.user.fullName)}
                    className="shrink-0 px-3 py-2 rounded-lg bg-violet-500 dark:bg-white text-white dark:text-[#1e1c24] text-xs font-semibold hover:bg-violet-600 dark:hover:bg-white/90 transition-opacity"
                  >
                    Add
                  </button>
                )}
                {searchResult.status === "pending_outgoing" && (
                  <span className="text-xs text-gray-700 dark:text-white/90 font-semibold shrink-0">Pending</span>
                )}
                {searchResult.status === "pending_incoming" && (
                  <span className="text-xs text-gray-700 dark:text-white/90 font-semibold shrink-0">Sent you a request</span>
                )}
              </div>
            )}

            {/* PENDING REQUESTS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 dark:text-white/90 uppercase tracking-wider">
                Pending Requests
              </h3>

              {isPendingLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500 dark:text-white" />
                </div>
              ) : (
                <>
                  {pendingIncoming.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-700 dark:text-white/90 font-semibold">Incoming</p>
                      {pendingIncoming.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-white/10"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={req.fromUser?.profilePic || "/boy.png"}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-white/30"
                            />
                            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{req.fromUser?.fullName}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => acceptRequest(req._id)}
                              className="p-1.5 rounded-lg bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40 transition-colors"
                              title="Accept"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectRequest(req._id)}
                              className="p-1.5 rounded-lg bg-error/15 text-error hover:bg-error/25 transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingOutgoing.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-700 dark:text-white/90 font-semibold">Outgoing</p>
                      {pendingOutgoing.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-white/10"
                        >
                          <img
                            src={req.toUser?.profilePic || "/boy.png"}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-white/30"
                          />
                          <p className="text-sm font-semibold truncate flex-1 text-gray-900 dark:text-white">{req.toUser?.fullName}</p>
                          <span className="text-xs text-gray-600 dark:text-white/80 font-semibold shrink-0">Pending</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
                    <p className="text-sm text-gray-600 dark:text-white/80 py-4 font-medium">No pending requests</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}

      {/* CURRENT USER */}
      {authUser && (
        <div className="p-3 border-t border-gray-200 dark:border-white/20 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20">
            <div className="relative shrink-0">
              <img
                src={authUser.profilePic || "/boy.png"}
                alt="You"
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-base-100 dark:ring-base-200" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-gray-900 dark:text-white">
                {authUser.fullName || "You"}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
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
