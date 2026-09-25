// Cloud save: records, three-way merge and the first sign-in on a device.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDemo } from "./demo.ts";
import {
  applyRemote,
  canon,
  combine,
  dataFromRows,
  emptySave,
  emptySyncState,
  firstSync,
  fromRecords,
  markPushed,
  merge3,
  pendingPush,
  recKey,
  safeId,
  stateFromRows,
  toRecords,
} from "./records.ts";
import type { PushRow, RemoteRow, SyncState } from "./records.ts";
import type { ArcData, Session } from "./types.ts";

const TODAY = "2026-09-24";

const sess = (id: string, date: string, extra: Partial<Session> = {}): Session => ({
  id,
  date,
  format: "class",
  attire: "gi",
  taught: null,
  rolls: [],
  quest: null,
  worked: null,
  stuck: null,
  createdAt: Date.parse(date),
  ...extra,
});

const save = (name: string, sessions: Session[] = []): ArcData => ({
  ...emptySave(),
  profile: { name, belt: "blau", stripes: 1, startBelt: "blau", weeklyGoal: 2, createdAt: "2026-09-01" },
  onboarding: { date: "2026-09-01", known: ["g_closed"] },
  sessions,
  character: {
    look: {} as never,
    equipped: {},
    mode: "gi",
    seen: ["start_gi"],
  },
});

/** In-memory server with the same semantics as arc_pull / arc_push. */
function server() {
  let rev = 0;
  const rows = new Map<string, RemoteRow>();
  return {
    pull(since: number): RemoteRow[] {
      return [...rows.values()].filter((r) => r.rev > since).sort((a, b) => a.rev - b.rev);
    },
    push(batch: PushRow[]) {
      for (const p of batch) rows.set(recKey(p.kind, p.id), { kind: p.kind, id: p.id, data: p.deleted ? null : p.data ?? null, deleted: p.deleted, rev: ++rev });
    },
    rows,
  };
}

/** A device: local data plus sync state, syncing like the app does (pull, then push). */
function device(data: ArcData, state: SyncState = emptySyncState()) {
  const d = { data, state };
  return {
    get data() {
      return d.data;
    },
    set data(x: ArcData) {
      d.data = x;
    },
    sync(s: ReturnType<typeof server>) {
      const r = applyRemote(d.data, d.state, s.pull(d.state.cursor));
      d.data = r.data;
      d.state = r.state;
      const out = pendingPush(d.data, d.state);
      s.push(out);
      d.state = markPushed(d.state, out);
    },
  };
}

const recordsOf = (d: ArcData) => [...toRecords(d).entries()].map(([k, r]) => [k, canon(r.data)]).sort();

test("records: a save survives the round trip, demo flag excluded", () => {
  const demo = buildDemo(TODAY);
  const back = fromRecords(toRecords(demo));
  assert.equal(back.demo, undefined);
  assert.deepEqual(recordsOf(back), recordsOf(demo));
  assert.equal(back.sessions.length, demo.sessions.length);
  assert.equal(back.promotions.length, demo.promotions.length);
});

test("records: canonical JSON ignores key order and undefined fields", () => {
  assert.equal(canon({ b: 1, a: { d: 2, c: undefined } }), canon({ a: { d: 2 }, b: 1 }));
  assert.notEqual(canon({ a: [1, 2] }), canon({ a: [2, 1] }));
});

test("records: ids the server would reject are made safe", () => {
  assert.equal(safeId("a b/c"), "a_b_c");
  assert.equal(safeId(""), "_");
  assert.equal(safeId("x".repeat(100)).length, 80);
  assert.match(safeId("2026-09-01.blau.2"), /^[A-Za-z0-9._:-]+$/);
});

test("sync: a second device gets everything, edits on both sides converge", () => {
  const s = server();
  const a = device(save("Kai", [sess("s1", "2026-09-10"), sess("s2", "2026-09-12")]));
  a.sync(s);

  // A new device: full pull.
  const rows = s.pull(0);
  const b = device(dataFromRows(rows), stateFromRows(rows));
  assert.equal(b.data.sessions.length, 2);
  assert.equal(b.data.profile?.name, "Kai");

  // A deletes a session and renames; B logs a session and changes the weekly goal.
  a.data = { ...a.data, sessions: a.data.sessions.filter((x) => x.id !== "s1"), profile: { ...a.data.profile!, name: "Kai R." } };
  b.data = { ...b.data, sessions: [...b.data.sessions, sess("s3", "2026-09-14")], profile: { ...b.data.profile!, weeklyGoal: 3 } };
  a.sync(s);
  b.sync(s);
  a.sync(s);

  for (const d of [a.data, b.data]) {
    assert.deepEqual(
      d.sessions.map((x) => x.id),
      ["s2", "s3"],
    );
    assert.equal(d.profile?.name, "Kai R.");
    assert.equal(d.profile?.weeklyGoal, 3);
  }
  assert.deepEqual(recordsOf(a.data), recordsOf(b.data));
});

