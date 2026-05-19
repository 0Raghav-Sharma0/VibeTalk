import { normId } from "./messageHelpers.js";

export function getLastActivity(user, lastMessageAt = {}) {
  const id = normId(user._id);
  if (lastMessageAt[id]) return lastMessageAt[id];
  if (user.lastMessageAt) return new Date(user.lastMessageAt).getTime();
  return 0;
}

export function compareFriends(a, b, { pinnedSet, lastMessageAt, unreadMessages }) {
  const idA = normId(a._id);
  const idB = normId(b._id);

  const pinA = pinnedSet.has(idA);
  const pinB = pinnedSet.has(idB);
  if (pinA !== pinB) return pinA ? -1 : 1;

  const unA = unreadMessages[idA] || 0;
  const unB = unreadMessages[idB] || 0;
  if (unA !== unB) return unB - unA;

  const onA = Boolean(a.isOnline);
  const onB = Boolean(b.isOnline);
  if (onA !== onB) return onA ? -1 : 1;

  const tA = getLastActivity(a, lastMessageAt);
  const tB = getLastActivity(b, lastMessageAt);
  if (tA !== tB) return tB - tA;

  return (a.fullName || "").localeCompare(b.fullName || "");
}

export function sortFriends(users, ctx) {
  return [...users].sort((a, b) => compareFriends(a, b, ctx));
}

/** Sections for "All" filter: pinned → online → recent (offline w/ chats) → offline */
export function groupFriendsForAll(users, ctx) {
  const sorted = sortFriends(users, ctx);
  const pinned = [];
  const online = [];
  const recent = [];
  const offline = [];

  for (const user of sorted) {
    const id = normId(user._id);
    const isPinned = ctx.pinnedSet.has(id);
    const isOnline = Boolean(user.isOnline);
    const hasRecent = getLastActivity(user, ctx.lastMessageAt) > 0;

    if (isPinned) {
      pinned.push(user);
      continue;
    }
    if (isOnline) {
      online.push(user);
      continue;
    }
    if (hasRecent) {
      recent.push(user);
      continue;
    }
    offline.push(user);
  }

  return { pinned, online, recent, offline };
}

export function onlineFriendsForAvatars(users, ctx, maxVisible = 6) {
  const online = users.filter((u) => Boolean(u.isOnline));
  const sorted = sortFriends(online, ctx);
  const visible = sorted.slice(0, maxVisible);
  const overflow = Math.max(0, sorted.length - maxVisible);
  return { visible, overflow, total: sorted.length };
}
