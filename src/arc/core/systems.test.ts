// The five progress systems: each answers one question and says whether it can fall.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SYSTEM, SYSTEMS } from "./systems.ts";

test("five systems, each with its own kanji and one question", () => {
  assert.equal(SYSTEMS.length, 5);
  assert.equal(new Set(SYSTEMS.map((s) => s.id)).size, 5);
  assert.equal(new Set(SYSTEMS.map((s) => s.kanji)).size, 5);
  for (const s of SYSTEMS) {
    assert.ok(s.question.endsWith("?"), s.id);
    assert.ok(s.grows && s.falls && s.home, s.id);
    assert.equal(SYSTEM[s.id], s);
  }
});
