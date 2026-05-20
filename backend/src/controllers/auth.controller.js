import { asyncHandler } from "../utils/asyncHandler.js";
import { container } from "../container.js";

export const syncUser = asyncHandler(async (req, res) => {
  const user = await container.authService.syncUser(req.clerkPayload, req.body);
  res.status(200).json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await container.authService.updateProfile(req.user, req.body);
  res.status(200).json(user);
});

export const checkAuth = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});
