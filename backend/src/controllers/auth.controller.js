// controllers/auth.controller.js
import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// ===================================================================
// SIGNUP
// ===================================================================
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashed,
    });

    const token = generateToken(user._id, res);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token,
    });
  } catch (err) {
    console.log("❌ Signup error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===================================================================
// LOGIN
// ===================================================================
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token,
    });
  } catch (err) {
    console.log("❌ Login error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===================================================================
// LOGOUT
// ===================================================================
export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.log("❌ Logout error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===================================================================
// UPDATE PROFILE (Name + Profile Pic)
// ===================================================================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, profilePic } = req.body;

    const updateData = {};

    // ------------------------
    // Update Name
    // ------------------------
    if (fullName) {
      if (fullName.trim().length < 2) {
        return res
          .status(400)
          .json({ message: "Name must be at least 2 characters" });
      }

      updateData.fullName = fullName;
    }

    // ------------------------
    // Update Profile Picture
    // ------------------------
    if (profilePic) {
      const uploaded = await cloudinary.uploader.upload(profilePic, {
        folder: "vibetalk/profile",
      });
      updateData.profilePic = uploaded.secure_url;
    }

    // If user is trying to update nothing
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    console.log("❌ Update profile error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ===================================================================
// CHECK AUTH
// ===================================================================
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.log("❌ CheckAuth error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
