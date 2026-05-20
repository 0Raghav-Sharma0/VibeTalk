import { QUEUE_NAMES } from "./queues.js";

/**
 * Production-oriented BullMQ settings (WhatsApp-style delivery pipeline).
 * Tune via env without code changes.
 */
export const queueConfig = {
  /** API process enqueues; workers deliver (set false in prod API, true in worker pod). */
  runWorkersInApi:
    process.env.RUN_WORKERS_IN_API === "true" ||
    (process.env.RUN_WORKERS_IN_API !== "false" &&
      process.env.NODE_ENV !== "production" &&
      process.env.WORKER_ONLY !== "true"),

  workerOnly: process.env.WORKER_ONLY === "true",

  concurrency: {
    messageDelivery: Number(process.env.MESSAGE_WORKER_CONCURRENCY) || 100,
    groupDelivery: Number(process.env.GROUP_WORKER_CONCURRENCY) || 40,
    deliveryReceipt: Number(process.env.RECEIPT_WORKER_CONCURRENCY) || 50,
  },

  /** BullMQ: lower number = higher priority */
  priority: {
    directMessage: 1,
    groupMessage: 2,
    deliveryReceipt: 3,
  },

  /** Retry schedule for push delivery (receiver may come online between attempts) */
  messageDelivery: {
    attempts: Number(process.env.MESSAGE_DELIVERY_ATTEMPTS) || 8,
    backoff: {
      type: "exponential",
      delay: Number(process.env.MESSAGE_DELIVERY_BACKOFF_MS) || 2000,
    },
    removeOnComplete: { age: 3600, count: 10_000 },
    removeOnFail: { age: 7 * 24 * 3600, count: 5_000 },
  },

  groupDelivery: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1500 },
    removeOnComplete: { age: 3600, count: 5_000 },
    removeOnFail: { age: 7 * 24 * 3600, count: 2_000 },
  },

  deliveryReceipt: {
    attempts: 3,
    backoff: { type: "fixed", delay: 500 },
    removeOnComplete: { age: 1800, count: 20_000 },
    removeOnFail: { age: 86400, count: 1_000 },
  },

  /** Delayed retries when receiver socket room is empty (ms) */
  offlineRetryDelaysMs: [3000, 10_000, 30_000, 60_000, 120_000],
};

export const QUEUE_JOB_NAMES = {
  DELIVER_DIRECT: "deliver-direct",
  FANOUT_GROUP: "fanout-group",
  EMIT_RECEIPT: "emit-receipt",
};

export { QUEUE_NAMES };
