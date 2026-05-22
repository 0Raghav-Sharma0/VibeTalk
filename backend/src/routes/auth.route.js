import express from "express";
import rateLimit from "express-rate-limit";
import { syncUser, updateProfile, checkAuth } from "../controllers/auth.controller.js";
import { verifyJwt, requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

router.use(authLimiter);

router.post("/sync", verifyJwt, syncUser);
router.get("/check-auth", requireAuth, checkAuth);
router.put("/update-profile", requireAuth, updateProfile);

export default router;
