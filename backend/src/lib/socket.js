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
    pingTimeout: 60000, // Increase timeout for video calls
    pingInterval: 25000,
  });

  console.log("🔥 Socket.IO Initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    const userId = socket.handshake.query?.userId;

    if (userId) {
      // Clean up old mappings
      for (const uid in userSocketMap) {
        if (userSocketMap[uid] === socket.id) delete userSocketMap[uid];
      }

      // Remove previous connection for this user
      const oldSocketId = userSocketMap[userId];
      if (oldSocketId && oldSocketId !== socket.id) {
        console.log(`🔄 Replacing old connection for user ${userId}`);
        delete userSocketMap[userId];
      }

      // Set new mapping
      userSocketMap[userId] = socket.id;
      console.log(`👤 User Online: ${userId} -> ${socket.id}`);
    }

    // Emit online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    /* ============================================================
       MESSAGING
    ============================================================ */
    socket.on("sendMessage", async (data) => {
      try {
        const { senderId, receiverId, text, image, video, file } = data;

        if (!senderId || !receiverId) {
          console.error("❌ Missing senderId or receiverId");
          return;
        }

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
          senderName: sender?.fullName || "Unknown User",
          senderAvatar: sender?.profilePic || null,
        };

        const targetSocket = getReceiverSocketId(receiverId);

        // Send to receiver if online
        if (targetSocket) {
          io.to(targetSocket).emit("newMessage", enrichedMessage);
        }

        // Send back to sender for confirmation
        io.to(socket.id).emit("newMessage", enrichedMessage);
        
        console.log(`💬 Message sent: ${senderId} -> ${receiverId}`);
      } catch (err) {
        console.error("❌ sendMessage error:", err);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    /* ============================================================
       TYPING
    ============================================================ */
    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      if (!senderId || !receiverId) return;
      
      const target = getReceiverSocketId(receiverId);
      if (target) {
        io.to(target).emit("typing", { senderId, isTyping });
      }
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
        console.error("❌ msg-delivered error:", err);
      }
    });

    socket.on("msg-seen", async ({ myId, friendId }) => {
      try {
        await Message.updateMany(
          { senderId: friendId, receiverId: myId, seen: false },
          { seen: true, delivered: true }
        );

        const target = getReceiverSocketId(friendId);
        if (target) {
          io.to(target).emit("msg-seen-update", { by: myId });
        }
      } catch (err) {
        console.error("❌ msg-seen error:", err);
      }
    });

    /* ============================================================
       WHITEBOARD + MUSIC
    ============================================================ */
    socket.on("join-room", (roomId) => {
      if (roomId) {
        socket.join(roomId);
        console.log(`🎨 User joined room: ${roomId}`);
      }
    });

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
   VIDEO CALLING - CLEAN VERSION
   Replace your entire video calling section with this
============================================================ */

// Step 1: Call initiation notification (no offer yet)
socket.on("call-initiated", (data) => {
  const { from, to, callType, callerName } = data;
  
  if (!to || !from || !callType) {
    console.error("❌ Invalid call-initiated data");
    return;
  }

  const target = getReceiverSocketId(to);
  
  if (!target) {
    console.log(`❌ User ${to} is offline`);
    socket.emit("call-failed", { 
      reason: "User is offline",
      userId: to 
    });
    return;
  }

  console.log(`📞 Call initiated: ${from} -> ${to} (${callType})`);
  
  // Just a simple notification - NO incoming-call event yet
  // The actual call setup happens via call-signal
});

// Step 2: Handle ALL WebRTC signaling (offers, answers, ICE)
socket.on("call-signal", (data) => {
  const { to, from, data: signalData, callType } = data;
  
  if (!to || !from || !signalData) {
    console.error("❌ Invalid call-signal data");
    return;
  }

  const target = getReceiverSocketId(to);
  
  if (!target) {
    console.log(`❌ User ${to} is offline`);
    socket.emit("call-failed", { 
      reason: "User is offline",
      userId: to 
    });
    return;
  }

  const signalType = signalData.type || 'ice';
  console.log(`📡 Forwarding ${signalType}: ${from} -> ${to}`);
  
  // ⭐ KEY FIX: Send incoming-call ONLY for offers
  if (signalType === 'offer') {
    console.log(`📞 Sending incoming call with offer to ${to}`);
    io.to(target).emit("incoming-call", {
      from,
      callType: callType || "video",
      callerName: "Caller",
      offer: signalData,
    });
  } else {
    // For answers and ICE candidates, forward via call-signal
    io.to(target).emit("call-signal", {
      to,
      from,
      data: signalData,
      callType: callType || "video",
    });
  }
});

// End call
socket.on("end-call", ({ targetUserId }) => {
  if (!targetUserId) return;
  
  console.log(`📞 Call ended: ${userId} <-> ${targetUserId}`);
  
  const target = getReceiverSocketId(targetUserId);
  if (target) {
    io.to(target).emit("call-ended", { by: userId });
  }
  socket.emit("call-ended", { by: userId });
});

// Reject call
socket.on("call-rejected", ({ callerId }) => {
  if (!callerId) return;
  
  console.log(`❌ Call rejected by ${userId}, caller: ${callerId}`);
  
  const target = getReceiverSocketId(callerId);
  if (target) {
    io.to(target).emit("call-rejected", { by: userId });
  }
});

// Call failed
socket.on("call-failed", ({ targetUserId, reason }) => {
  if (!targetUserId) return;
  
  const target = getReceiverSocketId(targetUserId);
  if (target) {
    io.to(target).emit("call-failed", { 
      reason: reason || "Call failed",
      from: userId 
    });
  }
});
    /* ============================================================
       DISCONNECT
    ============================================================ */
    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
      
      // Remove from userSocketMap
      for (const uid in userSocketMap) {
        if (userSocketMap[uid] === socket.id) {
          console.log(`👤 User Offline: ${uid}`);
          delete userSocketMap[uid];
        }
      }

      // Emit updated online users
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}