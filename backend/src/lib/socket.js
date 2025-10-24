import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// ✅ Updated CORS for your frontend (Vercel) and dev
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://blah-blah-jvc4-7m41x6617-raghavsharma099900-7404s-projects.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {};
const activeCalls = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ==================== CALL HANDLING ====================
  socket.on("call-user", ({ targetUserId, offer, callType = "video" }) => {
    const targetSocketId = getReceiverSocketId(targetUserId);
    if (targetSocketId) {
      activeCalls[socket.id] = { caller: userId, callee: targetUserId, callType };
      io.to(targetSocketId).emit("incoming-call", { from: userId, offer, callType });
    } else {
      socket.emit("call-failed", { reason: "User offline" });
    }
  });

  socket.on("call-accepted", ({ callerId, answer }) => {
    const callerSocketId = userSocketMap[callerId];
    if (callerSocketId) io.to(callerSocketId).emit("call-accepted", { answer });
  });

  socket.on("call-rejected", ({ callerId }) => {
    const callerSocketId = userSocketMap[callerId];
    if (callerSocketId) io.to(callerSocketId).emit("call-rejected");
  });

  socket.on("end-call", ({ targetUserId }) => {
    const targetSocketId = getReceiverSocketId(targetUserId);
    if (targetSocketId) io.to(targetSocketId).emit("call-ended");
  });

  // ==================== WEBRTC SIGNALING ====================
  socket.on("webrtc-answer", ({ targetUserId, answer }) => {
    const targetSocketId = getReceiverSocketId(targetUserId);
    if (targetSocketId)
      io.to(targetSocketId).emit("webrtc-answer", { answer, from: userId });
  });

  socket.on("webrtc-ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocketId = getReceiverSocketId(targetUserId);
    if (targetSocketId)
      io.to(targetSocketId).emit("webrtc-ice-candidate", { candidate, from: userId });
  });

  // ==================== CHAT REACTIONS ====================
  socket.on("sendReaction", ({ messageId, userId, emoji }) => {
    io.emit("messageReaction", { messageId, userId, emoji });
  });

  // ==================== MUSIC SYNC ====================
  socket.on("join-room", (roomId) => socket.join(roomId));
  socket.on("music-sync", ({ roomId, action, songUrl, songName, currentTime }) => {
    io.to(roomId).emit("music-sync", { action, songUrl, songName, currentTime });
  });

  // ==================== DISCONNECT ====================
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
