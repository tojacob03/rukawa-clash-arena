// Scouter readouts: pure functions over the logged data and the computed
// state. Four modes: you, a sparring partner, a tournament opponent and the
// weekly boss. The numbers come from the same model as everything else (Elo,
// mastery, evidence); the advice is plain rules on top: who is stronger, what
// you master, where you get stuck.

import type { ArcData, ArcState, Attire, Belt, SectorId, Size, TechKind, Technique } from "./types.ts";
import { BELT_R, FORM_WINDOW, K_COMP, K_ELO, SIZE_R, dayNum, expected, powerOf, rankAt, rollScore } from "./model.ts";
import { SECTORS, TECH, TECHS } from "./techniques.ts";
import { STUCK } from "./lore.ts";

const TIERS: [number, string][] = [
  [1075, "Weißgurt-Niveau"],
  [1225, "Blaugurt-Niveau"],
  [1360, "Lilagurt-Niveau"],
  [1470, "Braungurt-Niveau"],
  [Infinity, "Schwarzgurt-Niveau"],
];

export const powerTier = (ru: number) => TIERS.find(([t]) => ru < t)![1];
export { powerOf };
export const partnerR = (belt: Belt, size: Size) => BELT_R[belt] + SIZE_R[size];

// ── Records against belts ─────────────────────────────────────────────────

export interface VsRecord {
  rolls: number;
  /** Your submissions. */
  sf: number;
  /** Their submissions. */
  sa: number;
  /** Average control, 0 partner … 1 you. */
  ctrl: number;
  last: string | null;
}

/** Your rolls against one belt (optionally one size). */
export function recordVs(data: ArcData, belt: Belt, size?: Size): VsRecord {
  let rolls = 0;
  let sf = 0;
  let sa = 0;
  let c = 0;
  let last: string | null = null;
  for (const s of data.sessions) {
    for (const r of s.rolls) {
      if (r.belt !== belt || (size && r.size !== size)) continue;
      rolls++;
      sf += r.sf;
      sa += r.sa;
      c += r.c;
      if (!last || s.date > last) last = s.date;
    }
  }
  return { rolls, sf, sa, ctrl: rolls ? c / rolls : 0.5, last };
}

/** Competition matches against one belt: wins, losses, draws (walkovers left out). */
export function matchesVs(data: ArcData, belt: Belt) {
  let w = 0;
  let l = 0;
  let d = 0;
  for (const c of data.competitions ?? []) {
    const own = rankAt(data, dayNum(c.date)).belt;
    for (const m of c.matches) {
      if (m.method === "wo" || (m.oppBelt ?? own) !== belt) continue;
      if (m.result === "win") w++;
      else if (m.result === "loss") l++;
      else d++;
    }
  }
  return { w, l, d };
}

// ── What is at stake ──────────────────────────────────────────────────────

export interface Stake {
  label: string;
  /** Change of the Power Level. */
  delta: number;
}

/** Power Level change of one roll for three typical outcomes. */
export function rollStakes(ru: number, rp: number): Stake[] {
  const E = expected(ru, rp);
  const d = (sf: number, sa: number, c: 0 | 0.5 | 1) => powerOf(ru + K_ELO * (rollScore({ belt: "weiss", size: "gleich", sf, sa, c }) - E)) - powerOf(ru);
  return [
    { label: "Du tappst und führst", delta: d(1, 0, 1) },
    { label: "Ausgeglichen", delta: d(0, 0, 0.5) },
    { label: "Du wirst getappt und kontrolliert", delta: d(0, 1, 0) },
  ];
}

/** Power Level change of a competition match: win, draw, loss. */
export function matchStakes(ru: number, rp: number): Stake[] {
  const E = expected(ru, rp);
  const d = (s: number) => powerOf(ru + K_COMP * (s - E)) - powerOf(ru);
  return [
    { label: "Sieg", delta: d(1) },
    { label: "Unentschieden", delta: d(0.5) },
    { label: "Niederlage", delta: d(0) },
  ];
}

// ── Your techniques ───────────────────────────────────────────────────────

const OFFENSE: TechKind[] = ["sub", "sweep", "pass", "takedown", "backtake"];
const DEFENSE: TechKind[] = ["escape", "defense"];
const legal = (x: Technique, attire?: Attire) => (attire === "nogi" ? x.nogi : attire === "gi" ? x.gi : true);

/** Your best attacks: data level 3 or more, highest mastery first. */
export function weapons(st: ArcState, attire?: Attire, n = 3, kinds: TechKind[] = OFFENSE): string[] {
  return TECHS.filter((x) => kinds.includes(x.kind) && legal(x, attire) && st.nodes[x.id].dataLevel >= 3)
    .sort((a, b) => st.nodes[b.id].M - st.nodes[a.id].M)
    .slice(0, n)
    .map((x) => x.id);
}

