// backend/src/lib/socket.js
import { Server } from "socket.io";
import Message from "../models/message.model.js";

/* ============================================================
   ALLOWED ORIGINS
============================================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  /^https:\/\/.*\.vercel\.app$/,
  "https://blah-blah-jvc4.vercel.app",
  "https://blah-blah-hky1.vercel.app",
  "https://blah-blah-3.onrender.com",

  // ⭐ ADD THIS
  "https://visionary-hotteok-e390a5.netlify.app"
];


function isOriginAllowed(origin) {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOrigins.some((o) => o instanceof RegExp && o.test(origin));
}

/* ============================================================
   SOCKET SETUP
============================================================ */
let io = null;
const userSocketMap = {}; // userId -> socketId

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
        if (isOriginAllowed(origin)) callback(null, true);
        else {
          console.warn("❌ BLOCKED ORIGIN:", origin);
          callback(new Error("CORS Not Allowed: " + origin));
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  console.log("🔥 Socket.IO initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    const userId = socket.handshake.query?.userId;

    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`👤 User online -> ${userId} : ${socket.id}`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    /* ============================================================
       MESSAGING
    ============================================================ */
    socket.on("sendMessage", async (data) => {
      try {
        const { senderId, receiverId, text, image, video } = data;
        const message = await Message.create({
          senderId,
          receiverId,
          text: text || "",
          image: image || null,
          video: video || null,
        });

        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket) io.to(receiverSocket).emit("newMessage", message);

        io.to(socket.id).emit("newMessage", message);
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

    /* ============================================================
       TYPING / DELIVERED / SEEN
    ============================================================ */
    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      const receiverSocket = getReceiverSocketId(receiverId);
      if (receiverSocket)
        io.to(receiverSocket).emit("typing", { senderId, isTyping });
    });

    socket.on("msg-delivered", async ({ messageId, receiverId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { delivered: true });
        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket)
          io.to(receiverSocket).emit("msg-delivered-update", { messageId });
        io.to(socket.id).emit("msg-delivered-update", { messageId });
      } catch (err) {
        console.error("msg-delivered error:", err);
      }
    });

    socket.on("msg-seen", async ({ myId, friendId }) => {
      try {
        await Message.updateMany(
          { senderId: friendId, receiverId: myId, seen: false },
          { seen: true, delivered: true }
        );
        const friendSocket = getReceiverSocketId(friendId);
        if (friendSocket)
          io.to(friendSocket).emit("msg-seen-update", { by: myId });
      } catch (err) {
        console.error("msg-seen error:", err);
      }
    });

    /* ============================================================
       WHITEBOARD / MUSIC
    ============================================================ */
    socket.on("join-room", (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
    });

    socket.on("whiteboard-draw", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("whiteboard-draw", payload);
    });

    socket.on("whiteboard-clear", ({ roomId }) => {
      if (!roomId) return;
      io.to(roomId).emit("whiteboard-clear");
    });

    socket.on("music-sync", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("music-sync", payload);
    });

    /* ============================================================
       CALLING / WEBRTC SIGNALING (FIXED!!!)
    ============================================================ */

    // FIXED: remove broken `from`, use socket userId instead
    socket.on("call-user", ({ targetUserId, offer, callType }) => {
      try {
        const from = socket.handshake.query?.userId; // FIXED SOURCE

        if (!targetUserId) {
          io.to(socket.id).emit("call-failed", { reason: "Missing targetUserId" });
          return;
        }

        const targetSocketId = getReceiverSocketId(targetUserId);
        if (!targetSocketId) {
          io.to(socket.id).emit("call-failed", { reason: "User offline" });
          return;
        }

        io.to(targetSocketId).emit("incoming-call", { from, offer, callType });
      } catch (err) {
        console.error("call-user error:", err);
        io.to(socket.id).emit("call-failed", { reason: "Server error" });
      }
    });

    socket.on("call-accepted", ({ callerId, answer }) => {
      const callerSocket = getReceiverSocketId(callerId);
      if (callerSocket) io.to(callerSocket).emit("call-accepted", { answer });
    });

    socket.on("call-rejected", ({ callerId }) => {
      const callerSocket = getReceiverSocketId(callerId);
      if (callerSocket)
        io.to(callerSocket).emit("call-rejected", { by: socket.id });
    });

    socket.on("webrtc-ice-candidate", ({ targetUserId, candidate }) => {
      const targetSocket = getReceiverSocketId(targetUserId);
      if (targetSocket)
        io.to(targetSocket).emit("webrtc-ice-candidate", { candidate });
    });

    socket.on("end-call", ({ targetUserId }) => {
      const targetSocket = getReceiverSocketId(targetUserId);
      if (targetSocket)
        io.to(targetSocket).emit("call-ended", { by: socket.id });

      io.to(socket.id).emit("call-ended", { by: socket.id });
    });

    /* ============================================================
       DISCONNECT
    ============================================================ */
    socket.on("disconnect", () => {
      for (const uid in userSocketMap) {
        if (userSocketMap[uid] === socket.id) {
          delete userSocketMap[uid];
        }
      }

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}
