import { queueConfig, QUEUE_JOB_NAMES } from "../../config/queue.config.js";
import { QUEUE_NAMES } from "../../config/queues.js";
import {
  getMessageDeliveryQueue,
  getGroupMessageDeliveryQueue,
  getDeliveryReceiptQueue,
} from "./queueRegistry.js";

export function messageDeliveryJobId(messageId) {
  return `msg-${messageId}`;
}

export function groupDeliveryJobId(messageId) {
  return `gmsg-${messageId}`;
}

export function receiptJobId(messageId) {
  return `receipt-${messageId}`;
}

/**
 * Enqueue 1:1 delivery (idempotent jobId = one job per message).
 */
export async function enqueueDirectMessageDelivery({
  messageId,
  senderId,
  receiverId,
  attempt = 0,
}) {
  const queue = getMessageDeliveryQueue();
  if (!queue) throw new Error("Message delivery queue unavailable");

  const opts = {
    jobId: messageDeliveryJobId(messageId),
    priority: queueConfig.priority.directMessage,
    ...queueConfig.messageDelivery,
  };

  if (attempt > 0) {
    const delay =
      queueConfig.offlineRetryDelaysMs[
        Math.min(attempt - 1, queueConfig.offlineRetryDelaysMs.length - 1)
      ];
    opts.delay = delay;
    opts.jobId = `${messageDeliveryJobId(messageId)}-r${attempt}`;
  }

  return queue.add(
    QUEUE_JOB_NAMES.DELIVER_DIRECT,
    { messageId, senderId, receiverId, attempt },
    opts
  );
}

export async function enqueueGroupFanout({ message, memberIds, groupId }) {
  const queue = getGroupMessageDeliveryQueue();
  if (!queue) throw new Error("Group delivery queue unavailable");

  return queue.add(
    QUEUE_JOB_NAMES.FANOUT_GROUP,
    { message, memberIds, groupId },
    {
      jobId: groupDeliveryJobId(message._id),
      priority: queueConfig.priority.groupMessage,
      ...queueConfig.groupDelivery,
    }
  );
}

export async function enqueueDeliveryReceipt({ messageId, senderId, receiverId }) {
  const queue = getDeliveryReceiptQueue();
  if (!queue) return null;

  return queue.add(
    QUEUE_JOB_NAMES.EMIT_RECEIPT,
    { messageId, senderId, receiverId },
    {
      jobId: receiptJobId(messageId),
      priority: queueConfig.priority.deliveryReceipt,
      ...queueConfig.deliveryReceipt,
    }
  );
}
