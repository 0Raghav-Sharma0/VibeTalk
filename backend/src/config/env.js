import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname in ES Modules
const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

// Load .env file using absolute path
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Convert comma-separated CORS origins into array
function parseOrigins(value) {
  return (value || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

// Centralized environment configuration
export const env = {
  nodeEnv:
    process.env.NODE_ENV || "development",

  port:
    Number(process.env.PORT) || 5001,

  isProduction:
    process.env.NODE_ENV === "production",

  mongodbUri:
    process.env.MONGODB_URI,

  clerkJwtIssuer:
    process.env.CLERK_JWT_ISSUER,

  corsOrigins:
    parseOrigins(process.env.CORS_ORIGINS),

  cloudinary: {
    cloudName:
      process.env.CLOUDINARY_CLOUD_NAME?.trim(),

    apiKey:
      process.env.CLOUDINARY_API_KEY?.trim(),

    apiSecret:
      process.env.CLOUDINARY_API_SECRET?.trim(),
  },

  redisUrl:
    process.env.REDIS_URL ||
    "redis://localhost:6379",

  /**
   * Enables Express to trust reverse proxy headers
   * (Nginx / Load Balancer / Render / ALB etc.)
   * so req.ip contains the real client IP.
   */
  trustProxy:
    process.env.TRUST_PROXY === "true" ||
    process.env.NODE_ENV === "production",
};

// Returns array of missing required env vars
export function getMissingRequiredEnv() {
  const missing = [];

  if (!env.mongodbUri) {
    missing.push("MONGODB_URI");
  }

  if (!env.clerkJwtIssuer) {
    missing.push("CLERK_JWT_ISSUER");
  }

  return missing;
}

// Crash app during startup if required env vars are missing
export function assertRequiredEnv() {
  const missing = getMissingRequiredEnv();

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      "On Render: Dashboard → your Web Service → Environment → add them, then redeploy."
    );
  }
}

// Checks whether Cloudinary is fully configured
export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName &&
  env.cloudinary.apiKey &&
  env.cloudinary.apiSecret
);