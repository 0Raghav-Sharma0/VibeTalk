/**
 * Auth = Clerk session JWT in Authorization: Bearer <token>
 *
 * verifyJwt  — JWT valid only (used on POST /auth/sync)
 * requireAuth — JWT valid + MongoDB user exists (all other protected routes)
 */
import { getBearerToken, verifyBearerToken } from "../lib/clerk.js";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);
  const session = await verifyBearerToken(token);
  req.clerkId = session.clerkId;
  req.jwtClaims = session.claims;
  next();
});

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);
  const session = await verifyBearerToken(token);
  req.clerkId = session.clerkId;
  req.user = await userService.getByClerkIdCached(session.clerkId);
  next();
});
