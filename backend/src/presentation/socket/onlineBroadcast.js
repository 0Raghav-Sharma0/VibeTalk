import { getIO } from "../../lib/ioHolder.js";
import { presenceService } from "../../services/presence.service.js";
import { SOCKET_EVENTS } from "../../shared/events/socketEvents.js";

let onlineBroadcastTimer = null;

/** Debounced — avoids Redis adapter spam when many tabs connect at once */
export function scheduleBroadcastOnlineUsers() {
  if (onlineBroadcastTimer) return;
  onlineBroadcastTimer = setTimeout(async () => {
    onlineBroadcastTimer = null;
    try {
      const ids = await presenceService.getOnlineUserIds();
      const io = getIO();
      if (!io) return;
      io.local.emit(SOCKET_EVENTS.GET_ONLINE_USERS, ids);
    } catch (err) {
      console.warn("broadcastOnlineUsers failed:", err.message);
    }
  }, 400);
}
