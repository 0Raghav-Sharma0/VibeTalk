// backend/src/controllers/message.controller.js

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getIO, getReceiverSocketId } from "../lib/socket.js";

/* -------------------------------------------------------------------------- */
/* 🧩  Get All Users (Sidebar List)                                           */
/* -------------------------------------------------------------------------- */

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 💬  Get Chat Messages Between Two Users                                    */
/* -------------------------------------------------------------------------- */

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
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
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Frontend already gives Cloudinary URLs
    const imageUrl = image || null;
    const videoUrl = video || null;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();

    // SOCKET.IO — send new message to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      getIO().to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 💖  Add or Update Reaction                                                 */
/* -------------------------------------------------------------------------- */

export const addReaction = async (req, res) => {
  try {
    const { messageId, userId, emoji } = req.body;

    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove previous reaction from same user
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId
    );

    // Add new one
    message.reactions.push({ userId, emoji });

    await message.save();

    // Broadcast reaction update
    getIO().emit("messageReaction", {
      messageId,
      reactions: message.reactions,
    });

    res.status(200).json({
      message: "Reaction added successfully",
      data: message,
    });
  } catch (error) {
    console.error("❌ Error in addReaction:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
