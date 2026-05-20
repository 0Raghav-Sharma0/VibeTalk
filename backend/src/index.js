import http from "http";
import cloudinary from "./lib/cloudinary.js";
import { isCloudinaryConfigured } from "./config/env.js";
import { assertRequiredEnv, env } from "./config/env.js";
import { connectDB } from "./lib/db.js";
import { connectRedis, disconnectRedis } from "./lib/redis.js";
import { createApp } from "./app.js";
import { createSocketServer, getIO } from "./lib/socket.js";
import { getSocketClientCount } from "./lib/ioHolder.js";
import { scaleConfig, getScaleSummary } from "./config/scale.config.js";
import {
  attachSocketRedisAdapter,
  closeSocketRedisAdapter,
} from "./lib/socketAdapter.js";
import { startAllWorkers, stopAllWorkers, shouldRunWorkers } from "./workers/index.js";
import { initRealtimeBus, closeRealtimeBus } from "./infrastructure/realtime/realtimeBus.js";
import { closeAllQueues } from "./infrastructure/queue/queueRegistry.js";
import { closeBullConnection } from "./infrastructure/redis/bullConnection.js";

assertRequiredEnv();

const app = createApp();
const server = http.createServer(app);
const io = createSocketServer(server);

if (env.isProduction || process.env.SOCKET_METRICS_LOG === "true") {
  const interval = scaleConfig.metrics.logSocketCountIntervalMs;
  setInterval(() => {
    const n = getSocketClientCount();
    const plan = getScaleSummary();
    console.log(
      `📊 Sockets on this pod: ${n} (target ${plan.connectionsPerApiInstance}/pod, cluster plan ${plan.plannedCapacity})`
    );
  }, interval);
}

server.listen(env.port, async () => {
  console.log(`🚀 Server running on port ${env.port}`);
  console.log(`🌍 Environment: ${env.nodeEnv}`);
  console.log(`📐 Scale plan:`, getScaleSummary());
  await connectDB();
  await connectRedis();
  await initRealtimeBus();
  await attachSocketRedisAdapter(getIO());
  const workers = await startAllWorkers();
  console.log(`📡 Socket.IO + message pipeline ready`);
  if (!workers.enabled) {
    console.warn("⚠️ Message queues disabled");
  } else if (!shouldRunWorkers()) {
    console.log(
      "ℹ️  API-only mode: run `npm run dev:worker` for delivery workers (production pattern)"
    );
  }
});

if (isCloudinaryConfigured) {
  cloudinary.api
    .ping()
    .then((r) => console.log("☁️ Cloudinary Connected", r.status))
    .catch((err) => console.error("❌ Cloudinary Error:", err.message));
}

async function shutdown(signal) {
  console.log(`⚠️  ${signal} received`);
  await stopAllWorkers();
  await closeAllQueues();
  await closeBullConnection();
  await closeSocketRedisAdapter();
  await closeRealtimeBus();
  await disconnectRedis();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});
