import { asyncHandler } from "../utils/asyncHandler.js";
import { container } from "../container.js";

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const request = await container.friendService.sendRequest(
    req.user._id,
    req.body.username
  );
  res.status(201).json(request);
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const request = await container.friendService.acceptRequest(
    req.params.requestId,
    req.user._id
  );
  res.status(200).json(request);
});

export const rejectFriendRequest = asyncHandler(async (req, res) => {
  const result = await container.friendService.rejectRequest(
    req.params.requestId,
    req.user._id
  );
  res.status(200).json(result);
});

export const removeFriend = asyncHandler(async (req, res) => {
  const result = await container.friendService.removeFriend(
    req.user._id,
    req.params.friendId
  );
  res.status(200).json(result);
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const data = await container.friendService.getPending(req.user._id);
  res.status(200).json(data);
});

export const searchUserByUsername = asyncHandler(async (req, res) => {
  const data = await container.friendService.searchByUsername(
    req.user._id,
    req.query.username
  );
  res.status(200).json(data);
});
