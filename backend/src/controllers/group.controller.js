import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { getIO, getReceiverSocketId } from "../lib/socket.js";
import { cacheGet, cacheSet, cacheKeys } from "../lib/cache.js";

const toStr = (id) => (id?.toString?.() || String(id || ""));

const isMember = (group, userId) =>
  group.members.some((m) => toStr(m.userId) === toStr(userId));

const isAdmin = (group, userId) =>
  group.members.some(
    (m) => toStr(m.userId) === toStr(userId) && m.role === "admin"
  );

/* -------------------------------------------------------------------------- */
/* Create Group                                                               */
/* -------------------------------------------------------------------------- */
export const createGroup = async (req, res) => {
  try {
    const myId = req.user._id;
    const { name, memberIds } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const members = [{ userId: myId, role: "admin" }];
    const addedIds = new Set([toStr(myId)]);

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const friendIds = await getFriendIds(myId);
      for (const id of memberIds) {
        const sid = toStr(id);
        if (!addedIds.has(sid) && friendIds.has(sid)) {
          members.push({ userId: id, role: "member" });
          addedIds.add(sid);
        }
      }
    }

    const group = await Group.create({
      name: name.trim(),
      createdBy: myId,
      members,
    });

    const populated = await Group.findById(group._id)
      .populate("members.userId", "fullName profilePic")
      .populate("createdBy", "fullName profilePic");

    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ createGroup:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const FRIEND_IDS_CACHE_TTL = 180; // 3 min

async function getFriendIds(userId) {
  const cacheKey = cacheKeys.friendIds(userId);
  const cached = await cacheGet(cacheKey);
  if (cached) return new Set(cached);

  const accepted = await FriendRequest.find({
    status: "accepted",
    $or: [{ fromUser: userId }, { toUser: userId }],
  }).lean();

  const ids = new Set();
  for (const r of accepted) {
    ids.add(toStr(r.fromUser));
    ids.add(toStr(r.toUser));
  }
  ids.delete(toStr(userId));
  await cacheSet(cacheKey, [...ids], FRIEND_IDS_CACHE_TTL);
  return ids;
}

/* -------------------------------------------------------------------------- */
/* Get My Groups                                                              */
/* -------------------------------------------------------------------------- */
export const getMyGroups = async (req, res) => {
  try {
    const myId = req.user._id;

    const groups = await Group.find({
      "members.userId": myId,
    })
      .populate("members.userId", "fullName profilePic")
      .populate("createdBy", "fullName profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("❌ getMyGroups:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Get Group Messages                                                         */
/* -------------------------------------------------------------------------- */
export const getGroupMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!isMember(group, myId)) return res.status(403).json({ error: "Not a member" });

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const sorted = messages.reverse();

    const enriched = sorted.map((m) => ({
      ...m,
      _id: m._id.toString(),
      senderName: m.senderId?.fullName || "Unknown",
      senderAvatar: m.senderId?.profilePic || null,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error("❌ getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Send Group Message                                                         */
/* -------------------------------------------------------------------------- */
export const sendGroupMessage = async (req, res) => {
  try {
    const myId = req.user._id;
    const { groupId } = req.params;
    const { text, image, video } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!isMember(group, myId)) return res.status(403).json({ error: "Not a member" });

    const msg = await GroupMessage.create({
      groupId,
      senderId: myId,
      text: text || "",
      image: image || null,
      video: video || null,
    });

    const populated = await GroupMessage.findById(msg._id)
      .populate("senderId", "fullName profilePic");

    const enriched = {
      ...populated.toObject(),
      senderName: populated.senderId?.fullName || "Unknown",
      senderAvatar: populated.senderId?.profilePic || null,
    };

    for (const m of group.members) {
      const sid = getReceiverSocketId(toStr(m.userId));
      if (sid) {
        getIO().to(sid).emit("newGroupMessage", enriched);
      }
    }

    res.status(201).json(enriched);
  } catch (error) {
    console.error("❌ sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Add Member (admin only)                                                    */
/* -------------------------------------------------------------------------- */
export const addMember = async (req, res) => {
  try {
    const myId = req.user._id;
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!isAdmin(group, myId)) return res.status(403).json({ error: "Admin only" });

    const friendIds = await getFriendIds(myId);
    if (!friendIds.has(toStr(userId))) {
      return res.status(400).json({ error: "Can only add friends" });
    }
    if (isMember(group, userId)) {
      return res.status(400).json({ error: "Already in group" });
    }

    group.members.push({ userId, role: "member" });
    await group.save();

    const populated = await Group.findById(groupId)
      .populate("members.userId", "fullName profilePic")
      .populate("createdBy", "fullName profilePic");

    for (const m of populated.members) {
      const sid = getReceiverSocketId(toStr(m.userId?._id || m.userId));
      if (sid) getIO().to(sid).emit("group-updated", { group: populated });
    }

    res.status(200).json(populated);
  } catch (error) {
    console.error("❌ addMember:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Remove Member (admin only, or self)                                        */
/* -------------------------------------------------------------------------- */
export const removeMember = async (req, res) => {
  try {
    const myId = req.user._id;
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const removingSelf = toStr(userId) === toStr(myId);
    if (removingSelf) {
      group.members = group.members.filter((m) => toStr(m.userId) !== toStr(myId));
    } else {
      if (!isAdmin(group, myId)) return res.status(403).json({ error: "Admin only" });
      group.members = group.members.filter((m) => toStr(m.userId) !== toStr(userId));
    }

    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ success: true, deleted: true });
    }

    if (!removingSelf && isAdmin(group, userId)) {
      const firstAdmin = group.members.find((m) => m.role === "admin");
      if (!firstAdmin) {
        group.members[0].role = "admin";
      }
    }

    await group.save();

    const populated = await Group.findById(groupId)
      .populate("members.userId", "fullName profilePic")
      .populate("createdBy", "fullName profilePic");

    const targetSocket = getReceiverSocketId(toStr(userId));
    if (targetSocket) {
      getIO().to(targetSocket).emit("group-updated", { group: populated, removed: true });
    }

    res.status(200).json(populated);
  } catch (error) {
    console.error("❌ removeMember:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* Leave Group                                                                */
/* -------------------------------------------------------------------------- */
export const leaveGroup = async (req, res) => {
  try {
    const myId = req.user._id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!isMember(group, myId)) return res.status(403).json({ error: "Not a member" });

    group.members = group.members.filter((m) => toStr(m.userId) !== toStr(myId));

    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ success: true, deleted: true });
    }

    const wasAdmin = isAdmin(group, myId);
    if (wasAdmin) {
      const hasAdmin = group.members.some((m) => m.role === "admin");
      if (!hasAdmin) {
        group.members[0].role = "admin";
      }
    }

    await group.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ leaveGroup:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
