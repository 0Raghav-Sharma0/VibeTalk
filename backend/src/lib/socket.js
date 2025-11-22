// backend/src/lib/socket.js
import { Server } from "socket.io";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

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
  "https://visionary-hotteok-e390a5.netlify.app",
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOrigins.some((o) => o instanceof RegExp && o.test(origin));
}

/* ============================================================
   SOCKET SERVER
============================================================ */
let io = null;
const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function createSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) callback(null, true);
        else callback(new Error("CORS Not Allowed"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  console.log("🔥 Socket.IO Initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    const userId = socket.handshake.query?.userId;

    if (userId) {
      // Remove old entries for this socket ID
      for (const uid in userSocketMap) {
        if (userSocketMap[uid] === socket.id) delete userSocketMap[uid];
      }

      // Remove previous connection for this user
      if (userSocketMap[userId]) delete userSocketMap[userId];

      // Set new mapping
      userSocketMap[userId] = socket.id;
      console.log(`👤 User Online: ${userId} -> ${socket.id}`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    /* ============================================================
       MESSAGING
    ============================================================ */
    socket.on("sendMessage", async (data) => {
      try {
        const { senderId, receiverId, text, image, video, file } = data;

        const message = await Message.create({
          senderId,
          receiverId,
          text: text ?? "",
          image: image ?? null,
          video: video ?? null,
          file: file ?? null,
        });

        const sender = await User.findById(senderId).select("fullName profilePic");

        const enrichedMessage = {
          ...message.toObject(),
          senderName: sender?.fullName || "New Message",
          senderAvatar: sender?.profilePic || null,
        };

        const targetSocket = getReceiverSocketId(receiverId);

        if (targetSocket) io.to(targetSocket).emit("newMessage", enrichedMessage);

        io.to(socket.id).emit("newMessage", enrichedMessage);
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

    /* ============================================================
       TYPING
    ============================================================ */
    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      const target = getReceiverSocketId(receiverId);
      if (target) io.to(target).emit("typing", { senderId, isTyping });
    });

    /* ============================================================
       DELIVERED / SEEN
    ============================================================ */
    socket.on("msg-delivered", async ({ messageId, receiverId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { delivered: true });
        const target = getReceiverSocketId(receiverId);
        if (target) io.to(target).emit("msg-delivered-update", { messageId });
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

        const target = getReceiverSocketId(friendId);
        if (target) io.to(target).emit("msg-seen-update", { by: myId });
      } catch (err) {
        console.error("msg-seen error:", err);
      }
    });

    /* ============================================================
       WHITEBOARD + MUSIC
    ============================================================ */
    socket.on("join-room", (roomId) => roomId && socket.join(roomId));

    socket.on("whiteboard-draw", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("whiteboard-draw", payload);
    });

    socket.on("whiteboard-clear", ({ roomId }) => {
      if (roomId) io.to(roomId).emit("whiteboard-clear");
    });

    socket.on("music-sync", (payload) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit("music-sync", payload);
    });

    /* ============================================================
       SIMPLE-PEER CALLING (clean + minimal)
    ============================================================ */

    // send & receive offer/answer/ice inside single event
    socket.on("call-signal", (data) => {
      const target = getReceiverSocketId(data.to);
      if (target) {
        io.to(target).emit("call-signal", data);
      } else {
        io.to(socket.id).emit("call-failed", { reason: "User Offline" });
      }
    });

    // End call
    socket.on("end-call", ({ targetUserId }) => {
      const target = getReceiverSocketId(targetUserId);
      if (target) io.to(target).emit("call-ended", { by: socket.id });
      io.to(socket.id).emit("call-ended", { by: socket.id });
    });

    // Reject
    socket.on("call-rejected", ({ callerId }) => {
      const target = getReceiverSocketId(callerId);
      if (target) io.to(target).emit("call-rejected");
    });

    /* ============================================================
       DISCONNECT
    ============================================================ */
    socket.on("disconnect", () => {
      for (const uid in userSocketMap) {
        if (userSocketMap[uid] === socket.id) delete userSocketMap[uid];
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
