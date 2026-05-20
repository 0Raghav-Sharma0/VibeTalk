import { invalidateFriendCache } from "../lib/cache.js";
import { friendRepository } from "../repositories/friend.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { socketNotifier } from "../infrastructure/realtime/SocketNotifier.js";
import { AppError } from "../errors/AppError.js";
import { escapeRegex, toIdString } from "../domain/ids.js";

export class FriendService {
  constructor(notifier) {
    this.notifier = notifier ?? null;
  }

  getNotifier() {
    return this.notifier ?? socketNotifier;
  }

  async sendRequest(fromUserId, username) {
    if (!username?.trim()) throw AppError.badRequest("Username is required");

    const targetUser = await userRepository.findByFullNameExact(
      username,
      fromUserId
    );
    if (!targetUser) throw AppError.notFound("User not found");
    if (toIdString(targetUser._id) === toIdString(fromUserId)) {
      throw AppError.badRequest("You cannot add yourself");
    }

    const existing = await friendRepository.findBetweenUsers(
      fromUserId,
      targetUser._id
    );

    if (existing?.status === "accepted") {
      throw AppError.badRequest("Already friends");
    }
    if (existing?.status === "pending") {
      throw AppError.badRequest("Request already pending");
    }

    let request;
    if (existing) {
      request = await friendRepository.updateById(existing._id, {
        fromUser: fromUserId,
        toUser: targetUser._id,
        status: "pending",
      });
    } else {
      const created = await friendRepository.create({
        fromUser: fromUserId,
        toUser: targetUser._id,
        status: "pending",
      });
      request = await friendRepository.findByIdPopulated(created._id);
    }

    this.getNotifier().emitToUser(targetUser._id, "friend-request-received", {
      request: {
        _id: request._id,
        fromUser: request.fromUser,
        toUser: request.toUser,
        status: request.status,
      },
    });

    return request;
  }

  async acceptRequest(requestId, userId) {
    const request = await friendRepository.findPendingToUser(requestId, userId);
    if (!request) {
      throw AppError.notFound("Request not found or already handled");
    }

    request.status = "accepted";
    await request.save();

    const fromUserId = toIdString(request.fromUser?._id ?? request.fromUser);
    await invalidateFriendCache(userId, fromUserId);

    const populated = await friendRepository.findByIdPopulated(request._id);
    this.getNotifier().emitToUser(fromUserId, "friend-request-accepted", {
      request: populated,
    });

    return request;
  }

  async rejectRequest(requestId, userId) {
    const request = await friendRepository.rejectPending(requestId, userId);
    if (!request) {
      throw AppError.notFound("Request not found or already handled");
    }

    this.getNotifier().emitToUser(
      request.fromUser._id,
      "friend-request-rejected",
      { requestId }
    );

    return { success: true };
  }

  async removeFriend(userId, friendId) {
    const request = await friendRepository.unfriend(userId, friendId);
    if (!request) throw AppError.notFound("Not friends with this user");

    await invalidateFriendCache(userId, friendId);

    const otherId =
      toIdString(request.fromUser) === toIdString(userId)
        ? toIdString(request.toUser)
        : toIdString(request.fromUser);

    this.getNotifier().emitToUser(otherId, "friend-removed", {
      by: toIdString(userId),
    });

    return { success: true };
  }

  async getPending(userId) {
    const [incoming, outgoing] = await Promise.all([
      friendRepository.findPendingIncoming(userId),
      friendRepository.findPendingOutgoing(userId),
    ]);
    return { incoming, outgoing };
  }

  async searchByUsername(userId, username) {
    if (!username?.trim()) throw AppError.badRequest("Username is required");

    const targetUser = await userRepository.findByFullNameExact(username, userId);
    if (!targetUser) throw AppError.notFound("User not found");

    const existing = await friendRepository.findBetweenUsers(userId, targetUser._id);

    if (existing?.status === "accepted") {
      throw AppError.badRequest("Already friends");
    }
    if (existing?.status === "pending") {
      const isOutgoing = toIdString(existing.fromUser) === toIdString(userId);
      return {
        user: targetUser,
        status: isOutgoing ? "pending_outgoing" : "pending_incoming",
      };
    }

    return { user: targetUser, status: "can_add" };
  }
}

export const friendService = new FriendService();
