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

import type { ArcData, ArcState, QuestKind, Rarity, Session, Slot } from "./types.ts";
import { COUNTRY } from "./countries.ts";
import { TECH } from "./techniques.ts";
import { ROMAN, SEALS } from "./lore.ts";
import { dayNum } from "./model.ts";

export type Source =
  | { t: "start" }
  | { t: "drop" }
  | { t: "level"; n: number }
  | { t: "sessions"; n: number }
  | { t: "rolls"; n: number }
  | { t: "seal"; id: string }
  | { t: "arc"; n: number }
  | { t: "country"; code: string }
  | { t: "tokui"; tech: string };

export type Perk =
  | { t: "session"; xp: number }
  | { t: "quest"; kind: QuestKind; pct: number }
  | { t: "roll"; xp: number }
  | { t: "open"; xp: number };

export interface ItemArt {
  c?: string;
  c2?: string;
  lapel?: string;
  stitch?: string;
  pattern?: "solid" | "rank" | "wave" | "bolt" | "petals" | "tiger" | "stars" | "flame";
  style?: string;
  emblem?: "logo" | "flame" | "crown" | "wave" | "star" | "flag" | "tokui";
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
  I("gi_gold", "Goldkragen-Gi", "gi", "legendary", { t: "seal", id: "tokui" }, "Weiß mit goldenem Revers. Für die erste Tokui-Waza.", { c: "#f4f1ea", lapel: "#f1bf57", stitch: "#d99b2c" }),

  // No-Gi tops
  I("rg_rang", "Rang-Rashguard", "top", "common", { t: "start" }, "In der Farbe deines Gürtels.", { pattern: "rank" }),
  I("rg_schwarz", "Rashguard Schwarz", "top", "common", { t: "start" }, "Passt zu allem, vor allem zu Schweiß.", { c: "#1d1d26", c2: "#34406b", pattern: "solid" }),
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
  I("sp_schwarz", "Spats Schwarz", "bottom", "common", { t: "sessions", n: 5 }, "Lange Leggings unter oder statt Shorts.", { c: "#1d1d26", style: "spats" }),
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

  // Accessories
  I("ex_tape", "Fingertape", "extra", "common", { t: "sessions", n: 10 }, "Gi-Grips haben ihren Preis.", { style: "tape" }),
  I("ex_knie", "Kniebandagen", "extra", "common", { t: "drop" }, "Sichtbar im No-Gi.", { c: "#2a2a36", style: "knee" }),
  I("ex_handtuch", "Handtuch", "extra", "rare", { t: "drop" }, "Über der Schulter, zwischen den Runden.", { c: "#6fb3c9", style: "towel" }),
  I("ex_medaille", "Medaille", "extra", "epic", { t: "seal", id: "strong" }, "Drei Quest-Treffer gegen Stärkere.", { c: "#f1bf57", style: "medal" }),

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

  // Patches
  I("pa_waza", "Waza-Arc-Abzeichen", "patch", "common", { t: "start" }, "Das Zeichen der App.", { emblem: "logo" }),
  I("pa_stern", "Erster Stern", "patch", "common", { t: "seal", id: "first" }, "Für das erste Training.", { emblem: "star" }),
  I("pa_welle", "Arc-Welle", "patch", "rare", { t: "arc", n: 1 }, "Für den zweiten Arc.", { emblem: "wave" }),
  I("pa_flamme", "Flammen-Abzeichen", "patch", "rare", { t: "seal", id: "flame4" }, "Vier Wochen Flamme.", { emblem: "flame" }),
  I("pa_krone", "Boss-Krone", "patch", "epic", { t: "seal", id: "boss" }, "Einen Wochenboss besiegt.", { emblem: "crown" }),
];

/** Items that depend on the profile or on progress: flags and Tokui patches. */
export function dynamicItems(data: ArcData, st: ArcState): ItemDef[] {
  const out: ItemDef[] = [];
  for (const code of data.profile?.countries ?? []) {
    const c = COUNTRY[code];
    if (c) out.push(I(`flag:${code}`, `Flagge ${c.name}`, "patch", "common", { t: "country", code }, "Aus deinem Steckbrief.", { emblem: "flag", code }));
  }
  for (const id of st.tokui) {
    out.push(I(`tokui:${id}`, `Tokui-Aufnäher: ${TECH[id].name}`, "patch", "legendary", { t: "tokui", tech: id }, "Für eine Technik auf Tokui-Waza-Stufe.", { emblem: "tokui", code: id }));
  }
  return out;
}

export const ITEM = Object.fromEntries(ITEMS.map((x) => [x.id, x])) as Record<string, ItemDef>;
export const itemById = (id: string, data: ArcData, st: ArcState) => ITEM[id] ?? dynamicItems(data, st).find((x) => x.id === id);

export const DEFAULT_EQUIP: Partial<Record<Slot, string>> = { gi: "gi_weiss", top: "rg_rang", bottom: "sh_schwarz", patch2: "pa_waza" };

export function unlockText(src: Source): string {
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
      (s.t === "arc" && st.arc.index >= s.n);
    if (ok) owned.set(x.id, { id: x.id, via: unlockText(s) });
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
