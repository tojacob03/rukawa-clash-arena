// Items: clothing, accessories, talismans, auras and patches.
//
// The inventory is not stored. It follows from the logged data: start gear,
// milestones (level, trainings, rolls, seals, arcs), your countries and
// Tokui-Waza, and random drops after trainings. Drops are seeded by the date
// and the position of the session on that day, so the same data always gives
// the same loot, and deleting and re-saving a training does not re-roll it.
//
// Talismans only add XP (effort), never mastery: they make training more fun
// without bending what the app measures.

import type { ArcData, ArcState, Belt, QuestKind, Rarity, Session, Slot } from "./types.ts";
import { DEFAULT_SEA, ISLAND, rankIndex } from "./sea.ts";
import type { SeaId } from "./sea.ts";
import { COUNTRY } from "./countries.ts";
import { TECH } from "./techniques.ts";
import { ROMAN, SEALS } from "./lore.ts";
import { dayNum, isoOf } from "./model.ts";
import { reachedIsles } from "./voyage.ts";

export type Source =
  | { t: "start" }
  | { t: "drop" }
  | { t: "level"; n: number }
  | { t: "sessions"; n: number }
  | { t: "rolls"; n: number }
  | { t: "seal"; id: string }
  | { t: "arc"; n: number }
  | { t: "country"; code: string }
  | { t: "tokui"; tech: string }
  /**
   * Reaching an island on the sea chart (`home:2` is the third island of any
   * home sea), or the belt and stripe that used to stand for it.
   */
  | { t: "rank"; belt: Belt; stripes: number; isle?: string }
  /** Competitions: first one, a placement, a submission win. */
  | { t: "comp"; what: "first" | "place" | "subwin"; n?: number };

export type Perk =
  | { t: "session"; xp: number }
  | { t: "quest"; kind: QuestKind; pct: number }
  | { t: "roll"; xp: number }
  | { t: "open"; xp: number };

export type PatternKind =
  | "solid"
  | "rank"
  | "wave"
  | "bolt"
  | "petals"
  | "tiger"
  | "stars"
  | "flame"
  | "stripes"
  | "split"
  | "camo"
  | "hex"
  | "sunset"
  | "chevron"
  | "kraken"
  | "chart"
  | "checker"
  | "scales"
  | "side"
  | "plain";

export interface ItemArt {
  c?: string;
  c2?: string;
  /** Spats colour under shorts (style "combo"). */
  c3?: string;
  lapel?: string;
  stitch?: string;
  pattern?: PatternKind;
  /** Tops: sleeve length. */
  sleeve?: "long" | "short" | "none";
  style?: string;
  emblem?: "logo" | "flame" | "crown" | "wave" | "star" | "flag" | "tokui" | "anchor" | "skull" | "compass";
  code?: string;
}

export interface ItemDef {
  id: string;
  name: string;
  slot: Slot | "patch";
  rarity: Rarity;
  desc: string;
  src: Source;
  art: ItemArt;
  perk?: Perk;
}

export const RARITY: Record<Rarity, { name: string; color: string }> = {
  common: { name: "Gewöhnlich", color: "#c3cbe0" },
  rare: { name: "Selten", color: "#5f90ea" },
  epic: { name: "Episch", color: "#9a73f0" },
  legendary: { name: "Legendär", color: "#f1bf57" },
};

export const SLOTS: { id: Slot; name: string; accepts: ItemDef["slot"] }[] = [
  { id: "gi", name: "Gi", accepts: "gi" },
  { id: "top", name: "Oberteil (No-Gi)", accepts: "top" },
  { id: "bottom", name: "Unterteil (No-Gi)", accepts: "bottom" },
  { id: "head", name: "Kopf", accepts: "head" },
  { id: "extra", name: "Accessoire", accepts: "extra" },
  { id: "trait", name: "Merkmal", accepts: "trait" },
  { id: "talisman", name: "Talisman", accepts: "talisman" },
  { id: "aura", name: "Aura", accepts: "aura" },
  { id: "patch1", name: "Aufnäher Schulter", accepts: "patch" },
  { id: "patch2", name: "Aufnäher Brust", accepts: "patch" },
  { id: "patch3", name: "Aufnäher Bein", accepts: "patch" },
];

const I = (id: string, name: string, slot: ItemDef["slot"], rarity: Rarity, src: Source, desc: string, art: ItemArt = {}, perk?: Perk): ItemDef => ({
  id,
  name,
  slot,
  rarity,
  src,
  desc,
  art,
  perk,
});

