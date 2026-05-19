import FriendRequest from "../models/friendRequest.model.js";
import { toIdString } from "../domain/ids.js";

const USER_POPULATE = "fullName profilePic email";

export const friendRepository = {
  findBetweenUsers(userA, userB) {
    return FriendRequest.findOne({
      $or: [
        { fromUser: userA, toUser: userB },
        { fromUser: userB, toUser: userA },
      ],
    });
  },

  findAcceptedForUser(userId) {
    return FriendRequest.find({
      status: "accepted",
      $or: [{ fromUser: userId }, { toUser: userId }],
    }).lean();
  },

  create(data) {
    return FriendRequest.create(data);
  },

  findById(id) {
    return FriendRequest.findById(id);
  },

  findByIdPopulated(id) {
    return FriendRequest.findById(id).populate("fromUser toUser", USER_POPULATE);
  },

  updateById(id, data) {
    return FriendRequest.findByIdAndUpdate(id, data, { new: true }).populate(
      "fromUser toUser",
      USER_POPULATE
    );
  },

  findPendingIncoming(userId) {
    return FriendRequest.find({ toUser: userId, status: "pending" })
      .populate("fromUser", USER_POPULATE)
      .sort({ createdAt: -1 });
  },

  findPendingOutgoing(userId) {
    return FriendRequest.find({ fromUser: userId, status: "pending" })
      .populate("toUser", USER_POPULATE)
      .sort({ createdAt: -1 });
  },

  findPendingToUser(requestId, userId) {
    return FriendRequest.findOne({
      _id: requestId,
      toUser: userId,
      status: "pending",
    }).populate("fromUser", USER_POPULATE);
  },

  rejectPending(requestId, userId) {
    return FriendRequest.findOneAndUpdate(
      { _id: requestId, toUser: userId, status: "pending" },
      { status: "rejected" },
      { new: true }
    ).populate("fromUser", USER_POPULATE);
  },

  unfriend(userId, friendId) {
    return FriendRequest.findOneAndUpdate(
      {
        $or: [
          { fromUser: userId, toUser: friendId },
          { fromUser: friendId, toUser: userId },
        ],
        status: "accepted",
      },
      { status: "rejected" },
      { new: true }
    );
  },

  extractFriendIds(acceptedRequests, loggedInUserId) {
    const me = toIdString(loggedInUserId);
    return acceptedRequests.map((r) =>
      toIdString(r.fromUser) === me ? toIdString(r.toUser) : toIdString(r.fromUser)
    );
  },
};
