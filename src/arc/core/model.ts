// The Waza Arc model: turns logged trainings into levels, mastery, attributes,
// Ki, XP and the day's quest offers. Pure functions, no DOM, no storage, so
// the same code runs in the browser, in tests and later on a server.
//
// The formulas are documented in docs/waza-arc/KONZEPT.md (section 4).

import type {
  ArcData,
  ArcState,
  Attire,
  Attr,
  Belt,
  NodeState,
  QuestKind,
  QuestOffer,
  ReasonKey,
  Roll,
  SectorId,
  Session,
  Size,
  Technique,
} from "./types.ts";
import { COMBOS, NEIGH, SECTORS, TECH, TECHS, baseOf } from "./techniques.ts";
import { CLASS_ALL, CLASS_BY_SECTOR, EPITHET, SEALS } from "./lore.ts";

export const BELT_R: Record<Belt, number> = { weiss: 1000, blau: 1150, lila: 1300, braun: 1420, schwarz: 1520 };
export const SIZE_R: Record<Size, number> = { leichter: -60, gleich: 0, schwerer: 60 };
export const K_ELO = 12;
export const PRIOR = 4;
export const Z80 = 0.84;
export const FORM_WINDOW = 56;
export const COMPARE_MIN_ROLLS = 20;

const DAY_MS = 864e5;
export const dayNum = (iso: string) => Math.floor(Date.parse(iso + "T12:00:00Z") / DAY_MS);
export const isoOf = (d: number) => new Date(d * DAY_MS).toISOString().slice(0, 10);
export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
/** Monday-based week number. Day 4 (1970-01-05) was a Monday. */
export const weekOf = (d: number) => Math.floor((d - 4) / 7);

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const halfLife = (age: number, h: number) => Math.pow(2, -Math.max(0, age) / h);

/** Beta posterior around a baseline b: mean and the 80 % lower bound. */
export function posterior(b: number, n: number, s: number) {
  const a = PRIOR * b + s;
  const bb = PRIOR * (1 - b) + Math.max(0, n - s);
  const mu = a / (a + bb);
  const sd = Math.sqrt((mu * (1 - mu)) / (a + bb + 1));
  return { mu, lb: Math.max(0, mu - Z80 * sd) };
}

export const partnerRating = (r: Roll) => BELT_R[r.belt] + SIZE_R[r.size];
export const expected = (ru: number, rp: number) => 1 / (1 + Math.pow(10, (rp - ru) / 400));
export const partnerWeight = (E: number) => clamp(0.5 / E, 0.5, 2);
export const rollScore = (r: Roll) => clamp(0.5 + 0.2 * (r.sf - r.sa) + 0.3 * (r.c - 0.5), 0, 1);

export interface ComputeOptions {
  attire?: Attire;
}

interface Ev {
  exp: number;
  expOnb: number;
  KE: number;
  rawAtt: number;
  rawSucc: number;
  nw: number;
  sw: number;
  nd: number;
  sd: number;
  sStrong: number;
  last: number | null;
  lastAny: number | null;
}

export function questShape(x: Technique, st: Pick<NodeState, "level" | "rust">, forceTry = false): { node: string; kind: QuestKind; xp: number } {
  const survive = x.kind === "escape" || x.kind === "defense";
  const kind: QuestKind = forceTry
    ? survive
      ? "stand"
      : "jagd"
    : st.level <= 1
      ? "kata"
      : st.rust
        ? "schmiede"
        : survive
          ? "stand"
          : "jagd";
  const xp = { kata: 30, jagd: 30 + 10 * st.level, stand: 40 + 10 * st.level, schmiede: 60 }[kind];
  return { node: x.id, kind, xp };
}

export function sessionXp(s: Session) {
  let g = 40 + 5 * s.rolls.length;
  const q = s.quest;
  if (q && (q.kind === "kata" ? q.done : q.att > 0)) g += q.xp + Math.min(50, 5 * (q.succ || 0));
  if (s.worked || s.stuck) g += 15;
  return g;
}

export const levelXp = (level: number) => {
  let x = 0;
  for (let k = 3; k <= level; k++) x += 25 * k;
  return x;
};