/** Attacks you are building: seen or drilled, not yet proven live. Closest to the next level first. */
export function developing(st: ArcState, attire?: Attire, n = 2): string[] {
  return TECHS.filter((x) => OFFENSE.includes(x.kind) && legal(x, attire) && !st.nodes[x.id].fog && st.nodes[x.id].level >= 1 && st.nodes[x.id].dataLevel <= 2)
    .sort((a, b) => st.nodes[b.id].prog - st.nodes[a.id].prog || st.nodes[b.id].M - st.nodes[a.id].M)
    .slice(0, n)
    .map((x) => x.id);
}

/** Escapes and defences worth drilling: the boss's techniques first, then your strongest ones. */
export function defences(st: ArcState, attire?: Attire, n = 2): string[] {
  const boss = st.boss ? STUCK[st.boss.key]?.nodes ?? [] : [];
  const pool = TECHS.filter((x) => DEFENSE.includes(x.kind) && legal(x, attire) && !st.nodes[x.id].fog);
  const first = boss.filter((id) => pool.some((x) => x.id === id));
  const rest = pool
    .filter((x) => !first.includes(x.id))
    .sort((a, b) => st.nodes[b.id].M - st.nodes[a.id].M)
    .map((x) => x.id);
  return [...first, ...rest].slice(0, n);
}

export interface Plan {
  title: string;
  text: string;
  focus: string[];
}

/**
 * What to do in this roll. Against a clearly stronger partner: survive and
 * learn. Against a clearly weaker one: try what is not proven yet. In between:
 * your A-game.
 */
export function plan(E: number, st: ArcState, attire?: Attire, size: Size = "gleich"): Plan {
  const weight =
    size === "schwerer" ? " Schwerer Partner: Winkel und Frames statt Kraft, raus aus dem Druck, bevor er sitzt." : size === "leichter" ? " Leichterer Partner: kontrollieren statt drücken, Tempo raus." : "";
  if (E < 0.38) {
    return {
      title: "Überleben und lernen",
      text: `Der Partner ist klar stärker. Ziel: Positionen überstehen, Frames halten, ruhig atmen. Ein sauberer Escape zählt hier mehr als ein Sub.${weight}`,
      focus: defences(st, attire),
    };
  }
  if (E > 0.62) {
    const dev = developing(st, attire);
    return {
      title: "Neues ausprobieren",
      text: `Du bist klar vorne. Lass dein A-Game stecken und probier, was noch wackelt, gern aus schlechten Positionen.${weight}`,
      focus: dev.length ? dev : weapons(st, attire, 2),
    };
  }
  const w = weapons(st, attire, 2);
  return {
    title: "Dein A-Game",
    text: `Auf Augenhöhe: Spiel, was du kannst, und jag nebenbei deine Tagesquest.${weight}`,
    focus: w.length ? w : developing(st, attire),
  };
}

// ── Self scan ─────────────────────────────────────────────────────────────

export interface SelfScan {
  power: number;
  tier: string;
  /** Change over the last 8 weeks, in Power Level points. */
  trend8: number;
  peak: { power: number; day: number };
  /** Weekly samples of the last 16 weeks plus today. */
  series: { day: number; power: number }[];
  strongest: { sector: SectorId; val: number };
  weakest: { sector: SectorId; val: number };
  weapon: string | null;
  /** Quest hits in trainings against stronger partners, plus submission wins in competitions. */
  vsStronger: number;
  rust: number;
  form: { rolls: number; sf: number; sa: number };
  byBelt: { belt: Belt; rolls: number; sf: number; sa: number }[];
}

/** Power Level at a given day from the series of ratings after each training. */
function powerAt(st: ArcState, day: number) {
  let r = st.ruSeries[0]?.r ?? st.ru;
  for (const p of st.ruSeries) {
    if (p.d > day) break;
    r = p.r;
  }
  return powerOf(r);
}

