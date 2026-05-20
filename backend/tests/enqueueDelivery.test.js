import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  messageDeliveryJobId,
  groupDeliveryJobId,
  receiptJobId,
} from "../src/infrastructure/queue/enqueueDelivery.js";

describe("BullMQ job IDs (production-safe)", () => {
  it("direct message job id has no colon", () => {
    const id = messageDeliveryJobId("507f1f77bcf86cd799439011");
    assert.equal(id, "msg-507f1f77bcf86cd799439011");
    assert.ok(!id.includes(":"));
  });

  it("group job id has no colon", () => {
    const id = groupDeliveryJobId("abc");
    assert.equal(id, "gmsg-abc");
    assert.ok(!id.includes(":"));
  });

  it("receipt job id has no colon", () => {
    const id = receiptJobId("xyz");
    assert.equal(id, "receipt-xyz");
    assert.ok(!id.includes(":"));
  });
});
