import { getRedis, isRedisAvailable } from "../lib/redis.js";
import { toIdString } from "../domain/ids.js";

const THREAD_TTL = 600; // 10 min hot cache
const MAX_THREAD_MESSAGES = 50;

function threadKey(userA, userB) {
  const [a, b] = [toIdString(userA), toIdString(userB)].sort();
  return `thread:${a}:${b}`;
}

/**
 * WhatsApp-style hot thread cache in Redis (recent messages for fast reads).
 */
export const conversationCacheService = {
  async appendMessage(userA, userB, messagePayload) {
    if (!isRedisAvailable()) return;
    const redis = getRedis();
    const key = threadKey(userA, userB);
    const serialized = JSON.stringify(messagePayload);
    await redis
      .multi()
      .lpush(key, serialized)
      .ltrim(key, 0, MAX_THREAD_MESSAGES - 1)
      .expire(key, THREAD_TTL)
      .exec();
  },

  async getRecent(userA, userB, limit = 20) {
    if (!isRedisAvailable()) return null;
    const redis = getRedis();
    const items = await redis.lrange(threadKey(userA, userB), 0, limit - 1);
    return items.map((s) => JSON.parse(s)).reverse();
  },
};