export const ITEMS: ItemDef[] = [
  // Gi
  I("gi_weiss", "Weißer Gi", "gi", "common", { t: "start" }, "Der Klassiker. Frisch gewaschen riecht er nach Anfang.", { c: "#f4f1ea", lapel: "#e2d9c6" }),
  I("gi_blau", "Blauer Gi", "gi", "common", { t: "start" }, "Für alle, die Weiß nach dem dritten Training schon grau hatten.", { c: "#2d55a8", lapel: "#22448a" }),
  I("gi_schwarz", "Schwarzer Gi", "gi", "rare", { t: "drop" }, "Wirkt im Stand bedrohlich, in der Sauna weniger.", { c: "#1d1d26", lapel: "#2c2c3a" }),
  I("gi_sakura", "Sakura-Gi", "gi", "rare", { t: "drop" }, "Zartrosa. Wer darüber lacht, landet im Triangle.", { c: "#f3b3c8", lapel: "#e593ae" }),
  I("gi_asche", "Aschegrauer Gi", "gi", "rare", { t: "drop" }, "Die Farbe nach hundert Rolls.", { c: "#8e929c", lapel: "#747884" }),
  I("gi_oliv", "Oliv-Gi", "gi", "rare", { t: "drop" }, "Tarnt nichts, sieht aber so aus.", { c: "#5d6b3c", lapel: "#4a5630" }),
  I("gi_koi", "Koi-Gi", "gi", "epic", { t: "drop" }, "Weiß mit orangefarbenem Revers, wie ein Koi im Teich.", { c: "#f4f1ea", lapel: "#e8743b", stitch: "#e8743b" }),
  I("gi_aizome", "Aizome-Gi", "gi", "epic", { t: "arc", n: 1 }, "Mit Indigo gefärbt, wie traditionelle Kampfkunst-Kleidung.", { c: "#2a3470", lapel: "#1c2452", stitch: "#8fb0ff" }),
  I("gi_mitternacht", "Mitternachts-Gi", "gi", "epic", { t: "level", n: 15 }, "Dunkelblau mit goldener Naht.", { c: "#141b3a", lapel: "#0d1330", stitch: "#f1bf57" }),
  I("gi_sturm", "Sturmgrauer Gi", "gi", "epic", { t: "rank", belt: "braun", stripes: 1, isle: "c11" }, "Grau wie der Himmel über der Sturmkrone.", { c: "#5a6070", lapel: "#3d4250", stitch: "#9cc3ff" }),
  I("gi_gold", "Goldkragen-Gi", "gi", "legendary", { t: "seal", id: "tokui" }, "Weiß mit goldenem Revers. Für die erste Tokui-Waza.", { c: "#f4f1ea", lapel: "#f1bf57", stitch: "#d99b2c" }),

  // No-Gi tops
  I("rg_rang", "Rang-Rashguard", "top", "common", { t: "start" }, "In der Farbe deines Gürtels, kurze Ärmel.", { pattern: "rank", sleeve: "short" }),
  I("rg_schwarz", "Rashguard Schwarz", "top", "common", { t: "start" }, "Passt zu allem, vor allem zu Schweiß.", { c: "#1d1d26", c2: "#34406b", pattern: "solid" }),
  I("rg_weiss_k", "Rashguard Weiß, kurz", "top", "common", { t: "start" }, "Kurze Ärmel, damit man die Tattoos sieht.", { c: "#f4f1ea", c2: "#c3cbe0", pattern: "side", sleeve: "short" }),
  I("rg_navy_k", "Rashguard Navy, kurz", "top", "common", { t: "start" }, "Dunkelblau mit hellen Seitenstreifen.", { c: "#1b2a55", c2: "#f4f1ea", pattern: "side", sleeve: "short" }),
  I("ts_grau", "Trainingsshirt Grau", "top", "common", { t: "start" }, "Das Shirt, das in jeder Sporttasche liegt.", { c: "#6b7080", pattern: "plain", sleeve: "short" }),
  I("tt_schwarz", "Tanktop Schwarz", "top", "common", { t: "start" }, "Für Drills an heißen Tagen.", { c: "#1d1d26", pattern: "plain", sleeve: "none" }),
  I("rg_rot_k", "Rashguard Rot, kurz", "top", "common", { t: "sessions", n: 3 }, "Rot mit schwarzen Seiten.", { c: "#b3261e", c2: "#1d1d26", pattern: "side", sleeve: "short" }),
  I("rg_split", "Rashguard Zweifarbig", "top", "rare", { t: "sessions", n: 8 }, "Halb Nacht, halb Gold.", { c: "#1d1d26", c2: "#f1bf57", pattern: "split" }),
  I("rg_ringel", "Rashguard Ringel", "top", "common", { t: "sessions", n: 15 }, "Matrosenstreifen für Leute, die bald in See stechen.", { c: "#f4f1ea", c2: "#1b2a55", pattern: "stripes", sleeve: "short" }),
  I("rg_waben", "Rashguard Waben", "top", "rare", { t: "sessions", n: 25 }, "Sechsecke wie auf der Sternkarte.", { c: "#141c34", c2: "#5f90ea", pattern: "hex" }),
  I("rg_zickzack", "Rashguard Zickzack", "top", "rare", { t: "sessions", n: 40 }, "Pink auf Nacht. Laut und stolz.", { c: "#2a1b2e", c2: "#e46aa6", pattern: "chevron", sleeve: "short" }),
  I("rg_tarn", "Rashguard Tarnmuster", "top", "rare", { t: "rolls", n: 50 }, "Tarnt nicht, aber sieht nach Arbeit aus.", { c: "#3b4a2f", c2: "#7d8c56", pattern: "camo" }),
  I("rg_schuppen", "Rashguard Fischschuppen", "top", "epic", { t: "rolls", n: 300 }, "Glatt wie ein Fisch, schwer zu greifen.", { c: "#0e3b4a", c2: "#4fc3c9", pattern: "scales" }),
  I("rg_nachtgold", "Rashguard Nachtgold", "top", "rare", { t: "level", n: 10 }, "Dunkelblau mit goldenen Streifen. Ab Level 10.", { c: "#141c34", c2: "#f1bf57", pattern: "stripes" }),
  I("tt_rot", "Tanktop Rot", "top", "common", { t: "drop" }, "Zeigt Arme und Absichten.", { c: "#b3261e", pattern: "plain", sleeve: "none" }),
  I("ts_blau", "Trainingsshirt Blau", "top", "common", { t: "drop" }, "Weich, bequem, nach drei Rolls nass.", { c: "#2d55a8", pattern: "plain", sleeve: "short" }),
  I("rg_oliv_k", "Rashguard Oliv, kurz", "top", "common", { t: "drop" }, "Schlicht, dunkelgrün.", { c: "#4a5630", c2: "#1d1d26", pattern: "side", sleeve: "short" }),
  I("rg_karo", "Rashguard Schachbrett", "top", "rare", { t: "drop" }, "Jeder Zug geplant.", { c: "#23232e", c2: "#5a5f70", pattern: "checker" }),
  I("rg_abendrot", "Rashguard Abendrot", "top", "rare", { t: "drop" }, "Sonnenuntergang über dem Abendmeer.", { c: "#2a1b4a", c2: "#ff8a3d", pattern: "sunset", sleeve: "short" }),
  I("rg_krake", "Rashguard Krake", "top", "epic", { t: "drop" }, "Acht Arme für mehr Griffe.", { c: "#101838", c2: "#9a73f0", pattern: "kraken" }),
  I("rg_seekarte", "Rashguard Seekarte", "top", "epic", { t: "drop" }, "Auf Pergament gedruckt: der Kurs zur nächsten Insel.", { c: "#e9dcc0", c2: "#6b4a2b", pattern: "chart", sleeve: "short" }),
  I("rg_stroemung", "Rashguard Große Strömung", "top", "epic", { t: "rank", belt: "blau", stripes: 0, isle: "c0" }, "Für alle, die durch das Tor der vier Strömungen gesegelt sind.", { c: "#0f3a6b", c2: "#9cc3ff", pattern: "wave" }),
  I("rg_tiefsee", "Rashguard Tiefsee", "top", "epic", { t: "rank", belt: "braun", stripes: 0, isle: "c10" }, "Aus der Tiefen Strömung hinter dem Kammpass.", { c: "#06121f", c2: "#26b5b0", pattern: "kraken" }),
  I("rg_kuro", "Rashguard Schwarzkliff", "top", "legendary", { t: "rank", belt: "schwarz", stripes: 0, isle: "c15" }, "Schwarz mit goldenen Sternen. Für die Klippe, an der das eigentliche Lernen beginnt.", { c: "#0c0c10", c2: "#f1bf57", pattern: "stars" }),
  I("rg_champion", "Rashguard Champion", "top", "epic", { t: "comp", what: "place", n: 1 }, "Für Gold auf einem Turnier.", { c: "#1d1d26", c2: "#f1bf57", pattern: "bolt", sleeve: "short" }),
  I("rg_nebel", "Rashguard Nebel", "top", "common", { t: "drop" }, "Grau-blau wie die Matte um sechs Uhr morgens.", { c: "#2b2f4a", c2: "#9aa3c7", pattern: "solid" }),
  I("rg_welle", "Rashguard Welle", "top", "rare", { t: "drop" }, "Wellenmuster für Leute, die gern rollen.", { c: "#1e3f7a", c2: "#9cc3ff", pattern: "wave" }),
  I("rg_koi", "Rashguard Koi", "top", "rare", { t: "drop" }, "Orangefarbene Wellen auf Weiß.", { c: "#f4f1ea", c2: "#e8743b", pattern: "wave" }),
  I("rg_blitz", "Rashguard Blitz", "top", "rare", { t: "drop" }, "Für schnelle Pässe und schnellere Ausreden.", { c: "#23232e", c2: "#ffd24a", pattern: "bolt" }),
  I("rg_sakura", "Rashguard Kirschblüte", "top", "epic", { t: "drop" }, "Blütenblätter auf Nachtschwarz.", { c: "#2a1b2e", c2: "#f3a6c0", pattern: "petals" }),
  I("rg_tiger", "Rashguard Tigerstreifen", "top", "epic", { t: "level", n: 18 }, "Orange mit schwarzen Streifen.", { c: "#e08a2c", c2: "#1d1d26", pattern: "tiger" }),
  I("rg_stern", "Rashguard Sternbild", "top", "epic", { t: "seal", id: "map50" }, "Deine Sternkarte zum Anziehen.", { c: "#101838", c2: "#f1bf57", pattern: "stars" }),
  I("rg_phoenix", "Rashguard Phönix", "top", "legendary", { t: "level", n: 25 }, "Aus der Asche jedes verlorenen Rolls.", { c: "#b3261e", c2: "#ffcf5a", pattern: "flame" }),
  I("rg_drache", "Rashguard Drachenschuppe", "top", "legendary", { t: "drop" }, "Grüne Flammen. Seltener als ein sauberer Berimbolo.", { c: "#0f3d2e", c2: "#4fd18b", pattern: "flame" }),

  // No-Gi bottoms
  I("sh_schwarz", "Shorts Schwarz", "bottom", "common", { t: "start" }, "Grappling-Shorts ohne Taschen.", { c: "#1d1d26", style: "shorts" }),
  I("sp_schwarz", "Spats Schwarz", "bottom", "common", { t: "start" }, "Lange Leggings unter oder statt Shorts.", { c: "#1d1d26", style: "spats" }),
  I("sh_navy", "Shorts Navy", "bottom", "common", { t: "start" }, "Mit weißen Seitenstreifen.", { c: "#1b2a55", c2: "#f4f1ea", style: "shorts", pattern: "side" }),
  I("cb_schwarz", "Shorts über Spats", "bottom", "common", { t: "start" }, "Die klassische Kombi.", { c: "#1d1d26", c3: "#34406b", style: "combo" }),
  I("sh_streifen", "Shorts Seitenstreifen", "bottom", "common", { t: "sessions", n: 5 }, "Grau mit roten Streifen.", { c: "#5a5f70", c2: "#c8302a", style: "shorts", pattern: "side" }),
  I("cb_blau", "Combo Blau", "bottom", "common", { t: "sessions", n: 12 }, "Blaue Shorts über schwarzen Spats.", { c: "#2d55a8", c3: "#1d1d26", style: "combo" }),
  I("sp_tarn", "Spats Tarnmuster", "bottom", "rare", { t: "sessions", n: 30 }, "Passt zum Tarn-Rashguard.", { c: "#3b4a2f", c2: "#7d8c56", style: "spats", pattern: "camo" }),
  I("sh_karo", "Shorts Schachbrett", "bottom", "rare", { t: "rolls", n: 100 }, "Für Strategen.", { c: "#23232e", c2: "#5a5f70", style: "shorts", pattern: "checker" }),
  I("sp_tiger", "Spats Tigerstreifen", "bottom", "epic", { t: "level", n: 15 }, "Orange mit schwarzen Streifen. Ab Level 15.", { c: "#e08a2c", c2: "#1d1d26", style: "spats", pattern: "tiger" }),
  I("sh_matrose", "Shorts Matrose", "bottom", "rare", { t: "rank", belt: "weiss", stripes: 2, isle: "home:2" }, "Marineblau mit weißen Streifen. Für die dritte Insel deines Heimatmeers.", { c: "#1b2a55", c2: "#f4f1ea", style: "shorts", pattern: "stripes" }),
  I("sp_kamm", "Spats Scharlachkamm", "bottom", "epic", { t: "rank", belt: "lila", stripes: 0, isle: "c9" }, "Rot wie der große Kamm, vor dem die Wartende Mauer liegt.", { c: "#6b1320", c2: "#e0453c", style: "spats", pattern: "chevron" }),
  I("sp_waben", "Spats Waben", "bottom", "rare", { t: "drop" }, "Sechsecke bis zum Knöchel.", { c: "#141c34", c2: "#5f90ea", style: "spats", pattern: "hex" }),
  I("sh_flamme", "Shorts Flamme", "bottom", "rare", { t: "drop" }, "Heiß wie ein Scramble.", { c: "#1d1d26", c2: "#ff7a2c", style: "shorts", pattern: "flame" }),
  I("sp_schuppen", "Spats Fischschuppen", "bottom", "epic", { t: "drop" }, "Passt zum Schuppen-Rashguard.", { c: "#0e3b4a", c2: "#4fc3c9", style: "spats", pattern: "scales" }),
  I("cb_koi", "Combo Koi", "bottom", "rare", { t: "drop" }, "Weiße Shorts über orangen Spats.", { c: "#f4f1ea", c3: "#e8743b", style: "combo" }),
  I("sh_abendrot", "Shorts Abendrot", "bottom", "common", { t: "drop" }, "Die Sonne geht unten weiter.", { c: "#2a1b4a", c2: "#ff8a3d", style: "shorts", pattern: "sunset" }),
  I("sh_rot", "Shorts Rot", "bottom", "common", { t: "drop" }, "Signalfarbe.", { c: "#b3261e", style: "shorts" }),
  I("sh_blau", "Shorts Blau", "bottom", "common", { t: "drop" }, "Passt zum blauen Gürtel, den man im No-Gi nicht trägt.", { c: "#2d55a8", style: "shorts" }),
  I("sp_grau", "Spats Grau", "bottom", "common", { t: "drop" }, "Unauffällig. Genau richtig für Leglocks.", { c: "#5a5f70", style: "spats" }),
  I("sp_welle", "Spats Welle", "bottom", "rare", { t: "drop" }, "Passt zur Welle oben.", { c: "#1e3f7a", c2: "#9cc3ff", style: "spats", pattern: "wave" }),
  I("sp_galaxie", "Spats Galaxie", "bottom", "epic", { t: "drop" }, "Sterne bis zu den Knöcheln.", { c: "#1a1440", c2: "#b89cff", style: "spats", pattern: "stars" }),
  I("sh_gold", "Shorts Gold", "bottom", "legendary", { t: "seal", id: "boss" }, "Für alle, die einen Boss besiegt haben.", { c: "#d9a23a", style: "shorts" }),

  // Head
  I("hd_band_weiss", "Hachimaki, weiß", "head", "common", { t: "sessions", n: 1 }, "Stirnband für das erste eingetragene Training.", { c: "#f4f1ea", style: "band" }),
  I("hd_ohr", "Ohrenschützer", "head", "common", { t: "drop" }, "Gegen Blumenkohlohren. Meistens.", { c: "#2a2a36", style: "ears" }),
  I("hd_band_schwarz", "Hachimaki, schwarz", "head", "common", { t: "drop" }, "Ernst gemeint.", { c: "#1d1d26", style: "band" }),
  I("hd_band_rot", "Hachimaki, rot", "head", "rare", { t: "drop" }, "Rot heißt: heute wird gejagt.", { c: "#c8302a", style: "band" }),
  I("hd_band_gold", "Hachimaki, gold", "head", "legendary", { t: "level", n: 30 }, "Ab Level 30.", { c: "#f1bf57", style: "band" }),
  I("hd_bandana_rot", "Bandana Rot", "head", "common", { t: "drop" }, "Für No-Gi-Tage mit Stil.", { c: "#b3261e", style: "bandana" }),
  I("hd_bandana_nacht", "Bandana Nacht", "head", "rare", { t: "sessions", n: 20 }, "Dunkel mit weißen Punkten.", { c: "#1b2a55", style: "bandana" }),
  I("hd_piratentuch", "Piratentuch", "head", "epic", { t: "rank", belt: "weiss", stripes: 4, isle: "home:4" }, "Für die letzte Insel vor dem Tor.", { c: "#1d1d26", style: "bandana" }),

  // Accessories
  I("ex_tape", "Fingertape", "extra", "common", { t: "sessions", n: 10 }, "Gi-Grips haben ihren Preis.", { style: "tape" }),
  I("ex_knie", "Kniebandagen", "extra", "common", { t: "drop" }, "Sichtbar im No-Gi.", { c: "#2a2a36", style: "knee" }),
  I("ex_handtuch", "Handtuch", "extra", "rare", { t: "drop" }, "Über der Schulter, zwischen den Runden.", { c: "#6fb3c9", style: "towel" }),
  I("ex_medaille", "Medaille", "extra", "epic", { t: "seal", id: "strong" }, "Drei Quest-Treffer gegen Stärkere.", { c: "#f1bf57", style: "medal" }),
  I("ex_bronze", "Turniermedaille Bronze", "extra", "rare", { t: "comp", what: "place", n: 3 }, "Dritter Platz auf einem Turnier.", { c: "#c47a3a", style: "medal" }),
  I("ex_silber", "Turniermedaille Silber", "extra", "epic", { t: "comp", what: "place", n: 2 }, "Zweiter Platz auf einem Turnier.", { c: "#c9ced6", style: "medal" }),
  I("ex_gold", "Turniermedaille Gold", "extra", "legendary", { t: "comp", what: "place", n: 1 }, "Erster Platz auf einem Turnier.", { c: "#f1bf57", style: "medal" }),

  // Traits
  I("tr_ohr", "Blumenkohlohr", "trait", "rare", { t: "rolls", n: 200 }, "Nach 200 Rolls. Ein Abzeichen, das man nicht mehr ablegt.", { style: "ear" }),
  I("tr_narbe", "Narbe", "trait", "rare", { t: "level", n: 12 }, "Kleine Narbe über der Augenbraue.", { style: "scar" }),

  // Talismans
  I("tl_omamori", "Omamori des Fleißes", "talisman", "common", { t: "sessions", n: 3 }, "Glücksbringer für Dranbleiber.", {}, { t: "session", xp: 10 }),
  I("tl_rolle", "Kata-Rolle", "talisman", "rare", { t: "drop" }, "Eine Schriftrolle voller Wiederholungen.", {}, { t: "quest", kind: "kata", pct: 50 }),
  I("tl_zahn", "Jägerzahn", "talisman", "rare", { t: "drop" }, "Für alle, die auf der Jagd sind.", {}, { t: "quest", kind: "jagd", pct: 25 }),
  I("tl_knoten", "Eiserner Knoten", "talisman", "rare", { t: "drop" }, "Hält, wenn es eng wird.", {}, { t: "quest", kind: "stand", pct: 25 }),
  I("tl_hammer", "Schmiedehammer", "talisman", "rare", { t: "seal", id: "combo" }, "Schlägt Rost von alten Techniken.", {}, { t: "quest", kind: "schmiede", pct: 50 }),
  I("tl_glocke", "Open-Mat-Glocke", "talisman", "rare", { t: "drop" }, "Klingt nach freiem Rollen.", {}, { t: "open", xp: 30 }),
  I("tl_mond", "Mondstein", "talisman", "rare", { t: "drop" }, "Leuchtet nach jedem Roll ein bisschen heller.", {}, { t: "roll", xp: 2 }),
  I("tl_flamme", "Flammenamulett", "talisman", "epic", { t: "seal", id: "flame12" }, "Zwölf Wochen Flamme in einem Anhänger.", {}, { t: "roll", xp: 3 }),

  // Auras
  I("au_blau", "Blaue Flamme", "aura", "rare", { t: "seal", id: "ten" }, "Zehn Trainings. Es brennt.", { c: "#5f90ea" }),
  I("au_gold", "Goldene Aura", "aura", "epic", { t: "seal", id: "star4" }, "Die erste geschärfte Technik.", { c: "#f1bf57" }),
  I("au_sakura", "Kirschblütenregen", "aura", "epic", { t: "arc", n: 2 }, "Ab Arc III.", { c: "#f3a6c0" }),
  I("au_sterne", "Sternenstaub", "aura", "epic", { t: "drop" }, "Funkelt bei jedem Sweep.", { c: "#b89cff" }),
  I("au_donner", "Donnerschlag", "aura", "legendary", { t: "level", n: 20 }, "Ab Level 20 knistert die Luft.", { c: "#ffe39a" }),
  I("au_gischt", "Gischt", "aura", "legendary", { t: "rank", belt: "braun", stripes: 2, isle: "c12" }, "Salzwasser und Wind der Tiefen Strömung.", { c: "#9cc3ff" }),

  // Patches
  I("pa_waza", "Waza-Arc-Abzeichen", "patch", "common", { t: "start" }, "Das Zeichen der App.", { emblem: "logo" }),
  I("pa_stern", "Erster Stern", "patch", "common", { t: "seal", id: "first" }, "Für das erste Training.", { emblem: "star" }),
  I("pa_welle", "Arc-Welle", "patch", "rare", { t: "arc", n: 1 }, "Für den zweiten Arc.", { emblem: "wave" }),
  I("pa_flamme", "Flammen-Abzeichen", "patch", "rare", { t: "seal", id: "flame4" }, "Vier Wochen Flamme.", { emblem: "flame" }),
  I("pa_krone", "Boss-Krone", "patch", "epic", { t: "seal", id: "boss" }, "Einen Wochenboss besiegt.", { emblem: "crown" }),
  I("pa_anker", "Anker", "patch", "common", { t: "rank", belt: "weiss", stripes: 1, isle: "home:1" }, "Du bist nicht mehr ganz neu im Hafen.", { emblem: "anchor" }),
  I("pa_kompass", "Kompass", "patch", "rare", { t: "rank", belt: "blau", stripes: 2, isle: "c2" }, "Der Kurs stimmt.", { emblem: "compass" }),
  I("pa_flagge", "Totenkopfflagge", "patch", "epic", { t: "rank", belt: "lila", stripes: 2, isle: "c7" }, "Die alte Piratenflagge: Du segelst unter eigener Flagge.", { emblem: "skull", c: "#1d1d26", c2: "#f4f1ea" }),
  I("pa_arena", "Arena-Abzeichen", "patch", "rare", { t: "comp", what: "first" }, "Für dein erstes Turnier.", { emblem: "star", c: "#6b1320", c2: "#f1bf57" }),
  I("pa_finisher", "Finisher", "patch", "epic", { t: "comp", what: "subwin" }, "Ein Turnierkampf per Aufgabe gewonnen.", { emblem: "flame", c: "#1d1d26" }),
];

