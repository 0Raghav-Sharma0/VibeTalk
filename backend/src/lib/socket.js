// backend/src/lib/socket.js
import { Server } from "socket.io";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import { cacheGet, cacheSet, cacheKeys } from "./cache.js";

// 🔒 Active call lock
const activeCalls = new Map();
// key: "callerId:calleeId" → true

// Import Watch Party Controllers
import {
  createRoom,
  joinRoom,
  leaveRoom,
  syncPlayback,
  sendReaction,
  sendChatMessage,
  handleDisconnect as handleWatchPartyDisconnect,
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
const userSocketMap = {}; // { userId: socketId } — keys normalized to string
const watchPartyRooms = new Map();

function toStr(id) {
  return id != null ? String(id) : "";
}

export function getReceiverSocketId(userId) {
  return userSocketMap[toStr(userId)];
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
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
  });

  console.log("🔥 Socket.IO Initialized with enhanced CORS");

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);
    console.log("📧 Handshake query:", socket.handshake.query);
    console.log("🔐 Handshake auth:", socket.handshake.auth);

    const userId =
      socket.handshake.query?.userId || socket.handshake.auth?.userId;
    const username =
      socket.handshake.auth?.username || `User_${socket.id.substring(0, 6)}`;

    socket.userId = userId;
    socket.username = username;

    console.log(`👤 Socket user: ${username} (${userId})`);

    if (userId) {
      const uid = toStr(userId);
      if (userSocketMap[uid]) {
        console.log(`🔄 Replacing old connection for user ${uid}`);
        const oldSocket = io.sockets.sockets.get(userSocketMap[uid]);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
        delete userSocketMap[uid];
      }

      userSocketMap[uid] = socket.id;
      console.log(`✅ User Online: ${uid} -> ${socket.id}`);
    }

    socket.emit("connection-success", {
      socketId: socket.id,
      message: "Connected to server successfully",
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
          socket.emit("message-error", {
            error: "Missing sender or receiver ID",
          });
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

        let sender = await cacheGet(cacheKeys.senderMeta(senderId));
        if (!sender) {
          const u = await User.findById(senderId).select("fullName profilePic").lean();
          if (u) {
            sender = { fullName: u.fullName, profilePic: u.profilePic };
            await cacheSet(cacheKeys.senderMeta(senderId), sender, 300);
          }
        }

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
       GROUP MESSAGING
    ============================================================ */
    socket.on("sendGroupMessage", async (data) => {
      try {
        const { groupId, senderId, text, image, video, file } = data;
        if (!groupId || !senderId) return;

        const group = await Group.findById(groupId);
        if (!group) return;
        const isInGroup = group.members.some(
          (m) => m.userId.toString() === senderId.toString()
        );
        if (!isInGroup) return;

        const msg = await GroupMessage.create({
          groupId,
          senderId,
          text: text ?? "",
          image: image ?? null,
          video: video ?? null,
          file: file ?? null,
        });

        const populated = await GroupMessage.findById(msg._id)
          .populate("senderId", "fullName profilePic");

        const enriched = {
          ...populated.toObject(),
          senderName: populated.senderId?.fullName || "Unknown",
          senderAvatar: populated.senderId?.profilePic || null,
          // Ensure senderId is string so frontend can match optimistic message and avoid duplicates
          senderId: populated.senderId?._id?.toString() ?? populated.senderId?.toString?.() ?? populated.senderId,
        };

        for (const m of group.members) {
          const sid = getReceiverSocketId(m.userId.toString());
          if (sid) io.to(sid).emit("newGroupMessage", enriched);
        }
        // Do NOT emit again to sender - they are already in group.members and got it above
      } catch (err) {
        console.error("❌ sendGroupMessage error:", err);
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
      if (!from || !to || !callType) return;

      const callKey = `${from}:${to}`;
      const reverseKey = `${to}:${from}`;

      // 🔥 BLOCK DUPLICATE / LATE CALLS
      if (activeCalls.has(callKey) || activeCalls.has(reverseKey)) {
        console.log("⛔ Call already in progress, ignoring");
        return;
      }

      activeCalls.set(callKey, true);

      const receiverSocketId = getReceiverSocketId(to);
      if (!receiverSocketId) {
        console.log(`❌ User ${to} is offline, cannot initiate call`);
        activeCalls.delete(callKey);
        socket.emit("call-failed", { reason: "User is offline" });
        return;
      }

      console.log(`📞 Call initiated: ${from} -> ${to} (${callType})`);

      io.to(receiverSocketId).emit("incoming-call", {
        from,
        callerName,
        callType,
        callKey,
      });
    });
    socket.on("call-accepted", ({ to, by }) => {
      if (!to || !by) return;

      const target = getReceiverSocketId(to);
      if (!target) return;

      console.log(`✅ Call accepted: ${by} → ${to}`);

      io.to(target).emit("call-accepted", { by });
    });

    socket.on("call-signal", ({ to, from, data, callType }) => {
      if (!to || !data) {
        console.error("❌ Invalid call-signal", { to, hasData: !!data });
        return;
      }

      const target = getReceiverSocketId(to);
      if (!target) {
        console.log(`❌ User ${to} offline`);
        return;
      }

      console.log(`📡 Forwarding signal ${data.type} from ${from} → ${to}`);

      io.to(target).emit("call-signal", {
        from,
        data, // ✅ MUST be `data`
        callType,
      });
    });

    socket.on("call-ended", ({ to }) => {
      if (!to) return;

      console.log(`📞 Call ended: ${socket.userId} → ${to}`);

      const callKey = `${socket.userId}:${to}`;
      const reverseKey = `${to}:${socket.userId}`;
      activeCalls.delete(callKey);
      activeCalls.delete(reverseKey);

      const target = getReceiverSocketId(to);
      if (target) {
        io.to(target).emit("call-ended", { by: socket.userId });
      }
    });

    socket.on("call-rejected", ({ callerId }) => {
      if (!callerId) return;

      console.log(`❌ Call rejected by ${socket.userId}, caller: ${callerId}`);

      // Clean up active calls
      const callKey = `${callerId}:${socket.userId}`;
      const reverseKey = `${socket.userId}:${callerId}`;
      activeCalls.delete(callKey);
      activeCalls.delete(reverseKey);

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

      const uid = socket.userId ? toStr(socket.userId) : "";
      if (uid && userSocketMap[uid] === socket.id) {
        console.log(`👤 User Offline: ${uid}`);
        delete userSocketMap[uid];

        // Clean up any active calls involving this user
        for (const [key] of activeCalls) {
          const [callerId, calleeId] = key.split(":");
          if (callerId === uid || calleeId === uid) {
            activeCalls.delete(key);
            console.log(`🧹 Cleaned up call: ${key}`);
          }
        }
      }

      handleWatchPartyDisconnect(socket);

      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      console.log(
        `📊 Remaining online users: ${Object.keys(userSocketMap).length}`
      );
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

