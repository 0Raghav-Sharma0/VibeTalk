// src/index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";

import { connectDB } from "./lib/db.js";
import { connectRedis, disconnectRedis } from "./lib/redis.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import groupRoutes from "./routes/group.route.js";
import cloudinary from "./lib/cloudinary.js";

import { createSocketServer } from "./lib/socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

/* =====================================================
   CORS for Express (NOT socket.io)
===================================================== */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

/* =====================================================
   API ROUTES
===================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);

/* =====================================================
   SONGS
===================================================== */
app.use(
  "/songs",
  express.static(path.join(__dirname, "songs"))
);

/* =====================================================
   SOCKET.IO INIT
===================================================== */
const io = createSocketServer(server);

// Optional: Log socket stats periodically (useful for monitoring)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const connectedClients = io.engine.clientsCount;
    console.log(`📊 Connected clients: ${connectedClients}`);
  }, 300000); // Every 5 minutes
}

/* =====================================================
   START SERVER
===================================================== */
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO initialized`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  await connectDB();
  await connectRedis();
});

/* =====================================================
   CLOUDINARY CHECK
===================================================== */
(async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("☁️ Cloudinary Connected", result);
  } catch (err) {
    console.error("❌ Cloudinary Error:", err);
  }
})();

/* =====================================================
   GRACEFUL SHUTDOWN
===================================================== */
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  await disconnectRedis();
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  await disconnectRedis();
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

/* =====================================================
   ERROR HANDLING
===================================================== */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});