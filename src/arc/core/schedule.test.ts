import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dueReminders, emptyPlan, fmtHm, localParts, nextTraining, normalizePlan, occurrences, parseHm, reminderMessage, toIcs, weekNumber, zonedToUtc } from "./schedule.ts";
import { dayNum, weekOf } from "./model.ts";
import type { PlanSlot, TrainingPlan } from "./schedule.ts";

const BER = "Europe/Berlin";
const slot = (p: Partial<PlanSlot>): PlanSlot => ({ id: "s1", day: 0, start: "19:00", minutes: 90, sport: "bjj", attire: "gi", label: "BJJ Gi", remind: true, ...p });
const plan = (slots: PlanSlot[], p: Partial<TrainingPlan> = {}): TrainingPlan => ({ ...emptyPlan(BER), slots, ...p });
const at = (iso: string) => Date.parse(iso);

test("schedule: times parse and print", () => {
  assert.equal(parseHm("19:30"), 1170);
  assert.equal(parseHm("7:05"), 425);
  assert.equal(parseHm("24:00"), null);
  assert.equal(parseHm("abc"), null);
  assert.equal(fmtHm(425), "07:05");
});

test("schedule: wall-clock time to instant, across summer time", () => {
  // 28 September 2026 is a Monday in summer time (UTC+2), 2 November in winter time (UTC+1).
  assert.equal(zonedToUtc("2026-09-28", 19 * 60, BER), at("2026-09-28T17:00:00Z"));
  assert.equal(zonedToUtc("2026-11-02", 19 * 60, BER), at("2026-11-02T18:00:00Z"));
  // 02:30 does not exist on 29 March 2026 in Berlin: it moves to 03:30 summer time.
  assert.equal(zonedToUtc("2026-03-29", 150, BER), at("2026-03-29T01:30:00Z"));
  assert.equal(zonedToUtc("2026-09-28", 19 * 60, "America/New_York"), at("2026-09-28T23:00:00Z"));
  assert.deepEqual(localParts(at("2026-09-28T22:30:00Z"), BER), { date: "2026-09-29", minute: 30, second: 0 });
});

test("schedule: occurrences and the next training", () => {
  const p = plan([slot({}), slot({ id: "s2", day: 2, start: "18:30", sport: "judo", attire: undefined, label: "Judo" })]);
  const week = occurrences(p, at("2026-09-28T00:00:00Z"), at("2026-10-05T00:00:00Z"));
  assert.deepEqual(
    week.map((o) => [o.date, o.slot.id]),
    [
      ["2026-09-28", "s1"],
      ["2026-09-30", "s2"],
    ],
  );
  assert.equal(nextTraining(p, at("2026-09-28T08:00:00Z"))?.date, "2026-09-28");
  // During the training it is still "the next one"; after it, Wednesday is.
  assert.equal(nextTraining(p, at("2026-09-28T18:00:00Z"))?.slot.id, "s1");
  assert.equal(nextTraining(p, at("2026-09-28T19:00:00Z"))?.slot.id, "s2");
});

test("schedule: reminders fire once, 30 minutes before, within the window", () => {
  const p = plan([slot({}), slot({ id: "quiet", day: 0, start: "20:00", remind: false })]);
  // Training Monday 19:00 Berlin = 17:00Z, reminder at 16:30Z.
  assert.equal(dueReminders(p, at("2026-09-28T16:20:00Z")).length, 0);
  assert.deepEqual(
    dueReminders(p, at("2026-09-28T16:30:00Z")).map((o) => o.slot.id),
    ["s1"],
  );
  assert.equal(dueReminders(p, at("2026-09-28T16:44:00Z")).length, 1);
  assert.equal(dueReminders(p, at("2026-09-28T16:46:00Z")).length, 0);
  // A reminder before a training shortly after midnight fires the day before.
  const late = plan([slot({ id: "night", day: 1, start: "00:15" })]);
  assert.deepEqual(
    dueReminders(late, at("2026-09-28T21:45:00Z")).map((o) => o.date),
    ["2026-09-29"],
  );
});

