// backend/src/lib/redis.js
// Redis client with graceful fallback when Redis is unavailable

import Redis from "ioredis";

let redis = null;
let redisAvailable = false;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export async function connectRedis() {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 2 ? null : 1000),
    });

    redis.on("error", (err) => {
      console.warn("Redis error:", err.message);
    });

    redis.on("connect", () => {
      redisAvailable = true;
      console.log("Redis connected");
    });

    await redis.ping();
    redisAvailable = true;
    return redis;
  } catch (err) {
    console.warn("Redis unavailable, using in-memory fallback:", err.message);
    redis = null;
    redisAvailable = false;
    return null;
  }
}

export function getRedis() {
  return redis;
}

export function isRedisAvailable() {
  return redisAvailable && redis;
}

export async function disconnectRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    redisAvailable = false;
  }
}
