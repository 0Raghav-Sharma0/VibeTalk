import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import {
  sendMessage,
  getMessages,
  getUsersForSidebar,
  addReaction,
} from "../controllers/message.controller.js";

import { uploadFile } from "../controllers/file.controller.js";   // ⬅ ADD THIS
import multer from "multer";

// 🔥 Multer temp storage
const upload = multer({ dest: "uploads/" });

const router = express.Router();

/* ---------------------------------------------
   USERS LIST (SIDEBAR)
--------------------------------------------- */
router.get("/users", protectRoute, getUsersForSidebar);

/* ---------------------------------------------
   GET CHAT MESSAGES
--------------------------------------------- */
router.get("/:id", protectRoute, getMessages);

/* ---------------------------------------------
   SEND MESSAGE (TEXT / IMAGE / VIDEO)
--------------------------------------------- */
router.post("/send/:id", protectRoute, sendMessage);

/* ---------------------------------------------
   REACTIONS
--------------------------------------------- */
router.post("/reaction", protectRoute, addReaction);

/* ---------------------------------------------
   FILE UPLOAD (🔥 FIX FOR YOUR 404)
--------------------------------------------- */
router.post(
  "/upload-file",
  protectRoute,
  upload.single("file"),   // Multer expects the field name "file"
  uploadFile
);

export default router;
