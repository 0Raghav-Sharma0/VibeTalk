import { queueConfig } from "../config/queue.config.js";
import { isQueueInfrastructureReady } from "../infrastructure/redis/bullConnection.js";
import { initAllQueues } from "../infrastructure/queue/queueRegistry.js";
import { initRealtimeBus } from "../infrastructure/realtime/realtimeBus.js";
import { startMessageDeliveryWorker } from "./messageDelivery.worker.js";
import { startGroupMessageDeliveryWorker } from "./groupMessageDelivery.worker.js";
import { startDeliveryReceiptWorker } from "./deliveryReceipt.worker.js";

export function shouldRunWorkers() {
  if (!isQueueInfrastructureReady()) return false;
  if (queueConfig.workerOnly) return true;
  return queueConfig.runWorkersInApi;
}

export async function startAllWorkers() {
  if (!isQueueInfrastructureReady()) {
    console.warn(
      "⚠️ Redis/queues unavailable — sync socket delivery only (set REDIS_URL)"
    );
    return { enabled: false };
  }

  await initRealtimeBus();
  initAllQueues();

  startMessageDeliveryWorker();
  startGroupMessageDeliveryWorker();
  startDeliveryReceiptWorker();

  const mode = queueConfig.workerOnly
    ? "worker-only"
    : queueConfig.runWorkersInApi
      ? "embedded-in-api"
      : "disabled-on-api";

  console.log(`✅ BullMQ workers running [${mode}] (WhatsApp-scale delivery)`);
  return { enabled: true, mode };
}

export async function stopAllWorkers() {
  const { stopMessageDeliveryWorker } = await import(
    "./messageDelivery.worker.js"
  );
  const { stopGroupMessageDeliveryWorker } = await import(
    "./groupMessageDelivery.worker.js"
  );
  const { stopDeliveryReceiptWorker } = await import(
    "./deliveryReceipt.worker.js"
  );
  await stopMessageDeliveryWorker();
  await stopGroupMessageDeliveryWorker();
  await stopDeliveryReceiptWorker();
}
