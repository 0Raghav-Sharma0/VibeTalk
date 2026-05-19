import { groupRepository } from "../repositories/group.repository.js";

import { socketNotifier } from "../infrastructure/realtime/SocketNotifier.js";

import { isQueueInfrastructureReady } from "../infrastructure/redis/bullConnection.js";

import { enqueueGroupFanout } from "../infrastructure/queue/enqueueDelivery.js";

import { groupRules } from "../domain/group.rules.js";

import { toIdString } from "../domain/ids.js";

import { AppError } from "../errors/AppError.js";



function enrichGroupMessage(populated) {

  const doc = populated.toObject ? populated.toObject() : populated;

  return {

    ...doc,

    _id: toIdString(doc._id),

    groupId: toIdString(doc.groupId),

    senderId: toIdString(doc.senderId?._id ?? doc.senderId),

    senderName: doc.senderId?.fullName || "Unknown",

    senderAvatar: doc.senderId?.profilePic || null,

  };

}



export class GroupPipelineService {

  constructor(notifier) {

    this.notifier = notifier ?? null;

  }



  getNotifier() {

    return this.notifier ?? socketNotifier;

  }



  async sendGroupMessage({ groupId, senderId, text, image, video, file }) {

    const group = await groupRepository.findById(groupId);

    if (!group) throw AppError.notFound("Group not found");

    if (!groupRules.isMember(group, senderId)) {

      throw AppError.forbidden("Not a member");

    }



    const msg = await groupRepository.createMessage({

      groupId,

      senderId,

      text: text ?? "",

      image: image ?? null,

      video: video ?? null,

      file: file ?? null,

    });



    const populated = await groupRepository.findMessageByIdPopulated(msg._id);

    const enriched = enrichGroupMessage(populated);

    const memberIds = group.members.map((m) =>

      toIdString(m.userId?._id ?? m.userId)

    );



    if (isQueueInfrastructureReady()) {

      try {

        await enqueueGroupFanout({

          message: enriched,

          memberIds,

          groupId: toIdString(groupId),

        });

      } catch (err) {

        console.error("❌ Group enqueue failed, sync fan-out:", err.message);

        this.fanOutToMembers(enriched, memberIds);

      }

    } else {

      this.fanOutToMembers(enriched, memberIds);

    }



    return enriched;

  }



  fanOutToMembers(enriched, memberIds) {

    this.getNotifier().emitToUsers(memberIds, "newGroupMessage", enriched);

  }

}



export const groupPipelineService = new GroupPipelineService();