test("sync: the same field changed on both devices ends the same everywhere", () => {
  const s = server();
  const a = device(save("Kai"));
  a.sync(s);
  const rows = s.pull(0);
  const b = device(dataFromRows(rows), stateFromRows(rows));
  a.data = { ...a.data, profile: { ...a.data.profile!, name: "Von A" } };
  b.data = { ...b.data, profile: { ...b.data.profile!, name: "Von B" } };
  a.sync(s);
  b.sync(s);
  a.sync(s);
  assert.equal(a.data.profile?.name, b.data.profile?.name);
  assert.deepEqual(recordsOf(a.data), recordsOf(b.data));
});

test("sync: seen items and pause weeks merge like sets", () => {
  const s = server();
  const a = device({ ...save("Kai"), pauses: [100, 101] });
  a.sync(s);
  const rows = s.pull(0);
  const b = device(dataFromRows(rows), stateFromRows(rows));
  a.data = { ...a.data, character: { ...a.data.character!, seen: [...a.data.character!.seen, "item_a"] }, pauses: [100] };
  b.data = { ...b.data, character: { ...b.data.character!, seen: [...b.data.character!.seen, "item_b"] }, pauses: [100, 101, 102] };
  a.sync(s);
  b.sync(s);
  a.sync(s);
  for (const d of [a.data, b.data]) {
    assert.deepEqual([...d.character!.seen].sort(), ["item_a", "item_b", "start_gi"]);
    assert.deepEqual([...d.pauses].sort(), [100, 102]);
  }
});

test("sync: an edit elsewhere beats a deletion here, in both orders", () => {
  for (const order of ["delete-first", "edit-first"]) {
    const s = server();
    const a = device(save("Kai", [sess("s1", "2026-09-10")]));
    a.sync(s);
    const rows = s.pull(0);
    const b = device(dataFromRows(rows), stateFromRows(rows));
    a.data = { ...a.data, sessions: [] };
    b.data = { ...b.data, sessions: [{ ...b.data.sessions[0], worked: "g_scissor" }] };
    if (order === "delete-first") {
      a.sync(s);
      b.sync(s);
    } else {
      b.sync(s);
      a.sync(s);
    }
    a.sync(s);
    b.sync(s);
    for (const d of [a.data, b.data]) {
      assert.equal(d.sessions.length, 1, order);
      assert.equal(d.sessions[0].worked, "g_scissor", order);
    }
  }
});

test("sync: nothing to push after a clean sync, deletions become tombstones", () => {
  const s = server();
  const a = device(save("Kai", [sess("s1", "2026-09-10")]));
  a.sync(s);
  const st = { cursor: 0, base: Object.fromEntries([...toRecords(a.data)].map(([k, r]) => [k, canon(r.data)])) };
  assert.deepEqual(pendingPush(a.data, st), []);
  const push = pendingPush({ ...a.data, sessions: [] }, st);
  assert.deepEqual(push, [{ kind: "session", id: "s1", deleted: true }]);
});

test("sync: the root record goes first, so a new device never sees sessions without a profile", () => {
  const push = pendingPush(save("Kai", [sess("s1", "2026-09-10")]), emptySyncState());
  assert.equal(push[0].kind, "root");
});

test("merge3: fields changed on one side win, nested objects merge", () => {
  const base = { profile: { name: "A", weeklyGoal: 2 }, ui: {} };
  const mine = { profile: { name: "B", weeklyGoal: 2 }, ui: {} };
  const theirs = { profile: { name: "A", weeklyGoal: 4 }, ui: { rerollDay: "2026-09-20" } };
  assert.deepEqual(merge3(base, mine, theirs), { profile: { name: "B", weeklyGoal: 4 }, ui: { rerollDay: "2026-09-20" } });
});

test("first sign-in: adopt, take the account, or ask", () => {
  const empty = emptySave();
  const mine = save("Gerät", [sess("d1", "2026-09-01")]);
  const account = save("Konto", [sess("r1", "2026-08-01")]);
  assert.equal(firstSync(mine, empty), "adopt");
  assert.equal(firstSync(empty, account), "remote");
  assert.equal(firstSync({ ...buildDemo(TODAY) }, account), "remote");
  assert.equal(firstSync(mine, account), "ask");
  assert.equal(firstSync(null, empty), "empty");

  const merged = combine(mine, account, "merge");
  assert.equal(merged.profile?.name, "Konto");
  assert.deepEqual(merged.sessions.map((x) => x.id).sort(), ["d1", "r1"]);
  assert.equal(combine(mine, account, "account").profile?.name, "Konto");
  assert.equal(combine(mine, account, "device").profile?.name, "Gerät");

  // Keeping the device's data replaces the account's: the account's sessions become tombstones.
  const s = server();
  const acc = device(account);
  acc.sync(s);
  const rows = s.pull(0);
  const dev = device(combine(mine, dataFromRows(rows), "device"), stateFromRows(rows));
  dev.sync(s);
  const after = dataFromRows(s.pull(0));
  assert.deepEqual(after.sessions.map((x) => x.id), ["d1"]);
  assert.equal(after.profile?.name, "Gerät");
});