test("schedule: reminder text names the quest when the app left a preview", () => {
  const p = plan([slot({ place: "Gracie Barra" })], { preview: [{ key: "2026-09-28/s1", body: "Deine Quest: Armbar." }] });
  const [o] = dueReminders(p, at("2026-09-28T16:31:00Z"));
  const m = reminderMessage(p, o);
  assert.equal(m.title, "In 30 Minuten: BJJ Gi");
  assert.equal(m.body, "19:00 Uhr, Gracie Barra. Deine Quest: Armbar.");
  assert.equal(m.url, "/arc/#/matte");
  const plain = reminderMessage(plan([slot({})]), o);
  assert.match(plain.body, /Tagesquest/);
});

test("schedule: plans from storage are checked", () => {
  assert.equal(normalizePlan(null), null);
  assert.equal(normalizePlan({ slots: "x", tz: BER }), null);
  const p = normalizePlan({ slots: [slot({}), { id: "bad", day: 9, start: "19:00", sport: "bjj" }, { id: "t", day: 1, start: "25:00", sport: "bjj" }], tz: "Mars/Olympus", lead: 999 });
  assert.equal(p?.slots.length, 1);
  assert.equal(p?.tz, "UTC");
  assert.equal(p?.lead, 30);
});

test("schedule: calendar file with weekly events, alarms and the time zone", () => {
  const p = plan([slot({ title: "Fundamentals, Gi", place: "Halle 2; oben" }), slot({ id: "s2", day: 5, start: "10:00", remind: false, label: "Open Mat" })]);
  const ics = toIcs(p, at("2026-09-25T10:00:00Z"), "https://rukawaanalytics.com/arc/");
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.match(ics, /DTSTART;TZID=Europe\/Berlin:20260928T190000/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=SA/);
  assert.equal((ics.match(/BEGIN:VALARM/g) ?? []).length, 1);
  assert.match(ics, /TRIGGER:-PT30M/);
  assert.match(ics, /LOCATION:Halle 2\\; oben/);
  // Berlin changes on the last Sunday of March and October.
  assert.match(ics, /BEGIN:DAYLIGHT\r\nDTSTART:20260329T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU/);
  assert.match(ics, /BEGIN:STANDARD\r\nDTSTART:20261025T030000\r\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU/);
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  // New York: second Sunday in March, first in November.
  const ny = toIcs({ ...p, tz: "America/New_York" }, at("2026-09-25T10:00:00Z"), "x");
  assert.match(ny, /BYMONTH=3;BYDAY=2SU/);
  assert.match(ny, /BYMONTH=11;BYDAY=1SU/);
  assert.match(toIcs({ ...p, tz: "Asia/Tokyo" }, at("2026-09-25T10:00:00Z"), "x"), /TZOFFSETFROM:\+0900\r\nTZOFFSETTO:\+0900/);
});

test("schedule: week numbers match the app's paused weeks", () => {
  for (const iso of ["2026-09-27", "2026-09-28", "2026-10-04", "2027-01-01", "2026-03-29"]) assert.equal(weekNumber(iso), weekOf(dayNum(iso)), iso);
  assert.equal(weekNumber("2026-09-28"), weekNumber("2026-10-04"));
  assert.equal(weekNumber("2026-09-27") + 1, weekNumber("2026-09-28"));
});

test("schedule: the Edge Function uses the same file", () => {
  const src = readFileSync(new URL("./schedule.ts", import.meta.url), "utf8");
  const copy = readFileSync(new URL("../../../supabase/functions/_shared/schedule.ts", import.meta.url), "utf8");
  assert.equal(copy, src, "copy src/arc/core/schedule.ts to supabase/functions/_shared/schedule.ts");
});
