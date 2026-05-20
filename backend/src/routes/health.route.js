import express from "express";
import mongoose from "mongoose";
import { isRedisAvailable } from "../lib/redis.js";
import { isSocketAdapterAttached } from "../lib/socketAdapter.js";
import { getSocketClientCount } from "../lib/ioHolder.js";
import { env, isCloudinaryConfigured } from "../config/env.js";
import { getScaleSummary } from "../config/scale.config.js";
import { isQueueInfrastructureReady } from "../infrastructure/redis/bullConnection.js";
import {
  getQueueMetrics,
  getFailedJobSamples,
} from "../infrastructure/queue/queueRegistry.js";

const router = express.Router();
const startedAt = Date.now();

router.get("/ready", async (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisOk = isRedisAvailable();
  const queuesOk = isQueueInfrastructureReady();
  const ready = mongoReady && redisOk && queuesOk;
  res.status(ready ? 200 : 503).json({
    ready,
    checks: {
      mongodb: mongoReady,
      redis: redisOk,
      messageQueues: queuesOk,
    },
  });
});

router.get("/health", async (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const queueMetrics = await getQueueMetrics();
  const failedSamples =
    queueMetrics.sla?.totalFailed > 0 ? await getFailedJobSamples(3) : [];

  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: mongoReady ? "connected" : "disconnected",
      redis: isRedisAvailable() ? "connected" : "unavailable",
      messageQueues: isQueueInfrastructureReady() ? "enabled" : "disabled",
      cloudinary: isCloudinaryConfigured ? "configured" : "not_configured",
      socketRedisAdapter: isSocketAdapterAttached() ? "attached" : "single-instance",
    },
    sockets: {
      clientsOnThisPod: getSocketClientCount(),
    },
    scale: getScaleSummary(),
    queues: queueMetrics,
    failedJobSamples: failedSamples,
  });
});

router.get("/metrics", async (_req, res) => {
  const mem = process.memoryUsage();
  const queueMetrics = await getQueueMetrics();
  res.json({
    uptime: process.uptime(),
    uptimeMs: Date.now() - startedAt,
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    nodeVersion: process.version,
    env: env.nodeEnv,
    queues: queueMetrics,
    process: {
      pid: process.pid,
      platform: process.platform,
    },
  });
});

/** Prometheus text exposition (FAANG SRE-style scrape target) */
router.get("/metrics/prometheus", async (_req, res) => {
  const mem = process.memoryUsage();
  const q = await getQueueMetrics();
  const lines = [
    "# HELP nexaura_uptime_seconds Process uptime",
    "# TYPE nexaura_uptime_seconds gauge",
    `nexaura_uptime_seconds ${process.uptime()}`,
    "# HELP nexaura_heap_used_bytes Node heap used",
    "# TYPE nexaura_heap_used_bytes gauge",
    `nexaura_heap_used_bytes ${mem.heapUsed}`,
    "# HELP nexaura_queue_failed_total Failed BullMQ jobs",
    "# TYPE nexaura_queue_failed_total gauge",
  ];

  lines.push(
    "# HELP nexaura_socket_clients Connected Socket.IO clients on this pod",
    "# TYPE nexaura_socket_clients gauge",
    `nexaura_socket_clients ${getSocketClientCount()}`
  );

  if (q.enabled) {
    for (const [name, m] of Object.entries(q.queues)) {
      lines.push(`nexaura_queue_waiting{queue="${name}"} ${m.waiting}`);
      lines.push(`nexaura_queue_active{queue="${name}"} ${m.active}`);
      lines.push(`nexaura_queue_failed{queue="${name}"} ${m.failed}`);
      lines.push(`nexaura_queue_completed{queue="${name}"} ${m.completed}`);
    }
  }

  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(lines.join("\n") + "\n");
});

export default router;
