// backend/src/lib/socket.js
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import redis, { pubClient, subClient } from "./redisClient.js";

// 🚫 Redis disabled temporarily for Render deployment
const USE_REDIS = false;

const userSocketsKey = (userId) => `user:${userId}:sockets`;
const onlineUsersKey = "online_users";

let io = null;

// -----------------------------------------------------
// BROADCAST ONLINE USERS
// -----------------------------------------------------
async function broadcastOnlineUsers() {
  if (!USE_REDIS) {
    io.emit("getOnlineUsers", []);
    return;
  }

  const users = await redis.sMembers(onlineUsersKey);
  io.emit("getOnlineUsers", users || []);
}

// -----------------------------------------------------
// FORCE LOGOUT
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
// INITIALIZE SOCKET.IO
// -----------------------------------------------------
export async function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:5174",

        // 🚨 YOUR REAL DEPLOYED FRONTEND
        "https://blah-blah-agnhzh6a8-0raghav-sharma0s-projects.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000,
  });

  if (USE_REDIS) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("🔗 Redis Adapter Enabled");
  } else {
    console.log("🚫 Redis Adapter Disabled");
  }

  io.on("connection", async (socket) => {
    console.log("🟢 Connected:", socket.id);

    const userId = socket.handshake.query?.userId;

    if (USE_REDIS && userId) {
      await redis.sAdd(userSocketsKey(userId), socket.id);
      await redis.sAdd(onlineUsersKey, userId);
      socket.join(userId);
    }

    await broadcastOnlineUsers();

    socket.on("private-message", ({ toUserId, message }) => {
      io.to(toUserId).emit("private-message", {
        from: userId,
        message,
      });
    });

    socket.on("music-sync", ({ roomId, ...data }) => {
      socket.to(roomId).emit("music-sync", data);
    });

    socket.on("whiteboard-draw", ({ roomId, data }) => {
      socket.to(roomId).emit("whiteboard-draw", data);
    });

    socket.on("whiteboard-clear", ({ roomId }) => {
      io.to(roomId).emit("whiteboard-clear");
    });

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
