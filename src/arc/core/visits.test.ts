// The mat passport: gyms visited before and guest trainings since are one list
// of stamps, one per gym, however it was typed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanGuest, knownGyms, stamps, visitedCountries } from "./visits.ts";
import { emptySave, fromRecords, toRecords } from "./records.ts";
import type { ArcData, Session } from "./types.ts";

const s = (id: string, date: string, guest?: Session["guest"]): Session => ({ id, date, format: "class", attire: "gi", taught: null, rolls: [], quest: null, worked: null, stuck: null, createdAt: 1, guest });

test("a guest gym needs a name and a known country", () => {
  assert.equal(cleanGuest({ gym: "  ", country: "BR" }), null);
  assert.equal(cleanGuest({ gym: "Alliance", country: "XX" }), null);
  assert.equal(cleanGuest({ gym: "--", country: "BR" }), null);
  assert.deepEqual(cleanGuest({ gym: "  Alliance   HQ ", country: "BR", city: " São Paulo " }), { gym: "Alliance HQ", country: "BR", city: "São Paulo" });
});

test("the same gym from a visit by hand and from guest trainings is one stamp", () => {
  const d: ArcData = {
    ...emptySave(),
    visits: [{ id: "v1", gym: "Alliance HQ", country: "BR", date: "2018-02-01", createdAt: 1 }],
    sessions: [s("a", "2026-03-01", { gym: "alliance hq", country: "BR" }), s("b", "2026-04-01", { gym: "Alliánce  HQ", country: "BR", city: "São Paulo" }), s("c", "2026-04-02"), s("d", "2026-05-01", { gym: "Alliance HQ", country: "PT" })],
  };
  const list = stamps(d);
  assert.equal(list.length, 2);
  const br = list.find((x) => x.country === "BR")!;
  assert.equal(br.first, "2018-02-01");
  assert.equal(br.last, "2026-04-01");
  assert.equal(br.times, 3);
  assert.equal(br.city, "São Paulo");
  assert.deepEqual(br.manual, ["v1"]);
  assert.deepEqual([...visitedCountries(d).keys()].sort(), ["BR", "PT"]);
  assert.deepEqual([...visitedCountries(d, "2020-01-01").keys()], ["BR"]);
  assert.equal(knownGyms(d)[0].country, "PT");
});

test("visits by hand sync with the root record, guest gyms with their session", () => {
  const d: ArcData = { ...emptySave(), visits: [{ id: "v1", gym: "Alliance HQ", country: "BR", date: "2018-02-01", createdAt: 1 }], sessions: [s("a", "2026-03-01", { gym: "Tri-Force", country: "NL" })] };
  const recs = toRecords(d);
  assert.deepEqual((recs.get("root/main")!.data as ArcData).visits, d.visits);
  assert.deepEqual((recs.get("session/a")!.data as Session).guest, { gym: "Tri-Force", country: "NL" });
  assert.deepEqual(stamps(fromRecords(recs)), stamps(d));
});

test("broken entries from another device are skipped, not fatal", () => {
  const d = { ...emptySave(), visits: [null, { id: 3, gym: 5, country: "BR", date: "x" }, { id: "ok", gym: "Gym", country: "BR", date: "2020-01-01", createdAt: 1 }] } as unknown as ArcData;
  assert.equal(stamps(d).length, 1);
});
