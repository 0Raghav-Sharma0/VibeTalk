import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: null,
    },

    video: {
      type: String,
      default: null,
    },

    // FILE SUPPORT 🔥
    file: {
      url: { type: String, default: null },
      name: { type: String, default: null },
      size: { type: Number, default: null },
      type: { type: String, default: null },
    },

    delivered: {
      type: Boolean,
      default: false,
    },

    seen: {
      type: Boolean,
      default: false,
    },

    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
