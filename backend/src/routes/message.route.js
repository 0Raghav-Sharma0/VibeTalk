import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireBody } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/multer.js";
import {
  sendMessage,
  getMessages,
  getUsersForSidebar,
  addReaction,
} from "../controllers/message.controller.js";
import { uploadFile } from "../controllers/file.controller.js";

const router = express.Router();

router.get("/users", requireAuth, getUsersForSidebar);
router.get("/:id", requireAuth, getMessages);
router.post("/send/:id", requireAuth, sendMessage);
router.post(
  "/reaction",
  requireAuth,
  requireBody("messageId", "userId", "emoji"),
  addReaction
);
router.post("/upload-file", requireAuth, upload.single("file"), uploadFile);

export default router;
