import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingRequests,
  searchUserByUsername,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.post("/request", protectRoute, sendFriendRequest);
router.get("/pending", protectRoute, getPendingRequests);
router.get("/search", protectRoute, searchUserByUsername);
router.put("/accept/:requestId", protectRoute, acceptFriendRequest);
router.put("/reject/:requestId", protectRoute, rejectFriendRequest);
router.delete("/remove/:friendId", protectRoute, removeFriend);

export default router;
