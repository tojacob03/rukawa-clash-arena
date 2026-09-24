// Shared types for Waza Arc. Everything the app stores is plain JSON so it
// can live in localStorage today and move to Supabase (schema "arc") later.

export type Belt = "weiss" | "blau" | "lila" | "braun" | "schwarz";
export type Size = "leichter" | "gleich" | "schwerer";
export type Attire = "gi" | "nogi";
export type Format = "class" | "open";
export type Control = 0 | 0.5 | 1;
export type QuestKind = "kata" | "jagd" | "stand" | "schmiede";
export type SectorId = "guard" | "sub" | "ctrl" | "pass" | "stand" | "def";
export type Tier = 0 | 1 | 2 | 3 | 4;
export type ClassId = "netzweber" | "druckwalze" | "anker" | "schatten" | "jaeger" | "ferse" | "sturm" | "festung" | "wandler";
export type Slot = "gi" | "top" | "bottom" | "head" | "extra" | "trait" | "talisman" | "aura" | "patch1" | "patch2" | "patch3";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Look {
  skin: number;
  hair: number;
  hairColor: number;
  eyeColor: number;
  face: number;
  beard: number;
}

export interface Character {
  look: Look;
  equipped: Partial<Record<Slot, string>>;
  /** Which outfit the avatar shows. */
  mode: Attire;
  /** Item ids the player has already looked at (for the "neu" badge). */
  seen: string[];
}

export type TechKind =
  | "position"
  | "sweep"
  | "sub"
  | "pass"
  | "takedown"
  | "escape"
  | "control"
  | "backtake"
  | "defense"
  | "movement";

export interface Technique {
  id: string;
  name: string;
  aka: string[];
  sector: SectorId | "fund";
  /** Fundament nodes sit in the centre, pointing at this sector. */
  dir?: SectorId;
  branch: string;
  tier: Tier;
  kind: TechKind;
  pre: string[];
  gi: boolean;
  nogi: boolean;
  /** Joint locks and moves that injure fast when applied carelessly. */
  caution: boolean;
  note?: string;
}

export interface Roll {
  belt: Belt;
  size: Size;
  /** Submissions I finished. */
  sf: number;
  /** Submissions my partner finished. */
  sa: number;
  c: Control;
}

export interface QuestResult {
  node: string;
  kind: QuestKind;
  xp: number;
  att: number;
  succ: number;
  done: boolean;
}

export interface Session {
  id: string;
  date: string;
  format: Format;
  attire: Attire;
  taught: string | null;
  rolls: Roll[];
  quest: QuestResult | null;
  worked: string | null;
  stuck: string | null;
  createdAt: number;
  /** XP from equipped talismans, fixed when the session was saved. */
  bonus?: number;
}

export interface Profile {
  name: string;
  belt: Belt;
  stripes: number;
  /** Belt at sign-up; the Ki rating and the prologue start from it. */
  startBelt: Belt;
  startStripes?: number;
  weeklyGoal: number;
  createdAt: string;
  /** ISO 3166 codes (plus ENG, SCO), shown as patches. */
  countries?: string[];
  birthYear?: number;
  weightKg?: number;
  /** YYYY-MM */
  trainingSince?: string;
  /** Chosen play style. */
  cls?: ClassId;
}

export interface Promotion {
  date: string;
  belt: Belt;
  stripes: number;
}

export interface AcceptedQuest {
  day: string;
  node: string;
  kind: QuestKind;
  xp: number;
}

export interface ArcData {
  v: 1;
  profile: Profile | null;
  /** known: seen or drilled (level 2). claims: self-assessed 3 ("klappt im Roll") or 4 ("Stärke"). */
  onboarding: { date: string; known: string[]; claims?: Record<string, number> } | null;
  sessions: Session[];
  /** Week numbers (see weekOf) in healing mode. */
  pauses: number[];
  promotions: Promotion[];
  ui: {
    accepted?: AcceptedQuest;
    rerollDay?: string;
    todayAttire?: { day: string; attire: Attire };
  };
  character?: Character;
  demo?: boolean;
}

export interface NodeState {
  /** Shown level: the higher of data and self-assessment. */
  level: number;
  /** Level proven by logged data. */
  dataLevel: number;
  /** Self-assessed level from onboarding (0, 3 or 4). */
  claim: number;
  prog: number;
  M: number;
  K: number;
  A: number;
  b: number;
  exp: number;
  expOnb: number;
  rawAtt: number;
  rawSucc: number;
  nw: number;
  sw: number;
  mu: number;
  lbw: number;
  sStrong: number;
  dLast: number | null;
  dAny: number | null;
  rust: boolean;
  prov: boolean;
  fog: boolean;
}

export interface Attr {
  /** True while unconfirmed self-assessments feed the tree value. */
  claimed: boolean;
  baum: number;
  form: number | null;
  val: number;
}

export type ReasonKey = "prog" | "unc" | "rust" | "weak" | "taught" | "explore" | "prove";

export interface QuestOffer {
  node: string;
  kind: QuestKind;
  xp: number;
  P: number;
  reason: ReasonKey;
}

export interface Boss {
  key: string;
  hp: number;
  prev: number;
}

export interface ArcState {
  asOf: number;
  ru: number;
  ruSeries: { d: number; r: number }[];
  nodes: Record<string, NodeState>;
  attrs: Record<SectorId, Attr>;
  xp: number;
  /** XP from the time before the app (belt and stripes at the start). */
  prologXp: number;
  lvl: number;
  lo: number;
  hi: number;
  streak: number;
  weekNow: number;
  weekGoal: number;
  paused: boolean;
  /** Class the data points to. */
  clsDetected: ClassId;
  cls: string;
  title: string;
  tokui: string[];
  boss: Boss | null;
  offers: QuestOffer[];
  sessions: number;
  rolls: number;
  recentRolls: number;
  discovered: number;
  activeCombos: number;
  seals: { id: string; got: boolean }[];
  arc: { index: number; week: number };
}
