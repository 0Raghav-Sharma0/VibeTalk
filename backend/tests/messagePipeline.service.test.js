import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MessagePipelineService } from "../src/services/messagePipeline.service.js";

class RecordingNotifier {
  constructor() {
    this.events = [];
  }
  emitToUser(userId, event, payload) {
    this.events.push({ userId: String(userId), event, payload });
  }
  emitToUsers() {}
  broadcast() {}
}

describe("MessagePipelineService (injectable)", () => {
  let notifier;
  let service;

  beforeEach(() => {
    notifier = new RecordingNotifier();
    service = new MessagePipelineService(notifier, {
      onlineChecker: async () => true,
    });
  });

  it("emitDeliveryReceipt notifies sender", async () => {
    await service.emitDeliveryReceipt({
      messageId: "507f1f77bcf86cd799439011",
      senderId: "sender1",
    });
    assert.equal(notifier.events.length, 1);
    assert.equal(notifier.events[0].event, "msg-delivered-update");
    assert.equal(notifier.events[0].userId, "sender1");
  });

  it("getNotifier uses injected instance", () => {
    assert.equal(service.getNotifier(), notifier);
  });
});
