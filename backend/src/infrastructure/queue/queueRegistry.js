import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../../config/queues.js";
import { queueConfig } from "../../config/queue.config.js";
import {
  getBullConnection,
  isQueueInfrastructureReady,
} from "../redis/bullConnection.js";

const queues = new Map();

function createQueue(name, defaultJobOptions) {
  const connection = getBullConnection();
  if (!connection) return null;

  const queue = new Queue(name, {
    connection,
    defaultJobOptions,
  });
  queues.set(name, queue);
  return queue;
}

export function initAllQueues() {
  if (!isQueueInfrastructureReady()) return false;

  createQueue(QUEUE_NAMES.MESSAGE_DELIVERY, queueConfig.messageDelivery);
  createQueue(QUEUE_NAMES.GROUP_MESSAGE_DELIVERY, queueConfig.groupDelivery);
  createQueue(QUEUE_NAMES.DELIVERY_RECEIPT, queueConfig.deliveryReceipt);
  return true;
}

export function getMessageDeliveryQueue() {
  if (!queues.has(QUEUE_NAMES.MESSAGE_DELIVERY)) {
    initAllQueues();
  }
  return queues.get(QUEUE_NAMES.MESSAGE_DELIVERY) || null;
}

export function getGroupMessageDeliveryQueue() {
  if (!queues.has(QUEUE_NAMES.GROUP_MESSAGE_DELIVERY)) {
    initAllQueues();
  }
  return queues.get(QUEUE_NAMES.GROUP_MESSAGE_DELIVERY) || null;
}

export function getDeliveryReceiptQueue() {
  if (!queues.has(QUEUE_NAMES.DELIVERY_RECEIPT)) {
    initAllQueues();
  }
  return queues.get(QUEUE_NAMES.DELIVERY_RECEIPT) || null;
}

export async function getQueueMetrics() {
  if (!isQueueInfrastructureReady()) {
    return { enabled: false, queues: {}, sla: { healthy: false } };
  }

  if (queues.size === 0) initAllQueues();

  const metrics = {};
  let totalFailed = 0;
  let totalWaiting = 0;

  for (const [name, queue] of queues.entries()) {
    const [waiting, active, completed, failed, delayed, paused] =
      await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);
    metrics[name] = { waiting, active, completed, failed, delayed, paused };
    totalFailed += failed;
    totalWaiting += waiting;
  }

  return {
    enabled: true,
    queues: metrics,
    sla: {
      healthy: totalFailed === 0 && totalWaiting < 1000,
      totalFailed,
      totalWaiting,
    },
  };
}

/** Sample recent failed jobs for ops / debugging */
export async function getFailedJobSamples(limit = 5) {
  if (!isQueueInfrastructureReady()) return [];
  if (queues.size === 0) initAllQueues();

  const samples = [];
  for (const [queueName, queue] of queues.entries()) {
    const failed = await queue.getFailed(0, limit - 1);
    for (const job of failed) {
      samples.push({
        queue: queueName,
        id: job.id,
        name: job.name,
        failedReason: job.failedReason,
        attempts: job.attemptsMade,
      });
    }
  }
  return samples.slice(0, limit);
}

export async function closeAllQueues() {
  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();
}
