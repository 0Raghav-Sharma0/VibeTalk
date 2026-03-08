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
    if (addUsername.trim().length >= 2) {
      const t = setTimeout(() => searchByUsername(addUsername), 400);
      return () => clearTimeout(t);
    } else {
      clearSearch();
    }
  }, [addUsername, searchByUsername, clearSearch]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (addUsername.trim()) searchByUsername(addUsername);
  };

  const sortedUsers = [...users].sort((a, b) => {
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
    <aside className="h-full w-full flex flex-col min-h-0 bg-white dark:bg-base-100 border-r border-gray-200/80 dark:border-base-300/50 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.3)]">
      {/* HEADER */}
      <div className="relative px-4 py-5 border-b border-gray-200/80 dark:border-base-300/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 dark:from-primary/10 dark:to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shrink-0 shadow-lg shadow-primary/25 ring-2 ring-white dark:ring-base-100 ring-offset-2 ring-offset-gray-50 dark:ring-offset-base-100">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-base-content truncate tracking-tight">
                Friends
              </h2>
              <p className="text-xs text-gray-600 dark:text-base-content/60 font-medium mt-0.5">
                {filteredUsers.length} friends · {onlineCount} online
              </p>
            </div>
          </div>

          <span className="relative text-xs px-3 py-2 rounded-xl font-bold bg-success/15 text-success shrink-0 border border-success/25 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse ring-2 ring-success/30" />
            {onlineCount} online
          </span>
        </div>

        {/* TABS */}
        <div className="relative mt-4 flex gap-1 p-1 rounded-2xl bg-gray-100/80 dark:bg-base-200/80 backdrop-blur-sm border border-gray-200/50 dark:border-base-300/30">
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${
              activeTab === "friends"
                ? "bg-white dark:bg-base-100 text-gray-900 dark:text-base-content shadow-md border border-gray-200/80 dark:border-base-300/50"
                : "text-gray-600 dark:text-base-content/70 hover:bg-white/50 dark:hover:bg-base-100/50 border border-transparent"
            }`}
          >
            <Users className="w-4 h-4" />
            Friends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${
              activeTab === "groups"
                ? "bg-white dark:bg-base-100 text-gray-900 dark:text-base-content shadow-md border border-gray-200/80 dark:border-base-300/50"
                : "text-gray-600 dark:text-base-content/70 hover:bg-white/50 dark:hover:bg-base-100/50 border border-transparent"
            }`}
          >
            <UsersRound className="w-4 h-4" />
            Groups
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("add");
              clearSearch();
              setAddUsername("");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${
              activeTab === "add"
                ? "bg-white dark:bg-base-100 text-gray-900 dark:text-base-content shadow-md border border-gray-200/80 dark:border-base-300/50"
                : "text-gray-600 dark:text-base-content/70 hover:bg-white/50 dark:hover:bg-base-100/50 border border-transparent"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>

        {activeTab === "groups" && (
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="relative mt-3 w-full py-2.5 rounded-xl bg-primary/15 text-primary border-2 border-primary/30 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
          >
            <UsersRound className="w-4 h-4" />
            Create Group
          </button>
        )}

        {activeTab === "friends" && (
          <button
            type="button"
            onClick={() => setShowOnlineOnly((p) => !p)}
            className={`relative mt-3 text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 w-full transition-all font-semibold outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${
              showOnlineOnly
                ? "bg-primary/15 text-primary border-2 border-primary/30 shadow-sm"
                : "text-gray-600 dark:text-base-content/60 hover:bg-gray-100/80 dark:hover:bg-base-200/60 border-2 border-transparent"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                showOnlineOnly ? "bg-primary animate-pulse" : "bg-gray-400 dark:bg-base-content/40"
              }`}
            />
            Online only
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-base-200/30 dark:to-transparent scrollbar-thin scrollbar-thumb-base-300">
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
                  className={`relative rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? "bg-white dark:bg-base-200/80 border-2 border-primary/40 shadow-lg shadow-primary/10"
                      : "bg-white/80 dark:bg-base-200/40 border border-gray-200/60 dark:border-base-300/30 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/15 text-primary shrink-0">
                      <UsersRound className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-base-content truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-base-content/60">
                        {group.members?.length || 0} members · {adminCount} admin{adminCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {unread > 0 && !isSelected && (
                      <span className="min-w-[24px] h-6 px-2 flex items-center justify-center text-xs rounded-xl bg-primary text-gray-900 font-bold shrink-0 shadow-sm">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {groups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center mb-4">
                  <UsersRound className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-base-content">No groups yet</p>
                <p className="text-xs text-gray-800 dark:text-base-content/60 mt-1">Create a group to chat with friends</p>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-gray-900 font-semibold text-sm"
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
                  className={`relative rounded-2xl group transition-all duration-200 overflow-hidden
                    ${
                      isSelected
                        ? "bg-white dark:bg-base-200/80 border-2 border-primary/40 shadow-lg shadow-primary/10"
                        : unread
                        ? "bg-white dark:bg-base-200/60 border border-primary/20 shadow-md"
                        : "bg-white/80 dark:bg-base-200/40 border border-gray-200/60 dark:border-base-300/30 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                    }
                  `}
                >
                  {isSelected && (
                    <>
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary rounded-r-full shadow-sm" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                    </>
                  )}

                  <div
                    onClick={() => handleUserSelect(user)}
                    className="relative flex items-center gap-3 px-4 py-3 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <div className="p-0.5 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10">
                        <img
                          src={user.profilePic || "/boy.png"}
                          alt={user.fullName}
                          className="w-11 h-11 rounded-[14px] object-cover border-2 border-white dark:border-base-200 shadow-sm"
                        />
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full ring-2 ring-white dark:ring-base-100 animate-pulse shadow-sm" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm truncate ${
                            unread && !isSelected
                              ? "font-semibold text-gray-900 dark:text-base-content"
                              : "font-medium text-gray-900 dark:text-base-content"
                          }`}
                        >
                          {user.fullName || "Unknown User"}
                        </p>

                        {isTyping && (
                          <span className="text-xs text-primary font-medium animate-pulse shrink-0">
                            typing
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs font-medium ${
                          isOnline
                            ? "text-success"
                            : "text-gray-700 dark:text-base-content/60"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>

                    {unread > 0 && !isSelected && (
                      <span className="min-w-[24px] h-6 px-2 flex items-center justify-center text-xs rounded-xl bg-primary text-gray-900 font-bold shrink-0 shadow-sm">
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-error/15 text-error transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:ring-offset-2"
                    title="Remove friend"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent dark:from-primary/30 dark:to-primary/10 flex items-center justify-center mb-5 shadow-inner border border-primary/10">
                  <Users className="w-10 h-10 text-primary/60" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-base-content">
                  {showOnlineOnly ? "No online friends" : "No friends yet"}
                </p>
                <p className="text-xs text-gray-800 dark:text-base-content/60 mt-1 font-medium">
                  {showOnlineOnly
                    ? "All friends are offline"
                    : "Add friends by username to start chatting"}
                </p>
              </div>
            )}
          </>
        ) : (
          /* ADD FRIENDS TAB */
          <div className="space-y-5">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-base-content/50 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search by username"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-base-300/70 bg-white dark:bg-base-100 text-gray-900 dark:text-base-content text-sm font-medium placeholder:text-gray-500 dark:placeholder:text-base-content/50 outline-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
              {addUsername.trim().length >= 2 && (
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-3 rounded-2xl bg-primary text-gray-900 text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-all hover:opacity-90 shrink-0 shadow-lg shadow-primary/25 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              )}
            </form>

            {searchResult && (
              <div className="p-4 rounded-2xl bg-white dark:bg-base-200/80 border-2 border-gray-200/80 dark:border-base-300/50 flex items-center justify-between gap-3 shadow-lg transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={searchResult.user?.profilePic || "/boy.png"}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-base-300/50"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-base-content">{searchResult.user?.fullName}</p>
                    <p className="text-xs text-gray-800 dark:text-base-content/60 truncate font-medium">{searchResult.user?.email}</p>
                  </div>
                </div>
                {searchResult.status === "can_add" && (
                  <button
                    type="button"
                    onClick={() => sendRequest(searchResult.user.fullName)}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity shadow-md outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                  >
                    Add
                  </button>
                )}
                {searchResult.status === "pending_outgoing" && (
                  <span className="text-xs text-gray-700 dark:text-base-content/50 shrink-0 font-medium">Pending</span>
                )}
                {searchResult.status === "pending_incoming" && (
                  <span className="text-xs text-gray-700 dark:text-base-content/50 shrink-0 font-medium">Sent you a request</span>
                )}
              </div>
            )}

            {/* PENDING REQUESTS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-base-300 to-transparent" />
                <h3 className="text-xs font-bold text-gray-600 dark:text-base-content/60 uppercase tracking-widest">
                  Pending Requests
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-base-300 to-transparent" />
              </div>

              {isPendingLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {pendingIncoming.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-700 dark:text-base-content/50 font-semibold">Incoming</p>
                      {pendingIncoming.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white dark:bg-base-200/60 border-2 border-gray-200/80 dark:border-base-300/50 shadow-md"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={req.fromUser?.profilePic || "/boy.png"}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover border border-base-300/50"
                            />
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-base-content">{req.fromUser?.fullName}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => acceptRequest(req._id)}
                              className="p-2 rounded-lg bg-success/15 text-success hover:bg-success/25 transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-success/50 focus-visible:ring-offset-2"
                              title="Accept"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectRequest(req._id)}
                              className="p-2 rounded-lg bg-error/15 text-error hover:bg-error/25 transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:ring-offset-2"
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
                      <p className="text-xs text-gray-700 dark:text-base-content/50 font-semibold">Outgoing</p>
                      {pendingOutgoing.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-base-200/50 border-2 border-gray-200/60 dark:border-base-300/50 shadow-sm"
                        >
                          <img
                            src={req.toUser?.profilePic || "/boy.png"}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-base-300/50"
                          />
                          <p className="text-sm font-medium truncate flex-1 text-gray-900 dark:text-base-content">{req.toUser?.fullName}</p>
                          <span className="text-xs text-gray-700 dark:text-base-content/50 shrink-0 font-medium">Pending</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
                    <p className="text-sm text-gray-700 dark:text-base-content/50 py-4 font-medium">No pending requests</p>
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
        <div className="p-4 border-t-2 border-gray-200/80 dark:border-base-300/50 bg-gradient-to-t from-gray-100/80 to-gray-50/50 dark:from-base-200/60 dark:to-base-100/50">
          <div className="flex items-center gap-3 px-2 py-2 rounded-2xl bg-white/60 dark:bg-base-200/40 border border-gray-200/60 dark:border-base-300/30 shadow-inner">
            <div className="relative shrink-0">
              <div className="p-0.5 rounded-2xl bg-gradient-to-br from-primary to-primary/60">
                <img
                  src={authUser.profilePic || "/boy.png"}
                  alt="You"
                  className="w-11 h-11 rounded-[14px] object-cover border-2 border-white dark:border-base-200"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full ring-2 ring-white dark:ring-base-100 animate-pulse shadow-sm" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-900 dark:text-base-content">
                {authUser.fullName || "You"}
              </p>
              <p className="text-xs text-success flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 bg-success rounded-full shrink-0" />
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
