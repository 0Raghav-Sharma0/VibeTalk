import { messagePipelineService } from "../../../services/messagePipeline.service.js";
import { SOCKET_EVENTS } from "../../../shared/events/socketEvents.js";
import { parseSendMessage } from "../../../shared/validation/sendMessage.schema.js";
import { assertSocketSender } from "../utils.js";

export function registerMessagingHandlers(socket) {
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
    try {
      const parsed = parseSendMessage(data);
      if (!parsed.success) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
          error: parsed.error.issues[0]?.message ?? "Invalid message payload",
          clientMessageId: data?.clientMessageId,
        });
        return;
      }

      const {
        senderId,
        receiverId,
        text,
        image,
        video,
        file,
        clientMessageId,
      } = parsed.data;

      if (!assertSocketSender(socket, senderId)) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: "Unauthorized sender" });
        return;
      }

      await messagePipelineService.sendDirectMessage({
        senderId,
        receiverId,
        text,
        image,
        video,
        file,
        clientMessageId,
      });
    } catch (err) {
      console.error("❌ sendMessage error:", err);
      socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, {
        error: err.message || "Failed to send message",
        clientMessageId: data?.clientMessageId,
      });
    }
  });
}
