import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CallSignalingService } from "../src/services/callSignaling.service.js";

describe("CallSignalingService", () => {
  let svc;

  beforeEach(() => {
    svc = new CallSignalingService();
  });

  it("tryAcquire blocks duplicate and reverse direction", () => {
    assert.equal(svc.tryAcquire("a", "b"), true);
    assert.equal(svc.tryAcquire("a", "b"), false);
    assert.equal(svc.tryAcquire("b", "a"), false);
  });

  it("release clears both keys", () => {
    svc.tryAcquire("a", "b");
    svc.release("a", "b");
    assert.equal(svc.tryAcquire("b", "a"), true);
  });

  it("releaseAllForUser clears user calls", () => {
    svc.tryAcquire("a", "b");
    svc.tryAcquire("c", "a");
    svc.releaseAllForUser("a");
    assert.equal(svc.isInProgress("a", "b"), false);
    assert.equal(svc.isInProgress("c", "a"), false);
  });
});
