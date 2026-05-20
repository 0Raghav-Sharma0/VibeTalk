/** Breaks circular imports between socket.js and services that emit events */

let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

export function getIOSafe() {
  return io;
}

export function getSocketClientCount() {
  if (!io?.engine) return 0;
  return io.engine.clientsCount ?? 0;
}
