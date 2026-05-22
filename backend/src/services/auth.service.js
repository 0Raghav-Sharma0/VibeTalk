import { profileFromClerkPayload } from "../domain/user.dto.js";
import { userService } from "./user.service.js";
import { mediaService } from "./media.service.js";
import { AppError } from "../errors/AppError.js";

export const authService = {
  async syncUser(clerkId, jwtClaims, body) {
    const profile = profileFromClerkPayload(jwtClaims, body);
    const user = await userService.findOrCreateFromClerk({
      clerkId,
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
