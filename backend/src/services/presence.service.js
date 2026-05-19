import { getRedis, isRedisAvailable } from "../lib/redis.js";
import { toIdString } from "../domain/ids.js";

const PRESENCE_KEY = "presence:online_users";
const inMemoryOnline = new Set();

/**
 * Distributed presence (Redis SET) with in-memory fallback for single-node dev.
 */
export const presenceService = {
  async setOnline(userId) {
    const id = toIdString(userId);
    if (isRedisAvailable()) {
      await getRedis().sadd(PRESENCE_KEY, id);
    } else {
      inMemoryOnline.add(id);
    }
    return id;
  },

  async setOffline(userId) {
    const id = toIdString(userId);
    if (isRedisAvailable()) {
      await getRedis().srem(PRESENCE_KEY, id);
    } else {
      inMemoryOnline.delete(id);
    }
    return id;
  },

  async getOnlineUserIds() {
    if (isRedisAvailable()) {
      return getRedis().smembers(PRESENCE_KEY);
    }
    return [...inMemoryOnline];
  },

  async isOnline(userId) {
    const id = toIdString(userId);
    if (isRedisAvailable()) {
      return (await getRedis().sismember(PRESENCE_KEY, id)) === 1;
    }
    return inMemoryOnline.has(id);
  },
};
