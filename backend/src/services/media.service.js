import cloudinary from "../lib/cloudinary.js";
import { isCloudinaryConfigured } from "../config/env.js";
import { AppError } from "../errors/AppError.js";

export const mediaService = {
  assertConfigured() {
    if (!isCloudinaryConfigured) {
      throw AppError.serviceUnavailable(
        "Media uploads require Cloudinary environment variables.",
        "CLOUDINARY_NOT_CONFIGURED"
      );
    }
  },

  async uploadBase64Image(dataUri) {
    this.assertConfigured();
    const result = await cloudinary.uploader.upload(dataUri);
    return result.secure_url;
  },

  async uploadLocalFile(filePath, options) {
    this.assertConfigured();
    const result = await cloudinary.uploader.upload(filePath, options);
    return result;
  },
};
