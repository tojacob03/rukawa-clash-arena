// Social cards: building your own, checking other people's.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCard, cleanCode, crewWeek, gearItems, gymDay, parseInvite, readCard, readSnapshot, safeGear, safeLook, sharedSlots, weekOf } from "./social.ts";
import type { Peer, SocialCard } from "./social.ts";
import { DEFAULT_LOOK } from "../avatarOptions.ts";
import { weekNumber } from "./schedule.ts";
import type { TrainingPlan } from "./schedule.ts";

const TODAY = "2026-09-24"; // a Thursday

const mine = () =>
  buildCard({
    belt: "blau",
    stripes: 2,
    lvl: 14,
    ru: 131.46,
    streak: 5,
    weekNow: 2,
    weekGoal: 3,
    bounty: 1_250_000,
    cls: "anker",
    sea: "frost",
    island: 7,
    progress: 0.4567,
    ship: "Nebelkrähe",
    sail: "#3a6ee8",
    flag: { bg: 1, fg: 1, emblem: 2, cross: 3, head: 0 },
    look: { ...DEFAULT_LOOK, hair: 4 },
    mode: "nogi",
    equipped: { gi: "gi_weiss", patch1: "flag:DE", top: "rg_rang" },
    today: TODAY,
  });

test("social: own card survives the round trip through the checks", () => {
  const c = mine();
  assert.equal(c.pl, 1315);
  assert.equal(c.progress, 0.46);
  assert.equal(c.wk, weekNumber(TODAY));
  const back = readCard(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(back, c);
  // The gear draws: known items and the flag patch.
  const items = gearItems(c.gear);
  assert.equal(items.patch1?.id, "flag:DE");
  assert.equal(items.gi?.id, "gi_weiss");
});

test("social: foreign cards cannot smuggle in odd values", () => {
  const evil = readCard({
    belt: "blau",
    stripes: 99,
    lvl: -4,
    pl: "9000",
    sea: "__proto__",
    island: 500,
    progress: 7,
    ship: "Kahn‮\u0000 der Rache",
    sail: "url(https://x.test/a.png)",
    flag: { bg: 99, emblem: -1 },
    look: { skin: 400, skinHex: "red;background:url(x)", hair: 2.6, marks: ["blush", "constructor", 5], eyeColor2: -9 },
    gear: { gi: "constructor", patch1: "flag:__proto__", patch2: "tokui:toString", top: "gi_weiss", head: "" },
    cls: "hasOwnProperty",
  })!;
  assert.equal(evil.stripes, 4);
  assert.equal(evil.lvl, 1);
  assert.equal(evil.pl, 0);
  assert.equal(evil.sea, "morgen");
  assert.ok(evil.island < 30);
  assert.equal(evil.progress, 1);
  assert.equal(evil.ship, "Kahn der Rache");
  assert.equal(evil.sail, "#f1bf57");
  assert.equal(evil.flag.bg, 0);
  assert.equal(evil.look.skinHex, undefined);
  assert.ok((evil.look.skin ?? 0) < 20);
  assert.equal(evil.look.hair, 3);
  assert.deepEqual(evil.look.marks, ["blush"]);
  assert.equal(evil.look.eyeColor2, -1);
  assert.equal(evil.cls, null);
  // Unknown items and items in the wrong slot are dropped, an empty slot stays empty.
  assert.deepEqual(evil.gear, { head: "" });
  assert.equal(readCard({ belt: "rot" }), null);
  assert.equal(readCard(null), null);
});

test("social: look and gear checks keep what is valid", () => {
  const l = safeLook({ ...DEFAULT_LOOK, hairHex: "#AABBCC", neckTattoo: true });
  assert.equal(l.hairHex, "#AABBCC");
  assert.equal(l.neckTattoo, true);
  assert.deepEqual(safeGear({ patch3: "tokui:armbar_guard" }), {});
  assert.deepEqual(safeGear([1, 2]), {});
});

test("social: snapshot drops broken entries and keeps the rest", () => {
  const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const s = readSnapshot({
    me: { id: id(1), code: "ABCD-EFGH", name: "  Kai ", share_times: true },
    friends: [{ id: id(2), name: "Anna", card: mine(), slots: [{ day: 3, start: "18:30", minutes: 90, sport: "bjj" }, { day: 9, start: "25:00", sport: "bjj" }] }, { id: "nope", name: "x" }, "junk"],
    incoming: [{ id: id(3), name: "", card: null, slots: null }],
    outgoing: [{ id: id(4), name: "Ben", at: "2026-09-20T10:00:00Z" }],
    crew: { id: id(9), name: "Strohhüte", flag: { bg: 2 }, code: "WXYZ-2345", captain: true, members: [{ id: id(1), name: "Kai", captain: true }] },
    gym: null,
  });
  assert.deepEqual(s.me, { id: id(1), code: "ABCD-EFGH", name: "Kai", shareTimes: true });
  assert.equal(s.friends.length, 1);
  assert.deepEqual(s.friends[0].slots, [{ day: 3, start: "18:30", minutes: 90, sport: "bjj" }]);
  assert.equal(s.incoming[0].name, "Unbenannt");
  assert.equal(s.outgoing[0].name, "Ben");
  assert.equal(s.crew?.flag.bg, 2);
  assert.equal(s.crew?.members[0].captain, true);
  assert.equal(s.gym, null);
  assert.deepEqual(readSnapshot({ me: null }).me, null);
});

test("social: shared times leave titles and places at home", () => {
  const plan = {
    tz: "Europe/Berlin",
    lead: 30,
    push: false,
    email: false,
    slots: [
      { id: "b", day: 3, start: "18:30", minutes: 90, sport: "bjj", title: "Fundamentals", place: "Halle 2", label: "Fundamentals", remind: true },
      { id: "a", day: 0, start: "07:00", minutes: 60, sport: "kraft", label: "Kraft", remind: false },
    ],
  } as TrainingPlan;
  assert.deepEqual(sharedSlots(plan), [
    { day: 0, start: "07:00", minutes: 60, sport: "kraft" },
    { day: 3, start: "18:30", minutes: 90, sport: "bjj" },
  ]);
  assert.deepEqual(sharedSlots(null), []);
});

const peer = (id: string, name: string, card: Partial<SocialCard> | null, slots: Peer["slots"] = null): Peer => ({
  id,
  name,
  card: card ? { ...mine(), ...card } : null,
  slots,
  updated: null,
});

test("social: crew week counts this week only, capped at each goal", () => {
  const wk = weekNumber(TODAY);
  const m = [peer("a", "A", { week: 5, goal: 3, wk }), peer("b", "B", { week: 1, goal: 2, wk }), peer("c", "C", { week: 4, goal: 4, wk: wk - 1 }), peer("d", "D", null)];
  assert.deepEqual(crewWeek(m, TODAY), { done: 4, goal: 9, met: 1, of: 4 });
  assert.equal(weekOf(m[2].card, TODAY), 0);
});

test("social: gym day groups people by start time", () => {
  const thu = [{ day: 3 as const, start: "18:30", minutes: 90, sport: "bjj" }];
  const m = [peer("a", "Anna", {}, thu), peer("b", "Ben", {}, [...thu, { day: 3, start: "07:00", minutes: 60, sport: "bjj" }]), peer("me", "Kai", {}, thu), peer("c", "Cem", {}, [{ day: 4, start: "18:30", minutes: 90, sport: "bjj" }])];
  assert.deepEqual(gymDay(m, TODAY, "me"), [
    { start: "07:00", sport: "bjj", names: ["Ben"] },
    { start: "18:30", sport: "bjj", names: ["Anna", "Ben"] },
  ]);
});

test("social: codes and invitations", () => {
  assert.equal(cleanCode("abcd efgh"), "ABCD-EFGH");
  assert.equal(cleanCode(" wxyz-2345 "), "WXYZ-2345");
  assert.equal(cleanCode("ABCD-EFG0"), null, "0 is not in the alphabet");
  assert.equal(cleanCode("ABC"), null);
  assert.deepEqual(parseInvite("c-wxyz2345"), { kind: "c", code: "WXYZ-2345" });
  assert.deepEqual(parseInvite("G-ABCD-EFGH"), { kind: "g", code: "ABCD-EFGH" });
  assert.equal(parseInvite("x-ABCD-EFGH"), null);
  assert.equal(parseInvite(null), null);
});
