import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { queueConfig, QUEUE_NAMES } from "../src/config/queue.config.js";

describe("queue configuration", () => {
  it("defines three production queues", () => {
    assert.equal(QUEUE_NAMES.MESSAGE_DELIVERY, "vibetalk-message-delivery");
    assert.equal(QUEUE_NAMES.GROUP_MESSAGE_DELIVERY, "vibetalk-group-message-delivery");
    assert.equal(QUEUE_NAMES.DELIVERY_RECEIPT, "vibetalk-delivery-receipt");
    assert.ok(!QUEUE_NAMES.MESSAGE_DELIVERY.includes(":"));
  });

  it("prioritizes direct messages over groups", () => {
    assert.ok(queueConfig.priority.directMessage < queueConfig.priority.groupMessage);
  });

  it("has worker concurrency defaults suitable for throughput", () => {
    assert.ok(queueConfig.concurrency.messageDelivery >= 10);
    assert.ok(queueConfig.offlineRetryDelaysMs.length >= 3);
  });
});
