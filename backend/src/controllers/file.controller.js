import cloudinary from "../lib/cloudinary.js";
import fs from "fs";

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file received" });

    // Extract extension
    const ext = file.originalname.split(".").pop().toLowerCase();

    // Detect correct Cloudinary type
    let resourceType = "raw";
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } 
    else if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/")) {
      resourceType = "video";  
    }

    const baseName = file.originalname.replace("." + ext, "");

    const upload = await cloudinary.uploader.upload(file.path, {
      resource_type: resourceType,
      folder: "chat_files",

      // ✔ keep filename
      public_id: baseName,
      use_filename: true,
      unique_filename: false,

      // ❌ DO NOT USE `format` for RAW files (causes corruption)
      // format: ext,  ← REMOVE THIS
    });

    fs.unlinkSync(file.path);

    res.json({
      url: upload.secure_url,
      name: file.originalname,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};
