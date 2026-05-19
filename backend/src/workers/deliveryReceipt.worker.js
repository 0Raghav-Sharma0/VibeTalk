import { Worker } from "bullmq";
import { QUEUE_NAMES } from "../config/queues.js";
import { queueConfig } from "../config/queue.config.js";
import { getBullConnection } from "../infrastructure/redis/bullConnection.js";
import { messagePipelineService } from "../services/messagePipeline.service.js";

let worker = null;

export function startDeliveryReceiptWorker() {
  const connection = getBullConnection();
  if (!connection || worker) return null;

  worker = new Worker(
    QUEUE_NAMES.DELIVERY_RECEIPT,
    async (job) => {
      const { messageId, senderId } = job.data;
      return messagePipelineService.emitDeliveryReceipt({ messageId, senderId });
    },
    {
      connection,
      concurrency: queueConfig.concurrency.deliveryReceipt,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`❌ Receipt emit failed [${job?.id}]:`, err.message);
  });

  console.log(
    `✓ Delivery receipt worker (concurrency=${queueConfig.concurrency.deliveryReceipt})`
  );
  return worker;
}

export async function stopDeliveryReceiptWorker() {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
