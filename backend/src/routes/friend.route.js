import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
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

router.post("/request", protectRoute, requireBody("username"), sendFriendRequest);
router.get("/pending", protectRoute, getPendingRequests);
router.get("/search", protectRoute, requireQuery("username"), searchUserByUsername);
router.put("/accept/:requestId", protectRoute, acceptFriendRequest);
router.put("/reject/:requestId", protectRoute, rejectFriendRequest);
router.delete("/remove/:friendId", protectRoute, removeFriend);

export default router;
