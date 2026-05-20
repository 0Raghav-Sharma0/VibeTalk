import { cacheDel, cacheKeys, cacheGet, cacheSet } from "../lib/cache.js";
import { userRepository } from "../repositories/user.repository.js";
import { toUserDTO } from "../domain/user.dto.js";
import { AppError } from "../errors/AppError.js";

const USER_CACHE_TTL = 300;

export const userService = {
  toDTO: toUserDTO,

  async invalidateCaches(userId, clerkId) {
    await cacheDel(cacheKeys.user(userId));
    if (clerkId) await cacheDel(cacheKeys.user(`clerk:${clerkId}`));
    await cacheDel(cacheKeys.senderMeta(userId));
  },

  async findOrCreateFromClerk({ clerkId, email, fullName, profilePic }) {
    let user = await userRepository.findByClerkId(clerkId);

    if (user) {
      let dirty = false;
      if (profilePic && user.profilePic !== profilePic) {
        user.profilePic = profilePic;
        dirty = true;
      }
      if (fullName && user.fullName !== fullName) {
        user.fullName = fullName;
        dirty = true;
      }
      if (dirty) {
        await user.save();
        await this.invalidateCaches(user._id, clerkId);
      }
      return user;
    }

    if (email) {
      const legacy = await userRepository.findByEmail(email);
      if (legacy) {
        await userRepository.linkLegacyAccount(legacy, { clerkId, profilePic });
        await this.invalidateCaches(legacy._id, clerkId);
        return legacy;
      }
    }

    return userRepository.create({
      clerkId,
      email: email || `${clerkId}@users.clerk`,
      fullName: fullName || "User",
      profilePic: profilePic || "",
    });
  },

  async getByClerkIdCached(clerkId) {
    const cacheKey = cacheKeys.user(`clerk:${clerkId}`);
    let user = await cacheGet(cacheKey);
    if (user) return user;

    const doc = await userRepository.findByClerkIdLean(clerkId);
    if (!doc) {
      throw AppError.notFound(
        "User not synced. Call POST /api/auth/sync first.",
        "USER_NOT_SYNCED"
      );
    }

    user = toUserDTO(doc);
    await cacheSet(cacheKey, user, USER_CACHE_TTL);
    return user;
  },

  async updateProfile(userId, clerkId, { fullName, profilePic, about }) {
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (about !== undefined) updateData.about = about;
    if (profilePic) updateData.profilePic = profilePic;

    if (Object.keys(updateData).length === 0) {
      throw AppError.badRequest("No data provided for update.");
    }

    const updated = await userRepository.updateById(userId, updateData);
    await this.invalidateCaches(userId, clerkId);
    return toUserDTO(updated);
  },
};
