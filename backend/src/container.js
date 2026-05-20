/**
 * Composition root — wires concrete implementations (Dependency Inversion).
 * Import services from here when you need test doubles later.
 */
import { authService } from "./services/auth.service.js";
import { userService } from "./services/user.service.js";
import { mediaService } from "./services/media.service.js";
import { messageService } from "./services/message.service.js";
import { friendService } from "./services/friend.service.js";
import { groupService } from "./services/group.service.js";
import { friendGraphService } from "./services/friendGraph.service.js";
import { messagePipelineService } from "./services/messagePipeline.service.js";
import { groupPipelineService } from "./services/groupPipeline.service.js";
import { presenceService } from "./services/presence.service.js";
import { conversationCacheService } from "./services/conversationCache.service.js";
import { socketNotifier } from "./infrastructure/realtime/SocketNotifier.js";
import { receiptService } from "./services/receipt.service.js";
import { callSignalingService } from "./services/callSignaling.service.js";
import { eventBus } from "./infrastructure/events/eventBus.js";

export const container = {
  authService,
  userService,
  mediaService,
  messageService,
  friendService,
  groupService,
  friendGraphService,
  messagePipelineService,
  groupPipelineService,
  presenceService,
  conversationCacheService,
  socketNotifier,
  receiptService,
  callSignalingService,
  eventBus,
};
