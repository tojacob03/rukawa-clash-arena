// The sea chart: your BJJ journey as a voyage.
//
// A world split by a scarlet ridge running north to south and a great current
// running west to east. Where they cross lies the gate every sailor passes.
// Four seas fill the quarters in between; each white belt starts in one of
// them. From blue belt on you sail the great current: the outer current up to
// the ridge pass (blue and purple), then the deep current (brown and black) all
// the way round to Kap Kuro, the last island, just west of where you entered.
// Every stripe is an island. All names are original.

import type { Belt, SeaId } from "./types.ts";

export type { SeaId };

export interface Sea {
  id: SeaId;
  name: string;
  desc: string;
  color: string;
}

export const SEAS: Sea[] = [
  { id: "frost", name: "Frostmeer", desc: "Kalt, rau, ehrlich. Wer hier segeln lernt, friert später auf keiner Matte mehr.", color: "#7fb3d9" },
  { id: "morgen", name: "Morgenmeer", desc: "Das ruhigste der vier Meere. Viele lange Reisen haben in einem kleinen Hafen hier begonnen.", color: "#f3b36b" },
  { id: "abend", name: "Abendmeer", desc: "Lange Dämmerung, lange Rolls. Die Leute hier trainieren, bis die Laternen angehen.", color: "#b48be0" },
  { id: "glut", name: "Glutmeer", desc: "Heiß und laut. Vulkane, Märkte und Leute, die jeden Scramble lieben.", color: "#e57a5c" },
];
export const SEA = Object.fromEntries(SEAS.map((s) => [s.id, s])) as Record<SeaId, Sea>;

export const WORLD = {
  w: 1200,
  h: 760,
  /** The scarlet ridge: center band and the wrap-around at both edges. */
  ridgeX: 600,
  /** The great current. */
  currentY: 380,
  currentHalf: 42,
  /** Calm belts on both sides of the current. */
  calm: 26,
};

export interface Island {
  id: string;
  name: string;
  belt: Belt;
  stripe: number;
  /** Only for white belt islands. */
  sea?: SeaId;
  x: number;
  y: number;
  desc: string;
  kind?: "hafen" | "tor" | "pass" | "kap";
}

const ORDER: Belt[] = ["weiss", "blau", "lila", "braun", "schwarz"];

// Home seas: five islands from the harbour toward the gate in the center.
const HOME: Record<SeaId, [string, string][]> = {
  frost: [
    ["Hafen Eisnebel", "Ein Fischerdorf mit einer Matte im Bootshaus. Hier fängt alles an."],
    ["Robbenfels", "Die Robben zeigen, wie man shrimpt. Du schaust genau hin."],
    ["Nordlichtbucht", "Unter grünem Himmel lernst du, ruhig zu atmen, wenn es eng wird."],
    ["Gletscherdojo", "Eiskalter Boden, heiße Rolls. Der Meister redet wenig und korrigiert viel."],
    ["Kap Frostzahn", "Der letzte Fels vor dem Tor. Von hier siehst du den roten Kamm."],
  ],
  morgen: [
    ["Dorf Morgenrot", "Ein kleiner Hafen, ein alter Gi am Haken. Hier fängt alles an."],
    ["Muschelstrand", "Barfuß im Sand: Stance, Breakfall, Bridge."],
    ["Leuchtturm Sonnwacht", "Der Wärter rollt jeden Abend. Er gewinnt meistens."],
    ["Mühleninsel", "Die Flügel drehen sich wie ein Berimbolo, nur langsamer."],
    ["Wellenbrecherriff", "Die Brandung testet deine Base. Danach kommt das Tor."],
  ],
  abend: [
    ["Hafen Dämmerlicht", "Laternen am Kai, Matten im Lagerhaus. Hier fängt alles an."],
    ["Laterneninsel", "Jede Laterne steht für einen Escape, den jemand hier gelernt hat."],
    ["Schildkrötenstrand", "Die Einheimischen verteidigen sich in der Schildkröte. Stundenlang."],
    ["Zwielichtfeste", "Eine alte Burg. Wer ihre Tore hält, lernt Guard Retention."],
    ["Kap Abendstern", "Der erste Stern der Nacht zeigt zum Tor."],
  ],
  glut: [
    ["Hafen Glutsand", "Heißer Sand, lauter Markt, volle Matten. Hier fängt alles an."],
    ["Vulkan Kohlenherz", "Es brodelt, du schwitzt, dein Cardio wächst."],
    ["Palmenlager", "Training unter Palmen. Kokosnüsse als Gewichte."],
    ["Salzmarkt", "Händler, die mit Griffen handeln. Die guten kosten Übung."],
    ["Kap Feuerzunge", "Die Klippe glüht in der Abendsonne. Dahinter wartet das Tor."],
  ],
};

