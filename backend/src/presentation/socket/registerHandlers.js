import { registerMessagingHandlers } from "./handlers/messaging.handler.js";
import { registerTypingHandlers } from "./handlers/typing.handler.js";
import { registerGroupHandlers } from "./handlers/group.handler.js";
import { registerReceiptHandlers } from "./handlers/receipt.handler.js";
import { registerMediaRoomHandlers } from "./handlers/mediaRoom.handler.js";
import { registerCallHandlers } from "./handlers/call.handler.js";
import { registerWatchPartyHandlers } from "./handlers/watchParty.handler.js";
import { SOCKET_EVENTS } from "../../shared/events/socketEvents.js";

/**
 * Thin presentation layer: socket event → validate → service.
 * Business logic lives in application services, not here.
 */
export function registerSocketHandlers(io, socket) {
  registerMessagingHandlers(socket);
  registerTypingHandlers(io, socket);
  registerGroupHandlers(socket);
  registerReceiptHandlers(socket);
  registerMediaRoomHandlers(io, socket);
  registerCallHandlers(io, socket);
  registerWatchPartyHandlers(socket);

  socket.on(SOCKET_EVENTS.PING, () => {
    socket.emit(SOCKET_EVENTS.PONG, { timestamp: Date.now() });
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message);
  });
}