export function selfScan(data: ArcData, st: ArcState): SelfScan {
  const series = Array.from({ length: 17 }, (_, i) => {
    const day = st.asOf - (16 - i) * 7;
    return { day, power: i === 16 ? powerOf(st.ru) : powerAt(st, day) };
  });
  let peak = { power: powerOf(st.ruSeries[0]?.r ?? st.ru), day: st.ruSeries[0]?.d ?? st.asOf };
  for (const p of st.ruSeries) if (powerOf(p.r) > peak.power) peak = { power: powerOf(p.r), day: p.d };
  const vals = SECTORS.map((s) => ({ sector: s.id, val: st.attrs[s.id].val })).sort((a, b) => b.val - a.val);
  const form = { rolls: 0, sf: 0, sa: 0 };
  const belts = new Map<Belt, { rolls: number; sf: number; sa: number }>();
  for (const s of data.sessions) {
    const recent = dayNum(s.date) > st.asOf - FORM_WINDOW && dayNum(s.date) <= st.asOf;
    for (const r of s.rolls) {
      if (recent) {
        form.rolls++;
        form.sf += r.sf;
        form.sa += r.sa;
      }
      const b = belts.get(r.belt) ?? { rolls: 0, sf: 0, sa: 0 };
      b.rolls++;
      b.sf += r.sf;
      b.sa += r.sa;
      belts.set(r.belt, b);
    }
  }
  const order: Belt[] = ["weiss", "blau", "lila", "braun", "schwarz"];
  return {
    power: powerOf(st.ru),
    tier: powerTier(st.ru),
    trend8: powerOf(st.ru) - powerAt(st, st.asOf - 56),
    peak,
    series,
    strongest: vals[0],
    weakest: vals[vals.length - 1],
    weapon: weapons(st, undefined, 1)[0] ?? null,
    vsStronger: TECHS.reduce((a, x) => a + st.nodes[x.id].sStrong, 0),
    rust: TECHS.filter((x) => st.nodes[x.id].rust).length,
    form,
    byBelt: order.filter((b) => belts.has(b)).map((b) => ({ belt: b, ...belts.get(b)! })),
  };
}

// ── Partner and opponent ──────────────────────────────────────────────────

export interface PartnerScan {
  power: number;
  tier: string;
  /** Your expected score (≈ chance to come out ahead). */
  E: number;
  gap: number;
  stakes: Stake[];
  record: VsRecord;
  plan: Plan;
}

export function partnerScan(data: ArcData, st: ArcState, belt: Belt, size: Size, attire?: Attire): PartnerScan {
  const rp = partnerR(belt, size);
  const E = expected(st.ru, rp);
  return {
    power: powerOf(rp),
    tier: powerTier(rp),
    E,
    gap: powerOf(st.ru) - powerOf(rp),
    stakes: rollStakes(st.ru, rp),
    record: recordVs(data, belt, size),
    plan: plan(E, st, attire, size),
  };
}

export interface OpponentScan {
  power: number;
  tier: string;
  E: number;
  gap: number;
  stakes: Stake[];
  matches: { w: number; l: number; d: number };
  rolls: VsRecord;
  weapons: string[];
  /** Your weak spot: the weekly boss position or the lowest axis. */
  watch: string;
}

export function opponentScan(data: ArcData, st: ArcState, belt: Belt, attire?: Attire): OpponentScan {
  const rp = BELT_R[belt];
  const E = expected(st.ru, rp);
  const low = SECTORS.map((s) => ({ s, v: st.attrs[s.id].val })).sort((a, b) => a.v - b.v)[0];
  return {
    power: powerOf(rp),
    tier: powerTier(rp),
    E,
    gap: powerOf(st.ru) - powerOf(rp),
    stakes: matchStakes(st.ru, rp),
    matches: matchesVs(data, belt),
    rolls: recordVs(data, belt),
    weapons: weapons(st, attire, 3, ["sub", "sweep", "takedown", "backtake"]),
    watch: st.boss ? `${STUCK[st.boss.key].name}: da hängst du gerade am häufigsten fest.` : `${low.s.name} ist gerade deine schwächste Achse.`,
  };
}

// ── Boss ──────────────────────────────────────────────────────────────────

export interface BossScan {
  key: string;
  boss: string;
  position: string;
  hp: number;
  prev: number;
  /** Beaten when it happens at most this often in the next 14 days. */
  goal: number;
  trend: "wächst" | "schrumpft" | "unverändert";
  counters: { id: string; level: number; M: number; rust: boolean }[];
}

export function bossScan(st: ArcState): BossScan | null {
  const b = st.boss;
  if (!b) return null;
  const info = STUCK[b.key];
  return {
    key: b.key,
    boss: info.boss,
    position: info.name,
    hp: b.hp,
    prev: b.prev,
    goal: Math.floor(b.hp / 2),
    trend: b.hp > b.prev ? "wächst" : b.hp < b.prev ? "schrumpft" : "unverändert",
    counters: info.nodes.filter((id) => TECH[id]).map((id) => ({ id, level: st.nodes[id].level, M: st.nodes[id].M, rust: st.nodes[id].rust })),
  };
}
