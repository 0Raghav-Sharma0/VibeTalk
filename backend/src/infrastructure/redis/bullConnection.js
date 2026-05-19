import IORedis from "ioredis";
import { env } from "../../config/env.js";
import { isRedisAvailable } from "../../lib/redis.js";

let bullConnection = null;

/**
 * Dedicated Redis connection for BullMQ (maxRetriesPerRequest must be null).
 */
export function getBullConnection() {
  if (!env.redisUrl) return null;
  if (!bullConnection) {
    bullConnection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    bullConnection.on("error", (err) => {
      console.warn("BullMQ Redis error:", err.message);
    });
  }
  return bullConnection;
}

export async function closeBullConnection() {
  if (bullConnection) {
    await bullConnection.quit();
    bullConnection = null;
  }
}

/** Queues only when Redis actually connected (not just REDIS_URL in .env). */
export function isQueueInfrastructureReady() {
  return Boolean(env.redisUrl && isRedisAvailable() && getBullConnection());
}
