import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";

const MEMBER_POPULATE = "fullName profilePic";

export const groupRepository = {
  create(data) {
    return Group.create(data);
  },

  findById(id) {
    return Group.findById(id);
  },

  findByIdPopulated(id) {
    return Group.findById(id)
      .populate("members.userId", MEMBER_POPULATE)
      .populate("createdBy", MEMBER_POPULATE);
  },

  findForUser(userId) {
    return Group.find({ "members.userId": userId })
      .populate("members.userId", MEMBER_POPULATE)
      .populate("createdBy", MEMBER_POPULATE)
      .sort({ updatedAt: -1 });
  },

  deleteById(id) {
    return Group.findByIdAndDelete(id);
  },

  save(group) {
    return group.save();
  },

  findMessages(groupId, limit) {
    return GroupMessage.find({ groupId })
      .populate("senderId", MEMBER_POPULATE)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  createMessage(data) {
    return GroupMessage.create(data);
  },

  findMessageByIdPopulated(id) {
    return GroupMessage.findById(id).populate("senderId", MEMBER_POPULATE);
  },
};
