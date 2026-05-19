import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normId, upsertMessage } from "../../frontend/src/utils/messageHelpers.js";

describe("client message merge (WhatsApp-style dedup)", () => {
  it("normId stringifies object ids", () => {
    assert.equal(normId({ _id: "abc" }), "abc");
    assert.equal(normId("abc"), "abc");
  });

  it("upsert replaces by clientMessageId", () => {
    const list = [
      {
        _id: "temp-1",
        clientMessageId: "c1",
        text: "hi",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const server = {
      _id: "mongo-id",
      clientMessageId: "c1",
      text: "hi",
      createdAt: "2026-01-01T00:00:01.000Z",
    };
    const next = upsertMessage(list, server);
    assert.equal(next.length, 1);
    assert.equal(next[0]._id, "mongo-id");
  });

  it("keeps chronological order", () => {
    const a = { _id: "1", createdAt: "2026-01-01T00:00:00.000Z" };
    const b = { _id: "2", createdAt: "2026-01-01T00:00:02.000Z" };
    const next = upsertMessage([b], a);
    assert.equal(next[0]._id, "1");
    assert.equal(next[1]._id, "2");
  });
});
