import { asyncHandler } from "../utils/asyncHandler.js";
import { container } from "../container.js";

export const getUsersForSidebar = asyncHandler(async (req, res) => {
  const users = await container.messageService.getSidebarFriends(req.user._id);
  res.status(200).json(users);
});

export const getMessages = asyncHandler(async (req, res) => {
  const result = await container.messageService.getMessages(
    req.user._id,
    req.params.id,
    {
      limit: parseInt(req.query.limit, 10) || 50,
      before: req.query.before,
      since: req.query.since,
    }
  );
  res.status(200).json(result);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await container.messageService.sendMessage(
    req.user._id,
    req.params.id,
    req.body
  );
  res.status(201).json(message);
});

export const addReaction = asyncHandler(async (req, res) => {
  const result = await container.messageService.addReaction(req.body);
  res.status(200).json(result);
});
