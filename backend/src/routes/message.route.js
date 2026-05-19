import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
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

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post(
  "/reaction",
  protectRoute,
  requireBody("messageId", "userId", "emoji"),
  addReaction
);
router.post("/upload-file", protectRoute, upload.single("file"), uploadFile);

export default router;
