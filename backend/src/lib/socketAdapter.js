import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { env } from "../config/env.js";
import { isRedisAvailable } from "./redis.js";

/** Dedicated pub/sub clients — never share the app Redis client (BullMQ/cache can close it). */
let pubClient = null;
let subClient = null;
let adapterAttached = false;

export function isSocketAdapterAttached() {
  return adapterAttached;
}

/**
 * Enables horizontal scaling: any app instance can emit to any user's room.
 */
export async function attachSocketRedisAdapter(io) {
  if (!isRedisAvailable()) {
    console.warn(
      "⚠️ Socket.IO Redis adapter skipped — single-instance mode (set REDIS_URL for scale-out)"
    );
    return false;
  }

  const url = env.redisUrl || process.env.REDIS_URL || "redis://localhost:6379";

  pubClient = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 200, 3000),
  });
  subClient = pubClient.duplicate();

  pubClient.on("error", (err) => {
    console.warn("Socket adapter Redis pub error:", err.message);
  });
  subClient.on("error", (err) => {
    console.warn("Socket adapter Redis sub error:", err.message);
  });

  await Promise.all([pubClient.ping(), subClient.ping()]);

  io.adapter(createAdapter(pubClient, subClient));
  adapterAttached = true;
  console.log("✅ Socket.IO Redis adapter attached (dedicated pub/sub)");
  return true;
}

export async function closeSocketRedisAdapter() {
  adapterAttached = false;
  if (subClient) {
    await subClient.quit().catch(() => {});
    subClient = null;
  }
  if (pubClient) {
    await pubClient.quit().catch(() => {});
    pubClient = null;
  }
}
