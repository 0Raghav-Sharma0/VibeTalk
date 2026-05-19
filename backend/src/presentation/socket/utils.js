export function toStr(id) {
  return id != null ? String(id) : "";
}

export function assertSocketSender(socket, senderId) {
  return toStr(senderId) === toStr(socket.userId);
}
