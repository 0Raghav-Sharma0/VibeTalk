import { normId } from "./messageHelpers.js";

export function onlineSetFromIds(onlineIds) {
  const list = Array.isArray(onlineIds)
    ? onlineIds
    : Object.keys(onlineIds || {});
  return new Set(list.map(normId));
}

export function sameOnlineSet(prevIds, nextIds) {
  const a = onlineSetFromIds(prevIds);
  const b = onlineSetFromIds(nextIds);
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

export function patchUsersPresence(users, onlineIds) {
  if (!Array.isArray(users) || users.length === 0) return users;

  const online = onlineSetFromIds(onlineIds);
  let changed = false;

  const next = users.map((u) => {
    const isOnline = online.has(normId(u._id));
    if (Boolean(u.isOnline) === isOnline) return u;
    changed = true;
    return { ...u, isOnline };
  });

  return changed ? next : users;
}
