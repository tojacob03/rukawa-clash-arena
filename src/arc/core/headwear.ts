// Traditional headwear, one per country. You wear the ones of your own
// countries from the start; every other country's you earn by training in a
// gym there (see visits.ts).
//
// Picked from folk and working dress, never religious headwear. Where no
// headwear is clearly tied to a country, it gets a headband tied in the
// colours of its flag instead, and says so.

import { COUNTRIES, COUNTRY } from "./countries.ts";

export type HatStyle =
  | "band"
  | "sombrero"
  | "beret"
  | "flatcap"
  | "bowler"
  | "tyrolean"
  | "cap"
  | "fez"
  | "keffiyeh"
  | "papakha"
  | "kalpak"
  | "borik"
  | "ushanka"
  | "wreath"
  | "knit"
  | "svan"
  | "akkalpak"
  | "janjin"
  | "gat"
  | "conical"
  | "mongkol"
  | "salakot"
  | "wrap"
  | "cowboy"
  | "flatbrim"
  | "straw"
  | "panama"
  | "chullo"
  | "boater"
  | "stocking"
  | "sajkaca"
  | "capa"
  | "fisher"
  | "welsh"
  | "couro"
  | "fila";

export const HAT_STYLES: HatStyle[] = [
  "band",
  "sombrero",
  "beret",
  "flatcap",
  "bowler",
  "tyrolean",
  "cap",
  "fez",
  "keffiyeh",
  "papakha",
  "kalpak",
  "borik",
  "ushanka",
  "wreath",
  "knit",
  "svan",
  "akkalpak",
  "janjin",
  "gat",
  "conical",
  "mongkol",
  "salakot",
  "wrap",
  "cowboy",
  "flatbrim",
  "straw",
  "panama",
  "chullo",
  "boater",
  "stocking",
  "sajkaca",
  "capa",
  "fisher",
  "welsh",
  "couro",
  "fila",
];

export interface Hat {
  style: HatStyle;
  name: string;
  desc: string;
  c: string;
  c2?: string;
  c3?: string;
  /** Stripes, top to bottom (headbands, ribbons). */
  cs?: string[];
  /** A variant of the style: the feather on a hat, the shape of a cap. */
  trim?: string;
  /** A headband in the flag's colours, because no headwear fits the country. */
  fallback?: boolean;
}

const BLACK = "#1d1d26";
const WHITE = "#f4f1ea";
const RED = "#c8102e";
const GOLD = "#e0b040";
const STRAW = "#dcbf7c";

const H = (style: HatStyle, name: string, desc: string, c: string, more: Partial<Hat> = {}): Hat => ({ style, name, desc, c, ...more });