// Anchor points of each home sea route (harbour → gate).
const HOME_PATH: Record<SeaId, [number, number][]> = {
  frost: [
    [120, 110],
    [220, 170],
    [320, 130],
    [420, 210],
    [520, 290],
  ],
  morgen: [
    [1080, 110],
    [980, 170],
    [880, 130],
    [780, 210],
    [680, 290],
  ],
  abend: [
    [120, 650],
    [220, 590],
    [320, 630],
    [420, 550],
    [520, 470],
  ],
  glut: [
    [1080, 650],
    [980, 590],
    [880, 630],
    [780, 550],
    [680, 470],
  ],
};

const CURRENT: [Belt, string, string, Island["kind"]?][] = [
  ["blau", "Tor der vier Strömungen", "Hier treffen sich die Strömungen aller vier Meere und reißen dich in die Große Strömung. Blaugurt.", "tor"],
  ["blau", "Wirbelinsel", "Das Wasser dreht sich im Kreis. Wer die Hüfte nicht bewegt, dreht mit.", undefined],
  ["blau", "Nebelwald von Hakenstein", "Im Nebel findest du den Gegner nur mit den Haken.", undefined],
  ["blau", "Wüstenhafen Sandschleier", "Trockene Luft, lange Rolls, kein Schatten.", undefined],
  ["blau", "Insel Zweiter Atem", "Hier lernst du, dass die fünfte Runde anders ist als die erste.", undefined],
  ["lila", "Wolkenriff", "Ein Riff, das aus dem Nebel ragt. Lilagurt: Du beginnst, dein eigenes Spiel zu bauen.", undefined],
  ["lila", "Glockenturm von Ashi", "Jede Stunde läutet eine Glocke. Jede Stunde ein Beinhebel-Drill.", undefined],
  ["lila", "Seeschlangenpass", "Eine Enge voller Strömungen. Wer sich windet, kommt durch.", undefined],
  ["lila", "Garnison Eiserne Klammer", "Eine Festung, die nichts loslässt. Du lernst Druck von oben.", undefined],
  ["lila", "Die Wartende Mauer", "Der rote Kamm ragt vor dir auf. Nur wer bereit ist, findet den Pass.", undefined],
  ["braun", "Kammpass", "Der Weg über den Scharlachkamm. Dahinter liegt die Tiefe Strömung. Braungurt.", "pass"],
  ["braun", "Sturmkrone", "Hier regnet es seitwärts. Deine Technik muss unter Druck halten.", undefined],
  ["braun", "Korallenpalast", "Unter Wasser ist alles langsamer, nur dein Timing nicht.", undefined],
  ["braun", "Insel der Tausend Griffe", "Jeder Stein hier ist ein Griff, den jemand vor dir gelernt hat.", undefined],
  ["braun", "Donnerbucht", "Das Meer grollt. Du unterrichtest die ersten Neuen auf deinem Schiff.", undefined],
  ["schwarz", "Schwarzkliff", "Eine Klippe aus dunklem Stein. Schwarzgurt: Das eigentliche Lernen beginnt.", undefined],
  ["schwarz", "Meer der Stille", "Kein Wind, keine Wellen. Nur du und deine Grundlagen.", undefined],
  ["schwarz", "Letzter Leuchtturm", "Sein Licht reicht bis zu den Häfen der vier Meere.", undefined],
  ["schwarz", "Tor des Meisters", "Ein Bogen aus Treibholz. Wer hindurchsegelt, sieht Kap Kuro.", undefined],
  ["schwarz", "Kap Kuro", "Das Ende der Großen Strömung, gleich neben dem Tor, durch das du gekommen bist. Der Kreis schließt sich.", "kap"],
];

function currentPos(i: number): [number, number] {
  const { w, currentY, ridgeX } = WORLD;
  // First half: center → east edge. Second half: west edge → center.
  const half = i < 10 ? 0 : 1;
  const k = i % 10;
  const x0 = half === 0 ? ridgeX + 50 : 50;
  const x1 = half === 0 ? w - 60 : ridgeX - 60;
  const x = x0 + ((x1 - x0) * k) / 9;
  const y = currentY + (i % 2 ? 20 : -20);
  return [Math.round(x), Math.round(y)];
}

