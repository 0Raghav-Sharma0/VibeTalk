import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Reconstruct directory paths safely for Windows too
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Go up two levels (from src/lib → backend)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Debug: show what file is being loaded
console.log("🧩 Loading .env from:", path.resolve(__dirname, "../../.env"));

if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
  console.error("❌ Cloudinary environment variables missing. Check .env or path!");
} else {
  console.log("✅ Cloudinary environment variables loaded successfully");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

export default cloudinary;