const LIST: Record<string, Hat> = {
  // Europe
  DE: H("tyrolean", "Trachtenhut mit Gamsbart", "Loden aus den Alpen. Der Gamsbart wird gepflegt wie ein alter Gürtel.", "#44603c", { c2: "#2a2a2a", c3: "#6b5a48", trim: "gamsbart" }),
  AT: H("tyrolean", "Tirolerhut", "Grüner Filz, rot-weiße Kordel und eine Feder, die beim Aufwärmen wippt.", "#4a5a3c", { c2: RED, c3: BLACK, trim: "feather" }),
  CH: H("cap", "Sennenkäppi", "Das kleine schwarze Käppi der Sennen, mit Edelweiß bestickt.", BLACK, { c2: WHITE, c3: RED, trim: "kaeppi" }),
  FR: H("beret", "Béret", "Aus dem Baskenland in die ganze Welt. Sitzt schief, aber mit Absicht.", BLACK),
  IT: H("boater", "Gondoliere-Strohhut", "Flacher Strohhut mit Band. Rudern ist auch Cardio.", STRAW, { c2: RED }),
  ES: H("flatbrim", "Sombrero cordobés", "Flache Krempe, gerade Krone, aus Andalusien.", BLACK, { c2: "#34343e" }),
  PT: H("stocking", "Barrete verde", "Die grüne Zipfelmütze der Campinos aus dem Ribatejo, mit rotem Rand.", "#2f7a3a", { c2: RED }),
  IE: H("flatcap", "Flat Cap aus Donegal-Tweed", "Grüngrauer Tweed mit bunten Noppen.", "#5f6b50", { c2: "#b8a27a" }),
  GB: H("bowler", "Melone", "Steif, rund, schwarz. Übersteht auch einen Takedown.", BLACK, { c2: "#34343e" }),
  ENG: H("flatcap", "Schiebermütze", "Tweed aus Nordengland. Wird auch beim Aufwärmen nicht abgenommen.", "#6b5a44", { c2: "#a8946c" }),
  SCO: H("beret", "Tam o' Shanter", "Blaue Wollmütze mit rotem Bommel und kariertem Rand.", "#1f3a6b", { c2: RED, c3: WHITE, trim: "tam" }),
  WAL: H("welsh", "Welsh Hat", "Hoher schwarzer Hut aus der walisischen Tracht.", BLACK, { c2: "#34343e" }),
  PL: H("tyrolean", "Góral-Hut", "Der kleine schwarze Hut der Bergbauern aus der Tatra, mit Muschelband.", BLACK, { c2: BLACK, c3: WHITE, trim: "shells" }),
  HU: H("tyrolean", "Csikós-Hut", "Der Hut der Pusztareiter, mit einer grauen Kranichfeder.", BLACK, { c2: BLACK, c3: "#9aa0a8", trim: "crane" }),
  RO: H("papakha", "Căciulă", "Hohe Mütze aus Lammfell für Winter in den Karpaten.", BLACK),
  MD: H("papakha", "Căciulă", "Lammfellmütze, grau wie der Himmel im Januar.", "#55555c"),
  BG: H("kalpak", "Kalpak", "Niedrige Mütze aus schwarzem Lammfell.", BLACK),
  HR: H("capa", "Lička kapa", "Rote Kappe aus der Lika mit schwarzen Seidenfransen.", RED, { c2: BLACK, trim: "fringe" }),
  ME: H("capa", "Crnogorska kapa", "Flache Kappe: schwarzer Rand, rotes Feld, goldene Bögen.", RED, { c2: BLACK, c3: GOLD, trim: "gold" }),
  RS: H("sajkaca", "Šajkača", "Die Mütze mit der Kerbe oben, aus Wolltuch.", "#5a5a4e"),
  AL: H("cap", "Qeleshe", "Weiße Filzkappe aus den albanischen Bergen.", WHITE, { trim: "qeleshe" }),
  XK: H("cap", "Qeleshe", "Weiße Filzkappe, wie sie die Alten tragen.", WHITE, { trim: "qeleshe" }),
  GR: H("fisher", "Fischermütze", "Dunkelblaue Mütze mit Lackschirm und Kordel, vom Hafen direkt auf die Matte.", "#1b2a55", { c2: BLACK, c3: "#101018" }),
  UA: H("wreath", "Vinok", "Blumenkranz mit bunten Bändern.", "#3f7a3a", { c2: RED, c3: "#ffd700", cs: ["#0057b7", "#ffd700", RED, "#3f7a3a"], trim: "flowers" }),
  RU: H("ushanka", "Uschanka", "Pelzmütze mit Ohrenklappen für den russischen Winter.", "#6b4a2e", { c2: "#8e6a48" }),
  LV: H("wreath", "Eichenkranz", "Der Kranz aus Eichenlaub, den Männer zur Sommersonnenwende tragen.", "#4f7a2a", { c2: "#8a6a2e", trim: "oak" }),
  SE: H("knit", "Toppluva", "Strickmütze mit Bommel in Blau und Gelb.", "#006aa7", { c2: "#fecc00" }),
  NO: H("knit", "Selbu-Mütze", "Gestrickt mit dem Selbu-Stern aus Mittelnorwegen.", "#ba0c2f", { c2: WHITE }),
  DK: H("knit", "Strikhue", "Rot-weiße Strickmütze für den Weg zum Training im Wind.", RED, { c2: WHITE }),
  FI: H("knit", "Pipo", "Weiße Wollmütze mit blauem Muster und Bommel.", WHITE, { c2: "#002f6c" }),
  IS: H("knit", "Lopi-Mütze", "Aus ungefärbter isländischer Lopi-Wolle.", "#9a9488", { c2: WHITE }),
  // Caucasus and Central Asia
  GE: H("svan", "Swanische Mütze", "Runde Filzmütze aus Swanetien, mit Borte.", "#8a8478", { c2: "#3a3a40" }),
  AM: H("papakha", "Papacha", "Hohe Fellmütze aus dem Kaukasus.", BLACK),
  AZ: H("papakha", "Papaq", "Graue Karakul-Papaq, getragen zu Festen.", "#5a5a60"),
  DAG: H("papakha", "Papacha", "Weißgraue Papacha. Wer sie trägt, kam von einer langen Reise zurück.", "#d9d4c8"),
  TR: H("kalpak", "Kalpak", "Niedrige Fellmütze aus Astrachan.", "#3a3a40"),
  KZ: H("borik", "Borik", "Samtkrone mit Pelzrand, bestickt mit goldenen Widderhörnern.", "#6b4a2e", { c2: "#1b3a8a", c3: GOLD }),
  UZ: H("cap", "Doppi", "Viereckiges Käppchen mit weißen Pfefferschoten.", BLACK, { c2: WHITE, trim: "doppi" }),
  TJ: H("cap", "Toqi", "Besticktes Käppchen, jede Gegend hat ihr Muster.", "#1f3d2a", { c2: GOLD, trim: "doppi" }),
  KG: H("akkalpak", "Ak-Kalpak", "Hoher weißer Filzhut mit schwarzer Krempe, Nationalsymbol Kirgisistans.", WHITE, { c2: BLACK }),
  MN: H("janjin", "Janjin Malgai", "Die spitze Mütze der mongolischen Ringer, mit Knoten und Bändern.", "#1b3a8a", { c2: GOLD, c3: RED }),
  // Middle East and North Africa
  AE: H("keffiyeh", "Ghutra mit Agal", "Weißes Kopftuch, von einer schwarzen Kordel gehalten.", WHITE, { c2: BLACK }),
  QA: H("keffiyeh", "Ghutra mit Agal", "Weißes Kopftuch mit schwarzer Kordel.", WHITE, { c2: BLACK }),
  KW: H("keffiyeh", "Ghutra mit Agal", "Weißes Kopftuch mit schwarzer Kordel.", WHITE, { c2: BLACK }),
  BH: H("keffiyeh", "Ghutra mit Agal", "Weißes Kopftuch mit schwarzer Kordel.", WHITE, { c2: BLACK }),
  SA: H("keffiyeh", "Schemagh", "Rot-weiß gemustertes Kopftuch mit Agal.", WHITE, { c2: BLACK, c3: RED, trim: "pattern" }),
  JO: H("keffiyeh", "Schemagh", "Rot-weißes Tuch mit Fransen, gehalten vom Agal.", WHITE, { c2: BLACK, c3: RED, trim: "pattern" }),
  PS: H("keffiyeh", "Kufiya", "Schwarz-weißes Tuch mit Fischernetz-Muster.", WHITE, { c2: BLACK, c3: BLACK, trim: "pattern" }),
  IQ: H("keffiyeh", "Kufiya", "Schwarz-weiß gemustertes Tuch mit Agal.", WHITE, { c2: BLACK, c3: BLACK, trim: "pattern" }),
  SY: H("keffiyeh", "Kufiya", "Rot-weiß gemustertes Tuch mit Agal.", WHITE, { c2: BLACK, c3: RED, trim: "pattern" }),
  KUR: H("wrap", "Jamadani", "Gemustertes Tuch, gewickelt und mit Fransen über der Stirn.", BLACK, { c2: WHITE, trim: "fringe" }),
  OM: H("cap", "Kumma", "Weißes Käppchen mit bunter Stickerei.", WHITE, { c2: "#7a2b3a", c3: "#1b6a8a", trim: "kumma" }),
  LB: H("fez", "Tarbusch", "Roter Filz mit schwarzer Quaste.", "#a3162a", { c2: BLACK }),
  EG: H("fez", "Tarbusch", "Roter Filz mit schwarzer Quaste, einst in jedem Kairoer Café.", "#b01c2e", { c2: BLACK }),
  MA: H("fez", "Tarbouche", "Der rote Fes aus Fès.", "#9e1b2a", { c2: BLACK }),
  TN: H("fez", "Chechia", "Weiche rote Filzkappe, in Tunis seit Jahrhunderten gewalkt.", "#b3261e", { trim: "short" }),
  DZ: H("fez", "Chechia", "Weiche rote Filzkappe.", "#a8221e", { trim: "short" }),
  // Asia and the Pacific
  JP: H("band", "Hachimaki mit Hinomaru", "Stirnband mit roter Sonne. Gebunden vor jedem ernsten Kampf.", WHITE),
  CN: H("cap", "Guapi mao", "Schwarzes Segmentkäppchen mit rotem Knopf.", BLACK, { c2: RED, trim: "guapi" }),
  KR: H("gat", "Gat", "Der hohe durchscheinende Hut aus Rosshaar und Bambus.", BLACK),
  TW: H("conical", "Douli", "Flacher Bambushut gegen Sonne und Regen.", "#c9a86a", { c2: "#8a6a3a", trim: "flat" }),
  VN: H("conical", "Nón lá", "Der spitze Hut aus Palmblättern.", "#e8dcb4", { c2: "#b89c64" }),
  TH: H("mongkol", "Mongkol", "Der geflochtene Stirnreif der Muay-Thai-Kämpfer, getragen bis zum Kampfbeginn.", RED, { c2: WHITE, c3: GOLD }),
  PH: H("salakot", "Salakot", "Rattanhut mit Spitze, Schutz für Bauern und Krieger.", "#a8743a", { c2: "#c9ced6" }),
  ID: H("cap", "Peci", "Schwarze Samtkappe, Teil der Nationaltracht.", BLACK, { trim: "peci" }),
  MY: H("cap", "Songkok", "Ovale schwarze Samtkappe.", BLACK, { trim: "peci" }),
  KH: H("wrap", "Krama", "Das karierte Baumwolltuch, als Kopftuch gebunden.", RED, { c2: WHITE, trim: "check" }),
  IN: H("wrap", "Pagri", "Safranfarbener Wickel aus Rajasthan, zu Hochzeiten und Festen.", "#f39c12", { c2: RED, c3: "#f7d24a", trim: "pagri" }),
  PK: H("kalpak", "Karakul-Kappe", "Graue Kappe aus Karakul-Lammfell.", "#8a8a8a"),
  BD: H("band", "Gamchha", "Das karierte Baumwolltuch, als Stirnband gebunden.", "#006a4e", { c2: WHITE, cs: ["#006a4e", "#f42a41", "#006a4e"], trim: "check" }),
  AU: H("cowboy", "Akubra", "Buschhut aus Kaninchenfilz, breite Krempe gegen die Sonne.", "#6b5a44", { c2: "#3a2a1e", trim: "bush" }),
  WS: H("wreath", "Blütenkranz", "Kranz aus Hibiskus und Blättern.", "#3f7a3a", { c2: "#e0453c", c3: "#f7d24a", trim: "hibiscus" }),
  TO: H("wreath", "Blütenkranz", "Kranz aus roten und weißen Blüten.", "#3f7a3a", { c2: RED, c3: WHITE, trim: "hibiscus" }),
  // Africa
  NG: H("fila", "Fila", "Weiche Kappe aus Aso-oke, zur Seite gefaltet.", "#3a4fa0", { c2: "#e0c060" }),
  GH: H("band", "Kente-Stirnband", "Gewebt in den Farben des Kente-Tuchs.", "#fcd116", { c2: BLACK, cs: ["#fcd116", "#006b3f", "#ce1126"], trim: "kente" }),
  // Americas
  US: H("cowboy", "Cowboyhut", "Filz, Krempe, Delle. Für den Ritt zum Open Mat.", "#8a5a32", { c2: "#3a2a1e" }),
  CA: H("knit", "Tuque", "Rote Wollmütze mit Bommel für den Winter.", RED, { c2: WHITE }),
  MX: H("sombrero", "Sombrero", "Breite Krempe, hohe Krone, bestickter Rand.", STRAW, { c2: RED, c3: "#006847" }),
  BR: H("couro", "Chapéu de couro", "Lederhut aus dem Sertão, mit aufgeschlagener Krempe und Sternen.", "#7a4a26", { c2: "#a86a38", c3: GOLD }),
  AR: H("beret", "Boina", "Die Mütze der Gauchos.", BLACK),
  UY: H("flatbrim", "Gaucho-Hut", "Flache Krone, gerade Krempe, braun wie die Pampa.", "#4a3a2e", { c2: BLACK }),
  CL: H("flatbrim", "Chupalla", "Flacher Strohhut der Huasos mit schwarzem Band.", STRAW, { c2: BLACK }),
  PY: H("straw", "Sombrero pirí", "Leichter Hut aus Pirí-Stroh.", "#e0c890", { c2: BLACK }),
  BO: H("bowler", "Bombín", "Die kleine Melone aus La Paz.", "#3a2a22", { c2: BLACK }),
  PE: H("chullo", "Chullo", "Andenmütze aus Alpakawolle mit Ohrenklappen.", RED, { c2: WHITE, c3: "#1b6a8a" }),
  EC: H("panama", "Panamahut", "Aus Toquilla-Stroh geflochten. Kommt aus Ecuador, nicht aus Panama.", "#efe6cf", { c2: BLACK }),
  CO: H("panama", "Sombrero vueltiao", "Geflochten aus Caña flecha, schwarz-weiß gemustert.", "#efe6cf", { c2: BLACK, trim: "stripes" }),
  PA: H("panama", "Sombrero pintao", "Schwarz-weiß geflochtener Hut aus Panama.", "#efe6cf", { c2: BLACK, trim: "stripes" }),
  VE: H("cowboy", "Sombrero llanero", "Filzhut der Viehhirten aus den Llanos.", "#d8c49a", { c2: BLACK }),
  CU: H("straw", "Sombrero de yarey", "Palmstrohhut der Guajiros.", "#e2c77e", { c2: BLACK }),
  PR: H("straw", "Pava", "Breiter Strohhut der Jíbaros.", "#dcc27a", { c2: RED }),
  CR: H("straw", "Chonete", "Heller Stoffhut der Boyeros.", "#efe3c2", { c2: BLACK }),
};

