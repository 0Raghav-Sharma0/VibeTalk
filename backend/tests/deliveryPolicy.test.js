import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  planDelivery,
  DeliveryAction,
} from "../src/domain/deliveryPolicy.js";

describe("deliveryPolicy (FAANG-style pure logic)", () => {
  it("skips when already delivered (idempotent worker)", () => {
    const plan = planDelivery({
      alreadyDelivered: true,
      receiverOnline: true,
      attempt: 0,
      maxRetries: 5,
      queueReady: true,
    });
    assert.equal(plan.action, DeliveryAction.SKIP_ALREADY_DELIVERED);
  });

  it("pushes when receiver online", () => {
    const plan = planDelivery({
      alreadyDelivered: false,
      receiverOnline: true,
      attempt: 0,
      maxRetries: 5,
      queueReady: true,
    });
    assert.equal(plan.action, DeliveryAction.PUSH_TO_RECEIVER);
  });

  it("schedules offline retry when offline and retries remain", () => {
    const plan = planDelivery({
      alreadyDelivered: false,
      receiverOnline: false,
      attempt: 0,
      maxRetries: 5,
      queueReady: true,
    });
    assert.equal(plan.action, DeliveryAction.SCHEDULE_OFFLINE_RETRY);
    assert.equal(plan.nextAttempt, 1);
  });

  it("pending sync when offline and retries exhausted", () => {
    const plan = planDelivery({
      alreadyDelivered: false,
      receiverOnline: false,
      attempt: 5,
      maxRetries: 5,
      queueReady: true,
    });
    assert.equal(plan.action, DeliveryAction.PENDING_SYNC);
  });
});
