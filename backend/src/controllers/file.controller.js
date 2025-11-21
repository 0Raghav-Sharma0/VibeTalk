import cloudinary from "../lib/cloudinary.js";
import fs from "fs";

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file received" });

    // Determine correct resource type
    let resourceType = "raw";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.includes("audio") || 
      file.originalname.endsWith(".mp3") ||
      file.originalname.endsWith(".wav") ||
      file.originalname.endsWith(".m4a")
    ) {
      resourceType = "video"; // Cloudinary rule: audio = video
    }

    const upload = await cloudinary.uploader.upload(file.path, {
      resource_type: resourceType,
      folder: "chat_files",
    });

    fs.unlinkSync(file.path);

    return res.json({
      url: upload.secure_url,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      resource_type: resourceType,
    });

  } catch (err) {
    console.error("❌ FILE UPLOAD ERROR:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};
