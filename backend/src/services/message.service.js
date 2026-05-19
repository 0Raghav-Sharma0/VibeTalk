import { cacheGet, cacheSet, cacheKeys } from "../lib/cache.js";
import { messageRepository } from "../repositories/message.repository.js";
import { friendRepository } from "../repositories/friend.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { socketNotifier } from "../infrastructure/realtime/SocketNotifier.js";
import { messagePipelineService } from "./messagePipeline.service.js";
import { AppError } from "../errors/AppError.js";
import { toIdString } from "../domain/ids.js";

const SIDEBAR_CACHE_TTL = 60;

export class MessageService {
  constructor(notifier) {
    this.notifier = notifier ?? null;
  }

  getNotifier() {
    return this.notifier ?? socketNotifier;
  }

  async getSidebarFriends(loggedInUserId) {
    const cacheKey = cacheKeys.sidebarUsers(loggedInUserId);
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const accepted = await friendRepository.findAcceptedForUser(loggedInUserId);
    const friendIds = friendRepository.extractFriendIds(accepted, loggedInUserId);
    const users = await userRepository.findByIdsLean(friendIds);
    const lastByPeer = await messageRepository.findLastMessageAtByPeers(
      loggedInUserId,
      friendIds
    );

    const serialized = users.map((u) => {
      const id = toIdString(u._id);
      const lastMessageAt = lastByPeer.get(id);
      return {
        ...u,
        _id: id,
        lastMessageAt: lastMessageAt ? new Date(lastMessageAt).toISOString() : null,
      };
    });

    await cacheSet(cacheKey, serialized, SIDEBAR_CACHE_TTL);
    return serialized;
  }

  async getMessages(userId, peerId, { limit = 50, before, since } = {}) {
    const pageSize = Math.min(limit, 100);

    if (since) {
      const messages = await messageRepository.findConversationPage({
        userId,
        peerId,
        limit: pageSize,
        since,
      });
      return {
        messages,
        hasMore: false,
        nextCursor: null,
        sync: true,
      };
    }

    const messages = await messageRepository.findConversationPage({
      userId,
      peerId,
      limit: pageSize,
      before,
    });

    const hasMore = messages.length > pageSize;
    const result = hasMore ? messages.slice(0, pageSize) : messages;

    return {
      messages: result.reverse(),
      hasMore,
      nextCursor: hasMore ? toIdString(result[0]?._id) : null,
    };
  }

  /** REST send — uses async message pipeline (queue → worker → socket) */
  async sendMessage(senderId, receiverId, body) {
    const { message } = await messagePipelineService.sendDirectMessage({
      senderId,
      receiverId,
      ...body,
    });
    return message;
  }

  async addReaction({ messageId, userId, emoji }) {
    if (!messageId || !userId || !emoji) {
      throw AppError.badRequest("Missing required fields");
    }

    const message = await messageRepository.findById(messageId);
    if (!message) throw AppError.notFound("Message not found");

    message.reactions = message.reactions.filter(
      (r) => toIdString(r.userId) !== toIdString(userId)
    );
    message.reactions.push({ userId, emoji });
    await message.save();

    this.getNotifier().broadcast("reactionUpdated", {
      messageId,
      reactions: message.reactions,
    });

    return { success: true, reactions: message.reactions };
  }
}

export const messageService = new MessageService();
