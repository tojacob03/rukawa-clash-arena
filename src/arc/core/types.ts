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
export type SeaId = "frost" | "morgen" | "abend" | "glut";
export type SportId = "ringen" | "judo" | "sambo" | "kraft" | "ausdauer" | "striking" | "mma" | "mobility";

/** Character look. Indices point into the palettes and option lists in avatarOptions.ts; *Hex fields are custom colours. */
export interface Look {
  // Body
  skin: number;
  skinHex?: string;
  /** -2 … 2: leg length. */
  height: number;
  /** -2 … 2: width, on top of the weight from the profile. */
  build: number;
  /** 0 … 3: arm and shoulder size. */
  muscle: number;
  // Head
  faceShape: number;
  ears: number;
  // Eyes
  eyeShape: number;
  eyeColor: number;
  eyeHex?: string;
  /** Second eye colour (heterochromia), -1 for none. */
  eyeColor2: number;
  /** -2 … 2 */
  eyeSize: number;
  /** -2 … 2 */
  eyeGap: number;
  lashes: number;
  brows: number;
  // Nose and mouth
  nose: number;
  mouth: number;
  // Hair
  hair: number;
  hairColor: number;
  hairHex?: string;
  /** Highlight colour for tips and strands, -1 for none. */
  hairTips: number;
  beard: number;
  // Marks and decoration
  marks: string[];
  tattoo: number;
  /** 0 left, 1 right, 2 both arms. */
  tattooSide: number;
  neckTattoo: boolean;
  earring: number;
  /** Legacy expression from the first editor, only read when migrating. */
  face?: number;
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

export type CompResult = "win" | "loss" | "draw";
/** Submission, points, advantages, referee decision, disqualification, walkover. */
export type CompMethod = "sub" | "points" | "adv" | "ref" | "dq" | "wo";

export interface CompMatch {
  result: CompResult;
  method: CompMethod;
  /** Technique that finished the match (own submission win or the one you lost to). */
  tech?: string | null;
  oppBelt?: Belt;
}

export interface Competition {
  id: string;
  date: string;
  name: string;
  /** Organiser or rule set, free text (e.g. IBJJF, ADCC, AJP, local). */
  org?: string;
  attire: Attire;
  /** Weight class as written on the bracket, e.g. "-76 kg" or "Absolute". */
  weight?: string;
  matches: CompMatch[];
  /** 1–3 podium, 0 no placement. */
  place: number;
  createdAt: number;
}

/** A session of another sport (strength, wrestling, running …). */
export interface CrossSession {
  id: string;
  date: string;
  sport: SportId;
  minutes: number;
  /** 1 easy, 2 medium, 3 hard. */
  intensity: number;
  /** Stand-up technique drilled or tried (grappling sports only). */
  tech?: string | null;
  att?: number;
  succ?: number;
  createdAt: number;
}

export interface Profile {
  name: string;
  belt: Belt;
  stripes: number;
  /** Belt at sign-up; the Power Level and the prologue start from it. */
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
  /** Home sea on the sea chart (white belt route). */
  homeSea?: SeaId;
  /** Other sports, with the year you started. */
  sports?: { id: SportId; since?: number }[];
  /** Weight classes typed in for competitions, offered again next time. */
  weightClasses?: string[];
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
  competitions?: Competition[];
  cross?: CrossSession[];
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
  /** Body values 0 … 100 from other sports in the last 8 weeks. */
  body: { kraft: number; ausdauer: number; beweglichkeit: number; week: number; total: number };
  /** Competition record. */
  comps: { events: number; w: number; l: number; d: number; subs: number; medals: [number, number, number] };
}