export function compute(data: ArcData, asOfIso: string, opt: ComputeOptions = {}): ArcState {
  const asOf = dayNum(asOfIso);
  const profile = data.profile;
  const goal = profile?.weeklyGoal ?? 2;
  const all = data.sessions
    .filter((s) => dayNum(s.date) <= asOf)
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
  const sess = opt.attire ? all.filter((s) => s.attire === opt.attire) : all;
  const onb = data.onboarding ? dayNum(data.onboarding.date) : null;

  // Ki: an Elo rating over every roll card.
  let ru = BELT_R[profile?.startBelt ?? "weiss"];
  const ruSeries = [{ d: onb ?? (sess[0] ? dayNum(sess[0].date) : asOf), r: ru }];
  const der = sess.map((s) => {
    const rolls = s.rolls.map((r) => {
      const E = expected(ru, partnerRating(r));
      const w = partnerWeight(E);
      ru += K_ELO * (rollScore(r) - E);
      return { E, w, sf: r.sf, sa: r.sa, c: r.c };
    });
    ruSeries.push({ d: dayNum(s.date), r: ru });
    return { s, day: dayNum(s.date), rolls, wbar: rolls.length ? mean(rolls.map((x) => x.w)) : 1 };
  });

  // Evidence per technique.
  const ev: Record<string, Ev> = {};
  for (const x of TECHS) ev[x.id] = { exp: 0, expOnb: 0, KE: 0, rawAtt: 0, rawSucc: 0, nw: 0, sw: 0, nd: 0, sd: 0, sStrong: 0, last: null, lastAny: null };
  if (data.onboarding && onb !== null && onb <= asOf) {
    for (const id of data.onboarding.known) {
      const e = ev[id];
      if (!e) continue;
      e.exp += 3;
      e.expOnb += 3;
      e.KE += 3 * halfLife(asOf - onb, 60);
      e.lastAny = onb;
    }
  }
  for (const { s, day, wbar } of der) {
    const age = asOf - day;
    if (s.taught && ev[s.taught]) {
      const e = ev[s.taught];
      e.exp++;
      e.KE += halfLife(age, 60);
      e.lastAny = day;
    }
    const q = s.quest;
    if (q && ev[q.node]) {
      const e = ev[q.node];
      if (q.kind === "kata") {
        if (q.done) {
          e.exp++;
          e.KE += 1.5 * halfLife(age, 60);
          e.lastAny = day;
        }
      } else if (q.att > 0) {
        const d = halfLife(age, 120);
        const succ = Math.min(q.succ, q.att);
        e.exp++;
        e.KE += halfLife(age, 60);
        e.rawAtt += q.att;
        e.rawSucc += succ;
        e.nw += wbar * q.att;
        e.sw += wbar * succ;
        e.nd += wbar * q.att * d;
        e.sd += wbar * succ * d;
        if (wbar >= 1.1) e.sStrong += succ;
        e.last = day;
        e.lastAny = day;
      }
    }
    if (s.worked && ev[s.worked]) {
      const e = ev[s.worked];
      const w = 0.5 * wbar;
      const d = halfLife(age, 120);
      e.nw += w;
      e.sw += w;
      e.nd += w * d;
      e.sd += w * d;
      e.last = Math.max(e.last ?? -1e9, day);
      e.lastAny = day;
    }
  }

  const nodes: Record<string, NodeState> = {};
  for (const x of TECHS) {
    const e = ev[x.id];
    const b = baseOf(x);
    const pw = posterior(b, e.nw, e.sw);
    const pd = posterior(b, e.nd, e.sd);
    const K = 1 - Math.exp(-e.KE / 2.5);
    const A = Math.min(1, pd.lb / (1.5 * b)) * (e.nd / (e.nd + 5));
    const dLast = e.last === null ? null : asOf - e.last;
    const dAny = e.lastAny === null ? null : asOf - e.lastAny;
    const fresh = dAny === null || dAny <= 45 ? 1 : Math.max(0.5, halfLife(dAny - 45, 60));
    let level = 0;
    if (e.exp > 0 || e.nw > 0) level = 1;
    if (level === 1 && (e.exp >= 3 || e.rawAtt >= 5)) level = 2;
    if (level === 2 && e.rawAtt >= 5) level = 3;
    if (level === 3 && e.nw >= 8 && pw.lb >= b) level = 4;
    if (level === 4 && e.nw >= 25 && pw.lb >= 1.5 * b && e.sStrong >= 3) level = 5;
    const prog = [
      0,
      Math.max(Math.min(1, e.exp / 3), Math.min(1, e.rawAtt / 5)),
      Math.min(1, e.rawAtt / 5),
      0.5 * Math.min(1, e.nw / 8) + 0.5 * Math.min(1, pw.lb / b),
      (Math.min(1, e.nw / 25) + Math.min(1, pw.lb / (1.5 * b)) + Math.min(1, e.sStrong / 3)) / 3,
      1,
    ][level];
    nodes[x.id] = {
      level,
      prog,
      M: 100 * (0.25 * K + 0.75 * A) * fresh,
      K,
      A,
      b,
      exp: e.exp,
      expOnb: e.expOnb,
      rawAtt: e.rawAtt,
      rawSucc: e.rawSucc,
      nw: e.nw,
      sw: e.sw,
      mu: pw.mu,
      lbw: pw.lb,
      sStrong: e.sStrong,
      dLast,
      dAny,
      rust: level >= 3 && dAny !== null && dAny > 60,
      prov: level === 2 && e.exp - e.expOnb < 3 && e.rawAtt < 5,
      fog: false,
    };
  }
  for (const x of TECHS) {
    nodes[x.id].fog = !(x.sector === "fund" || nodes[x.id].level >= 1 || NEIGH[x.id].some((id) => nodes[id].level >= 1));
  }

  // Attributes: tree (what you can) and form (what you show lately).
  const rec = der.filter((x) => x.day > asOf - FORM_WINDOW);
  const rr = rec.flatMap((x) => x.rolls);
  const attrs = {} as Record<SectorId, Attr>;
  for (const sct of SECTORS) {
    const ns = TECHS.filter((x) => x.sector === sct.id);
    // Tree value: depth (your five best techniques) and breadth (share of the
    // sector you can use live). A plain average over 20-40 techniques would
    // bury a blue belt near zero.
    const top = ns.map((x) => nodes[x.id].M).sort((a, b) => b - a);
    const depth = (top[0] + top[1] + top[2] + top[3] + top[4]) / 5;
    const breadth = (100 * ns.filter((x) => nodes[x.id].level >= 3).length) / ns.length;
    const baum = 0.6 * depth + 0.4 * breadth;
    let form: number | null = null;
    if (sct.id === "sub" && rr.length) form = 100 * (1 - Math.exp(-(rr.reduce((a, r) => a + r.w * r.sf, 0) / rr.length) / 0.6));
    else if (sct.id === "def" && rr.length) form = 100 * Math.exp(-(rr.reduce((a, r) => a + r.sa / r.w, 0) / rr.length) / 0.7);
    else if (sct.id === "ctrl" && rr.length) form = clamp(50 + 100 * mean(rr.map((r) => r.c - r.E)), 0, 100);
    else if (sct.id === "guard" || sct.id === "pass" || sct.id === "stand") {
      let nn = 0;
      let ss = 0;
      let bb = 0;
      for (const x of rec) {
        const q = x.s.quest;
        const tq = q ? TECH[q.node] : undefined;
        if (q && tq && q.kind !== "kata" && q.att > 0 && tq.sector === sct.id) {
          nn += x.wbar * q.att;
          ss += x.wbar * Math.min(q.succ, q.att);
          bb += x.wbar * q.att * baseOf(tq);
        }
      }
      if (nn > 0) {
        const b = bb / nn;
        form = 100 * Math.min(1, posterior(b, nn, ss).lb / (1.5 * b)) * (nn / (nn + 5));
      }
    }
    attrs[sct.id] = { baum, form, val: form === null ? baum : 0.65 * baum + 0.35 * form };
  }

  // XP, level, weekly flame.
  let xp = 0;
  const wk = new Map<number, number>();
  for (const { s, day } of der) {
    xp += sessionXp(s);
    const w = weekOf(day);
    wk.set(w, (wk.get(w) ?? 0) + 1);
  }
  for (const c of wk.values()) if (c >= goal) xp += 100;
  for (const x of TECHS) xp += levelXp(nodes[x.id].level);
  const lvl = Math.floor(Math.sqrt(xp / 40)) + 1;
  const lo = 40 * (lvl - 1) ** 2;
  const hi = 40 * lvl ** 2;

  const cw = weekOf(asOf);
  const startWeek = weekOf(onb ?? (der[0]?.day ?? asOf));
  let streak = 0;
  let longest = 0;
  {
    let run = 0;
    for (let w = startWeek; w <= cw; w++) {
      if (data.pauses.includes(w)) continue;
      if ((wk.get(w) ?? 0) >= goal) {
        run++;
        longest = Math.max(longest, run);
      } else if (w < cw) run = 0;
    }
    streak = run;
  }

  // Class and title.
  const ranked = SECTORS.map((s) => [s.id, attrs[s.id].val] as const).sort((a, b) => b[1] - a[1]);
  const cls = ranked[0][1] - ranked[1][1] < 2 ? CLASS_ALL : CLASS_BY_SECTOR[ranked[0][0]];
  const tokui = TECHS.filter((x) => nodes[x.id].level === 5)
    .sort((a, b) => nodes[b.id].M - nodes[a.id].M)
    .map((x) => x.id);
  const title = tokui.length ? EPITHET[tokui[0]] ?? `Meister: ${TECH[tokui[0]].name}` : "Noch ohne Tokui-Waza";

  // Weekly boss and whether one was ever beaten.
  const countStuck = (a: number, b: number) => {
    const m: Record<string, number> = {};
    for (const { s, day } of der) if (s.stuck && day > a && day <= b) m[s.stuck] = (m[s.stuck] ?? 0) + 1;
    return m;
  };
  const c14 = countStuck(asOf - 14, asOf);
  const p14 = countStuck(asOf - 28, asOf - 14);
  const top = Object.entries(c14).sort((a, b) => b[1] - a[1])[0];
  const boss = top ? { key: top[0], hp: top[1], prev: p14[top[0]] ?? 0 } : null;
  let bossBeaten = false;
  if (der.length) {
    for (let d = der[0].day + 14; d + 14 <= asOf && !bossBeaten; d += 7) {
      const before = Object.entries(countStuck(d - 14, d)).sort((a, b) => b[1] - a[1])[0];
      if (before && before[1] >= 2 && (countStuck(d, d + 14)[before[0]] ?? 0) <= Math.floor(before[1] / 2)) bossBeaten = true;
    }
  }

  // Quest offers.
  const recentQ = all.slice(-3).map((s) => s.quest?.node).filter(Boolean) as string[];
  const taught7 = new Set(all.filter((s) => s.taught && dayNum(s.date) > asOf - 7).map((s) => s.taught as string));
  const offers: QuestOffer[] = [];
  for (const x of TECHS) {
    const st = nodes[x.id];
    if (st.fog) continue;
    if (x.sector === "fund" && st.level >= 2) continue;
    const attrV = x.sector === "fund" ? 50 : attrs[x.sector].val;
    const c: Record<ReasonKey, number> = {
      prog: st.level >= 2 && st.level <= 4 ? 1.2 * st.prog : 0,
      unc: st.level >= 2 && st.level <= 4 ? 0.6 / (1 + st.nw / 4) : 0,
      rust: st.rust ? 0.9 : 0,
      weak: x.sector === "fund" ? 0.2 : (0.8 * (100 - attrV)) / 100,
      taught: taught7.has(x.id) ? 0.9 : 0,
      explore: st.level <= 1 ? 0.35 : 0,
    };
    let P = c.prog + c.unc + c.rust + c.weak + c.taught + c.explore;
    if (recentQ.includes(x.id)) P -= 1.5;
    if (st.level === 5) P -= 0.8;
    const reason = (Object.entries(c) as [ReasonKey, number][]).sort((a, b) => b[1] - a[1])[0][0];
    offers.push({ ...questShape(x, st), P, reason });
  }
  offers.sort((a, b) => b.P - a.P || (a.node < b.node ? -1 : 1));

  const combosActive = COMBOS.filter(([a, b]) => nodes[a].level >= 3 && nodes[b].level >= 3).length;
  const discovered = TECHS.filter((x) => nodes[x.id].level >= 1).length;
  const rollsTotal = der.reduce((a, x) => a + x.rolls.length, 0);
  const levelsAt = (l: number) => TECHS.some((x) => nodes[x.id].level >= l);
  const sStrongTotal = TECHS.reduce((a, x) => a + nodes[x.id].sStrong, 0);
  const giN = all.filter((s) => s.attire === "gi").length;
  const noGiN = all.length - giN;
  const got: Record<string, boolean> = {
    first: der.length >= 1,
    ten: der.length >= 10,
    rolls100: rollsTotal >= 100,
    star3: levelsAt(3),
    star4: levelsAt(4),
    tokui: tokui.length > 0,
    combo: combosActive > 0,
    flame4: longest >= 4,
    flame12: longest >= 12,
    boss: bossBeaten,
    strong: sStrongTotal >= 3,
    map50: discovered >= 50,
    both: giN >= 5 && noGiN >= 5,
  };

  const arcStart = onb ?? (der[0]?.day ?? asOf);
  const weeksIn = Math.max(0, weekOf(asOf) - weekOf(arcStart));

  return {
    asOf,
    ru,
    ruSeries,
    nodes,
    attrs,
    xp,
    lvl,
    lo,
    hi,
    streak,
    weekNow: wk.get(cw) ?? 0,
    weekGoal: goal,
    paused: data.pauses.includes(cw),
    cls,
    title,
    tokui,
    boss,
    offers,
    sessions: der.length,
    rolls: rollsTotal,
    recentRolls: rr.length,
    discovered,
    activeCombos: combosActive,
    seals: SEALS.map((s) => ({ id: s.id, got: !!got[s.id] })),
    arc: { index: Math.floor(weeksIn / 8), week: (weeksIn % 8) + 1 },
  };
}

