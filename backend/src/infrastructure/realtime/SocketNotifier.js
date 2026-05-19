import { toIdString } from "../../domain/ids.js";
import { realtimeEmitToUser, realtimeEmitToUsers } from "./realtimeBus.js";
import { getIO } from "../../lib/ioHolder.js";

/**
 * Real-time notifier — works on API nodes (Socket.IO server) and worker pods (Redis emitter).
 */
export class SocketNotifier {
  emitToUser(userId, event, payload) {
    if (!realtimeEmitToUser(userId, event, payload)) {
      console.warn(`realtime emit skipped (no bus): ${event}`);
    }
  }

  emitToUsers(userIds, event, payload) {
    realtimeEmitToUsers(userIds, event, payload);
  }

  broadcast(event, payload) {
    const io = getIO();
    if (io) {
      io.emit(event, payload);
    }
  }
}

export const socketNotifier = new SocketNotifier();
