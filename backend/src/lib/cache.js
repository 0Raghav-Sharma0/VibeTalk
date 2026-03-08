// backend/src/lib/cache.js
// Redis-backed cache with in-memory fallback

import { getRedis, isRedisAvailable } from "./redis.js";

const memoryCache = new Map();
const DEFAULT_TTL = 300; // 5 minutes

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export async function cacheGet(key) {
  if (isRedisAvailable()) {
    try {
      const val = await getRedis().get(key);
      return val ? safeJsonParse(val) : null;
    } catch {
      return null;
    }
  }
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSet(key, value, ttlSeconds = DEFAULT_TTL) {
  const serialized = JSON.stringify(value);
  if (isRedisAvailable()) {
    try {
      await getRedis().setex(key, ttlSeconds, serialized);
      return true;
    } catch {
      return false;
    }
  }
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  return true;
}

export async function cacheDel(key) {
  if (isRedisAvailable()) {
    try {
      await getRedis().del(key);
    } catch {}
  }
  memoryCache.delete(key);
}

export async function cacheDelPattern(prefix) {
  if (isRedisAvailable()) {
    try {
      const keys = await getRedis().keys(`${prefix}*`);
      if (keys.length > 0) await getRedis().del(...keys);
    } catch {}
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}

// Cache key helpers - always normalize to string for consistent keys
export const cacheKeys = {
  user: (id) => `user:${id != null ? String(id) : ""}`,
  senderMeta: (id) => `sender:${id != null ? String(id) : ""}`,
  sidebarUsers: (userId) => `sidebar:${userId != null ? String(userId) : ""}`,
  friendIds: (userId) => `friendIds:${userId != null ? String(userId) : ""}`,
};

/** Invalidate sidebar + friendIds for both users when friend relationship changes */
export async function invalidateFriendCache(userId1, userId2) {
  const toStr = (id) => (id != null && typeof id === "object" && id._id != null ? String(id._id) : String(id ?? ""));
  const ids = [toStr(userId1), toStr(userId2)].filter(Boolean);
  for (const id of ids) {
    await cacheDel(cacheKeys.sidebarUsers(id));
    await cacheDel(cacheKeys.friendIds(id));
  }
}
