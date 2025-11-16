// backend/src/lib/socket.js
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import redis, { pubClient, subClient } from "./redisClient.js";

// 🚫 Redis disabled temporarily for Render deployment
const USE_REDIS = false;

// Redis keys
const userSocketsKey = (userId) => `user:${userId}:sockets`;
const onlineUsersKey = "online_users";

let io = null;

// -----------------------------------------------------
// BROADCAST ONLINE USERS
// -----------------------------------------------------
async function broadcastOnlineUsers() {
  if (!USE_REDIS) {
    io.emit("getOnlineUsers", []); // no redis → empty list
    return;
  }

  const users = await redis.sMembers(onlineUsersKey);
  io.emit("getOnlineUsers", users || []);
}

// -----------------------------------------------------
// FORCE LOGOUT USER FROM ALL DEVICES
// -----------------------------------------------------
async function forceLogoutUser(userId) {
  if (!USE_REDIS) return;

  const sockets = await redis.sMembers(userSocketsKey(userId));
  if (!sockets || sockets.length === 0) return;

  sockets.forEach((sid) => {
    io.to(sid).emit("force-logout", { reason: "logged_out" });

    const sock = io.sockets.sockets.get(sid);
    if (sock) sock.disconnect(true);
  });
}

// -----------------------------------------------------
// INITIALIZE SOCKET
// -----------------------------------------------------
export async function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:4173",
        "https://blah-blah-jvc4.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000,
  });

  // attach redis adapter (only if enabled)
  if (USE_REDIS) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("🔗 Redis Adapter Enabled");
  } else {
    console.log("🚫 Redis Adapter Disabled");
  }

  // -----------------------------------------------------
  // CLIENT CONNECTED
  // -----------------------------------------------------
  io.on("connection", async (socket) => {
    console.log("🟢 Connected:", socket.id);

    const userId = socket.handshake.query?.userId;

    // Save online users only if Redis enabled
    if (USE_REDIS && userId) {
      await redis.sAdd(userSocketsKey(userId), socket.id);
      await redis.sAdd(onlineUsersKey, userId);
      socket.join(userId);
    }

    await broadcastOnlineUsers();

    // -----------------------------------------------------
    // PRIVATE MESSAGE
    // -----------------------------------------------------
    socket.on("private-message", ({ toUserId, message }) => {
      io.to(toUserId).emit("private-message", {
        from: userId,
        message,
      });
    });

    // -----------------------------------------------------
    // CALL SYSTEM
    // -----------------------------------------------------
    socket.on("call-user", async ({ targetUserId, offer, callType }) => {
      if (!USE_REDIS) return; // disable for now

      const sockets = await redis.sMembers(userSocketsKey(targetUserId));
      sockets.forEach((sid) =>
        io.to(sid).emit("incoming-call", { from: userId, offer, callType })
      );
    });

    socket.on("webrtc-answer", async ({ targetUserId, answer }) => {
      if (!USE_REDIS) return;

      const sockets = await redis.sMembers(userSocketsKey(targetUserId));
      sockets.forEach((sid) =>
        io.to(sid).emit("webrtc-answer", { answer, from: userId })
      );
    });

    socket.on("webrtc-ice-candidate", async ({ targetUserId, candidate }) => {
      if (!USE_REDIS) return;

      const sockets = await redis.sMembers(userSocketsKey(targetUserId));
      sockets.forEach((sid) =>
        io.to(sid).emit("webrtc-ice-candidate", { candidate, from: userId })
      );
    });

    // -----------------------------------------------------
    // MUSIC SYNC
    // -----------------------------------------------------
    socket.on("music-sync", ({ roomId, ...data }) => {
      socket.to(roomId).emit("music-sync", data);
    });

    // -----------------------------------------------------
    // WHITEBOARD
    // -----------------------------------------------------
    socket.on("whiteboard-draw", ({ roomId, data }) => {
      socket.to(roomId).emit("whiteboard-draw", data);
    });

    socket.on("whiteboard-clear", ({ roomId }) => {
      io.to(roomId).emit("whiteboard-clear");
    });

    // -----------------------------------------------------
    // DISCONNECT
    // -----------------------------------------------------
    socket.on("disconnect", async () => {
      console.log("🔴 Disconnected:", socket.id);

      if (USE_REDIS && userId) {
        await redis.sRem(userSocketsKey(userId), socket.id);

        const left = await redis.sCard(userSocketsKey(userId));
        if (left === 0) await redis.sRem(onlineUsersKey, userId);
      }

      await broadcastOnlineUsers();
    });
  });

  // -----------------------------------------------------
  // Redis pub/sub only if enabled
  // -----------------------------------------------------
  if (USE_REDIS) {
    await subClient.subscribe("force-logout", async (msg) => {
      const { userId } = JSON.parse(msg);
      await forceLogoutUser(userId);
    });

    console.log("📢 Subscribed: force-logout");
  } else {
    console.log("🚫 Redis Pub/Sub Disabled");
  }
}

export { io };
