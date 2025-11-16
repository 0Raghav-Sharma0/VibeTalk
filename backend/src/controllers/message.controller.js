import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { io } from "../lib/socket.js";


/* -------------------------------------------------------------------------- */
/* 🧩  Get All Users (for sidebar list)                                        */
/* -------------------------------------------------------------------------- */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Exclude the logged-in user and password field
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("❌ Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 💬  Get Chat Messages Between Two Users                                   */
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
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error in getMessages controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* ✉️  Send a New Message                                                    */
/* -------------------------------------------------------------------------- */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, video } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // ✅ Since frontend already uploads to Cloudinary, just store the URLs
    const imageUrl = image || null;
    const videoUrl = video || null;

    // Create message document
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
    });

    await newMessage.save();

    // ✅ Real-time socket update
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage controller:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 💖  Add or Update a Reaction on a Message                                 */
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

    // Remove any existing reaction from same user, then add new one
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId
    );
    message.reactions.push({ userId, emoji });

    await message.save();

    // Emit reaction update via socket
    io.emit("messageReaction", { messageId, reactions: message.reactions });

    res.status(200).json({
      message: "Reaction added successfully",
      data: message,
    });
  } catch (error) {
    console.error("❌ Error adding reaction:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
