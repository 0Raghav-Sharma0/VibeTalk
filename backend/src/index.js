// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import messageRoutes from "./routes/message.route.js";
import cors from "cors";
import { initSocket } from "./lib/socket.js";
import http from "http";
import path from "path";
import multer from "multer";
import cloudinary from "./lib/cloudinary.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// ------------------------------------------
// EXPRESS APP + HTTP SERVER
// ------------------------------------------
const app = express();
const server = http.createServer(app);

// ------------------------------------------
// CORS
// ------------------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://blah-blah-jvc4.vercel.app",
      "https://blah-blah-jvc4-eoigy5j7w-raghavsharma099900-7404s-projects.vercel.app",
      "https://blah-blah-3.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ------------------------------------------
// ROUTES
// ------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// ------------------------------------------
// SERVE SONGS
// ------------------------------------------
app.use(
  "/songs",
  express.static(path.join(__dirname, "songs"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      }
    },
  })
);

// ------------------------------------------
// FILE UPLOAD
// ------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "songs")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/upload", upload.single("song"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({
    message: "File uploaded successfully",
    url: `/songs/${req.file.filename}`,
  });
});

// ------------------------------------------
// START SERVER + INIT SOCKET
// ------------------------------------------
(async () => {
  try {
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🔥 Server running on port ${PORT}`);
      connectDB();
    });

    // Initialize Socket.IO with Redis adapter
    await initSocket(server);

    console.log("🔗 Socket.IO + Redis initialized successfully");
  } catch (err) {
    console.error("❌ Failed to initialize Socket.IO:", err);
  }
})();

// ------------------------------------------
// CLOUDINARY TEST
// ------------------------------------------
(async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("☁️ Cloudinary Connected:", result);
  } catch (err) {
    console.error("❌ Cloudinary Error:", err.message);
  }
})();