export const ISLANDS: Island[] = [
  ...(Object.keys(HOME) as SeaId[]).flatMap((sea) =>
    HOME[sea].map(([name, desc], stripe) => ({
      id: `${sea}${stripe}`,
      name,
      desc,
      belt: "weiss" as Belt,
      stripe,
      sea,
      x: HOME_PATH[sea][stripe][0],
      y: HOME_PATH[sea][stripe][1],
      kind: stripe === 0 ? ("hafen" as const) : undefined,
    })),
  ),
  ...CURRENT.map(([belt, name, desc, kind], i) => ({
    id: `c${i}`,
    name,
    desc,
    belt,
    stripe: i % 5,
    x: currentPos(i)[0],
    y: currentPos(i)[1],
    kind,
  })),
];
export const ISLAND = Object.fromEntries(ISLANDS.map((x) => [x.id, x])) as Record<string, Island>;

/** Rank as one number: white 0 … black 4 = 24. */
export const rankIndex = (belt: Belt, stripes: number) => ORDER.indexOf(belt) * 5 + Math.min(4, Math.max(0, stripes));

/** The island for a belt and stripe; white belt islands depend on the home sea. */
export function islandAt(belt: Belt, stripes: number, sea: SeaId): Island {
  const s = Math.min(4, Math.max(0, stripes));
  if (belt === "weiss") return ISLAND[`${sea}${s}`];
  return ISLAND[`c${(ORDER.indexOf(belt) - 1) * 5 + s}`];
}

/** The islands of your route, in order. */
export function route(sea: SeaId): Island[] {
  return [...HOME[sea].map((_, i) => ISLAND[`${sea}${i}`]), ...CURRENT.map((_, i) => ISLAND[`c${i}`])];
}

export const DEFAULT_SEA: SeaId = "morgen";

// ── Landmarks ─────────────────────────────────────────────────────────────
// Every island has three: the landing (first training while docked there), a
// landmark (8 trainings) and the island's secret (15 trainings). Discovered
// only by training while your ship lies there, so the map keeps growing
// between two stripes.

export const LANDING = 1;
export const LANDMARK = 8;
export const SECRET = 15;

export const LANDMARKS: Record<string, [string, string]> = {
  frost0: ["Das Bootshaus mit der ersten Matte", "Das Logbuch des alten Fischers"],
  frost1: ["Die Robbenbank", "Die Shrimp-Grotte"],
  frost2: ["Das Atemfeld unter dem Nordlicht", "Die grüne Grotte"],
  frost3: ["Die Eistreppe", "Die Schriftrolle des stillen Meisters"],
  frost4: ["Der Wachturm am Zahn", "Der Blick auf den roten Kamm"],
  morgen0: ["Der Haken mit dem alten Gi", "Die Werft am Morgenkai"],
  morgen1: ["Die Breakfall-Dünen", "Die Perlmuschel"],
  morgen2: ["Die Wendeltreppe", "Das Tagebuch des Wärters"],
  morgen3: ["Das Mühlrad", "Der Speicher unter den Flügeln"],
  morgen4: ["Die Brandungsfelsen", "Der Pfad durchs Riff"],
  abend0: ["Das Lagerhaus-Dōjō", "Der Laternenmacher"],
  abend1: ["Die Allee der Escapes", "Die erste Laterne"],
  abend2: ["Die Panzerbucht", "Das Nest der alten Schildkröte"],
  abend3: ["Das Torhaus", "Der verborgene Burghof"],
  abend4: ["Die Sternwarte", "Die Karte zum Tor"],
  glut0: ["Der Markt am Kai", "Die Matte hinter dem Gewürzstand"],
  glut1: ["Die heißen Quellen", "Der Pfad am Kraterrand"],
  glut2: ["Das Kokosnuss-Gym", "Die Hängematte des Trainers"],
  glut3: ["Die Stände der Griffhändler", "Das Kontor der Meistergriffe"],
  glut4: ["Die glühende Klippe", "Das Leuchtfeuer der Zunge"],
  c0: ["Der Wirbel am Tor", "Die Inschrift im Torbogen"],
  c1: ["Der Kreiselstrand", "Das Auge des Wirbels"],
  c2: ["Die Hakenbäume", "Die Lichtung im Nebel"],
  c3: ["Die Oase", "Das Sandglas-Dōjō"],
  c4: ["Der Rundenstein", "Die Quelle des zweiten Atems"],
  c5: ["Die Wolkentreppe", "Das Nest über dem Riff"],
  c6: ["Die Glockenstube", "Die Glocke ohne Klöppel"],
  c7: ["Die Engstelle", "Die abgestreifte Schlangenhaut"],
  c8: ["Der Exerzierhof", "Die Rüstkammer"],
  c9: ["Das Lager am Fuß der Mauer", "Die Steinstufen zum Pass"],
  c10: ["Die Passhöhe", "Der Gipfelstein mit den Gürteln"],
  c11: ["Das Sturmhaus", "Das Auge des Sturms"],
  c12: ["Der Korallengarten", "Der Thronsaal unter Wasser"],
  c13: ["Die Wand der Griffe", "Der erste Griff"],
  c14: ["Die Lehrmatte am Strand", "Die Donnerhöhle"],
  c15: ["Die Klippenschule", "Der Stein der Anfänger"],
  c16: ["Die spiegelnde See", "Der Grund der Stille"],
  c17: ["Das Licht für die Häfen", "Die Namenswand"],
  c18: ["Der Treibholzbogen", "Das Wort über dem Tor"],
  c19: ["Die letzte Anlegestelle", "Der Kreis, der sich schließt"],
};

