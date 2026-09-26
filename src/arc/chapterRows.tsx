// What a training, competition or other sport moved, sorted into the ways
// of the chapter end: effort, skill, strength (the voyage comes from the
// data itself). The order is the one of the five systems (core/systems.ts).

import { Blossom } from "./components/Blossom.tsx";
import type { ArcState, Competition } from "./core/types.ts";
import type { Diff } from "./core/model.ts";
import type { ChapterRow, ChapterWays } from "./components/ChapterEnd.tsx";
import { SECTORS, TECH } from "./core/techniques.ts";
import { LEVELS, SEALS } from "./core/lore.ts";
import { BODY } from "./core/sports.ts";
import { power, signed } from "./format.ts";
import { LvlStep } from "./components/ui.tsx";

function common(D: Diff, after: ArcState): ChapterWays {
  const effort: ChapterRow[] = [];
  const skill: ChapterRow[] = [];
  const strength: ChapterRow[] = [];
  const seals: ChapterRow[] = [];

  effort.push(
    D.weekGoal
      ? {
          key: "week",
          text: (
            <>
              Wochenziel erreicht, die Flamme wächst <LvlStep from={D.streakFrom} to={D.streakTo} label="Flamme" />
            </>
          ),
        }
      : {
          key: "week",
          text: after.weekNow >= after.weekGoal ? `Diese Woche ${after.weekNow} Trainings, das Ziel steht.` : `Diese Woche ${after.weekNow} von ${after.weekGoal} Trainings.`,
        },
  );

  const ups = D.levels.filter((l) => l.to > l.from);
  for (const l of ups) {
    skill.push({
      key: `lv-${l.id}`,
      icon: <Blossom level={l.to} size={26} />,
      bloom: true,
      text: (
        <>
          {l.to === 5 ? "Neue Tokui-Waza: " : ""}
          {TECH[l.id].name}, jetzt {LEVELS[l.to]} <LvlStep from={l.from} to={l.to} label="Stufe" />
        </>
      ),
    });
  }
  for (const l of D.dataLevels.filter((x) => x.to > x.from && !ups.some((u) => u.id === x.id))) {
    skill.push({
      key: `dl-${l.id}`,
      icon: <Blossom level={l.to} size={26} />,
      text: D.confirmed.includes(l.id) ? `${TECH[l.id].name}: Einschätzung bestätigt, Stufe ${l.to}` : `${TECH[l.id].name}: Stufe ${l.to} im Roll bewiesen`,
    });
  }
  for (const m of D.mastery.filter((m) => !ups.some((l) => l.id === m.id)).slice(0, 3)) {
    const n = after.nodes[m.id];
    skill.push({
      key: `m-${m.id}`,
      icon: <Blossom level={n.level} rust={n.rust} prov={n.prov} size={26} />,
      text: `${TECH[m.id].name}: Meisterung ${signed(m.d, 1)}`,
    });
  }
  if (after.title && D.levels.some((l) => l.to === 5)) skill.push({ key: "title", text: `Neuer Beiname: ${after.title}` });

  if (D.power) strength.push({ key: "power", text: `Power Level ${power(after.ru)}`, delta: signed(D.power) });
  const moved = SECTORS.map((s) => ({ s, d: D.attrs[s.id] })).filter((x) => Math.abs(x.d) >= 1).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  if (moved) strength.push({ key: "hex", text: `Hexagon: ${moved.s.name} ${Math.round(after.attrs[moved.s.id].val)}`, delta: signed(Math.round(moved.d)) });

  for (const id of D.seals) {
    const s = SEALS.find((x) => x.id === id);
    seals.push({ key: `seal-${id}`, text: `„${s?.name ?? id}“: ${s?.desc ?? ""}` });
  }
  return { effort, skill, strength, seals };
}

export const trainingWays = (D: Diff, after: ArcState) => common(D, after);

export function compWays(c: Competition, D: Diff, after: ArcState): ChapterWays {
  const w = c.matches.filter((m) => m.result === "win").length;
  const l = c.matches.filter((m) => m.result === "loss").length;
  const subs = c.matches.filter((m) => m.result === "win" && m.method === "sub").length;
  const place = ["", "Gold", "Silber", "Bronze"][c.place];
  const ways = common(D, after);
  ways.effort.unshift({
    key: "rec",
    text: `${c.name}: ${w} ${w === 1 ? "Sieg" : "Siege"}, ${l} ${l === 1 ? "Niederlage" : "Niederlagen"}${subs ? `, ${subs} per Aufgabe` : ""}${place ? `. ${place}!` : "."}`,
  });
  return ways;
}

export function crossWays(D: Diff, after: ArcState): ChapterWays {
  const ways = common(D, after);
  ways.strength.push(...BODY.filter((b) => D.body[b.id]).map((b) => ({ key: `body-${b.id}`, text: `${b.name} ${after.body[b.id]}`, delta: signed(D.body[b.id]) })));
  return ways;
}
