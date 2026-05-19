import { authService } from "../services/auth.service.js";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyClerkSession = asyncHandler(async (req, res, next) => {
  const token = authService.extractToken(req);
  req.clerkPayload = await authService.verifySession(token);
  next();
});

export const requireAppUser = asyncHandler(async (req, res, next) => {
  req.user = await userService.getByClerkIdCached(req.clerkPayload.sub);
  next();
});

/** Clerk JWT + MongoDB user — used on messages, friends, groups */
export const protectRoute = asyncHandler(async (req, res, next) => {
  const token = authService.extractToken(req);
  req.clerkPayload = await authService.verifySession(token);
  req.user = await userService.getByClerkIdCached(req.clerkPayload.sub);
  next();
});