/** The three landmarks of an island with the number of trainings each needs. */
export function landmarksOf(id: string): { name: string; need: number }[] {
  const [mark, secret] = LANDMARKS[id] ?? ["Ein Aussichtspunkt", "Ein Geheimnis"];
  return [
    { name: "Die Anlegestelle", need: LANDING },
    { name: mark, need: LANDMARK },
    { name: secret, need: SECRET },
  ];
}

// ── Ships ─────────────────────────────────────────────────────────────────

export const SHIPS: Record<Belt, { name: string; desc: string }> = {
  weiss: { name: "Beiboot", desc: "Klein und wendig, jede Welle spürbar. So fängt jede Reise an." },
  blau: { name: "Schaluppe", desc: "Ein Mast, ein großes Segel, genug Platz für ein eigenes Spiel." },
  lila: { name: "Brigantine", desc: "Zwei Masten. Du fängst an, andere mitzunehmen." },
  braun: { name: "Fregatte", desc: "Drei Masten, schnell und schwer bewaffnet." },
  schwarz: { name: "Flaggschiff", desc: "Das Schiff, nach dem sich die anderen richten." },
};

/** Where the ship is: at its island, or part of the way to the next one. */
export function shipPos(r: Island[], idx: number, progress: number): { x: number; y: number; left: boolean } {
  const W = WORLD.w;
  const a = r[idx];
  const b = r[idx + 1];
  const ax = a.x + 16;
  const ay = a.y - 6;
  if (!b || progress <= 0) return { x: ax, y: ay, left: false };
  if (a.id === "c9" && b.id === "c10") {
    // Over the ridge at the east edge, back in at the west edge.
    const east = W - 10 - ax;
    const west = b.x - 16 - 10;
    const d = progress * (east + west);
    return d <= east ? { x: ax + d, y: ay, left: false } : { x: 10 + (d - east), y: b.y - 6, left: false };
  }
  const bx = b.x - 16;
  const by = b.y - 6;
  return { x: ax + (bx - ax) * progress, y: ay + (by - ay) * progress, left: bx < ax };
}

type Pt = { x: number; y: number };

/**
 * The course of the ship from one route position to a later one (island
 * index plus the share of the way to the next island): where it starts, every
 * island it reaches on the way, where it ends. Split into legs where the
 * route leaves the chart at the east edge and comes back in at the west.
 */
export function voyageLegs(r: Island[], from: number, to: number): Pt[][] {
  const W = WORLD.w;
  const at = (u: number): Pt => {
    const i = Math.max(0, Math.min(r.length - 1, Math.floor(u)));
    const p = shipPos(r, i, u - i);
    return { x: p.x, y: p.y };
  };
  const legs: Pt[][] = [[at(from)]];
  const add = (p: Pt) => {
    const leg = legs[legs.length - 1];
    const last = leg[leg.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 0.5) return;
    if (last.x - p.x > W / 2) {
      leg.push({ x: W - 10, y: last.y });
      legs.push([{ x: 10, y: p.y }]);
    }
    legs[legs.length - 1].push(p);
  };
  for (let i = Math.floor(from) + 1; i <= Math.min(r.length - 1, Math.floor(to)); i++) add(at(i));
  add(at(to));
  return legs.filter((l) => l.length > 1);
}

/** A smooth path through the points (Catmull-Rom as cubic curves), for the course and its wake. */
export function smoothPath(pts: Pt[]): string {
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

/** Length of a course, along its points. */
export const courseLength = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);

/** The sea serpent (weekly boss): one hump per life point, at most eight. Waterline at y = 0. */
export const SERPENT = { hump: 16, top: -27, bottom: 12 };
export const serpentWidth = (max: number) => 36 + Math.max(1, Math.min(8, max)) * SERPENT.hump;
