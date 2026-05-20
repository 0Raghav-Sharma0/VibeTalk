import { userRoom } from "../../../config/queues.js";
import { SOCKET_EVENTS } from "../../../shared/events/socketEvents.js";
import { toStr } from "../utils.js";

export function registerTypingHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.TYPING, ({ senderId, receiverId, isTyping }) => {
    if (!senderId || !receiverId) return;
    io.to(userRoom(toStr(receiverId))).emit(SOCKET_EVENTS.TYPING, {
      senderId,
      isTyping,
    });
  });
}
