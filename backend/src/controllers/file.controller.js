import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { container } from "../container.js";
import { AppError } from "../errors/AppError.js";

export const uploadFile = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw AppError.badRequest("No file received");

  const ext = file.originalname.split(".").pop().toLowerCase();
  let resourceType = "raw";
  if (file.mimetype.startsWith("image/")) resourceType = "image";
  else if (
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/")
  ) {
    resourceType = "video";
  }

  const baseName = file.originalname.replace(`.${ext}`, "");
  const upload = await container.mediaService.uploadLocalFile(file.path, {
    resource_type: resourceType,
    folder: "chat_files",
    public_id: baseName,
    use_filename: true,
    unique_filename: false,
  });

  fs.unlinkSync(file.path);

  res.json({
    url: upload.secure_url,
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
  });
});
