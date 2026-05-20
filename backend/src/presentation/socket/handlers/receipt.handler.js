import { receiptService } from "../../../services/receipt.service.js";
import { SOCKET_EVENTS } from "../../../shared/events/socketEvents.js";

export function registerReceiptHandlers(socket) {
  socket.on(SOCKET_EVENTS.MSG_DELIVERED, async ({ messageId, receiverId }) => {
    try {
      const result = await receiptService.markDelivered({ messageId, receiverId });
      if (result.ok) {
        socket.emit(SOCKET_EVENTS.MSG_DELIVERED_UPDATE, { messageId });
        console.log(`✅ Message delivered: ${messageId}`);
      }
    } catch (err) {
      console.error("❌ msg-delivered error:", err);
    }
  });

  socket.on(SOCKET_EVENTS.MSG_SEEN, async ({ myId, friendId }) => {
    try {
      const result = await receiptService.markSeen({ myId, friendId });
      if (result.ok) {
        console.log(`👀 Messages seen by: ${myId}`);
      }
    } catch (err) {
      console.error("❌ msg-seen error:", err);
    }
  });
}
