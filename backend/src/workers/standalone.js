/**
 * Production worker fleet — run separately from API nodes.
 *
 *   WORKER_ONLY=true npm run worker
 *
 * Uses @socket.io/redis-emitter to push to user rooms on API Socket.IO servers.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import { connectRedis } from "../lib/redis.js";
import { startAllWorkers, stopAllWorkers } from "./index.js";
import { closeAllQueues } from "../infrastructure/queue/queueRegistry.js";
import { closeBullConnection } from "../infrastructure/redis/bullConnection.js";
import { closeRealtimeBus } from "../infrastructure/realtime/realtimeBus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

process.env.WORKER_ONLY = "true";

await connectDB();
await connectRedis();
const workers = await startAllWorkers();

if (!workers.enabled) {
  console.error("❌ Cannot start workers: Redis/queues unavailable");
  process.exit(1);
}

console.log(`👷 Worker fleet ready [${workers.mode}]`);

async function shutdown() {
  await stopAllWorkers();
  await closeAllQueues();
  await closeBullConnection();
  await closeRealtimeBus();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