/** Colours for the headband of countries whose flag is drawn by hand. */
const FLAG_COLORS: Record<string, string[]> = {
  CZ: [WHITE, "#d7141a", "#11457e"],
  SK: [WHITE, "#0b4ea2", "#ee1c25"],
  SI: [WHITE, "#005da4", "#ed1c24"],
  MK: ["#d20000", "#ffe600", "#d20000"],
  BA: ["#002395", "#fecb00", "#002395"],
  CY: [WHITE, "#d57800", "#4e5b31"],
  MT: [WHITE, "#cf142b"],
  IR: ["#239f40", WHITE, "#da0000"],
  LK: ["#8d153a", "#ffbe29", "#00534e", "#eb7400"],
  SG: ["#ef3340", WHITE],
  NZ: ["#012169", RED, WHITE],
  LY: ["#e70013", BLACK, "#239e46"],
  SO: ["#4189dd", WHITE, "#4189dd"],
  ET: ["#078930", "#fcdd09", "#da121a"],
  KE: [BLACK, "#bb0000", "#006600"],
  SN: ["#00853f", "#fdef42", "#e31b23"],
  CM: ["#007a5e", "#ce1126", "#fcd116"],
  CD: ["#007fff", "#f7d618", "#ce1021"],
  ZA: ["#007749", "#ffb81c", "#e03c31", "#001489"],
  JM: ["#009b3a", "#fed100", BLACK],
  DO: ["#002d62", WHITE, "#ce1126"],
  GT: ["#4997d0", WHITE, "#4997d0"],
  HN: ["#0073cf", WHITE, "#0073cf"],
  SV: ["#0047ab", WHITE, "#0047ab"],
  HT: ["#00209f", "#d21034"],
};

