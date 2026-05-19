import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSendMessage } from "../src/shared/validation/sendMessage.schema.js";

describe("sendMessageSchema", () => {
  it("accepts minimal valid payload", () => {
    const r = parseSendMessage({
      senderId: "a",
      receiverId: "b",
      text: "hi",
    });
    assert.equal(r.success, true);
  });

  it("rejects missing receiver", () => {
    const r = parseSendMessage({ senderId: "a" });
    assert.equal(r.success, false);
  });
});
