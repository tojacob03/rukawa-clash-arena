// Names and flavour. All of it is original wording or general Japanese
// martial-arts vocabulary (waza, kata, dojo, shoden ... hiden, tokui-waza),
// no terms owned by any anime or game.

import type { QuestKind } from "./types.ts";

export const APP_NAME = "Waza Arc";

export const LEVELS = ["Unbekannt", "Gesehen", "Gedrillt", "Erprobt", "Geschärft", "Tokui-Waza"];
export const LEVEL_HINT = [
  "Noch nie gesehen.",
  "Einmal im Kurs gesehen oder gedrillt.",
  "Mehrmals gesehen oder gedrillt.",
  "Im Roll versucht.",
  "Funktioniert zuverlässig im Roll.",
  "Deine Spezialtechnik: trifft auch gegen Stärkere.",
];

/** Rings of the star map, named after the classic levels of transmission. */
export const RINGS = [
  { jp: "Kiso", de: "Fundament" },
  { jp: "Shoden", de: "Grundlehre" },
  { jp: "Chūden", de: "Mittlere Lehre" },
  { jp: "Okuden", de: "Tiefe Lehre" },
  { jp: "Hiden", de: "Geheime Lehre" },
];

export const QUEST: Record<QuestKind, { name: string; sub: string; kanji: string }> = {
  kata: { name: "Kata", sub: "Drill", kanji: "型" },
  jagd: { name: "Jagd", sub: "Im Roll versuchen", kanji: "狩" },
  stand: { name: "Standhalten", sub: "Aus der Klemme", kanji: "耐" },
  schmiede: { name: "Schmiede", sub: "Rost abschlagen", kanji: "鍛" },
};

/** Titles for a technique that reached Tokui-Waza. */
export const EPITHET: Record<string, string> = {
  s_triangle: "Die Dreiecksfalle",
  s_armbar_g: "Der Hebelmeister",
  s_kimura: "Die Kimura-Falle",
  s_rnc: "Die Würgeschlange",
  s_guillotine: "Das Fallbeil",
  s_darce: "Die Schlinge",
  s_anaconda: "Die Anakonda",
  s_omoplata: "Die Schulterfessel",
  s_bowarrow: "Der Bogenschütze",
  s_loop: "Die Schlaufe",
  s_ezekiel: "Der Ärmelwürger",
  s_heel_in: "Der Fersenjäger",
  s_heel_out: "Der Fersenjäger",
  s_ankle: "Der Knöchelhebel",
  g_closed: "Die Klammer",
  g_scissor: "Die Schere",
  g_bfsweep: "Der Schmetterling",
  g_berimbolo: "Der Wirbel",
  g_dlr: "Der Haken",
  g_half: "Der Halbgardist",
  g_deephalf: "Der Maulwurf",
  c_mount: "Der Berg",
  c_backctrl: "Der Rucksack",
  c_kob: "Der Dorn",
  p_kneecut: "Die Knieklinge",
  p_toreando: "Der Torero",
  p_legdrag: "Der Beinzieher",
  p_bodylock: "Die Umklammerung",
  t_double: "Der Rammbock",
  t_single: "Der Einbein-Jäger",
  t_osoto: "Die Sichel",
  t_uchimata: "Der Schenkelwerfer",
  d_elbow: "Der Entfesselte",
  d_granby: "Der Ungreifbare",
};

/** Player rank by level. */
export const RANKS: [number, string][] = [
  [1, "Mattenneuling"],
  [5, "Schüler des Dōjō"],
  [10, "Wanderer der Matte"],
  [15, "Techniksucher"],
  [20, "Rollkrieger"],
  [25, "Klingenschmied"],
  [30, "Dōjō-Veteran"],
  [40, "Legende der Matte"],
];
export const rankOf = (lvl: number) => {
  let r = RANKS[0][1];
  for (const [min, name] of RANKS) if (lvl >= min) r = name;
  return r;
};

/** Eight-week seasons. */
export const ARCS = ["Erwachen", "Erste Prüfung", "Die Schmiede", "Sturm", "Durchbruch", "Aufstieg", "Tiefe Lehre", "Meisterweg"];
export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Positions you can get stuck in; the most frequent one becomes the weekly boss. */
export const STUCK: Record<string, { name: string; boss: string; nodes: string[] }> = {
  sidebottom: { name: "Unter Side Control", boss: "Der Schraubstock", nodes: ["d_side", "d_frames", "d_ghost"] },
  mountbottom: { name: "Unter Mount", boss: "Die Last", nodes: ["d_mount", "d_elbow"] },
  kobbottom: { name: "Unter Knee on Belly", boss: "Der Dorn", nodes: ["d_kob", "d_frames"] },
  backlost: { name: "Rücken verloren", boss: "Der Schatten", nodes: ["d_back", "d_chokedef", "d_bodytri"] },
  turtle: { name: "In der Turtle festgenagelt", boss: "Der Panzerbrecher", nodes: ["d_granby", "d_sitout", "d_turtle"] },
  halfbottom: { name: "Half Guard unten plattgedrückt", boss: "Das Nadelöhr", nodes: ["g_kneeshield", "g_dogfight", "g_oldschool"] },
  guardpassed: { name: "Guard wird gepasst", boss: "Der Sturm", nodes: ["g_retention", "d_frames", "g_butterfly"] },
  closedtop: { name: "In der Closed Guard gefangen", boss: "Die Falle", nodes: ["p_open", "p_standbreak", "d_tridef"] },
  standing: { name: "Im Stand unterlegen", boss: "Die Mauer", nodes: ["t_sprawl", "t_single", "t_double"] },
  leglocked: { name: "In Beinverknotungen", boss: "Die Schlinge", nodes: ["d_legdef", "d_heelhide", "d_5050esc"] },
};

export const SEALS: { id: string; name: string; desc: string }[] = [
  { id: "first", name: "Erster Schritt", desc: "Das erste Training eingetragen." },
  { id: "ten", name: "Zehn Trainings", desc: "Zehn Trainings eingetragen." },
  { id: "rolls100", name: "Hundert Rolls", desc: "100 Roll-Karten gesammelt." },
  { id: "star3", name: "Erprobt", desc: "Die erste Technik auf Stufe 3." },
  { id: "star4", name: "Geschärfte Klinge", desc: "Die erste Technik auf Stufe 4." },
  { id: "tokui", name: "Tokui-Waza", desc: "Die erste Spezialtechnik." },
  { id: "combo", name: "Kombo erweckt", desc: "Beide Enden einer Kombo auf Stufe 3." },
  { id: "flame4", name: "Flamme IV", desc: "Vier Wochen in Folge das Wochenziel erreicht." },
  { id: "flame12", name: "Flamme XII", desc: "Zwölf Wochen in Folge das Wochenziel erreicht." },
  { id: "boss", name: "Boss besiegt", desc: "Eine Position, in der du festhingst, halbiert." },
  { id: "strong", name: "Gegen den Strom", desc: "Drei Quest-Treffer in Trainings gegen stärkere Partner." },
  { id: "map50", name: "Kartograf", desc: "50 Sterne im Training erreicht." },
  { id: "both", name: "Beide Welten", desc: "Je fünf Trainings im Gi und im No-Gi." },
  { id: "arena", name: "Arena", desc: "Das erste Turnier eingetragen." },
  { id: "podium", name: "Podest", desc: "Eine Medaille auf einem Turnier." },
  { id: "cross10", name: "Zweite Disziplin", desc: "Zehn Einheiten Nebensport eingetragen." },
  { id: "entdecker", name: "Entdecker", desc: "Drei Inseln der Seekarte vollständig erkundet." },
];
