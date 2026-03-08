import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

friendRequestSchema.index({ fromUser: 1, toUser: 1 });
friendRequestSchema.index({ toUser: 1, status: 1 });
friendRequestSchema.index({ fromUser: 1, status: 1 });
friendRequestSchema.index({ status: 1, fromUser: 1, toUser: 1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
