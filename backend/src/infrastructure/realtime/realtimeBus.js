import { Emitter } from "@socket.io/redis-emitter";
import Redis from "ioredis";
import { getIO } from "../../lib/ioHolder.js";
import { userRoom } from "../../config/queues.js";
import { toIdString } from "../../domain/ids.js";
import { env } from "../../config/env.js";
import { isRedisAvailable } from "../../lib/redis.js";

let redisEmitter = null;
let emitterRedis = null;

/**
 * Redis Emitter — lets worker processes push to Socket.IO rooms without hosting HTTP.
 * API nodes use getIO(); worker pods use redisEmitter (same Redis adapter channel).
 */
export async function initRealtimeBus() {
  if (redisEmitter || !isRedisAvailable()) return redisEmitter;

  const url = env.redisUrl || process.env.REDIS_URL || "redis://localhost:6379";
  emitterRedis = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  redisEmitter = new Emitter(emitterRedis);
  return redisEmitter;
}

export function getRealtimeBus() {
  return { io: getIO(), emitter: redisEmitter };
}

function emitToRoom(room, event, payload) {
  const io = getIO();
  if (io) {
    io.to(room).emit(event, payload);
    return true;
  }
  if (redisEmitter) {
    redisEmitter.to(room).emit(event, payload);
    return true;
  }
  return false;
}

export function realtimeEmitToUser(userId, event, payload) {
  return emitToRoom(userRoom(toIdString(userId)), event, payload);
}

export function realtimeEmitToUsers(userIds, event, payload) {
  const seen = new Set();
  for (const id of userIds) {
    const key = toIdString(id);
    if (seen.has(key)) continue;
    seen.add(key);
    emitToRoom(userRoom(key), event, payload);
  }
}

export async function closeRealtimeBus() {
  if (emitterRedis) {
    await emitterRedis.quit().catch(() => {});
    emitterRedis = null;
  }
  redisEmitter = null;
}
