import mongoose from "mongoose";
import Message from "../models/message.model.js";

export const messageRepository = {
  async findConversationPage({ userId, peerId, limit, before, since }) {
    const filter = {
      $or: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    };

    if (before) {
      const cursorMsg = await Message.findById(before).lean();
      if (cursorMsg) filter.createdAt = { $lt: cursorMsg.createdAt };
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        filter.createdAt = filter.createdAt
          ? { ...filter.createdAt, $gt: sinceDate }
          : { $gt: sinceDate };
      }
    }

    return Message.find(filter)
      .sort({ createdAt: since ? 1 : -1 })
      .limit(limit + 1)
      .lean();
  },

  create(data) {
    return Message.create(data);
  },

  findById(id) {
    return Message.findById(id);
  },

  findByClientMessageId(clientMessageId) {
    return Message.findOne({ clientMessageId }).lean();
  },

  markDelivered(id) {
    return Message.findByIdAndUpdate(id, { delivered: true }, { new: true }).lean();
  },

  /** Idempotent: only first transition to delivered returns a doc */
  markDeliveredIfPending(id) {
    return Message.findOneAndUpdate(
      { _id: id, delivered: { $ne: true } },
      { delivered: true },
      { new: true }
    ).lean();
  },

  findByIdLean(id) {
    return Message.findById(id).lean();
  },

  markSeenForConversation({ viewerId, peerId }) {
    return Message.updateMany(
      { senderId: peerId, receiverId: viewerId, seen: false },
      { seen: true, delivered: true }
    );
  },

  /** Latest DM timestamp per friend for sidebar ordering */
  async findLastMessageAtByPeers(userId, peerIds) {
    if (!peerIds?.length) return new Map();

    const uid = new mongoose.Types.ObjectId(userId);
    const peers = peerIds.map((id) => new mongoose.Types.ObjectId(id));

    const rows = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: uid, receiverId: { $in: peers } },
            { senderId: { $in: peers }, receiverId: uid },
          ],
        },
      },
      {
        $project: {
          peerId: {
            $cond: [{ $eq: ["$senderId", uid] }, "$receiverId", "$senderId"],
          },
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$peerId",
          lastMessageAt: { $first: "$createdAt" },
        },
      },
    ]);

    const map = new Map();
    for (const row of rows) {
      map.set(String(row._id), row.lastMessageAt);
    }
    return map;
  },
};