/** Items that depend on the profile or on progress: flags and Tokui patches. */
/** A flag or Tokui patch from its id alone ("flag:DE", "tokui:armbar"), e.g. on a friend's avatar. */
export function dynamicItem(id: string): ItemDef | undefined {
  const [kind, code = ""] = id.split(":");
  const has = (o: object) => Object.prototype.hasOwnProperty.call(o, code);
  if (kind === "flag" && has(COUNTRY)) return I(id, `Flagge ${COUNTRY[code].name}`, "patch", "common", { t: "country", code }, "Aus deinem Steckbrief.", { emblem: "flag", code });
  if (kind === "tokui" && has(TECH)) return I(id, `Tokui-Aufnäher: ${TECH[code].name}`, "patch", "legendary", { t: "tokui", tech: code }, "Für eine Technik auf Tokui-Waza-Stufe.", { emblem: "tokui", code });
  return undefined;
}

export function dynamicItems(data: ArcData, st: ArcState): ItemDef[] {
  const ids = [...(data.profile?.countries ?? []).map((c) => `flag:${c}`), ...st.tokui.map((t) => `tokui:${t}`)];
  return ids.map(dynamicItem).filter((x): x is ItemDef => !!x);
}

export const ITEM = Object.fromEntries(ITEMS.map((x) => [x.id, x])) as Record<string, ItemDef>;
export const itemById = (id: string, data: ArcData, st: ArcState) => ITEM[id] ?? dynamicItems(data, st).find((x) => x.id === id);

