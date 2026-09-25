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
    ["Muschelstrand", "Barfuß im Sand: Grundstellung, Fallschule, Brücke."],
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
