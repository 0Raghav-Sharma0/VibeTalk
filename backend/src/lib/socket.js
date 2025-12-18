// backend/src/lib/socket.js
import { Server } from "socket.io";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

// Import Watch Party Controllers
import {
  createRoom,
  joinRoom,
  leaveRoom,
  syncPlayback,
  sendReaction,
  sendChatMessage,
  handleDisconnect as handleWatchPartyDisconnect
} from "../controllers/watchPartyController.js";

/* ============================================================
   ALLOWED ORIGINS
============================================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174", 
  "http://localhost:4173",
  "http://localhost:3000",
  "https://blah-blah-jvc4.vercel.app",
  "https://blah-blah-hky1.vercel.app",
  "https://blah-blah-2.onrender.com",
  "https://blah-blah-3.onrender.com",
  "https://visionary-hotteok-e390a5.netlify.app",
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOrigins.some((o) => o instanceof RegExp && o.test(origin));
}

/* ============================================================
   SOCKET SERVER
============================================================ */
let io = null;
const userSocketMap = {}; // { userId: socketId }
const watchPartyRooms = new Map();
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function createSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        console.log(`🌐 CORS check for origin: ${origin}`);
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          console.warn(`❌ CORS blocked: ${origin}`);
          callback(new Error("CORS Not Allowed"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
  });

  console.log("🔥 Socket.IO Initialized with enhanced CORS");

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);
    console.log("📧 Handshake query:", socket.handshake.query);
    console.log("🔐 Handshake auth:", socket.handshake.auth);

    const userId = socket.handshake.query?.userId || socket.handshake.auth?.userId;
    const username = socket.handshake.auth?.username || `User_${socket.id.substring(0, 6)}`;

    socket.userId = userId;
    socket.username = username;

    console.log(`👤 Socket user: ${username} (${userId})`);

    if (userId) {
      if (userSocketMap[userId]) {
        console.log(`🔄 Replacing old connection for user ${userId}`);
        const oldSocket = io.sockets.sockets.get(userSocketMap[userId]);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
        delete userSocketMap[userId];
      }

      userSocketMap[userId] = socket.id;
      console.log(`✅ User Online: ${userId} -> ${socket.id}`);
    }

    socket.emit("connection-success", { 
      socketId: socket.id, 
      message: "Connected to server successfully" 
    });

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    /* ============================================================
       MESSAGING
    ============================================================ */
    socket.on("sendMessage", async (data) => {
      try {
        console.log("💬 Received sendMessage:", data);
        const { senderId, receiverId, text, image, video, file } = data;

        if (!senderId || !receiverId) {
          console.error("❌ Missing senderId or receiverId");
          socket.emit("message-error", { error: "Missing sender or receiver ID" });
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

        if (targetSocket) {
          io.to(targetSocket).emit("newMessage", enrichedMessage);
          console.log(`📤 Message sent to receiver: ${receiverId}`);
        }

        socket.emit("newMessage", enrichedMessage);
        
        console.log(`✅ Message sent: ${senderId} -> ${receiverId}`);
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
      
      console.log(`⌨️ Typing: ${senderId} -> ${receiverId} (${isTyping})`);
      
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
        socket.emit("msg-delivered-update", { messageId });
        
        console.log(`✅ Message delivered: ${messageId}`);
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
        
        console.log(`👀 Messages seen by: ${myId}`);
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
       VIDEO CALLING - FIXED VERSION ⭐
    ============================================================ */
    socket.on("call-initiated", async (data) => {
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
      
      try {
        const caller = await User.findById(from).select("fullName profilePic");
        
        io.to(target).emit("incoming-call", {
          from,
          callType,
          callerName: caller?.fullName || callerName || "Caller",
          callerPic: caller?.profilePic,
        });
      } catch (error) {
        console.error("❌ Error fetching caller info:", error);
        io.to(target).emit("incoming-call", {
          from,
          callType,
          callerName: callerName || "Caller",
          socketId: socket.id
        });
      }
    });
   socket.on("call-accept", ({ from }) => {
  if (!from || !socket.userId) return;

  const callerSocket = getReceiverSocketId(from);
  if (!callerSocket) return;

  console.log("✅ Call accepted:", socket.userId, "accepted", from);

  // 🔥 Notify CALLER that call is accepted
  io.to(callerSocket).emit("call-accepted", {
    by: socket.userId,
  });
});


    socket.on("call-signal", async (data) => {
      const { to, from, signal, callType, data: signalData } = data;
      
      const actualSignal = signal || signalData;
      const actualFrom = from || socket.userId;
      
      if (!to || !actualSignal) {
        console.error("❌ Invalid call-signal data", { to, hasSignal: !!actualSignal });
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

      console.log(`📡 Signal type: ${actualSignal.type} from ${actualFrom} to ${to}`);
      
      // ⭐ KEY FIX: If this is an OFFER, update incoming call with offer data
      // ⭐ STORE OFFER so receiver can accept late
// Forward signal
io.to(target).emit("call-signal", {
  to,
  from: actualFrom,
  data: actualSignal,
  callType: callType || "video"
});

    });

    socket.on("end-call", ({ targetUserId }) => {
      if (!targetUserId) return;
      
      console.log(`📞 Call ended: ${socket.userId} -> ${targetUserId}`);
      
      
      const target = getReceiverSocketId(targetUserId);
      if (target) {
        io.to(target).emit("call-ended", { by: socket.userId });
      }
    });

    socket.on("call-rejected", ({ callerId }) => {
      if (!callerId) return;
      
      console.log(`❌ Call rejected by ${socket.userId}, caller: ${callerId}`);
      
      
      const target = getReceiverSocketId(callerId);
      if (target) {
        io.to(target).emit("call-rejected", { by: socket.userId });
      }
    });

    /* ============================================================
       WATCH PARTY EVENTS
    ============================================================ */
    
    socket.on("watchparty:create", (data) => {
      console.log(`🎬 Creating watch party room:`, data);
      createRoom(socket, data);
    });

    socket.on("watchparty:join", (data) => {
      console.log(`🎬 User joining watch party:`, data);
      joinRoom(socket, data);
    });

    socket.on("watchparty:leave", (data) => {
      console.log(`🎬 User leaving watch party:`, data);
      leaveRoom(socket, data);
    });

    socket.on("watchparty:sync", (data) => {
      console.log(`⏯️ Playback sync:`, data);
      syncPlayback(socket, data);
    });

    socket.on("watchparty:reaction", (data) => {
      console.log(`❤️ Reaction:`, data);
      sendReaction(socket, data);
    });

    socket.on("watchparty:chat", (data) => {
      console.log(`💬 Watch party chat:`, data);
      sendChatMessage(socket, data);
    });

    socket.on("watchparty:ping", () => {
      socket.emit("watchparty:pong", { timestamp: Date.now() });
    });

    /* ============================================================
       DISCONNECT - ENHANCED CLEANUP
    ============================================================ */
    socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", socket.id, "Reason:", reason);

  if (reason === "transport close") {
    console.log("⏸ Ignoring transient transport close");
    return;
  }   
      if (socket.userId && userSocketMap[socket.userId] === socket.id) {
        console.log(`👤 User Offline: ${socket.userId}`);
        delete userSocketMap[socket.userId];
        
      }

      handleWatchPartyDisconnect(socket);

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      
      console.log(`📊 Remaining online users: ${Object.keys(userSocketMap).length}`);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}

export { watchPartyRooms };