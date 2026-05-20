import { SOCKET_EVENTS } from "../../../shared/events/socketEvents.js";

export function registerMediaRoomHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
    if (roomId) {
      socket.join(roomId);
      console.log(`🎨 User joined room: ${roomId}`);
    }
  });

  socket.on(SOCKET_EVENTS.WHITEBOARD_DRAW, (payload) => {
    if (!payload?.roomId) return;
    socket.to(payload.roomId).emit(SOCKET_EVENTS.WHITEBOARD_DRAW, payload);
  });

  socket.on(SOCKET_EVENTS.WHITEBOARD_CLEAR, ({ roomId }) => {
    if (roomId) io.to(roomId).emit(SOCKET_EVENTS.WHITEBOARD_CLEAR);
  });

  socket.on(SOCKET_EVENTS.MUSIC_SYNC, (payload) => {
    if (!payload?.roomId) return;
    socket.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_SYNC, payload);
  });
}