export const DEFAULT_EQUIP: Partial<Record<Slot, string>> = { gi: "gi_weiss", top: "rg_rang", bottom: "sh_schwarz", patch2: "pa_waza" };

const BELT_NAME: Record<Belt, string> = { weiss: "Weiß", blau: "Blau", lila: "Lila", braun: "Braun", schwarz: "Schwarz" };

export function unlockText(src: Source, sea: SeaId = DEFAULT_SEA): string {
  switch (src.t) {
    case "start":
      return "Startausrüstung";
    case "drop":
      return "Zufallsbeute nach dem Training";
    case "level":
      return `Ab Level ${src.n}`;
    case "sessions":
      return `${src.n} ${src.n === 1 ? "Training" : "Trainings"} eingetragen`;
    case "rolls":
      return `${src.n} Roll-Karten`;
    case "seal":
      return `Siegel „${SEALS.find((s) => s.id === src.id)?.name ?? src.id}“`;
    case "arc":
      return `Arc ${ROMAN[src.n]} erreichen`;
    case "country":
      return "Land im Steckbrief";
    case "tokui":
      return "Tokui-Waza erreichen";
    case "rank": {
      const rank = `${BELT_NAME[src.belt]}gurt${src.stripes ? `, ${src.stripes}. Streifen` : ""}`;
      const is = src.isle ? ISLAND[src.isle.startsWith("home:") ? `${sea}${src.isle.slice(5)}` : src.isle] : null;
      return is ? `Insel ${is.name} erreichen oder ${rank}` : rank;
    }
    case "comp":
      return src.what === "first" ? "Erstes Turnier eingetragen" : src.what === "subwin" ? "Turnierkampf per Aufgabe gewonnen" : `${src.n}. Platz auf einem Turnier`;
  }
}

