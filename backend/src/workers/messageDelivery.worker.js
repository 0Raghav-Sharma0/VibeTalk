import { Worker } from "bullmq";
import { QUEUE_NAMES } from "../config/queues.js";
import { queueConfig } from "../config/queue.config.js";
import { getBullConnection } from "../infrastructure/redis/bullConnection.js";
import { messagePipelineService } from "../services/messagePipeline.service.js";

let worker = null;

export function startMessageDeliveryWorker() {
  const connection = getBullConnection();
  if (!connection || worker) return null;

  worker = new Worker(
    QUEUE_NAMES.MESSAGE_DELIVERY,
    async (job) => {
      const { messageId, attempt = 0 } = job.data;
      const enriched = await messagePipelineService.enrichById(messageId);
      if (!enriched) {
        throw new Error(`Message ${messageId} not found`);
      }

      const result = await messagePipelineService.deliverToReceiver(enriched, {
        attempt,
      });

      return {
        status: result.status || (result.delivered ? "delivered" : "pending"),
        messageId,
        ...result,
      };
    },
    {
      connection,
      concurrency: queueConfig.concurrency.messageDelivery,
      limiter: {
        max: 2000,
        duration: 1000,
      },
    }
  );

  worker.on("completed", (job, result) => {
    if (result?.status === "pending_sync") {
      console.log(
        `📭 Message ${job.data.messageId} pending sync (offline retry ${result.attempt})`
      );
    }
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Message delivery failed [${job?.id}]:`, err.message);
  });

  console.log(
    `📬 Message delivery worker (concurrency=${queueConfig.concurrency.messageDelivery})`
  );
  return worker;
}

export async function stopMessageDeliveryWorker() {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
