import { cacheGet, cacheSet, cacheKeys } from "../lib/cache.js";
import { messageRepository } from "../repositories/message.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { socketNotifier } from "../infrastructure/realtime/SocketNotifier.js";
import { isQueueInfrastructureReady } from "../infrastructure/redis/bullConnection.js";
import {
  enqueueDirectMessageDelivery,
  enqueueDeliveryReceipt,
} from "../infrastructure/queue/enqueueDelivery.js";
import { conversationCacheService } from "./conversationCache.service.js";
import { presenceService } from "./presence.service.js";
import { toIdString } from "../domain/ids.js";
import { getIO } from "../lib/ioHolder.js";
import { userRoom } from "../config/queues.js";
import { queueConfig } from "../config/queue.config.js";
import { planDelivery, DeliveryAction } from "../domain/deliveryPolicy.js";
import { logger } from "../lib/logger.js";

/**
 * WhatsApp / FAANG-style message pipeline:
 * WRITE PATH  → MongoDB + ACK sender
 * DELIVERY    → BullMQ worker → Socket room
 * RECEIPTS    → separate receipt queue
 */
export class MessagePipelineService {
  constructor(notifier, deps = {}) {
    this.notifier = notifier ?? null;
    this.onlineChecker =
      deps.onlineChecker ?? ((receiverId) => this.isReceiverOnline(receiverId));
  }

  getNotifier() {
    return this.notifier ?? socketNotifier;
  }

  async enrichMessageDoc(messageDoc) {
    const doc = messageDoc?.toObject ? messageDoc.toObject() : messageDoc;
    if (!doc) return null;

    const senderId = toIdString(doc.senderId?._id ?? doc.senderId);
    let sender = await cacheGet(cacheKeys.senderMeta(senderId));
    if (!sender) {
      const u = await userRepository.findById(senderId);
      if (u) {
        sender = { fullName: u.fullName, profilePic: u.profilePic };
        await cacheSet(cacheKeys.senderMeta(senderId), sender, 300);
      }
    }

    return {
      ...doc,
      _id: toIdString(doc._id),
      senderId,
      receiverId: toIdString(doc.receiverId),
      senderName: sender?.fullName || "Unknown User",
      senderAvatar: sender?.profilePic || null,
      delivered: Boolean(doc.delivered),
    };
  }

  async enrichById(messageId) {
    const msg = await messageRepository.findById(messageId);
    return this.enrichMessageDoc(msg);
  }

  async sendDirectMessage(payload) {
    const { senderId, receiverId, text, image, video, file, clientMessageId } =
      payload;

    if (clientMessageId) {
      const existing = await messageRepository.findByClientMessageId(
        clientMessageId
      );
      if (existing) {
        return { message: await this.enrichMessageDoc(existing), deduplicated: true };
      }
    }

    const message = await messageRepository.create({
      senderId,
      receiverId,
      text: text ?? "",
      image: image ?? null,
      video: video ?? null,
      file: file ?? null,
      clientMessageId: clientMessageId || undefined,
    });

    const enriched = await this.enrichMessageDoc(message);
    await conversationCacheService.appendMessage(senderId, receiverId, enriched);

    this.getNotifier().emitToUser(senderId, "newMessage", enriched);
    this.getNotifier().emitToUser(senderId, "messageAck", {
      clientMessageId,
      messageId: enriched._id,
      status: isQueueInfrastructureReady() ? "queued" : "sent",
    });

    if (isQueueInfrastructureReady()) {
      try {
        await enqueueDirectMessageDelivery({
          messageId: enriched._id,
          senderId: toIdString(senderId),
          receiverId: toIdString(receiverId),
        });
        logger.debug("message enqueued", { messageId: enriched._id });
      } catch (err) {
        logger.error("enqueue failed, inline fallback", { err: err.message });
        await this.deliverToReceiver(enriched, { attempt: 0 });
      }
    } else {
      await this.deliverToReceiver(enriched, { attempt: 0 });
    }

    return { message: enriched, deduplicated: false };
  }

  async isReceiverOnline(receiverId) {
    const uid = toIdString(receiverId);
    const io = getIO();
    if (io) {
      const sockets = await io.in(userRoom(uid)).fetchSockets();
      return sockets.length > 0;
    }
    return presenceService.isOnline(uid);
  }

  async deliverToReceiver(enriched, { attempt = 0 } = {}) {
    const receiverId = toIdString(enriched.receiverId);
    const senderId = toIdString(enriched.senderId);
    const messageId = enriched._id;

    const existing = await messageRepository.findByIdLean(messageId);
    const alreadyDelivered = Boolean(existing?.delivered);
    const receiverOnline = await this.onlineChecker(receiverId);
    const maxRetries = queueConfig.offlineRetryDelaysMs.length;
    const queueReady = isQueueInfrastructureReady();

    const plan = planDelivery({
      alreadyDelivered,
      receiverOnline,
      attempt,
      maxRetries,
      queueReady,
    });

    switch (plan.action) {
      case DeliveryAction.SKIP_ALREADY_DELIVERED:
        return { delivered: true, status: "already_delivered" };

      case DeliveryAction.SCHEDULE_OFFLINE_RETRY:
        await enqueueDirectMessageDelivery({
          messageId,
          senderId,
          receiverId,
          attempt: plan.nextAttempt,
        });
        return {
          delivered: false,
          reason: "receiver_offline",
          attempt,
          status: "retry_scheduled",
        };

      case DeliveryAction.PENDING_SYNC:
        return { delivered: false, reason: "receiver_offline", attempt, status: "pending_sync" };

      case DeliveryAction.PUSH_TO_RECEIVER:
      default:
        break;
    }

    this.getNotifier().emitToUser(receiverId, "newMessage", enriched);

    const updated = await messageRepository.markDeliveredIfPending(messageId);
    if (updated) {
      if (queueReady) {
        await enqueueDeliveryReceipt({ messageId, senderId, receiverId });
      } else {
        this.getNotifier().emitToUser(senderId, "msg-delivered-update", { messageId });
      }
    }

    return { delivered: true, status: "pushed" };
  }

  async emitDeliveryReceipt({ messageId, senderId }) {
    this.getNotifier().emitToUser(senderId, "msg-delivered-update", {
      messageId: toIdString(messageId),
    });
    return { ok: true };
  }
}

export const messagePipelineService = new MessagePipelineService();
