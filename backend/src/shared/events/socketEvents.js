/** Socket.IO event names — avoid magic strings across handlers and clients */

export const SOCKET_EVENTS = {
  CONNECTION_SUCCESS: "connection-success",

  SEND_MESSAGE: "sendMessage",
  MESSAGE_ERROR: "message-error",

  TYPING: "typing",

  SEND_GROUP_MESSAGE: "sendGroupMessage",

  MSG_DELIVERED: "msg-delivered",
  MSG_DELIVERED_UPDATE: "msg-delivered-update",
  MSG_SEEN: "msg-seen",
  MSG_SEEN_UPDATE: "msg-seen-update",

  JOIN_ROOM: "join-room",
  WHITEBOARD_DRAW: "whiteboard-draw",
  WHITEBOARD_CLEAR: "whiteboard-clear",
  MUSIC_SYNC: "music-sync",

  CALL_INITIATED: "call-initiated",
  CALL_ACCEPTED: "call-accepted",
  CALL_SIGNAL: "call-signal",
  CALL_ENDED: "call-ended",
  CALL_REJECTED: "call-rejected",
  CALL_FAILED: "call-failed",
  INCOMING_CALL: "incoming-call",

  WATCHPARTY_CREATE: "watchparty:create",
  WATCHPARTY_JOIN: "watchparty:join",
  WATCHPARTY_LEAVE: "watchparty:leave",
  WATCHPARTY_SYNC: "watchparty:sync",
  WATCHPARTY_REACTION: "watchparty:reaction",
  WATCHPARTY_CHAT: "watchparty:chat",
  WATCHPARTY_PING: "watchparty:ping",
  WATCHPARTY_PONG: "watchparty:pong",

  GET_ONLINE_USERS: "getOnlineUsers",
  PING: "ping",
  PONG: "pong",
};
