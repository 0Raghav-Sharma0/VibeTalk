import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    profilePic: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.index({ fullName: 1 });

const User = mongoose.model("User", userSchema);

export default User;
