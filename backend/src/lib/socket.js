// backend/src/lib/socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// ================================================
// 🔐 ALLOWED FRONTEND ORIGINS
// ================================================
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://blah-blah-jvc4.vercel.app",                       // your Vercel
        "https://blah-blah-hky1.vercel.app",                       // your new vercel
        "https://blah-blah-3.onrender.com",                        // your render frontend
      ]
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:4173",
      ];

console.log("🧩 Allowed Socket Origins:", allowedOrigins);

// ================================================
// 🎧 SOCKET.IO SETUP
// ================================================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ================================================
// 👤 ONLINE USERS (No Redis)
// ================================================
const userSocketMap = {}; // userId → socketId

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// ================================================
// 🔥 SOCKET EVENTS
// ================================================
io.on("connection", (socket) => {
  console.log("🟢 Socket Connected:", socket.id);

  const userId = socket.handshake.query.userId;

  // Save user online
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`👤 User ${userId} online`);
  }

  // Broadcast active users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ==================================================
  // 📞 REAL-TIME CALL SYSTEM (No Redis, Fully Working)
  // ==================================================

  // User A calls User B
  socket.on("call-user", ({ targetUserId, offer, callType = "video" }) => {
    const targetSocket = getReceiverSocketId(targetUserId);

    if (!targetSocket) {
      socket.emit("call-failed", { reason: "User is offline" });
      return;
    }

    io.to(targetSocket).emit("incoming-call", {
      from: userId,
      offer,
      callType,
    });
  });

  // User B accepts
  socket.on("call-accepted", ({ callerId, answer }) => {
    const callerSocket = getReceiverSocketId(callerId);
    if (callerSocket) io.to(callerSocket).emit("call-accepted", { answer });
  });

  // User B rejects
  socket.on("call-rejected", ({ callerId }) => {
    const callerSocket = getReceiverSocketId(callerId);
    if (callerSocket) io.to(callerSocket).emit("call-rejected");
  });

  // End Call
  socket.on("end-call", ({ targetUserId }) => {
    const targetSocket = getReceiverSocketId(targetUserId);
    if (targetSocket) io.to(targetSocket).emit("call-ended");
  });

  // WebRTC Answer
  socket.on("webrtc-answer", ({ targetUserId, answer }) => {
    const targetSocket = getReceiverSocketId(targetUserId);
    if (targetSocket)
      io.to(targetSocket).emit("webrtc-answer", { answer, from: userId });
  });

  // WebRTC ICE Candidate
  socket.on("webrtc-ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocket = getReceiverSocketId(targetUserId);
    if (targetSocket)
      io.to(targetSocket).emit("webrtc-ice-candidate", {
        candidate,
        from: userId,
      });
  });

  // ==================================================
  // ❤️ MESSAGE REACTIONS
  // ==================================================
  socket.on("sendReaction", ({ messageId, userId, emoji }) => {
    io.emit("messageReaction", { messageId, userId, emoji });
  });

  // ==================================================
  // 🎧 MUSIC SYNC (Play/Pause/Seek)
  // ==================================================
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`🎵 Joined Room ${roomId}`);
  });

  socket.on("music-sync", ({ roomId, action, songUrl, songName, currentTime }) => {
    socket.to(roomId).emit("music-sync", {
      action,
      songUrl,
      songName,
      currentTime: currentTime || 0,
    });
  });

  // ==================================================
  // ✏️ REAL-TIME WHITEBOARD
  // ==================================================
  socket.on("whiteboard-draw", ({ roomId, data }) => {
    socket.to(roomId).emit("whiteboard-draw", data);
  });

  socket.on("whiteboard-clear", ({ roomId }) => {
    io.to(roomId).emit("whiteboard-clear");
  });

  // ==================================================
  // ❌ DISCONNECT
  // ==================================================
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);

    // Remove user from map
    for (const uid in userSocketMap) {
      if (userSocketMap[uid] === socket.id) {
        delete userSocketMap[uid];
        console.log(`❌ User ${uid} offline`);
        break;
      }
    }

    // Update online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
