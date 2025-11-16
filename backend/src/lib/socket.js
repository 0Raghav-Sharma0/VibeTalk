// backend/src/lib/socket.js
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import redis, { pubClient, subClient } from "./redisClient.js";

// Redis keys
const userSocketsKey = (userId) => `user:${userId}:sockets`;
const onlineUsersKey = "online_users";

let io = null;

// -----------------------------------------------------
// BROADCAST ONLINE USERS
// -----------------------------------------------------
async function broadcastOnlineUsers() {
  const users = await redis.sMembers(onlineUsersKey); // correct v4/v5 API
  io.emit("getOnlineUsers", users || []);
}

// -----------------------------------------------------
// FORCE LOGOUT USER FROM ALL DEVICES
// -----------------------------------------------------
async function forceLogoutUser(userId) {
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

  // attach redis adapter (multi instance support)
  io.adapter(createAdapter(pubClient, subClient));

  // -----------------------------------------------------
  // CLIENT CONNECTED
  // -----------------------------------------------------
  io.on("connection", async (socket) => {
    console.log("🟢 Connected:", socket.id);

    const userId = socket.handshake.query?.userId;

    if (userId) {
      await redis.sAdd(userSocketsKey(userId), socket.id);
      await redis.sAdd(onlineUsersKey, userId);

      socket.join(userId); // personal room
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
      const sockets = await redis.sMembers(userSocketsKey(targetUserId));
      sockets.forEach((sid) =>
        io.to(sid).emit("incoming-call", { from: userId, offer, callType })
      );
    });

    socket.on("webrtc-answer", async ({ targetUserId, answer }) => {
      const sockets = await redis.sMembers(userSocketsKey(targetUserId));
      sockets.forEach((sid) =>
        io.to(sid).emit("webrtc-answer", { answer, from: userId })
      );
    });

    socket.on("webrtc-ice-candidate", async ({ targetUserId, candidate }) => {
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

      if (userId) {
        await redis.sRem(userSocketsKey(userId), socket.id);

        const left = await redis.sCard(userSocketsKey(userId));
        if (left === 0) await redis.sRem(onlineUsersKey, userId);
      }

      await broadcastOnlineUsers();
    });
  });

  // -----------------------------------------------------
  // REDIS PUB/SUB: FORCE LOGOUT
  // -----------------------------------------------------
  await subClient.subscribe("force-logout", async (msg) => {
    const { userId } = JSON.parse(msg);
    await forceLogoutUser(userId);
  });

  console.log("📢 Subscribed to Redis: force-logout");
}

export { io };
