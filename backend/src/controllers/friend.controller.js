import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { getIO, getReceiverSocketId } from "../lib/socket.js";
import { invalidateFriendCache } from "../lib/cache.js";

/* -------------------------------------------------------------------------- */
/* Send Friend Request                                                        */
/* -------------------------------------------------------------------------- */
export const sendFriendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { username } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    const targetUser = await User.findOne({
      fullName: { $regex: new RegExp(`^${username.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      _id: { $ne: myId },
    }).select("-password");
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser._id.toString() === myId.toString()) {
      return res.status(400).json({ error: "You cannot add yourself" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { fromUser: myId, toUser: targetUser._id },
        { fromUser: targetUser._id, toUser: myId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "Already friends" });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ error: "Request already pending" });
      }
      // status === "rejected" - allow re-send by updating
    }

    let request;
    if (existing) {
      request = await FriendRequest.findByIdAndUpdate(
        existing._id,
        { fromUser: myId, toUser: targetUser._id, status: "pending" },
        { new: true }
      ).populate("fromUser toUser", "fullName profilePic email");
    } else {
      request = await FriendRequest.create({
        fromUser: myId,
        toUser: targetUser._id,
        status: "pending",
      });
      request = await FriendRequest.findById(request._id).populate(
        "fromUser toUser",
        "fullName profilePic email"
      );
    }

    const targetSocket = getReceiverSocketId(targetUser._id.toString());
    if (targetSocket) {
      getIO().to(targetSocket).emit("friend-request-received", {
        request: {
          _id: request._id,
          fromUser: request.fromUser,
          toUser: request.toUser,
          status: request.status,
        },
      });
    }

    res.status(201).json(request);
  } catch (error) {
    console.error("❌ sendFriendRequest:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Accept Friend Request                                                      */
/* -------------------------------------------------------------------------- */
export const acceptFriendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOne({
      _id: requestId,
      toUser: myId,
      status: "pending",
    }).populate("fromUser", "fullName profilePic email");

    if (!request) {
      return res.status(404).json({ error: "Request not found or already handled" });
    }

    request.status = "accepted";
    await request.save();

    const fromUserId = String(request.fromUser?._id ?? request.fromUser);
    await invalidateFriendCache(myId, fromUserId);

    const populated = await FriendRequest.findById(request._id)
      .populate("fromUser toUser", "fullName profilePic email");

    const fromSocket = getReceiverSocketId(fromUserId);
    if (fromSocket) {
      getIO().to(fromSocket).emit("friend-request-accepted", { request: populated });
      console.log(`📤 friend-request-accepted sent to sender: ${fromUserId}`);
    } else {
      console.warn(`⚠️ Sender ${fromUserId} not connected — they'll see the friend when they refresh`);
    }

    res.status(200).json(request);
  } catch (error) {
    console.error("❌ acceptFriendRequest:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Reject Friend Request                                                      */
/* -------------------------------------------------------------------------- */
export const rejectFriendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOneAndUpdate(
      { _id: requestId, toUser: myId, status: "pending" },
      { status: "rejected" },
      { new: true }
    ).populate("fromUser", "fullName profilePic email");

    if (!request) {
      return res.status(404).json({ error: "Request not found or already handled" });
    }

    const fromSocket = getReceiverSocketId(request.fromUser._id.toString());
    if (fromSocket) {
      getIO().to(fromSocket).emit("friend-request-rejected", { requestId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ rejectFriendRequest:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Remove Friend (unfriend)                                                   */
/* -------------------------------------------------------------------------- */
export const removeFriend = async (req, res) => {
  try {
    const myId = req.user._id;
    const { friendId } = req.params;

    const request = await FriendRequest.findOneAndUpdate(
      {
        $or: [
          { fromUser: myId, toUser: friendId },
          { fromUser: friendId, toUser: myId },
        ],
        status: "accepted",
      },
      { status: "rejected" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: "Not friends with this user" });
    }

    await invalidateFriendCache(myId, friendId);

    const otherId = request.fromUser.toString() === myId.toString()
      ? request.toUser.toString()
      : request.fromUser.toString();
    const otherSocket = getReceiverSocketId(otherId);
    if (otherSocket) {
      getIO().to(otherSocket).emit("friend-removed", { by: myId.toString() });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ removeFriend:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Get Pending Requests (incoming + outgoing)                                 */
/* -------------------------------------------------------------------------- */
export const getPendingRequests = async (req, res) => {
  try {
    const myId = req.user._id;

    const incoming = await FriendRequest.find({
      toUser: myId,
      status: "pending",
    })
      .populate("fromUser", "fullName profilePic email")
      .sort({ createdAt: -1 });

    const outgoing = await FriendRequest.find({
      fromUser: myId,
      status: "pending",
    })
      .populate("toUser", "fullName profilePic email")
      .sort({ createdAt: -1 });

    res.status(200).json({ incoming, outgoing });
  } catch (error) {
    console.error("❌ getPendingRequests:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Search User by Username (fullName - for Add Friend)                         */
/* -------------------------------------------------------------------------- */
export const searchUserByUsername = async (req, res) => {
  try {
    const myId = req.user._id;
    const { username } = req.query;

    if (!username?.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    const escaped = username.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const targetUser = await User.findOne({
      fullName: { $regex: new RegExp(`^${escaped}$`, "i") },
      _id: { $ne: myId },
    }).select("-password");

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { fromUser: myId, toUser: targetUser._id },
        { fromUser: targetUser._id, toUser: myId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "Already friends" });
      }
      if (existing.status === "pending") {
        const isOutgoing = existing.fromUser.toString() === myId.toString();
        return res.status(200).json({
          user: targetUser,
          status: isOutgoing ? "pending_outgoing" : "pending_incoming",
        });
      }
    }

    res.status(200).json({ user: targetUser, status: "can_add" });
  } catch (error) {
    console.error("❌ searchUserByUsername:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
