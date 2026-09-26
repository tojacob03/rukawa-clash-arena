// Headwear of the countries: every country has one, the ones you come from
// are yours at once, and a guest training abroad unlocks that country's.
import { test } from "node:test";
import assert from "node:assert/strict";
import { COUNTRIES } from "./countries.ts";
import { HAT_STYLES, OWN_HAT, hatOf } from "./headwear.ts";
import { dynamicItem, inventory } from "./items.ts";
import { compute } from "./model.ts";
import { emptySave } from "./records.ts";
import type { ArcData, Session } from "./types.ts";

const HEX = /^#[0-9a-f]{6}$/i;

test("every country has headwear, drawn in a known style with valid colours", () => {
  for (const { code } of COUNTRIES) {
    const h = hatOf(code);
    assert.ok(h, code);
    assert.ok(HAT_STYLES.includes(h.style), `${code} ${h.style}`);
    assert.ok(h.name.trim() && h.desc.trim(), code);
    for (const c of [h.c, h.c2, h.c3, ...(h.cs ?? [])].filter(Boolean)) assert.match(c!, HEX, `${code} ${c}`);
  }
  assert.equal(hatOf("XX"), null);
});

test("countries without their own headwear get a headband in at least two flag colours", () => {
  for (const { code } of COUNTRIES) {
    if (OWN_HAT.has(code)) continue;
    const h = hatOf(code)!;
    assert.equal(h.style, "band", code);
    assert.ok(h.fallback, code);
    assert.ok((h.cs?.length ?? 0) >= 2 && h.cs!.length <= 4, `${code} ${h.cs}`);
    for (let i = 1; i < h.cs!.length; i++) assert.notEqual(h.cs![i], h.cs![i - 1], code);
  }
  // Most countries get their own headwear, not the fallback.
  assert.ok(OWN_HAT.size >= 90, `${OWN_HAT.size}`);
  for (const code of OWN_HAT) assert.ok(COUNTRIES.some((c) => c.code === code), `${code} is not a country`);
});

test("headwear items resolve from their id alone, for friends' avatars", () => {
  const x = dynamicItem("hat:MX");
  assert.equal(x?.slot, "head");
  assert.equal(x?.art.style, "sombrero");
  assert.equal(dynamicItem("hat:nope"), undefined);
});

const today = "2026-09-20";
const base = (): ArcData => ({
  ...emptySave(),
  profile: { name: "T", belt: "weiss", stripes: 0, startBelt: "weiss", weeklyGoal: 2, createdAt: "2026-01-01", countries: ["DE"] },
});
const session = (date: string, guest?: Session["guest"]): Session => ({
  id: date,
  date,
  format: "class",
  attire: "gi",
  taught: null,
  rolls: [],
  quest: null,
  worked: null,
  stuck: null,
  createdAt: 1,
  guest,
});

test("your own countries' headwear is yours from the start", () => {
  const d = base();
  const own = inventory(d, compute(d, today));
  assert.ok(own.has("hat:DE"));
  assert.ok(!own.has("hat:BR"));
});

test("a guest training or a visit entered by hand unlocks that country's headwear", () => {
  const d = { ...base(), sessions: [session("2026-09-10", { gym: "Alliance", country: "BR" })], visits: [{ id: "v1", gym: "Carlson Gracie", country: "JP", date: "2019-05-01", createdAt: 1 }] };
  const own = inventory(d, compute(d, today));
  assert.ok(own.has("hat:BR"));
  assert.ok(own.has("hat:JP"));
  assert.match(own.get("hat:BR")!.via, /Brasilien/);
  assert.equal(own.get("hat:JP")!.date, "2019-05-01");
  // Not before the visit happened.
  const early = inventory(d, compute(d, "2026-09-01"));
  assert.ok(!early.has("hat:BR"));
});
