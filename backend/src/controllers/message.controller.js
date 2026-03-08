// backend/src/controllers/message.controller.js

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { getIO, getReceiverSocketId } from "../lib/socket.js";
import { cacheGet, cacheSet, cacheKeys } from "../lib/cache.js";

const SIDEBAR_CACHE_TTL = 60; // 1 min - shorter to avoid stale friend list

/* -------------------------------------------------------------------------- */
/* 🧩  Get Friends Only (Sidebar List) - visible only after request accepted  */
/* -------------------------------------------------------------------------- */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const cacheKey = cacheKeys.sidebarUsers(loggedInUserId);

    const cached = await cacheGet(cacheKey);
    if (cached) return res.status(200).json(cached);

    const acceptedRequests = await FriendRequest.find({
      status: "accepted",
      $or: [
        { fromUser: loggedInUserId },
        { toUser: loggedInUserId },
      ],
    }).lean();

    const friendIds = acceptedRequests.map((r) =>
      r.fromUser.toString() === loggedInUserId.toString()
        ? r.toUser.toString()
        : r.fromUser.toString()
    );

    const users = await User.find({ _id: { $in: friendIds } })
      .select("-password")
      .lean();

    const serialized = users.map((u) => ({
      ...u,
      _id: u._id.toString(),
    }));
    await cacheSet(cacheKey, serialized, SIDEBAR_CACHE_TTL);

    res.status(200).json(serialized);
  } catch (error) {
    console.error("❌ Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 💬  Get Chat Messages Between Two Users (paginated, latest 100)            */
/* -------------------------------------------------------------------------- */
export const getMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const friendId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: friendId },
        { senderId: friendId, receiverId: myId }
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const sorted = messages.reverse();

    res.status(200).json(sorted);
  } catch (error) {
    console.error("❌ Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* ✉️  Send New Message (TEXT / IMAGE / VIDEO)                                */
/* -------------------------------------------------------------------------- */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || "",
      image: image || null,
      video: video || null,
    });

    const receiverSocket = getReceiverSocketId(receiverId);

    if (receiverSocket) {
      // 🔥 Send message to receiver
      getIO().to(receiverSocket).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 💖  Add or Update Reaction (WhatsApp style)                                */
/* -------------------------------------------------------------------------- */
export const addReaction = async (req, res) => {
  try {
    const { messageId, userId, emoji } = req.body;

    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Remove old reaction by same user
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId
    );

    // Push new reaction
    message.reactions.push({ userId, emoji });

    await message.save();

    // 🔥 Correct event name
    getIO().emit("reactionUpdated", {
      messageId,
      reactions: message.reactions,
    });

    res.status(200).json({
      success: true,
      reactions: message.reactions,
    });
  } catch (error) {
    console.error("❌ Error in addReaction:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
