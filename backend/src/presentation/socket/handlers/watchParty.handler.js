import {
  createRoom,
  joinRoom,
  leaveRoom,
  syncPlayback,
  sendReaction,
  sendChatMessage,
} from "../../../controllers/watchPartyController.js";
import { SOCKET_EVENTS } from "../../../shared/events/socketEvents.js";

export function registerWatchPartyHandlers(socket) {
  socket.on(SOCKET_EVENTS.WATCHPARTY_CREATE, (data) => {
    console.log(`🎬 Creating watch party room:`, data);
    createRoom(socket, data);
  });

  socket.on(SOCKET_EVENTS.WATCHPARTY_JOIN, (data) => {
    console.log(`🎬 User joining watch party:`, data);
    joinRoom(socket, data);
  });

  socket.on(SOCKET_EVENTS.WATCHPARTY_LEAVE, (data) => {
    console.log(`🎬 User leaving watch party:`, data);
    leaveRoom(socket, data);
  });

  socket.on(SOCKET_EVENTS.WATCHPARTY_SYNC, (data) => {
    console.log(`⏯️ Playback sync:`, data);
    syncPlayback(socket, data);
  });

  socket.on(SOCKET_EVENTS.WATCHPARTY_REACTION, (data) => {
    console.log(`❤️ Reaction:`, data);
    sendReaction(socket, data);
  });

  socket.on(SOCKET_EVENTS.WATCHPARTY_CHAT, (data) => {
    console.log(`💬 Watch party chat:`, data);
    sendChatMessage(socket, data);
  });

  socket.on(SOCKET_EVENTS.WATCHPARTY_PING, () => {
    socket.emit(SOCKET_EVENTS.WATCHPARTY_PONG, { timestamp: Date.now() });
  });
}
