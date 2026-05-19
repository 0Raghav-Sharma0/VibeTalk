import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "../config/env.js";

export { isCloudinaryConfigured };

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  console.log("✅ Cloudinary configured");
} else {
  console.warn(
    "⚠️ Cloudinary not configured — media uploads disabled until env vars are set"
  );
}

export default cloudinary;
