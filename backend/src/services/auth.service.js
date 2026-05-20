import { verifyClerkToken, extractBearerToken } from "../lib/clerk.js";
import { profileFromClerkPayload } from "../domain/user.dto.js";
import { userService } from "./user.service.js";
import { mediaService } from "./media.service.js";
import { AppError } from "../errors/AppError.js";

export const authService = {
  extractToken(req) {
    const token = extractBearerToken(req);
    if (!token) throw AppError.unauthorized("No token provided");
    return token;
  },

  async verifySession(token) {
    try {
      return await verifyClerkToken(token);
    } catch {
      throw AppError.unauthorized("Invalid token");
    }
  },

  async syncUser(clerkPayload, body) {
    const profile = profileFromClerkPayload(clerkPayload, body);
    const user = await userService.findOrCreateFromClerk({
      clerkId: clerkPayload.sub,
      ...profile,
    });
    return userService.toDTO(user);
  },

  async updateProfile(appUser, body) {
    let profilePicUrl;
    if (body.profilePic) {
      profilePicUrl = await mediaService.uploadBase64Image(body.profilePic);
    }
    return userService.updateProfile(appUser._id, appUser.clerkId, {
      fullName: body.fullName,
      about: body.about,
      profilePic: profilePicUrl,
    });
  },
};
