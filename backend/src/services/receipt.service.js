import { messageRepository } from "../repositories/message.repository.js";
import { socketNotifier } from "../infrastructure/realtime/SocketNotifier.js";
import { toIdString } from "../domain/ids.js";
import { SOCKET_EVENTS } from "../shared/events/socketEvents.js";
import { eventBus } from "../infrastructure/events/eventBus.js";
import { DOMAIN_EVENTS } from "../infrastructure/events/eventTypes.js";

/**
 * Delivery / read receipts — moved out of socket handlers (repository layer).
 */
export class ReceiptService {
  constructor(deps = {}) {
    this.messageRepository = deps.messageRepository ?? messageRepository;
    this.notifier = deps.notifier ?? socketNotifier;
  }

  async markDelivered({ messageId, receiverId }) {
    if (!messageId) return { ok: false, reason: "missing_message_id" };

    await this.messageRepository.markDelivered(messageId);

    const notifyUserId = toIdString(receiverId);
    if (notifyUserId) {
      this.notifier.emitToUser(notifyUserId, SOCKET_EVENTS.MSG_DELIVERED_UPDATE, {
        messageId,
      });
    }

    eventBus.publish(DOMAIN_EVENTS.MESSAGE_DELIVERED, { messageId, receiverId });
    return { ok: true, messageId, notifyUserId };
  }

  async markSeen({ myId, friendId }) {
    if (!myId || !friendId) return { ok: false, reason: "missing_ids" };

    await this.messageRepository.markSeenForConversation({
      viewerId: myId,
      peerId: friendId,
    });

    const peerId = toIdString(friendId);
    this.notifier.emitToUser(peerId, SOCKET_EVENTS.MSG_SEEN_UPDATE, {
      by: toIdString(myId),
    });

    eventBus.publish(DOMAIN_EVENTS.MESSAGE_SEEN, { viewerId: myId, peerId: friendId });
    return { ok: true, peerId };
  }
}

export const receiptService = new ReceiptService();
