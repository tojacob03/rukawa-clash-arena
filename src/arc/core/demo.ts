// Demo dojo: 20 simulated weeks of a blue belt, so the app can be explored
// before logging anything. The simulated person picks quests the way a real
// one would: mostly the top card, sometimes the technique from class, now and
// then a favourite. They also tend to skip Schmiede quests, so rust shows up.

import type { ArcData, Attire, Belt, Control, QuestResult, Roll, Session, Size } from "./types.ts";
import { TECH, baseOf } from "./techniques.ts";
import { inventory } from "./items.ts";
import { DEFAULT_LOOK } from "../avatarOptions.ts";
import { BELT_R, SIZE_R, clamp, compute, dayNum, expected, isoOf, partnerWeight, pickCards, questShape, weekOf } from "./model.ts";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KNOWN = [
  "f_shrimp", "f_grips", "f_base", "f_posture", "f_breakfall", "f_bridge",
  "g_closed", "g_retention", "g_scissor", "g_hipbump", "g_half",
  "p_open", "p_pressure", "p_toreando", "p_kneecut",
  "t_stance", "t_pull", "c_side", "c_mount", "c_mountkeep", "c_backctrl",
  "s_armbar_g", "s_americana", "s_crosscollar", "s_triangle", "s_kimura", "s_rnc", "s_armbar_m",
  "d_mount", "d_side", "d_elbow",
];

/** Self-assessment at the start: the scissor sweep already worked in rolls. */
const CLAIMS: Record<string, number> = { g_scissor: 3, g_closed: 3 };

const CURRICULUM: [string, string][] = [
  ["g_closed", "g_scissor"], ["g_dlr", "g_berimbolo"], ["g_berimbolo", "s_triangle"], ["p_kneecut", "p_pressure"],
  ["c_backctrl", "c_bodytri"], ["s_triangle", "s_omoplata"], ["t_double", "t_single"], ["d_side", "d_frames"],
  ["g_half", "g_oldschool"], ["p_toreando", "p_legdrag"], ["s_kimura", "g_hipbump"], ["", ""],
  ["c_mount", "s_armbar_m"], ["d_elbow", "d_mount"], ["g_butterfly", "g_bfsweep"], ["p_kneecut", "p_smash"],
  ["t_snap", "t_sprawl"], ["s_rnc", "s_bowarrow"], ["g_scissor", "g_flower"], ["d_side", "d_ghost"],
  ["p_overunder", "p_bodylock"],
];
const PAUSE_WEEK = 11;
const STYLE: Record<string, number> = { guard: 1.5, sub: 1.25, ctrl: 1.0, pass: 1.1, stand: 0.55, def: 0.85, fund: 1 };
const BONUS: Record<string, number> = { s_triangle: 2.2, s_armbar_g: 1.5, g_scissor: 1.35, p_kneecut: 1.45, g_berimbolo: 0.3, c_backctrl: 1.2 };
const FAV = ["s_triangle", "s_triangle", "g_scissor", "p_kneecut", "s_armbar_g"];
const BELT_P: [Belt, number][] = [["weiss", 0.33], ["blau", 0.34], ["lila", 0.19], ["braun", 0.09], ["schwarz", 0.05]];
const SIZE_P: [Size, number][] = [["leichter", 0.3], ["gleich", 0.45], ["schwerer", 0.25]];
const STUCK_EARLY: [string, number][] = [["halfbottom", 0.28], ["sidebottom", 0.24], ["standing", 0.22], ["mountbottom", 0.1], ["backlost", 0.08], ["guardpassed", 0.08]];
const STUCK_LATE: [string, number][] = [["sidebottom", 0.5], ["standing", 0.2], ["halfbottom", 0.1], ["mountbottom", 0.08], ["backlost", 0.06], ["turtle", 0.06]];

export const DEMO_SEED = 5;

