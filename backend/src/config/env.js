import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseOrigins(value) {
  return (value || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5001,
  isProduction: process.env.NODE_ENV === "production",

  mongodbUri: process.env.MONGODB_URI,
  clerkJwtIssuer: process.env.CLERK_JWT_ISSUER,

  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
  },

  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  /** Behind Nginx / ALB — enables Express trust proxy for correct client IP */
  trustProxy:
    process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production",
};

export function assertRequiredEnv() {
  const missing = [];
  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (!env.clerkJwtIssuer) missing.push("CLERK_JWT_ISSUER");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName &&
    env.cloudinary.apiKey &&
    env.cloudinary.apiSecret
);