function flagColors(code: string): string[] {
  const f = COUNTRY[code]?.flag;
  const list = f && (f.t === "h" || f.t === "v") ? f.c : f && f.t === "nordic" ? [f.bg, f.cross, f.bg] : FLAG_COLORS[code] ?? [WHITE, BLACK];
  // Two neighbouring stripes of the same colour read as one; four is all a headband holds.
  return list.filter((c, i) => i === 0 || c.toLowerCase() !== list[i - 1].toLowerCase()).slice(0, 4);
}

/** The headwear of a country: its own, or a headband in its colours. */
export function hatOf(code: string): Hat | null {
  const land = COUNTRY[code];
  if (!land) return null;
  const own = Object.prototype.hasOwnProperty.call(LIST, code) ? LIST[code] : null;
  if (own) return own;
  const cs = flagColors(code);
  return {
    style: "band",
    name: `Stirnband ${land.name}`,
    desc: "Für die Matte gebunden, in den Farben der Flagge.",
    c: cs[0],
    cs,
    fallback: true,
  };
}

/** Countries that have their own headwear, not a headband. */
export const OWN_HAT = new Set(Object.keys(LIST));

/** Every country, for tests and the passport. */
export const HAT_COUNTRIES = COUNTRIES.map((c) => c.code);

/** The part of the avatar's drawing a hat takes up, for item icons (a square around it). */
export function hatBox(style?: string): string {
  switch (style) {
    case "keffiyeh":
      return "52 20 136 136";
    case "ushanka":
    case "chullo":
      return "58 22 124 124";
    case "wreath":
      return "60 30 120 120";
    case "band":
      return "66 30 136 136";
    case "mongkol":
      return "62 6 132 132";
    case "sombrero":
    case "cowboy":
    case "straw":
    case "conical":
    case "salakot":
    case "gat":
      return "38 0 164 164";
    case "tyrolean":
    case "panama":
    case "boater":
    case "flatbrim":
    case "bowler":
    case "welsh":
    case "couro":
      return "56 4 128 128";
    default:
      return "70 12 100 100";
  }
}
