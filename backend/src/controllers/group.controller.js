import { asyncHandler } from "../utils/asyncHandler.js";
import { container } from "../container.js";

export const createGroup = asyncHandler(async (req, res) => {
  const group = await container.groupService.createGroup(req.user._id, req.body);
  res.status(201).json(group);
});

export const getMyGroups = asyncHandler(async (req, res) => {
  const groups = await container.groupService.getMyGroups(req.user._id);
  res.status(200).json(groups);
});

export const getGroupMessages = asyncHandler(async (req, res) => {
  const messages = await container.groupService.getGroupMessages(
    req.user._id,
    req.params.groupId,
    parseInt(req.query.limit, 10) || 100
  );
  res.status(200).json(messages);
});

export const sendGroupMessage = asyncHandler(async (req, res) => {
  const message = await container.groupService.sendGroupMessage(
    req.user._id,
    req.params.groupId,
    req.body
  );
  res.status(201).json(message);
});

export const addMember = asyncHandler(async (req, res) => {
  const group = await container.groupService.addMember(
    req.user._id,
    req.params.groupId,
    req.body.userId
  );
  res.status(200).json(group);
});

export const removeMember = asyncHandler(async (req, res) => {
  const result = await container.groupService.removeMember(
    req.user._id,
    req.params.groupId,
    req.params.userId
  );
  res.status(200).json(result);
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const result = await container.groupService.leaveGroup(
    req.user._id,
    req.params.groupId
  );
  res.status(200).json(result);
});
