import { userRoom } from "../../../config/queues.js";
import { presenceService } from "../../../services/presence.service.js";
import { callSignalingService } from "../../../services/callSignaling.service.js";
import { SOCKET_EVENTS } from "../../../shared/events/socketEvents.js";
import { toStr } from "../utils.js";

export function registerCallHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.CALL_INITIATED, async (data) => {
    const { from, to, callType, callerName } = data ?? {};
    if (!from || !to || !callType) return;

    if (!callSignalingService.tryAcquire(from, to)) {
      console.log("⛔ Call already in progress, ignoring");
      return;
    }

    const online = await presenceService.isOnline(to);
    if (!online) {
      console.log(`❌ User ${to} is offline, cannot initiate call`);
      callSignalingService.release(from, to);
      socket.emit(SOCKET_EVENTS.CALL_FAILED, { reason: "User is offline" });
      return;
    }

    console.log(`📞 Call initiated: ${from} -> ${to} (${callType})`);
    const callKey = callSignalingService.callKey(from, to);

    io.to(userRoom(toStr(to))).emit(SOCKET_EVENTS.INCOMING_CALL, {
      from,
      callerName,
      callType,
      callKey,
    });
  });

  socket.on(SOCKET_EVENTS.CALL_ACCEPTED, ({ to, by }) => {
    if (!to || !by) return;
    console.log(`✅ Call accepted: ${by} → ${to}`);
    io.to(userRoom(toStr(to))).emit(SOCKET_EVENTS.CALL_ACCEPTED, { by });
  });

  socket.on(SOCKET_EVENTS.CALL_SIGNAL, ({ to, from, data, callType }) => {
    if (!to || !data) {
      console.error("❌ Invalid call-signal", { to, hasData: !!data });
      return;
    }
    console.log(`📡 Forwarding signal ${data.type} from ${from} → ${to}`);
    io.to(userRoom(toStr(to))).emit(SOCKET_EVENTS.CALL_SIGNAL, {
      from,
      data,
      callType,
    });
  });

  socket.on(SOCKET_EVENTS.CALL_ENDED, ({ to }) => {
    if (!to) return;
    console.log(`📞 Call ended: ${socket.userId} → ${to}`);
    callSignalingService.release(socket.userId, to);
    io.to(userRoom(toStr(to))).emit(SOCKET_EVENTS.CALL_ENDED, {
      by: socket.userId,
    });
  });

  socket.on(SOCKET_EVENTS.CALL_REJECTED, ({ callerId }) => {
    if (!callerId) return;
    console.log(`❌ Call rejected by ${socket.userId}, caller: ${callerId}`);
    callSignalingService.release(callerId, socket.userId);
    io.to(userRoom(toStr(callerId))).emit(SOCKET_EVENTS.CALL_REJECTED, {
      by: socket.userId,
    });
  });
}
