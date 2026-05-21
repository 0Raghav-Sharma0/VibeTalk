import { env } from "./env.js";

/** Dev / demo origins when CORS_ORIGINS is unset */
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://localhost:3000",
  "https://blah-blah-jvc4.vercel.app",
  "https://blah-blah-hky1.vercel.app",
  "https://blah-blah-2.onrender.com",
  "https://blah-blah-3.onrender.com",
];

const ORIGIN_PATTERNS = [
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
];

/**
 * Single source for HTTP + Socket.IO CORS.
 * If CORS_ORIGINS is set in env, only those + patterns apply.
 * Otherwise defaults + patterns (socket previously used this list).
 */
export function isOriginAllowed(origin) {
  if (!origin) return true;

  const explicit = env.corsOrigins.length > 0 ? env.corsOrigins : DEFAULT_ORIGINS;
  if (explicit.includes(origin)) return true;
  return ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function socketCorsMiddleware(origin, callback) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    console.warn(`❌ CORS blocked: ${origin}`);
    callback(new Error("CORS Not Allowed"));
  }
}

export const socketCorsOptions = {
  origin: socketCorsMiddleware,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

export const expressCorsOptions = {
  origin(origin, callback) {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
};