export function perkText(p: Perk): string {
  switch (p.t) {
    case "session":
      return `+${p.xp} XP pro Training`;
    case "quest":
      return `+${p.pct} % XP auf ${{ kata: "Kata", jagd: "Jagd", stand: "Standhalten", schmiede: "Schmiede" }[p.kind]}-Quests`;
    case "roll":
      return `+${p.xp} XP pro Roll-Karte`;
    case "open":
      return `+${p.xp} XP pro Open Mat`;
  }
}

/** FNV-1a hash of a string, mapped to [0, 1). */
function rand(key: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

export interface Owned {
  id: string;
  via: string;
  date?: string;
}

/** Everything the player owns, derived from the data. */
export function inventory(data: ArcData, st: ArcState): Map<string, Owned> {
  const owned = new Map<string, Owned>();
  const got = new Set(st.seals.filter((s) => s.got).map((s) => s.id));
  const p = data.profile;
  const rank = p ? rankIndex(p.belt, p.stripes) : 0;
  const sea = p?.homeSea ?? DEFAULT_SEA;
  const comps = (data.competitions ?? []).filter((c) => dayNum(c.date) <= st.asOf);
  const isles = reachedIsles(data, isoOf(st.asOf));
  const reached = (id: string) => (id.startsWith("home:") ? [...isles].some((x) => /^(frost|morgen|abend|glut)\d$/.test(x) && x.endsWith(id.slice(5))) : isles.has(id));
  for (const x of [...ITEMS, ...dynamicItems(data, st)]) {
    const s = x.src;
    const ok =
      s.t === "start" ||
      s.t === "country" ||
      s.t === "tokui" ||
      (s.t === "level" && st.lvl >= s.n) ||
      (s.t === "sessions" && st.sessions >= s.n) ||
      (s.t === "rolls" && st.rolls >= s.n) ||
      (s.t === "seal" && got.has(s.id)) ||
      (s.t === "arc" && st.arc.index >= s.n) ||
      (s.t === "rank" && (rank >= rankIndex(s.belt, s.stripes) || (!!s.isle && reached(s.isle)))) ||
      (s.t === "comp" &&
        (s.what === "first"
          ? comps.length > 0
          : s.what === "subwin"
            ? comps.some((c) => c.matches.some((m) => m.result === "win" && m.method === "sub"))
            : comps.some((c) => c.place === s.n)));
    if (ok) owned.set(x.id, { id: x.id, via: unlockText(s, sea) });
  }

  // Random drops, in order of the trainings. A drop can be a duplicate of an
  // item you already own; then nothing new is found, which keeps the rare
  // pieces rare.
  const drops = ITEMS.filter((x) => x.src.t === "drop");
  const sessions = data.sessions
    .filter((s) => dayNum(s.date) <= st.asOf)
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
  const perDay: Record<string, number> = {};
  for (const s of sessions) {
    const k = `${s.date}#${(perDay[s.date] = (perDay[s.date] ?? 0) + 1)}`;
    if (rand(k + ":drop") >= dropChance(s)) continue;
    const r = rand(k + ":rarity");
    const rarity: Rarity = r < 0.03 ? "legendary" : r < 0.15 ? "epic" : r < 0.45 ? "rare" : "common";
    const pool = drops.filter((x) => x.rarity === rarity);
    const item = pool[Math.floor(rand(k + ":pick") * pool.length)];
    if (item && !owned.has(item.id)) owned.set(item.id, { id: item.id, via: "Beute nach dem Training", date: s.date });
  }
  return owned;
}

export function dropChance(s: Session) {
  const q = s.quest;
  let p = 0.12;
  if (q && q.kind !== "kata" && q.succ > 0) p += 0.13;
  if (q && q.kind === "kata" && q.done) p += 0.08;
  if (s.worked || s.stuck) p += 0.04;
  return p;
}

/** XP a session earns from the equipped talisman. */
export function talismanBonus(talisman: ItemDef | undefined, s: Pick<Session, "rolls" | "quest" | "format">) {
  const p = talisman?.perk;
  if (!p) return 0;
  switch (p.t) {
    case "session":
      return p.xp;
    case "roll":
      return p.xp * s.rolls.length;
    case "open":
      return s.format === "open" ? p.xp : 0;
    case "quest": {
      const q = s.quest;
      if (!q || q.kind !== p.kind || (q.kind === "kata" ? !q.done : q.att <= 0)) return 0;
      return Math.round((q.xp * p.pct) / 100);
    }
  }
}
