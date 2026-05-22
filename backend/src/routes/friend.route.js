import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireBody, requireQuery } from "../middleware/validate.middleware.js";
import {
  sendFriendRequest,
  getPendingRequests,
  searchUserByUsername,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.post("/request", requireAuth, requireBody("username"), sendFriendRequest);
router.get("/pending", requireAuth, getPendingRequests);
router.get("/search", requireAuth, requireQuery("username"), searchUserByUsername);
router.put("/accept/:requestId", requireAuth, acceptFriendRequest);
router.put("/reject/:requestId", requireAuth, rejectFriendRequest);
router.delete("/remove/:friendId", requireAuth, removeFriend);

export default router;