export function buildDemo(todayIsoStr: string, seed = DEMO_SEED): ArcData {
  const rng = mulberry32(seed);
  const pick = <T,>(arr: [T, number][]): T => {
    const x = rng();
    let acc = 0;
    for (const [v, p] of arr) {
      acc += p;
      if (x < acc) return v;
    }
    return arr[arr.length - 1][0];
  };
  const binom = (n: number, p: number) => {
    let k = 0;
    for (let i = 0; i < n; i++) if (rng() < p) k++;
    return k;
  };

  const today = dayNum(todayIsoStr);
  const monday0 = (weekOf(today) - 20) * 7 + 4;
  const data: ArcData = {
    v: 1,
    profile: {
      name: "Demo-Kämpfer",
      belt: "blau",
      stripes: 2,
      startBelt: "blau",
      startStripes: 1,
      weeklyGoal: 2,
      createdAt: isoOf(monday0),
      countries: ["DE", "BR"],
      birthYear: Number(todayIsoStr.slice(0, 4)) - 31,
      weightKg: 78,
      trainingSince: isoOf(monday0 - 800).slice(0, 7),
      cls: "netzweber",
    },
    onboarding: { date: isoOf(monday0), known: KNOWN, claims: CLAIMS },
    sessions: [],
    pauses: [weekOf(monday0) + PAUSE_WEEK],
    promotions: [{ date: isoOf(monday0 + 7 * 13 + 2), belt: "blau", stripes: 2 }],
    ui: {},
    character: {
      look: { ...DEFAULT_LOOK, skin: 2, hair: 3, hairColor: 0, hairTips: 10, eyeShape: 3, eyeColor: 1, brows: 4, nose: 5, mouth: 2, beard: 5, muscle: 2, marks: ["blush", "matburn"], tattoo: 2, tattooSide: 1, earring: 1 },
      equipped: { patch1: "flag:DE", patch3: "flag:BR", talisman: "tl_omamori", head: "" },
      mode: "gi",
      seen: [],
    },
    demo: true,
  };
  const cum: Record<string, number> = {};
  let n = 0;

  for (let w = 0; w <= 20; w++) {
    if (w === PAUSE_WEEK) continue;
    const days: number[] = [];
    if (w === 20) days.push(0);
    else {
      if (rng() < 0.92) days.push(0);
      if (rng() < 0.86) days.push(2);
      if (rng() < 0.45 || (w >= 12 && days.length < 2) || days.length === 0) days.push(5);
    }
    for (const dd of days) {
      const day = monday0 + 7 * w + dd;
      if (day >= today) continue;
      const date = isoOf(day);
      const open = dd === 5;
      const attire: Attire = rng() < 0.3 ? "nogi" : "gi";
      let taught = open ? null : CURRICULUM[w][dd === 0 ? 0 : 1] || null;
      if (taught && attire === "nogi" && !TECH[taught].nogi) taught = null;
      const trueR = 1175 + 3 * w;

      const rolls: Roll[] = [];
      const ws: number[] = [];
      const nR = 4 + Math.floor(rng() * 3);
      for (let i = 0; i < nR; i++) {
        const belt = pick(BELT_P);
        const size = pick(SIZE_P);
        const E = expected(trueR, BELT_R[belt] + SIZE_R[size]);
        ws.push(partnerWeight(E));
        const x = rng();
        const c: Control = x < E * 0.75 ? 1 : x < E * 0.75 + 0.35 ? 0.5 : 0;
        const sf = rng() < E * 0.7 ? (rng() < 0.3 ? 2 : 1) : 0;
        const sa = rng() < (1 - E) * 0.7 ? (rng() < 0.25 ? 2 : 1) : 0;
        rolls.push({ belt, size, sf, sa, c });
      }
      const wSim = ws.reduce((a, b) => a + b, 0) / ws.length;

      const st = compute(data, date);
      const cards = pickCards(st.offers, { attire });
      const x = rng();
      let shape = cards[0];
      if (w <= 2 && taught === "g_berimbolo") shape = { ...questShape(TECH[taught], st.nodes[taught], true), P: 0, reason: "taught" };
      else if (x < 0.4 || (!taught && x < 0.65)) shape = cards[0]?.kind === "schmiede" && cards[1] ? cards[1] : cards[0];
      else if (x < 0.65 && taught) shape = { ...questShape(TECH[taught], st.nodes[taught], true), P: 0, reason: "taught" };
      else {
        const favs = FAV.filter((id) => attire === "gi" || TECH[id].nogi);
        const fav = favs[Math.floor(rng() * favs.length)];
        shape = { ...questShape(TECH[fav], st.nodes[fav], true), P: 0, reason: "prog" };
      }

      let quest: QuestResult | null = null;
      if (shape) {
        quest = { node: shape.node, kind: shape.kind, xp: shape.xp, att: 0, succ: 0, done: false };
        if (quest.kind === "kata") quest.done = rng() < 0.85;
        else {
          const tq = TECH[quest.node];
          const c0 = cum[quest.node] ?? 0;
          const style = STYLE[tq.sector] ?? 1;
          const p = Math.min(0.85, baseOf(tq) * style * (BONUS[tq.id] ?? 1) * (1 - 0.1 * Math.max(0, tq.tier - 1)) * (0.75 + 0.25 * Math.min(1, c0 / 15)));
          quest.att = 2 + Math.floor(rng() * 5);
          quest.succ = binom(quest.att, clamp(p / Math.sqrt(wSim), 0, 0.9));
          cum[quest.node] = c0 + quest.att;
        }
      }

      let worked: string | null = null;
      let stuck: string | null = null;
      if (rng() < 0.55) {
        if (quest && quest.succ > 0 && rng() < 0.6) worked = quest.node;
        stuck = pick(w >= 15 ? STUCK_LATE : STUCK_EARLY);
      }
      const s: Session = { id: `demo-${++n}`, date, format: open ? "open" : "class", attire, taught, rolls, quest, worked, stuck, createdAt: day * 1000 };
      data.sessions.push(s);
    }
  }
  // Two tournaments on Saturdays in past weeks.
  data.competitions = [
    {
      id: "demo-comp-1",
      date: isoOf(monday0 + 7 * 8 + 5),
      name: "Rhein-Ruhr Open",
      org: "AJP",
      attire: "gi",
      weight: "-82,3 kg",
      place: 3,
      matches: [
        { result: "win", method: "points", oppBelt: "blau" },
        { result: "loss", method: "sub", tech: "s_bowarrow", oppBelt: "blau" },
      ],
      createdAt: (monday0 + 7 * 8 + 5) * 1000,
    },
    {
      id: "demo-comp-2",
      date: isoOf(monday0 + 7 * 16 + 5),
      name: "Berlin Grappling Cup",
      org: "Grappling Industries",
      attire: "nogi",
      weight: "-82,3 kg",
      place: 2,
      matches: [
        { result: "win", method: "sub", tech: "s_triangle", oppBelt: "blau" },
        { result: "win", method: "points", oppBelt: "blau" },
        { result: "loss", method: "adv", oppBelt: "blau" },
      ],
      createdAt: (monday0 + 7 * 16 + 5) * 1000,
    },
  ];
  // Other sports: strength most weeks, wrestling every other Saturday.
  data.profile!.sports = [
    { id: "kraft", since: Number(todayIsoStr.slice(0, 4)) - 4 },
    { id: "ringen", since: Number(todayIsoStr.slice(0, 4)) - 15 },
  ];
  data.cross = [];
  for (let w = 0; w < 20; w++) {
    const tue = monday0 + 7 * w + 1;
    if (tue < today && rng() < 0.75) data.cross.push({ id: `demo-x${w}k`, date: isoOf(tue), sport: "kraft", minutes: 60, intensity: 2, createdAt: tue * 1000 + 500 });
    const sat = monday0 + 7 * w + 5;
    if (w % 2 === 0 && sat < today && w !== 8 && w !== 16) {
      const att = 3 + Math.floor(rng() * 4);
      data.cross.push({ id: `demo-x${w}r`, date: isoOf(sat), sport: "ringen", minutes: 90, intensity: 3, tech: "t_double", att, succ: Math.floor(att * 0.5), createdAt: sat * 1000 + 500 });
    }
  }

  // Everything found up to ten days ago has been looked at; newer loot shows as new.
  const earlier = isoOf(today - 10);
  data.character!.seen = [...inventory(data, compute(data, earlier)).keys()];
  return data;
}
