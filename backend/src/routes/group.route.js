import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  addMember,
  removeMember,
  leaveGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", requireAuth, createGroup);
router.get("/", requireAuth, getMyGroups);
router.get("/:groupId/messages", requireAuth, getGroupMessages);
router.post("/:groupId/messages", requireAuth, sendGroupMessage);
router.post("/:groupId/members", requireAuth, addMember);
router.delete("/:groupId/members/:userId", requireAuth, removeMember);
router.post("/:groupId/leave", requireAuth, leaveGroup);

export default router;
