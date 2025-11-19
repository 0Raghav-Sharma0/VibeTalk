// backend/src/lib/socket.js

import { Server } from "socket.io";
import Message from "../models/message.model.js";

/* ============================================================
   ✔ ALLOWED ORIGINS
============================================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  /^https:\/\/.*\.vercel\.app$/,
  "https://blah-blah-jvc4.vercel.app",
  "https://blah-blah-hky1.vercel.app",
  "https://blah-blah-3.onrender.com",
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOrigins.some((o) => o instanceof RegExp && o.test(origin));
}

/* ============================================================
   ✔ GLOBAL SOCKET INSTANCE
============================================================ */
let io = null;

/* ============================================================
   ✔ MAP userId → socketId
============================================================ */
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

/* ============================================================
   ✔ CREATE SOCKET SERVER
============================================================ */
export function createSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) callback(null, true);
        else callback(new Error("CORS Not Allowed: " + origin));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  console.log("🔥 Socket.IO initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    const userId = socket.handshake.query.userId;

    /* ============================================================
       ✔ STORE USER ONLINE
    ============================================================ */
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`👤 User online → ${userId}`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    /* ============================================================
       ✔ SEND MESSAGE — FIXED REAL-TIME
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

        // Send to receiver
        if (receiverSocket) io.to(receiverSocket).emit("newMessage", message);

        // Send back to sender (remove loading)
        io.to(socket.id).emit("newMessage", message);

        console.log("📩 Message delivered:", message._id);
      } catch (err) {
        console.log("❌ sendMessage error:", err);
      }
    });

    /* ============================================================
       ✔ MESSAGE DELIVERED
    ============================================================ */
    socket.on("msg-delivered", async ({ messageId, receiverId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { delivered: true });

        const receiverSocket = getReceiverSocketId(receiverId);

        if (receiverSocket) {
          io.to(receiverSocket).emit("msg-delivered-update", { messageId });
        }

        io.to(socket.id).emit("msg-delivered-update", { messageId });
      } catch (err) {
        console.log("❌ msg-delivered error:", err);
      }
    });

    /* ============================================================
       ✔ MESSAGE SEEN
    ============================================================ */
    socket.on("msg-seen", async ({ myId, friendId }) => {
      try {
        await Message.updateMany(
          {
            senderId: friendId,
            receiverId: myId,
            seen: false,
          },
          { seen: true, delivered: true }
        );

        const friendSocket = getReceiverSocketId(friendId);

        if (friendSocket) {
          io.to(friendSocket).emit("msg-seen-update", { by: myId });
        }
      } catch (err) {
        console.log("❌ msg-seen error:", err);
      }
    });

    /* ============================================================
       ✔ TYPING INDICATOR
    ============================================================ */
    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      const receiverSocket = getReceiverSocketId(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", {
          senderId,
          isTyping,
        });
      }
    });

    /* ============================================================
       ✔ WHITEBOARD SYNC
    ============================================================ */
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("whiteboard-draw", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("whiteboard-draw", payload);
    });

    socket.on("whiteboard-shape", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("whiteboard-shape", payload);
    });

    socket.on("whiteboard-undo", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("whiteboard-undo", payload);
    });

    socket.on("whiteboard-redo", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("whiteboard-redo", payload);
    });

    socket.on("whiteboard-clear", ({ roomId }) => {
      if (roomId) io.to(roomId).emit("whiteboard-clear");
    });

    /* ============================================================
       ✔ MUSIC SYNC
    ============================================================ */
    socket.on("music-sync", (payload) => {
      socket.to(payload.roomId).emit("music-sync", payload);
    });

    /* ============================================================
       ✔ USER DISCONNECT
    ============================================================ */
    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);

      for (const uid in userSocketMap) {
        if (userSocketMap[uid] === socket.id) {
          delete userSocketMap[uid];
          console.log(`❌ User offline → ${uid}`);
        }
      }

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
}

/* ============================================================
   ✔ GET SOCKET INSTANCE
============================================================ */
export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized!");
  return io;
}
