// backend/src/lib/socket.js

import { Server } from "socket.io";

/* ============================================================
   ALLOWED FRONTEND ORIGINS (CORS)
============================================================ */
const allowedOrigins = [
  // Local dev
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",

  // Vercel main deployments
  "https://blah-blah-jvc4.vercel.app",
  "https://blah-blah-hky1.vercel.app",

  // Allow all vercel preview URLs
  /^https:\/\/.*\.vercel\.app$/,

  // Render static site
  "https://blah-blah-3.onrender.com",
];

function isOriginAllowed(origin) {
  if (!origin) return false;

  // Direct match
  if (allowedOrigins.includes(origin)) return true;

  // RegExp match
  return allowedOrigins.some((o) => o instanceof RegExp && o.test(origin));
}

/* ============================================================
   SOCKET.IO INSTANCE
============================================================ */
let io = null;

/* ============================================================
   ONLINE USERS (NO REDIS)
============================================================ */
const userSocketMap = {}; // userId → socketId

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

/* ============================================================
   CREATE SOCKET SERVER
============================================================ */
export function createSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          console.log("❌ BLOCKED ORIGIN:", origin);
          callback(new Error("CORS Not Allowed: " + origin));
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  console.log("🔥 Socket.IO initialized with CORS");

  /* ============================================================
     SOCKET EVENTS
  ============================================================ */
  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    const userId = socket.handshake.query.userId;

    // Track online users
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`👤 User online: ${userId}`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    /* =======================
       CALLING SYSTEM
    ======================== */
    socket.on("call-user", ({ targetUserId, offer, callType }) => {
      const receiver = getReceiverSocketId(targetUserId);

      if (!receiver) {
        socket.emit("call-failed", { reason: "User offline" });
        return;
      }

      io.to(receiver).emit("incoming-call", {
        from: userId,
        offer,
        callType,
      });
    });

    socket.on("call-accepted", ({ callerId, answer }) => {
      const callerSocket = getReceiverSocketId(callerId);
      if (callerSocket) io.to(callerSocket).emit("call-accepted", { answer });
    });

    socket.on("call-rejected", ({ callerId }) => {
      const callerSocket = getReceiverSocketId(callerId);
      if (callerSocket) io.to(callerSocket).emit("call-rejected");
    });

    socket.on("end-call", ({ targetUserId }) => {
      const receiver = getReceiverSocketId(targetUserId);
      if (receiver) io.to(receiver).emit("call-ended");
    });

    /* =======================
       WEBRTC SIGNALING
    ======================== */
    socket.on("webrtc-answer", ({ targetUserId, answer }) => {
      const receiver = getReceiverSocketId(targetUserId);
      if (receiver)
        io.to(receiver).emit("webrtc-answer", { answer, from: userId });
    });

    socket.on("webrtc-ice-candidate", ({ targetUserId, candidate }) => {
      const receiver = getReceiverSocketId(targetUserId);
      if (receiver)
        io.to(receiver).emit("webrtc-ice-candidate", {
          candidate,
          from: userId,
        });
    });

    /* =======================
       MESSAGE REACTIONS
    ======================== */
    socket.on("sendReaction", ({ messageId, userId, emoji }) => {
      io.emit("messageReaction", { messageId, userId, emoji });
    });

    /* =======================
       WHITEBOARD REAL-TIME SYNC
    ======================== */

    // Join a room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`📝 Joined whiteboard room: ${roomId}`);
    });

    // Draw data broadcast (REAL FIX)
    socket.on("whiteboard-draw", (payload) => {
      if (!payload) return;

      const { roomId } = payload;
      if (!roomId) return;

      // Broadcast the SAME payload your frontend expects
      socket.to(roomId).emit("whiteboard-draw", payload);
    });

    // Clear canvas
    socket.on("whiteboard-clear", ({ roomId }) => {
      if (!roomId) return;
      io.to(roomId).emit("whiteboard-clear");
    });

    /* =======================
       MUSIC SYNC
    ======================== */
    socket.on("music-sync", ({ roomId, action, songUrl, songName, currentTime }) => {
      socket.to(roomId).emit("music-sync", {
        action,
        songUrl,
        songName,
        currentTime,
      });
    });

    /* =======================
       DISCONNECT
    ======================== */
    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);

      for (const uid in userSocketMap) {
        if (userSocketMap[uid] === socket.id) {
          delete userSocketMap[uid];
          console.log(`❌ User offline: ${uid}`);
        }
      }

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
}

/* ============================================================
   GET SOCKET INSTANCE
============================================================ */
export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized!");
  return io;
}
