import { userRoom } from "../../config/queues.js";
import { getIO, setIO } from "../../lib/ioHolder.js";
import { presenceService } from "../../services/presence.service.js";
import { callSignalingService } from "../../services/callSignaling.service.js";
import { handleDisconnect as handleWatchPartyDisconnect } from "../../controllers/watchPartyController.js";
import { SOCKET_EVENTS } from "../../shared/events/socketEvents.js";
import { scheduleBroadcastOnlineUsers } from "./onlineBroadcast.js";
import { registerSocketHandlers } from "./registerHandlers.js";
import { toStr } from "./utils.js";

async function countSocketsInUserRoom(uid) {
  try {
    const sockets = await getIO().in(userRoom(uid)).fetchSockets();
    return sockets.length;
  } catch {
    return 0;
  }
}

export function attachConnectionHandler(io) {
  setIO(io);

  io.on("connection", async (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    const userId = socket.userId;
    const username = socket.username;
    console.log(`👤 Socket user: ${username} (${userId})`);

    if (userId) {
      const uid = toStr(userId);
      await socket.join(userRoom(uid));
      const connections = await countSocketsInUserRoom(uid);
      if (connections === 1) {
        await presenceService.setOnline(uid);
      }
      console.log(
        `✅ User Online: ${uid} -> ${socket.id} (room ${userRoom(uid)}, sockets=${connections})`
      );
    }

    socket.emit(SOCKET_EVENTS.CONNECTION_SUCCESS, {
      socketId: socket.id,
      message: "Connected to server successfully",
    });

    scheduleBroadcastOnlineUsers();
    registerSocketHandlers(io, socket);

    socket.on("disconnect", async (reason) => {
      console.log("🔴 Socket disconnected:", socket.id, "Reason:", reason);

      const uid = socket.userId ? toStr(socket.userId) : "";
      if (uid) {
        const remaining = await countSocketsInUserRoom(uid);
        if (remaining === 0) {
          console.log(`👤 User Offline: ${uid}`);
          await presenceService.setOffline(uid);
          callSignalingService.releaseAllForUser(uid);
        }
      }

      handleWatchPartyDisconnect(socket);
      scheduleBroadcastOnlineUsers();
    });
  });
}