/** Three cards from three sectors, at most one Schmiede and one Kata card. */
export function pickCards(offers: QuestOffer[], opt: { attire?: Attire; exclude?: Set<string> } = {}) {
  const out: QuestOffer[] = [];
  const secs = new Set<string>();
  const kinds: Partial<Record<QuestKind, boolean>> = {};
  for (const q of offers) {
    const x = TECH[q.node];
    if (opt.exclude?.has(q.node)) continue;
    if (opt.attire === "nogi" && !x.nogi) continue;
    if (opt.attire === "gi" && !x.gi) continue;
    if (secs.has(x.sector)) continue;
    if ((q.kind === "schmiede" || q.kind === "kata") && kinds[q.kind]) continue;
    out.push(q);
    secs.add(x.sector);
    kinds[q.kind] = true;
    if (out.length === 3) break;
  }
  return out;
}

export interface Diff {
  xp: number;
  lvlFrom: number;
  lvlTo: number;
  streakFrom: number;
  streakTo: number;
  weekGoal: boolean;
  ki: number;
  levels: { id: string; from: number; to: number }[];
  mastery: { id: string; d: number }[];
  attrs: Record<SectorId, number>;
  seals: string[];
}

export function diff(a: ArcState, b: ArcState): Diff {
  const levels = TECHS.filter((x) => b.nodes[x.id].level !== a.nodes[x.id].level).map((x) => ({
    id: x.id,
    from: a.nodes[x.id].level,
    to: b.nodes[x.id].level,
  }));
  const mastery = TECHS.map((x) => ({ id: x.id, d: b.nodes[x.id].M - a.nodes[x.id].M }))
    .filter((x) => Math.abs(x.d) >= 0.3)
    .sort((p, q) => Math.abs(q.d) - Math.abs(p.d))
    .slice(0, 4);
  return {
    xp: b.xp - a.xp,
    lvlFrom: a.lvl,
    lvlTo: b.lvl,
    streakFrom: a.streak,
    streakTo: b.streak,
    weekGoal: a.weekNow < a.weekGoal && b.weekNow >= b.weekGoal,
    ki: Math.round(b.ru * 10) - Math.round(a.ru * 10),
    levels,
    mastery,
    attrs: Object.fromEntries(SECTORS.map((s) => [s.id, b.attrs[s.id].val - a.attrs[s.id].val])) as Record<SectorId, number>,
    seals: b.seals.filter((s, i) => s.got && !a.seals[i].got).map((s) => s.id),
  };
}

/** XP breakdown of one session, given the diff it caused. */
export function xpParts(s: Session, D: Diff): [string, number][] {
  const parts: [string, number][] = [["Training", 40]];
  if (s.rolls.length) parts.push([`${s.rolls.length} Roll-Karten`, 5 * s.rolls.length]);
  const q = s.quest;
  if (q && (q.kind === "kata" ? q.done : q.att > 0)) {
    parts.push(["Quest", q.xp]);
    if (q.succ) parts.push([`${q.succ} Treffer`, Math.min(50, 5 * q.succ)]);
  }
  if (s.worked || s.stuck) parts.push(["Notiz", 15]);
  if (D.weekGoal) parts.push(["Wochenziel", 100]);
  const lv = D.levels.reduce((a, x) => a + levelXp(x.to) - levelXp(x.from), 0);
  if (lv) parts.push(["Stufenaufstieg", lv]);
  return parts;
}
