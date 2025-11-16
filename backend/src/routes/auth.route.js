import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// AUTH
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// UPDATE PROFILE (PUT = partial update)
router.put("/update-profile", protectRoute, updateProfile);

// CHECK AUTH
router.get("/check-auth", protectRoute, checkAuth);

export default router;
