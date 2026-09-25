// App-side helpers for the weekly plan: labels, the stored plan, and the
// quest preview that lets a server reminder name the quest.

import type { ArcData, ArcState, Attire, SportId } from "./core/types.ts";
import { emptyPlan, normalizePlan, occurrences, weekdayOf } from "./core/schedule.ts";
import type { PlanSlot, QuestPreview, TrainingPlan } from "./core/schedule.ts";
import { SPORT } from "./core/sports.ts";
import { TECH } from "./core/techniques.ts";
import { pickCards } from "./core/model.ts";
import { questTask } from "./questText.ts";

export function localTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export const getPlan = (d: ArcData): TrainingPlan => normalizePlan(d.plan) ?? emptyPlan(localTz());

export const sportName = (sport: string) => (sport === "bjj" ? "BJJ" : SPORT[sport as SportId]?.name ?? sport);

export function slotLabel(s: Pick<PlanSlot, "sport" | "attire" | "title">) {
  const t = s.title?.trim();
  if (t) return t;
  if (s.sport === "bjj") return s.attire === "gi" ? "BJJ Gi" : s.attire === "nogi" ? "BJJ No-Gi" : "BJJ";
  return sportName(s.sport);
}

/** Gi or No-Gi from the plan, when today has exactly that kind of BJJ training. */
export function plannedAttire(data: ArcData, day: string): Attire | null {
  const wd = weekdayOf(day);
  const kinds = new Set(getPlan(data).slots.filter((s) => s.day === wd && s.sport === "bjj" && s.attire).map((s) => s.attire as Attire));
  return kinds.size === 1 ? [...kinds][0] : null;
}

const orList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} oder ${xs[xs.length - 1]}`);

/** Quest lines for the BJJ trainings of the next seven days. */
export function buildPreview(data: ArcData, st: ArcState, plan: TrainingPlan, now: number): QuestPreview[] {
  const last: Attire = [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.attire ?? "gi";
  const out: QuestPreview[] = [];
  for (const o of occurrences(plan, now, now + 7 * 24 * 3600_000)) {
    if (o.slot.sport !== "bjj" || !o.slot.remind) continue;
    const acc = data.ui.accepted?.day === o.date ? data.ui.accepted : null;
    let body: string;
    if (acc && TECH[acc.node]) body = `Deine Quest: ${TECH[acc.node].name}. ${questTask(acc)}`;
    else {
      const cards = pickCards(st.offers, { attire: o.slot.attire ?? last }).map((c) => TECH[c.node]?.name).filter(Boolean);
      body = cards.length ? `Zieh deine Karte: ${orList(cards)}.` : "Zieh vor dem Training deine Tagesquest.";
    }
    out.push({ key: `${o.date}/${o.slot.id}`, body: body.slice(0, 220) });
  }
  return out;
}

/** Download the plan as a calendar file. */
export function downloadIcs(ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "waza-arc-training.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
