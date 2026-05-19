import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ReceiptService } from "../src/services/receipt.service.js";
import { SOCKET_EVENTS } from "../src/shared/events/socketEvents.js";

describe("ReceiptService", () => {
  let repo;
  let notifier;
  let service;

  beforeEach(() => {
    repo = {
      markDelivered: async (id) => ({ _id: id, delivered: true }),
      markSeenForConversation: async () => ({ modifiedCount: 2 }),
    };
    notifier = { events: [], emitToUser(userId, event, payload) {
      this.events.push({ userId: String(userId), event, payload });
    }};
    service = new ReceiptService({
      messageRepository: repo,
      notifier,
    });
  });

  it("markDelivered updates repo and notifies receiver", async () => {
    const result = await service.markDelivered({
      messageId: "msg1",
      receiverId: "userA",
    });
    assert.equal(result.ok, true);
    assert.equal(notifier.events.length, 1);
    assert.equal(notifier.events[0].event, SOCKET_EVENTS.MSG_DELIVERED_UPDATE);
    assert.equal(notifier.events[0].userId, "userA");
  });

  it("markSeen updates conversation and notifies peer", async () => {
    const result = await service.markSeen({ myId: "me", friendId: "friend" });
    assert.equal(result.ok, true);
    assert.equal(notifier.events[0].event, SOCKET_EVENTS.MSG_SEEN_UPDATE);
    assert.equal(notifier.events[0].payload.by, "me");
  });
});
