import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
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
createSocketServer(server);

/* =====================================================
   START SERVER
===================================================== */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
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
