import { cacheGet, cacheSet, cacheKeys } from "../lib/cache.js";
import { friendRepository } from "../repositories/friend.repository.js";
import { toIdString } from "../domain/ids.js";

const FRIEND_IDS_CACHE_TTL = 180;

/**
 * Shared friend-graph reads (used by sidebar, groups, friend flows).
 */
export const friendGraphService = {
  async getFriendIdSet(userId) {
    const cacheKey = cacheKeys.friendIds(userId);
    const cached = await cacheGet(cacheKey);
    if (cached) return new Set(cached);

    const accepted = await friendRepository.findAcceptedForUser(userId);
    const ids = new Set();
    for (const r of accepted) {
      ids.add(toIdString(r.fromUser));
      ids.add(toIdString(r.toUser));
    }
    ids.delete(toIdString(userId));

    await cacheSet(cacheKey, [...ids], FRIEND_IDS_CACHE_TTL);
    return ids;
  },
};
