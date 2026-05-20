/**
 * Pure delivery policy (testable, no I/O) — WhatsApp-style offline + idempotency.
 */

export const DeliveryAction = {
  SKIP_ALREADY_DELIVERED: "skip_already_delivered",
  PUSH_TO_RECEIVER: "push_to_receiver",
  SCHEDULE_OFFLINE_RETRY: "schedule_offline_retry",
  PENDING_SYNC: "pending_sync",
};

/**
 * @param {object} p
 * @param {boolean} p.alreadyDelivered
 * @param {boolean} p.receiverOnline
 * @param {number} p.attempt
 * @param {number} p.maxRetries
 * @param {boolean} p.queueReady
 */
export function planDelivery({
  alreadyDelivered,
  receiverOnline,
  attempt,
  maxRetries,
  queueReady,
}) {
  if (alreadyDelivered) {
    return { action: DeliveryAction.SKIP_ALREADY_DELIVERED };
  }
  if (receiverOnline) {
    return { action: DeliveryAction.PUSH_TO_RECEIVER };
  }
  if (attempt < maxRetries && queueReady) {
    return { action: DeliveryAction.SCHEDULE_OFFLINE_RETRY, nextAttempt: attempt + 1 };
  }
  return { action: DeliveryAction.PENDING_SYNC, attempt };
}
