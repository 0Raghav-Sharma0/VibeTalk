import { useEffect, useState, useCallback, useMemo } from "react";
import { Users, UserPlus, Search, Check, X, Loader2, UsersRound } from "lucide-react";
import SidebarOnlineAvatars, { MAX_VISIBLE } from "./SidebarOnlineAvatars";
import SidebarFriendsList from "./SidebarFriendsList";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import { useMusicStore } from "../store/musicStore";
import { usePinnedStore } from "../store/usePinnedStore";
import { onlineFriendsForAvatars } from "../utils/sidebarFriends";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";

const SIDEBAR_TABS = [
  { id: "friends", label: "Friends", Icon: Users },
  { id: "groups", label: "Groups", Icon: UsersRound },
  { id: "add", label: "Add", Icon: UserPlus },
];

const Sidebar = ({ onClose }) => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadMessages,
    lastMessageAt,
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
  const [friendsFilter, setFriendsFilter] = useState("all");
  const [addUsername, setAddUsername] = useState("");

  const { pinnedIds, hydrate: hydratePins, togglePin } = usePinnedStore();

  const toStrId = useCallback((id) => (id?.toString?.() || String(id || "")), []);

  useEffect(() => {
    if (authUser?._id) hydratePins(authUser._id);
  }, [authUser?._id, hydratePins]);

  useEffect(() => {
    getUsers();
    fetchPendingRequests();
    getGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; presence via socket
  }, []);

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

  const friendsOnly = useMemo(
    () => users.filter((u) => toStrId(u._id) !== toStrId(authUser?._id)),
    [users, authUser?._id, toStrId]
  );

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const sortCtx = useMemo(
    () => ({ pinnedSet, lastMessageAt, unreadMessages }),
    [pinnedSet, lastMessageAt, unreadMessages]
  );

  const { visible: onlineAvatarFriends, overflow: onlineOverflow } = useMemo(
    () => onlineFriendsForAvatars(friendsOnly, sortCtx, MAX_VISIBLE),
    [friendsOnly, sortCtx]
  );

  const onlineCount = Math.max(
    0,
    onlineUsers.filter((id) => toStrId(id) !== toStrId(authUser?._id)).length
  );

  const friendCountLabel =
    friendsOnly.length === 1 ? "1 friend" : `${friendsOnly.length} friends`;

  const handleTogglePin = useCallback(
    (userId) => togglePin(userId),
    [togglePin]
  );

  if (isUsersLoading && users.length === 0) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full flex flex-col min-h-0 sidebar-theme text-gray-900 dark:text-white">
      <header className="sidebar-header">
        <div className="px-3 pt-3 pb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="sidebar-header-icon shrink-0">
              <Users className="w-5 h-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                Friends
              </h2>
            <p className="text-sm text-gray-600 dark:text-white/70 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{friendCountLabel}</span>
              <span className="text-gray-400 dark:text-white/60">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    onlineCount > 0
                      ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse"
                      : "bg-gray-400 dark:bg-white/40"
                  }`}
                />
                {onlineCount} online
              </span>
            </p>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          <nav className="sidebar-tabs" aria-label="Sidebar sections">
            {SIDEBAR_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id);
                  if (id === "add") {
                    clearSearch();
                    setAddUsername("");
                  }
                }}
                className={`sidebar-tab-btn ${
                  activeTab === id ? "sidebar-tab-btn--active" : ""
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {activeTab === "groups" && (
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="mt-2.5 w-full py-2.5 rounded-xl bg-violet-600 dark:bg-violet-600/90 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-700 dark:hover:bg-violet-500 transition-colors"
            >
              <UsersRound className="w-4 h-4" />
              Create group
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
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
                  className={`relative rounded-xl cursor-pointer transition-all duration-200 overflow-hidden hover-lift ${
                    isSelected
                      ? "bg-[#EEECF9] sidebar-friend-selected ring-1 ring-[#7D3DCF]/30 dark:ring-transparent"
                      : "bg-gray-100/80 dark-item hover:bg-gray-200"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-[#7D3DCF] dark:bg-[#7c3aed] rounded-r-full" />
                  )}
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ring-2 ${isSelected ? "bg-violet-100 dark:bg-violet-500/30 ring-[#7D3DCF] dark:ring-violet-500" : "bg-violet-100 dark:bg-white/10 ring-violet-200 dark:ring-white/30"}`}>
                      <UsersRound className={`w-4 h-4 ${isSelected ? "text-[#7D3DCF] dark:text-violet-400" : "text-violet-600 dark:text-white/90"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-[#7D3DCF] dark:text-violet-400" : "text-gray-900 dark:text-white"}`}>
                        {group.name}
                      </p>
                      <p className={`text-xs font-medium ${isSelected ? "text-[#9C66CC] dark:text-violet-400/90" : "text-gray-600 dark:text-white/80"}`}>
                        {group.members?.length || 0} members · {adminCount} admin{adminCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {unread > 0 && !isSelected && (
                      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs rounded-lg bg-violet-500 dark:bg-white text-white dark:text-black font-semibold shrink-0">
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white">No groups yet</p>
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
            <div className="sidebar-filter-row" role="tablist" aria-label="Friends filter">
              {[
                { id: "all", label: "All" },
                { id: "pinned", label: "Pinned" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={friendsFilter === id}
                  onClick={() => setFriendsFilter(id)}
                  className={`sidebar-filter-btn ${
                    friendsFilter === id ? "sidebar-filter-btn--active" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {friendsFilter === "all" && onlineAvatarFriends.length > 0 && (
              <SidebarOnlineAvatars
                friends={onlineAvatarFriends}
                overflow={onlineOverflow}
                onSelect={handleUserSelect}
              />
            )}

            {friendsOnly.length > 0 ? (
              <SidebarFriendsList
                users={friendsOnly}
                filter={friendsFilter}
                pinnedSet={pinnedSet}
                lastMessageAt={lastMessageAt}
                unreadMessages={unreadMessages}
                typing={typing}
                selectedUser={selectedUser}
                onSelect={handleUserSelect}
                onRemove={removeFriend}
                onTogglePin={handleTogglePin}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-white/10 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-violet-500 dark:text-white/80" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">No friends yet</p>
                <p className="text-sm text-gray-600 dark:text-white/80 mt-1 font-medium">
                  Add friends by username to start chatting
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
                  className="px-4 py-2 rounded-xl bg-violet-500 dark:bg-white text-white dark:text-black text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-opacity hover:bg-violet-600 dark:hover:bg-white/90 shrink-0"
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
                    className="shrink-0 px-3 py-2 rounded-lg bg-violet-500 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-violet-600 dark:hover:bg-white/90 transition-opacity"
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
              <h3 className="text-xs font-semibold text-gray-700 dark:text-white/90 uppercase tracking-wider">
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
              <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
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
