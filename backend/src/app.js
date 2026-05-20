import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import { expressCorsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./errors/errorHandler.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import groupRoutes from "./routes/group.route.js";
import healthRoutes from "./routes/health.route.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  if (env.trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(cors(expressCorsOptions));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  app.use(healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/friends", friendRoutes);
  app.use("/api/groups", groupRoutes);
  // Versioned API (same handlers — clients can migrate to /api/v1/*)
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/messages", messageRoutes);
  app.use("/api/v1/friends", friendRoutes);
  app.use("/api/v1/groups", groupRoutes);

  app.use("/songs", express.static(path.join(__dirname, "../songs")));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
