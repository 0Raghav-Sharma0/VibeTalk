import { groupRepository } from "../repositories/group.repository.js";
import { friendGraphService } from "./friendGraph.service.js";
import { socketNotifier } from "../infrastructure/realtime/SocketNotifier.js";
import { groupRules } from "../domain/group.rules.js";
import { toIdString } from "../domain/ids.js";
import { AppError } from "../errors/AppError.js";

function enrichGroupMessage(msg) {
  const doc = msg.toObject ? msg.toObject() : msg;
  return {
    ...doc,
    _id: toIdString(doc._id),
    senderName: doc.senderId?.fullName || "Unknown",
    senderAvatar: doc.senderId?.profilePic || null,
  };
}

function memberIdsFromGroup(group) {
  return group.members.map((m) => toIdString(m.userId?._id ?? m.userId));
}

export class GroupService {
  constructor(notifier) {
    this.notifier = notifier ?? null;
  }

  getNotifier() {
    return this.notifier ?? socketNotifier;
  }

  async createGroup(creatorId, { name, memberIds }) {
    if (!name?.trim()) throw AppError.badRequest("Group name is required");

    const members = [{ userId: creatorId, role: "admin" }];
    const added = new Set([toIdString(creatorId)]);

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const friendIds = await friendGraphService.getFriendIdSet(creatorId);
      for (const id of memberIds) {
        const sid = toIdString(id);
        if (!added.has(sid) && friendIds.has(sid)) {
          members.push({ userId: id, role: "member" });
          added.add(sid);
        }
      }
    }

    const group = await groupRepository.create({
      name: name.trim(),
      createdBy: creatorId,
      members,
    });

    const populated = await groupRepository.findByIdPopulated(group._id);
    this.getNotifier().emitToUsers(memberIdsFromGroup(populated), "group-updated", {
      group: populated,
    });

    return populated;
  }

  getMyGroups(userId) {
    return groupRepository.findForUser(userId);
  }

  async getGroupMessages(userId, groupId, limit = 100) {
    const group = await groupRepository.findById(groupId);
    if (!group) throw AppError.notFound("Group not found");
    if (!groupRules.isMember(group, userId)) {
      throw AppError.forbidden("Not a member");
    }

    const pageSize = Math.min(limit, 200);
    const messages = await groupRepository.findMessages(groupId, pageSize);
    return messages.reverse().map((m) => ({
      ...m,
      _id: toIdString(m._id),
      senderName: m.senderId?.fullName || "Unknown",
      senderAvatar: m.senderId?.profilePic || null,
    }));
  }

  async sendGroupMessage(userId, groupId, payload) {
    const { groupPipelineService } = await import("./groupPipeline.service.js");
    return groupPipelineService.sendGroupMessage({
      groupId,
      senderId: userId,
      ...payload,
    });
  }

  async addMember(adminId, groupId, userId) {
    const group = await groupRepository.findById(groupId);
    if (!group) throw AppError.notFound("Group not found");
    if (!groupRules.isAdmin(group, adminId)) {
      throw AppError.forbidden("Admin only");
    }

    const friendIds = await friendGraphService.getFriendIdSet(adminId);
    if (!friendIds.has(toIdString(userId))) {
      throw AppError.badRequest("Can only add friends");
    }
    if (groupRules.isMember(group, userId)) {
      throw AppError.badRequest("Already in group");
    }

    group.members.push({ userId, role: "member" });
    await groupRepository.save(group);

    const populated = await groupRepository.findByIdPopulated(groupId);
    this.getNotifier().emitToUsers(memberIdsFromGroup(populated), "group-updated", {
      group: populated,
    });
    return populated;
  }

  async removeMember(actorId, groupId, targetUserId) {
    const group = await groupRepository.findById(groupId);
    if (!group) throw AppError.notFound("Group not found");

    const removingSelf = toIdString(targetUserId) === toIdString(actorId);

    if (removingSelf) {
      group.members = group.members.filter(
        (m) => toIdString(m.userId) !== toIdString(actorId)
      );
    } else {
      if (!groupRules.isAdmin(group, actorId)) {
        throw AppError.forbidden("Admin only");
      }
      group.members = group.members.filter(
        (m) => toIdString(m.userId) !== toIdString(targetUserId)
      );
    }

    if (group.members.length === 0) {
      await groupRepository.deleteById(groupId);
      return { success: true, deleted: true };
    }

    if (!removingSelf && groupRules.isAdmin(group, targetUserId)) {
      const hasAdmin = group.members.some((m) => m.role === "admin");
      if (!hasAdmin) group.members[0].role = "admin";
    }

    await groupRepository.save(group);
    const populated = await groupRepository.findByIdPopulated(groupId);

    this.getNotifier().emitToUser(targetUserId, "group-updated", {
      group: populated,
      removed: true,
    });

    return populated;
  }

  async leaveGroup(userId, groupId) {
    return this.removeMember(userId, groupId, userId);
  }
}

export const groupService = new GroupService();
