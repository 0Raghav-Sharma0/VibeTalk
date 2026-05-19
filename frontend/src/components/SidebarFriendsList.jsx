import { memo } from "react";
import SidebarFriendRow from "./SidebarFriendRow";
import { groupFriendsForAll, sortFriends } from "../utils/sidebarFriends";
import { normId } from "../utils/messageHelpers";

function SectionHeader({ label }) {
  return (
    <p className="type-section text-gray-500 dark:text-white/60 px-2 pt-2 pb-1">
      {label}
    </p>
  );
}

function FriendRows({
  users,
  selectedUserId,
  unreadMessages,
  typing,
  pinnedSet,
  onSelect,
  onRemove,
  onTogglePin,
}) {
  return users.map((user) => {
    const id = normId(user._id);
    return (
      <SidebarFriendRow
        key={id}
        user={user}
        isSelected={selectedUserId === id}
        isOnline={Boolean(user.isOnline)}
        isPinned={pinnedSet.has(id)}
        unread={unreadMessages[id] || 0}
        isTyping={typing[id]}
        onSelect={() => onSelect(user)}
        onRemove={() => onRemove(id)}
        onTogglePin={() => onTogglePin(id)}
      />
    );
  });
}

function SidebarFriendsList({
  users,
  filter,
  pinnedSet,
  lastMessageAt,
  unreadMessages,
  typing,
  selectedUser,
  onSelect,
  onRemove,
  onTogglePin,
}) {
  const ctx = { pinnedSet, lastMessageAt, unreadMessages };
  const selectedUserId = selectedUser?._id ? normId(selectedUser._id) : null;

  if (filter === "pinned") {
    const pinnedUsers = sortFriends(
      users.filter((u) => pinnedSet.has(normId(u._id))),
      ctx
    );
    if (pinnedUsers.length === 0) {
      return (
        <p className="text-sm text-center text-gray-600 dark:text-white/70 py-8 px-4 font-medium">
          Pin friends from the list to see them here
        </p>
      );
    }
    return (
      <FriendRows
        users={pinnedUsers}
        selectedUserId={selectedUserId}
        unreadMessages={unreadMessages}
        typing={typing}
        pinnedSet={pinnedSet}
        onSelect={onSelect}
        onRemove={onRemove}
        onTogglePin={onTogglePin}
      />
    );
  }

  const { pinned, online, recent, offline } = groupFriendsForAll(users, ctx);

  return (
    <>
      {pinned.length > 0 && (
        <>
          <SectionHeader label="Pinned" />
          <FriendRows
            users={pinned}
            selectedUserId={selectedUserId}
            unreadMessages={unreadMessages}
            typing={typing}
            pinnedSet={pinnedSet}
            onSelect={onSelect}
            onRemove={onRemove}
            onTogglePin={onTogglePin}
          />
        </>
      )}
      {online.length > 0 && (
        <>
          <SectionHeader label="Online" />
          <FriendRows
            users={online}
            selectedUserId={selectedUserId}
            unreadMessages={unreadMessages}
            typing={typing}
            pinnedSet={pinnedSet}
            onSelect={onSelect}
            onRemove={onRemove}
            onTogglePin={onTogglePin}
          />
        </>
      )}
      {recent.length > 0 && (
        <>
          <SectionHeader label="Recent" />
          <FriendRows
            users={recent}
            selectedUserId={selectedUserId}
            unreadMessages={unreadMessages}
            typing={typing}
            pinnedSet={pinnedSet}
            onSelect={onSelect}
            onRemove={onRemove}
            onTogglePin={onTogglePin}
          />
        </>
      )}
      {offline.length > 0 && (
        <>
          <SectionHeader label="Offline" />
          <FriendRows
            users={offline}
            selectedUserId={selectedUserId}
            unreadMessages={unreadMessages}
            typing={typing}
            pinnedSet={pinnedSet}
            onSelect={onSelect}
            onRemove={onRemove}
            onTogglePin={onTogglePin}
          />
        </>
      )}
    </>
  );
}

export default memo(SidebarFriendsList);
