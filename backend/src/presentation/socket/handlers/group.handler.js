import { groupPipelineService } from "../../../services/groupPipeline.service.js";
import { SOCKET_EVENTS } from "../../../shared/events/socketEvents.js";
import { assertSocketSender } from "../utils.js";

export function registerGroupHandlers(socket) {
  socket.on(SOCKET_EVENTS.SEND_GROUP_MESSAGE, async (data) => {
    try {
      const { groupId, senderId, text, image, video, file } = data ?? {};
      if (!groupId || !senderId) return;
      if (!assertSocketSender(socket, senderId)) return;

      await groupPipelineService.sendGroupMessage({
        groupId,
        senderId,
        text,
        image,
        video,
        file,
      });
    } catch (err) {
      console.error("❌ sendGroupMessage error:", err);
    }
  });
}
