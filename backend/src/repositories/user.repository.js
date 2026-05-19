import User from "../models/user.model.js";
import { escapeRegex } from "../domain/ids.js";

export const userRepository = {
  findByClerkId(clerkId) {
    return User.findOne({ clerkId });
  },

  findByClerkIdLean(clerkId) {
    return User.findOne({ clerkId }).lean();
  },

  findByEmail(email) {
    return User.findOne({ email });
  },

  findById(id) {
    return User.findById(id);
  },

  findByIdsLean(ids) {
    if (!ids?.length) return [];
    return User.find({ _id: { $in: ids } })
      .select("-password")
      .lean();
  },

  findByFullNameExact(username, excludeUserId) {
    const escaped = escapeRegex(username);
    return User.findOne({
      fullName: { $regex: new RegExp(`^${escaped}$`, "i") },
      _id: { $ne: excludeUserId },
    })
      .select("-password")
      .lean();
  },

  create(data) {
    return User.create(data);
  },

  updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true }).lean();
  },

  async linkLegacyAccount(user, { clerkId, profilePic }) {
    user.clerkId = clerkId;
    if (profilePic && !user.profilePic) user.profilePic = profilePic;
    user.password = undefined;
    return user.save();
  },
};
