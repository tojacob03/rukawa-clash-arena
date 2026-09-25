// Rows for the chapter end: what a training, competition or other sport moved.

import { Blossom } from "./components/Blossom.tsx";
import { Award, Flame, Gauge, HeartPulse, Swords, TrendingDown, TrendingUp } from "lucide-react";
import type { ArcState, Competition } from "./core/types.ts";
import type { Diff } from "./core/model.ts";
import type { ChapterRow } from "./components/ChapterEnd.tsx";
import { TECH } from "./core/techniques.ts";
import { LEVELS, SEALS } from "./core/lore.ts";
import { BODY } from "./core/sports.ts";
import { signed } from "./format.ts";
import { LvlStep } from "./components/ui.tsx";

const icon = 20;

function common(D: Diff, after: ArcState): ChapterRow[] {
  const rows: ChapterRow[] = [];
  if (D.weekGoal) {
    rows.push({
      key: "week",
      icon: <Flame size={icon} aria-hidden="true" />,
      text: (
        <>
          Wochenziel erreicht, die Flamme wächst <LvlStep from={D.streakFrom} to={D.streakTo} label="Flamme" />
        </>
      ),
    });
  }
  const ups = D.levels.filter((l) => l.to > l.from);
  for (const l of ups) {
    rows.push({
      key: `lv-${l.id}`,
      icon: <Blossom level={l.to} size={icon} />,
      text: (
        <>
          {l.to === 5 ? "Neue Tokui-Waza: " : ""}
          {TECH[l.id].name}, jetzt {LEVELS[l.to]} <LvlStep from={l.from} to={l.to} label="Stufe" />
        </>
      ),
    });
  }
  for (const l of D.dataLevels.filter((x) => x.to > x.from && !ups.some((u) => u.id === x.id))) {
    rows.push({
      key: `dl-${l.id}`,
      icon: <Blossom level={l.to} size={icon} />,
      text: D.confirmed.includes(l.id) ? `${TECH[l.id].name}: Einschätzung bestätigt, Stufe ${l.to}` : `${TECH[l.id].name}: Stufe ${l.to} im Roll bewiesen`,
    });
  }
  for (const m of D.mastery.filter((m) => !ups.some((l) => l.id === m.id)).slice(0, 3)) {
    rows.push({
      key: `m-${m.id}`,
      icon: m.d > 0 ? <TrendingUp size={icon} aria-hidden="true" /> : <TrendingDown size={icon} aria-hidden="true" />,
      text: `${TECH[m.id].name}: Meisterung ${signed(m.d, 1)}`,
    });
  }
  if (D.power) rows.push({ key: "power", icon: <Gauge size={icon} aria-hidden="true" />, text: `Power Level ${signed(D.power)}` });
  for (const id of D.seals) {
    const s = SEALS.find((x) => x.id === id);
    rows.push({ key: `seal-${id}`, icon: <Award size={icon} aria-hidden="true" />, text: `Siegel „${s?.name ?? id}“: ${s?.desc ?? ""}` });
  }
  if (after.title && D.levels.some((l) => l.to === 5)) rows.push({ key: "title", icon: <Award size={icon} aria-hidden="true" />, text: `Neuer Beiname: ${after.title}` });
  return rows;
}

export const trainingRows = (D: Diff, after: ArcState) => common(D, after);

export function compRows(c: Competition, D: Diff, after: ArcState): ChapterRow[] {
  const w = c.matches.filter((m) => m.result === "win").length;
  const l = c.matches.filter((m) => m.result === "loss").length;
  const subs = c.matches.filter((m) => m.result === "win" && m.method === "sub").length;
  const place = ["", "Gold", "Silber", "Bronze"][c.place];
  return [
    {
      key: "rec",
      icon: <Swords size={icon} aria-hidden="true" />,
      text: `${c.name}: ${w} ${w === 1 ? "Sieg" : "Siege"}, ${l} ${l === 1 ? "Niederlage" : "Niederlagen"}${subs ? `, ${subs} per Aufgabe` : ""}${place ? `. ${place}!` : "."}`,
    },
    ...common(D, after),
  ];
}

export function crossRows(D: Diff, after: ArcState): ChapterRow[] {
  const rows: ChapterRow[] = BODY.filter((b) => D.body[b.id]).map((b) => ({
    key: `body-${b.id}`,
    icon: <HeartPulse size={icon} aria-hidden="true" />,
    text: `${b.name} ${signed(D.body[b.id])}, jetzt ${after.body[b.id]}`,
  }));
  return [...rows, ...common(D, after)];
}
