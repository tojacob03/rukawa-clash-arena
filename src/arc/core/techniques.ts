// The Waza library: every technique on the star map.
//
// Names follow what is said on German BJJ mats (mostly the English or
// Portuguese terms). Japanese names use Kodokan spelling with hyphens,
// German judo names follow the Deutscher Judo-Bund. Named techniques
// (Tarikoplata, Baratoplata, Williams Guard, Estima Lock ...) carry the name
// the grappling community uses for them.
//
// Tiers are rings on the map: 0 Fundament, 1 Shoden, 2 Chuden, 3 Okuden,
// 4 Hiden. `pre` is the in-sector prerequisite, cross-sector links live in
// COMBOS.

import type { SectorId, TechKind, Technique, Tier } from "./types.ts";

export interface Sector {
  id: SectorId;
  name: string;
  /** Pooled baseline success rate for the sector's form value. */
  b: number;
  kanji: string;
  branches: { id: string; name: string }[];
}

export const SECTORS: Sector[] = [
  {
    id: "guard",
    name: "Guard",
    b: 0.3,
    kanji: "守",
    branches: [
      { id: "closed", name: "Closed Guard" },
      { id: "open", name: "Offene Guard" },
      { id: "half", name: "Half Guard" },
      { id: "hook", name: "Haken & Beine" },
      { id: "lapel", name: "Gi-Guards" },
    ],
  },
  {
    id: "sub",
    name: "Submission",
    b: 0.18,
    kanji: "極",
    branches: [
      { id: "arm", name: "Armhebel" },
      { id: "tri", name: "Dreiecke & Schulterhebel" },
      { id: "lapel", name: "Kragenwürger" },
      { id: "head", name: "Kopf-Arm & Front Headlock" },
      { id: "leg", name: "Beinhebel" },
    ],
  },
  {
    id: "ctrl",
    name: "Kontrolle",
    b: 0.4,
    kanji: "固",
    branches: [
      { id: "pin", name: "Seitliche Pins" },
      { id: "mount", name: "Mount" },
      { id: "back", name: "Rücken" },
      { id: "ride", name: "Turtle & Front Headlock" },
    ],
  },
  {
    id: "pass",
    name: "Passing",
    b: 0.25,
    kanji: "突",
    branches: [
      { id: "open", name: "Guard öffnen" },
      { id: "pressure", name: "Druck" },
      { id: "speed", name: "Beweglich" },
    ],
  },
  {
    id: "stand",
    name: "Stand",
    b: 0.25,
    kanji: "投",
    branches: [
      { id: "wrestle", name: "Ringen" },
      { id: "judo", name: "Judo-Würfe" },
      { id: "pull", name: "Guard Pull & Opferwürfe" },
      { id: "clinch", name: "Clinch & Griffe" },
    ],
  },
  {
    id: "def",
    name: "Verteidigung",
    b: 0.3,
    kanji: "逃",
    branches: [
      { id: "pin", name: "Pin-Escapes" },
      { id: "back", name: "Rücken & Turtle" },
      { id: "sub", name: "Submission-Abwehr" },
      { id: "leg", name: "Beinhebel-Abwehr" },
    ],
  },
];

export const SECTOR = Object.fromEntries(SECTORS.map((s) => [s.id, s])) as Record<SectorId, Sector>;

interface Opts {
  aka?: string[];
  gi?: boolean;
  nogi?: boolean;
  caution?: boolean;
  note?: string;
}

const t = (
  id: string,
  name: string,
  sector: SectorId,
  branch: string,
  tier: Tier,
  kind: TechKind,
  pre: string[],
  o: Opts = {},
): Technique => ({
  id,
  name,
  aka: o.aka ?? [],
  sector,
  branch,
  tier,
  kind,
  pre,
  gi: o.gi ?? true,
  nogi: o.nogi ?? true,
  caution: o.caution ?? false,
  note: o.note,
});

const f = (id: string, name: string, dir: SectorId, aka: string[] = []): Technique => ({
  id,
  name,
  aka,
  sector: "fund",
  dir,
  branch: "fund",
  tier: 0,
  kind: "movement",
  pre: [],
  gi: true,
  nogi: true,
  caution: false,
});

const GI_ONLY = { nogi: false } as const;
const CAUTION_LEG = {
  caution: true,
  note: "Beinhebel greifen schnell und ohne viel Vorwarnung. Kontrolliert ansetzen, früh lösen, und das Regelwerk prüfen: Viele erlauben ihn erst ab bestimmten Gürteln.",
};

export const TECHS: Technique[] = [
  // ── Fundament ──────────────────────────────────────────────────────────
  f("f_shrimp", "Shrimp", "guard", ["Hüftflucht", "Ebi"]),
  f("f_grips", "Grip Fighting", "sub", ["Griffkampf", "Grips"]),
  f("f_base", "Base", "ctrl", ["Base & Gewicht"]),
  f("f_posture", "Posture", "pass", ["Haltung"]),
  f("f_breakfall", "Breakfall", "stand", ["Fallschule", "Ukemi"]),
  f("f_bridge", "Bridge", "def", ["Brücke", "Upa"]),

  // ── Guard ──────────────────────────────────────────────────────────────
  t("g_closed", "Closed Guard", "guard", "closed", 1, "position", ["f_shrimp"], { aka: ["Geschlossene Guard", "Guarda fechada"] }),
  t("g_scissor", "Scissor Sweep", "guard", "closed", 2, "sweep", ["g_closed"], { aka: ["Scheren-Sweep"] }),
  t("g_hipbump", "Hip Bump Sweep", "guard", "closed", 2, "sweep", ["g_closed"], { aka: ["Sit-up Sweep"] }),
  t("g_flower", "Flower Sweep", "guard", "closed", 2, "sweep", ["g_closed"], { aka: ["Pendulum Sweep"] }),
  t("g_highguard", "High Guard", "guard", "closed", 3, "position", ["g_closed"], { aka: ["Climbing Guard"] }),
  t("g_williams", "Williams Guard", "guard", "closed", 4, "position", ["g_highguard"], { aka: ["Shoulder Pin Guard"], note: "Benannt nach Shawn Williams. Eine High-Guard-Variante mit Griff unter dem eigenen Bein." }),
  t("g_rubber", "Rubber Guard", "guard", "closed", 4, "position", ["g_highguard"]),

  t("g_retention", "Guard Retention", "guard", "open", 1, "movement", ["f_shrimp"], { aka: ["Guard Recovery"] }),
  t("g_seated", "Seated Guard", "guard", "open", 2, "position", ["g_retention"], { aka: ["Sitting Guard"] }),
  t("g_butterfly", "Butterfly Guard", "guard", "open", 2, "position", ["g_retention"]),
  t("g_balloon", "Balloon Sweep", "guard", "open", 3, "sweep", ["g_retention"]),
  t("g_tripod", "Tripod Sweep", "guard", "open", 3, "sweep", ["g_seated"]),
  t("g_sickle", "Sickle Sweep", "guard", "open", 3, "sweep", ["g_tripod"]),
  t("g_bfsweep", "Butterfly Sweep", "guard", "open", 3, "sweep", ["g_butterfly"], { aka: ["Hook Sweep"] }),
  t("g_elevator", "Elevator Sweep", "guard", "open", 3, "sweep", ["g_butterfly"]),
  t("g_shin2shin", "Shin-to-Shin", "guard", "open", 3, "position", ["g_seated"]),
  t("g_kguard", "K-Guard", "guard", "open", 4, "position", ["g_shin2shin"]),

  t("g_half", "Half Guard unten", "guard", "half", 1, "position", ["f_shrimp"], { aka: ["Meia-guarda"] }),
  t("g_kneeshield", "Knee Shield", "guard", "half", 2, "position", ["g_half"], { aka: ["Z-Guard"] }),
  t("g_oldschool", "Old School Sweep", "guard", "half", 2, "sweep", ["g_half"]),
  t("g_lockdown", "Lockdown", "guard", "half", 2, "position", ["g_half"]),
  t("g_dogfight", "Dogfight", "guard", "half", 3, "position", ["g_half"], { note: "Aus der Half Guard mit Underhook auf die Knie kommen." }),
  t("g_deephalf", "Deep Half Guard", "guard", "half", 3, "position", ["g_half"]),
  t("g_electric", "Electric Chair Sweep", "guard", "half", 3, "sweep", ["g_lockdown"]),
  t("g_waiter", "Waiter Sweep", "guard", "half", 4, "sweep", ["g_deephalf"]),

  t("g_dlr", "De La Riva Guard", "guard", "hook", 2, "position", ["g_retention"], { aka: ["DLR"] }),
  t("g_rdlr", "Reverse De La Riva", "guard", "hook", 3, "position", ["g_dlr"], { aka: ["RDLR"] }),
  t("g_xguard", "X-Guard", "guard", "hook", 3, "position", ["g_butterfly"]),
  t("g_slx", "Single Leg X", "guard", "hook", 3, "position", ["g_xguard"], { aka: ["SLX", "Ashi Garami"] }),
  t("g_xsweep", "X-Guard Sweep", "guard", "hook", 4, "sweep", ["g_xguard"]),
  t("g_berimbolo", "Berimbolo", "guard", "hook", 4, "backtake", ["g_dlr"]),
  t("g_kod", "Kiss of the Dragon", "guard", "hook", 4, "backtake", ["g_rdlr"]),
  t("g_5050", "50/50 Guard", "guard", "hook", 4, "position", ["g_slx"]),
  t("g_outsideashi", "Outside Ashi Garami", "guard", "hook", 4, "position", ["g_slx"], { aka: ["Outside Ashi"] }),
  t("g_saddle", "Saddle", "guard", "hook", 4, "position", ["g_slx"], { aka: ["Inside Sankaku", "411", "Honey Hole", "Cross Ashi Garami"] }),

  t("g_spider", "Spider Guard", "guard", "lapel", 2, "position", ["g_retention"], GI_ONLY),
  t("g_lasso", "Lasso Guard", "guard", "lapel", 3, "position", ["g_spider"], GI_ONLY),
  t("g_collarsleeve", "Collar-Sleeve Guard", "guard", "lapel", 3, "position", ["g_spider"], GI_ONLY),
  t("g_worm", "Worm Guard", "guard", "lapel", 4, "position", ["g_dlr"], { ...GI_ONLY, note: "Revers-Guard: das Revers des Partners wird um sein Bein geführt." }),

  // ── Submission ─────────────────────────────────────────────────────────
  t("s_americana", "Americana", "sub", "arm", 1, "sub", ["f_grips"], { aka: ["Keylock", "Ude-garami"] }),
  t("s_armbar_g", "Armbar aus der Guard", "sub", "arm", 1, "sub", ["f_grips"], { aka: ["Juji-gatame"] }),
  t("s_kimura", "Kimura", "sub", "arm", 2, "sub", ["s_americana"], { aka: ["Gyaku-ude-garami", "Double Wristlock"] }),
  t("s_armbar_m", "Armbar aus dem Mount", "sub", "arm", 2, "sub", ["s_armbar_g"]),
  t("s_wrist", "Wristlock", "sub", "arm", 3, "sub", ["s_americana"], { aka: ["Handgelenkhebel"] }),
  t("s_bicep", "Biceps Slicer", "sub", "arm", 3, "sub", ["s_armbar_g"], { aka: ["Bizeps-Slicer", "Bicep Slicer"] }),
  t("s_kimtrap", "Kimura Trap", "sub", "arm", 3, "position", ["s_kimura"], { note: "Kimura-Griff als Kontrollsystem: Sweeps, Rückennahme und Finish aus einem Griff." }),
  t("s_flyarmbar", "Flying Armbar", "sub", "arm", 4, "sub", ["s_armbar_g"]),

  t("s_triangle", "Triangle", "sub", "tri", 2, "sub", ["s_armbar_g"], { aka: ["Sankaku-jime"] }),
  t("s_omoplata", "Omoplata", "sub", "tri", 3, "sub", ["s_triangle"]),
  t("s_revtriangle", "Reverse Triangle", "sub", "tri", 3, "sub", ["s_triangle"]),
  t("s_gogo", "Gogoplata", "sub", "tri", 4, "sub", ["s_triangle"]),
  t("s_monoplata", "Monoplata", "sub", "tri", 4, "sub", ["s_omoplata"], { note: "Schulterhebel mit nur einem Bein, oft das Finish, wenn die Omoplata abgewehrt wird." }),
  t("s_barata", "Baratoplata", "sub", "tri", 4, "sub", ["s_omoplata"], { note: "Benannt nach Rafael „Barata“ Freitas." }),
  t("s_tarik", "Tarikoplata", "sub", "tri", 4, "sub", ["s_kimura"], { note: "Benannt nach Tarik Hopstock. Kimura-Variante mit Bein-Arm-Rahmen." }),

  t("s_crosscollar", "Cross Collar Choke", "sub", "lapel", 1, "sub", ["f_grips"], { ...GI_ONLY, aka: ["Juji-jime"] }),
  t("s_bowarrow", "Bow & Arrow Choke", "sub", "lapel", 2, "sub", ["s_crosscollar"], GI_ONLY),
  t("s_loop", "Loop Choke", "sub", "lapel", 3, "sub", ["s_crosscollar"], GI_ONLY),
  t("s_clock", "Clock Choke", "sub", "lapel", 3, "sub", ["s_crosscollar"], GI_ONLY),
  t("s_baseball", "Baseball Bat Choke", "sub", "lapel", 3, "sub", ["s_crosscollar"], GI_ONLY),
  t("s_ezekiel", "Ezekiel Choke", "sub", "lapel", 3, "sub", ["s_crosscollar"], { aka: ["Sode-guruma-jime"] }),
  t("s_papercutter", "Paper Cutter Choke", "sub", "lapel", 4, "sub", ["s_crosscollar"], GI_ONLY),

  t("s_rnc", "Rear Naked Choke", "sub", "head", 1, "sub", ["f_grips"], { aka: ["Hadaka-jime", "Mata Leão"] }),
  t("s_guillotine", "Guillotine", "sub", "head", 2, "sub", ["f_grips"]),
  t("s_armtriangle", "Arm Triangle", "sub", "head", 2, "sub", ["f_grips"], { aka: ["Kata-gatame", "Head and Arm Choke"] }),
  t("s_highelbow", "High-Elbow Guillotine", "sub", "head", 3, "sub", ["s_guillotine"]),
  t("s_anaconda", "Anaconda Choke", "sub", "head", 3, "sub", ["s_guillotine"]),
  t("s_darce", "D'Arce Choke", "sub", "head", 3, "sub", ["s_armtriangle"]),
  t("s_nschoke", "North-South Choke", "sub", "head", 3, "sub", ["s_armtriangle"]),
  t("s_peruvian", "Peruvian Necktie", "sub", "head", 4, "sub", ["s_anaconda"]),
  t("s_japanese", "Japanese Necktie", "sub", "head", 4, "sub", ["s_darce"]),
  t("s_vonflue", "Von Flue Choke", "sub", "head", 4, "sub", ["s_guillotine"], { note: "Konter gegen die Guillotine: Schulterdruck aus Side Control." }),

  t("s_ankle", "Straight Ankle Lock", "sub", "leg", 2, "sub", ["f_grips"], { aka: ["Straight Footlock"] }),
  t("s_kneebar", "Kneebar", "sub", "leg", 3, "sub", ["s_ankle"], CAUTION_LEG),
  t("s_toehold", "Toe Hold", "sub", "leg", 3, "sub", ["s_ankle"], CAUTION_LEG),
  t("s_heel_out", "Outside Heel Hook", "sub", "leg", 3, "sub", ["s_ankle"], CAUTION_LEG),
  t("s_heel_in", "Inside Heel Hook", "sub", "leg", 4, "sub", ["s_heel_out"], CAUTION_LEG),
  t("s_estima", "Estima Lock", "sub", "leg", 4, "sub", ["s_ankle"], { ...CAUTION_LEG, note: "Fußhebel, benannt nach den Brüdern Braulio und Victor Estima. " + CAUTION_LEG.note }),
  t("s_calfslicer", "Calf Slicer", "sub", "leg", 4, "sub", ["s_kneebar"], { ...CAUTION_LEG, aka: ["Calf Crusher"] }),
  t("s_bananasplit", "Banana Split", "sub", "leg", 4, "sub", ["s_kneebar"], CAUTION_LEG),

  // ── Kontrolle ──────────────────────────────────────────────────────────
  t("c_side", "Side Control", "ctrl", "pin", 1, "control", ["f_base"], { aka: ["100 Kilos", "Yoko-shiho-gatame"] }),
  t("c_kesa", "Kesa-gatame", "ctrl", "pin", 2, "control", ["c_side"], { aka: ["Scarf Hold"] }),
  t("c_ns", "North-South", "ctrl", "pin", 2, "control", ["c_side"], { aka: ["Kami-shiho-gatame"] }),
  t("c_kob", "Knee on Belly", "ctrl", "pin", 2, "control", ["c_side"], { aka: ["Knee Ride"] }),
  t("c_revkesa", "Reverse Kesa", "ctrl", "pin", 3, "control", ["c_kesa"], { aka: ["Ushiro-kesa-gatame", "Reverse Scarf Hold"] }),
  t("c_kuzure", "Kuzure-kesa-gatame", "ctrl", "pin", 3, "control", ["c_kesa"], { aka: ["Modified Scarf Hold"] }),
  t("c_flow", "Pin-Wechsel", "ctrl", "pin", 3, "movement", ["c_kob"], { note: "Flüssig zwischen Side Control, Knee on Belly, Mount und North-South wechseln." }),
  t("c_crucifix", "Crucifix", "ctrl", "pin", 4, "control", ["c_turtletop"]),

  t("c_mount", "Mount", "ctrl", "mount", 1, "control", ["f_base"], { aka: ["Tate-shiho-gatame"] }),
  t("c_mountkeep", "Mount halten", "ctrl", "mount", 2, "control", ["c_mount"]),
  t("c_highmount", "High Mount", "ctrl", "mount", 2, "control", ["c_mount"]),
  t("c_smount", "S-Mount", "ctrl", "mount", 3, "control", ["c_highmount"]),
  t("c_techmount", "Technical Mount", "ctrl", "mount", 3, "control", ["c_mount"]),
  t("c_giftwrap", "Gift Wrap", "ctrl", "mount", 3, "control", ["c_mountkeep"]),

  t("c_backctrl", "Back Control", "ctrl", "back", 2, "control", ["c_mount"], { aka: ["Seatbelt & Hooks", "Rückenkontrolle"] }),
  t("c_bodytri", "Body Triangle", "ctrl", "back", 3, "control", ["c_backctrl"]),
  t("c_turtleback", "Back Take aus der Turtle", "ctrl", "back", 3, "backtake", ["c_turtletop"]),
  t("c_crabride", "Crab Ride", "ctrl", "back", 4, "backtake", ["c_backctrl"]),
  t("c_truck", "Truck", "ctrl", "back", 4, "control", ["c_turtletop"]),

  t("c_turtletop", "Turtle-Kontrolle", "ctrl", "ride", 2, "control", ["f_base"], { aka: ["Turtle oben"] }),
  t("c_fhl", "Front Headlock", "ctrl", "ride", 2, "control", ["f_base"]),
  t("c_legride", "Leg Ride", "ctrl", "ride", 3, "control", ["c_turtletop"], { aka: ["Leg Riding"] }),
  t("c_spiral", "Spiral Ride", "ctrl", "ride", 4, "control", ["c_legride"]),

  // ── Passing ────────────────────────────────────────────────────────────
  t("p_open", "Guard Break", "pass", "open", 1, "pass", ["f_posture"], { aka: ["Closed Guard öffnen", "Guard öffnen"] }),
  t("p_standbreak", "Standing Guard Break", "pass", "open", 2, "pass", ["p_open"], { aka: ["Guard Break im Stand"] }),

  t("p_pressure", "Pressure", "pass", "pressure", 1, "movement", ["f_posture"], { aka: ["Pressure Passing", "Druck & Gewicht"] }),
  t("p_kneecut", "Knee Cut", "pass", "pressure", 2, "pass", ["p_pressure"], { aka: ["Knee Slice"] }),
  t("p_overunder", "Over-Under Pass", "pass", "pressure", 2, "pass", ["p_pressure"]),
  t("p_doubleunder", "Double-Under Pass", "pass", "pressure", 2, "pass", ["p_pressure"], { aka: ["Stack Pass"] }),
  t("p_bodylock", "Body Lock Pass", "pass", "pressure", 3, "pass", ["p_overunder"]),
  t("p_legweave", "Leg Weave", "pass", "pressure", 3, "pass", ["p_overunder"]),
  t("p_smash", "Half Guard Smash", "pass", "pressure", 3, "pass", ["p_kneecut"], { aka: ["Smash Pass"] }),
  t("p_hq", "Headquarters", "pass", "pressure", 3, "position", ["p_kneecut"], { aka: ["HQ"] }),
  t("p_longstep", "Long Step", "pass", "pressure", 4, "pass", ["p_smash"]),
  t("p_backstep", "Backstep", "pass", "pressure", 4, "pass", ["p_hq"]),

  t("p_toreando", "Toreando", "pass", "speed", 2, "pass", ["p_open"], { aka: ["Torreando", "Bullfighter Pass"] }),
  t("p_legdrag", "Leg Drag", "pass", "speed", 3, "pass", ["p_toreando"]),
  t("p_xpass", "X-Pass", "pass", "speed", 3, "pass", ["p_toreando"]),
  t("p_chain", "Passing Chains", "pass", "speed", 4, "movement", ["p_legdrag"], { aka: ["Pass-Ketten"], note: "Zwischen Pässen wechseln, sobald der Partner eine Seite zumacht." }),

  // ── Stand ──────────────────────────────────────────────────────────────
  t("t_stance", "Stance & Motion", "stand", "wrestle", 1, "movement", ["f_breakfall"], { aka: ["Stance", "Stand & Bewegung"] }),
  t("t_double", "Double Leg", "stand", "wrestle", 2, "takedown", ["t_stance"]),
  t("t_single", "Single Leg", "stand", "wrestle", 2, "takedown", ["t_stance"]),
  t("t_snap", "Snap Down", "stand", "wrestle", 2, "takedown", ["t_stance"]),
  t("t_sprawl", "Sprawl", "stand", "wrestle", 2, "defense", ["t_stance"]),
  t("t_highcrotch", "High Crotch", "stand", "wrestle", 3, "takedown", ["t_single"]),
  t("t_anklepick", "Ankle Pick", "stand", "wrestle", 3, "takedown", ["t_snap"]),
  t("t_bodylocktd", "Body Lock Takedown", "stand", "wrestle", 3, "takedown", ["t_double"]),
  t("t_whizzer", "Whizzer", "stand", "wrestle", 3, "defense", ["t_sprawl"], { aka: ["Overhook-Abwehr"] }),
  t("t_fireman", "Fireman's Carry", "stand", "wrestle", 4, "takedown", ["t_highcrotch"]),
  t("t_matreturn", "Mat Return", "stand", "wrestle", 4, "takedown", ["t_bodylocktd"]),

  t("t_osoto", "O-soto-gari", "stand", "judo", 2, "takedown", ["f_breakfall"], { aka: ["Große Außensichel"] }),
  t("t_ouchi", "O-uchi-gari", "stand", "judo", 2, "takedown", ["f_breakfall"], { aka: ["Große Innensichel"] }),
  t("t_ogoshi", "O-goshi", "stand", "judo", 2, "takedown", ["f_breakfall"], { aka: ["Großer Hüftwurf"] }),
  t("t_kouchi", "Ko-uchi-gari", "stand", "judo", 3, "takedown", ["t_ouchi"], { aka: ["Kleine Innensichel"] }),
  t("t_deashi", "De-ashi-barai", "stand", "judo", 3, "takedown", ["t_kouchi"], { aka: ["Fußfeger"] }),
  t("t_seoi", "Seoi-nage", "stand", "judo", 3, "takedown", ["t_ogoshi"], { aka: ["Schulterwurf"] }),
  t("t_tani", "Tani-otoshi", "stand", "judo", 3, "takedown", ["t_osoto"], { aka: ["Talfallzug"] }),
  t("t_uchimata", "Uchi-mata", "stand", "judo", 4, "takedown", ["t_ogoshi"], { aka: ["Innenschenkelwurf"] }),
  t("t_harai", "Harai-goshi", "stand", "judo", 4, "takedown", ["t_ogoshi"], { aka: ["Hüftfeger"] }),
  t("t_kataguruma", "Kata-guruma", "stand", "judo", 4, "takedown", ["t_seoi"], { aka: ["Schulterrad"] }),

  t("t_pull", "Guard Pull", "stand", "pull", 1, "position", ["f_breakfall"]),
  t("t_tomoe", "Tomoe-nage", "stand", "pull", 3, "takedown", ["t_pull"], { aka: ["Kopfwurf"] }),
  t("t_sumi", "Sumi-gaeshi", "stand", "pull", 3, "takedown", ["t_pull"], { aka: ["Eckenwurf"] }),
  t("t_jumpguard", "Jump Guard", "stand", "pull", 3, "position", ["t_pull"], { aka: ["Flying Guard"], caution: true, note: "Belastet die Knie des Partners. Nur abgesprochen, und in vielen Regelwerken eingeschränkt." }),
  t("t_imanari", "Imanari Roll", "stand", "pull", 4, "position", ["t_pull"], { note: "Rolle in eine Beinverknotung, benannt nach Masakazu Imanari." }),

  t("t_techstand", "Technical Stand-up", "stand", "clinch", 1, "movement", ["f_breakfall"], { aka: ["Aufstehen in Base"] }),
  t("t_collartie", "Collar Tie", "stand", "clinch", 2, "position", ["t_stance"]),
  t("t_russian", "Russian Tie", "stand", "clinch", 3, "position", ["t_collartie"], { aka: ["2-on-1"] }),
  t("t_armdrag", "Arm Drag", "stand", "clinch", 3, "takedown", ["t_collartie"]),

  // ── Verteidigung ───────────────────────────────────────────────────────
  t("d_mount", "Mount Escape (Upa)", "def", "pin", 1, "escape", ["f_bridge"], { aka: ["Trap and Roll"] }),
  t("d_side", "Side Control Escape", "def", "pin", 1, "escape", ["f_bridge"]),
  t("d_elbow", "Elbow-Knee Escape", "def", "pin", 2, "escape", ["d_mount"], { aka: ["Shrimp Escape"] }),
  t("d_frames", "Frames & Distanz", "def", "pin", 2, "defense", ["d_side"], { aka: ["Framing"] }),
  t("d_kob", "Knee-on-Belly-Escape", "def", "pin", 2, "escape", ["d_side"]),
  t("d_kesa", "Kesa-gatame-Escape", "def", "pin", 3, "escape", ["d_side"]),
  t("d_ns", "North-South-Escape", "def", "pin", 3, "escape", ["d_side"]),
  t("d_ghost", "Ghost Escape", "def", "pin", 3, "escape", ["d_frames"]),

  t("d_turtle", "Turtle (defensiv)", "def", "back", 2, "defense", ["f_bridge"]),
  t("d_hipheist", "Hip Heist", "def", "back", 2, "movement", ["f_bridge"]),
  t("d_back", "Back Escape", "def", "back", 3, "escape", ["d_elbow"], { aka: ["Shoulder Walk"] }),
  t("d_granby", "Granby Roll", "def", "back", 3, "escape", ["d_turtle"]),
  t("d_sitout", "Sit-Out", "def", "back", 3, "escape", ["d_turtle"]),
  t("d_bodytri", "Body-Triangle-Escape", "def", "back", 4, "escape", ["d_back"]),

  t("d_chokedef", "Choke-Verteidigung", "def", "sub", 2, "defense", ["f_bridge"], { aka: ["Hand Fighting", "Würgeabwehr"] }),
  t("d_armbardef", "Armbar-Verteidigung", "def", "sub", 2, "defense", ["f_bridge"]),
  t("d_hitchhiker", "Hitchhiker Escape", "def", "sub", 3, "escape", ["d_armbardef"]),
  t("d_tridef", "Triangle-Verteidigung", "def", "sub", 3, "defense", ["d_armbardef"], { aka: ["Posture & Stack"] }),
  t("d_kimuradef", "Kimura-Verteidigung", "def", "sub", 3, "defense", ["d_armbardef"]),
  t("d_guillodef", "Guillotine-Verteidigung", "def", "sub", 3, "defense", ["d_chokedef"]),
  t("d_omodef", "Omoplata-Verteidigung", "def", "sub", 4, "defense", ["d_tridef"]),

  t("d_legdef", "Leglock-Verteidigung", "def", "leg", 3, "defense", ["d_frames"], { aka: ["Beine befreien"] }),
  t("d_heelhide", "Heel Hide", "def", "leg", 4, "defense", ["d_legdef"], { aka: ["Ferse verstecken"] }),
  t("d_5050esc", "50/50 Escape", "def", "leg", 4, "escape", ["d_legdef"], { aka: ["50/50-Befreiung"] }),
];

export const TECH: Record<string, Technique> = Object.fromEntries(TECHS.map((x) => [x.id, x]));

/** Cross-sector links: a sweep that lands in a pin, a pin that sets up a finish. */
export const COMBOS: [string, string, string][] = [
  ["t_pull", "g_closed", "Pull in die Closed Guard"],
  ["g_closed", "s_triangle", "Closed Guard → Triangle"],
  ["g_closed", "s_armbar_g", "Closed Guard → Armbar"],
  ["g_hipbump", "s_kimura", "Hip Bump ↔ Kimura"],
  ["g_scissor", "c_mount", "Scissor Sweep → Mount"],
  ["g_flower", "c_mount", "Flower Sweep → Mount"],
  ["g_highguard", "s_omoplata", "High Guard → Omoplata"],
  ["g_rubber", "s_gogo", "Rubber Guard → Gogoplata"],
  ["g_berimbolo", "c_backctrl", "Berimbolo → Rücken"],
  ["g_kod", "c_backctrl", "Kiss of the Dragon → Rücken"],
  ["g_slx", "s_ankle", "Single Leg X → Straight Ankle Lock"],
  ["g_outsideashi", "s_heel_out", "Outside Ashi → Outside Heel Hook"],
  ["g_saddle", "s_heel_in", "Saddle → Inside Heel Hook"],
  ["s_kimtrap", "c_backctrl", "Kimura Trap → Rücken"],
  ["c_mount", "s_armbar_m", "Mount → Armbar"],
  ["c_mount", "s_americana", "Mount → Americana"],
  ["c_smount", "s_armbar_m", "S-Mount → Armbar"],
  ["c_backctrl", "s_rnc", "Rücken → Rear Naked Choke"],
  ["c_backctrl", "s_bowarrow", "Rücken → Bow & Arrow"],
  ["c_side", "s_kimura", "Side Control → Kimura"],
  ["c_side", "s_papercutter", "Side Control → Paper Cutter"],
  ["c_ns", "s_nschoke", "North-South → North-South Choke"],
  ["c_kob", "s_baseball", "Knee on Belly → Baseball Bat Choke"],
  ["c_fhl", "s_guillotine", "Front Headlock → Guillotine"],
  ["c_fhl", "s_darce", "Front Headlock → D'Arce"],
  ["c_fhl", "s_anaconda", "Front Headlock → Anaconda"],
  ["c_turtletop", "s_clock", "Turtle → Clock Choke"],
  ["c_truck", "s_calfslicer", "Truck → Calf Slicer"],
  ["c_truck", "s_bananasplit", "Truck → Banana Split"],
  ["p_kneecut", "c_side", "Knee Cut → Side Control"],
  ["p_smash", "c_side", "Half Guard Smash → Side Control"],
  ["p_toreando", "c_kob", "Toreando → Knee on Belly"],
  ["p_legdrag", "c_backctrl", "Leg Drag → Rücken"],
  ["t_double", "p_pressure", "Double Leg → Druck-Passing"],
  ["t_snap", "c_fhl", "Snap Down → Front Headlock"],
  ["t_sprawl", "c_fhl", "Sprawl → Front Headlock"],
  ["t_armdrag", "c_backctrl", "Arm Drag → Rücken"],
  ["t_osoto", "c_kesa", "O-soto-gari → Kesa-gatame"],
  ["t_ogoshi", "c_kesa", "O-goshi → Kesa-gatame"],
  ["t_imanari", "g_saddle", "Imanari Roll → Saddle"],
  ["d_elbow", "g_half", "Elbow-Knee → Half Guard"],
  ["d_frames", "g_retention", "Frames → Guard zurück"],
  ["d_granby", "g_retention", "Granby Roll → Guard zurück"],
];

export const NEIGH: Record<string, string[]> = Object.fromEntries(TECHS.map((x) => [x.id, [] as string[]]));
for (const x of TECHS) {
  for (const p of x.pre) {
    NEIGH[x.id].push(p);
    NEIGH[p].push(x.id);
  }
}
for (const [a, b] of COMBOS) {
  NEIGH[a].push(b);
  NEIGH[b].push(a);
}

/** Baseline success rate per attempt, by what the technique is. */
export const BASE: Record<TechKind, number> = {
  position: 0.45,
  sweep: 0.3,
  sub: 0.18,
  pass: 0.25,
  takedown: 0.25,
  escape: 0.3,
  control: 0.4,
  backtake: 0.25,
  defense: 0.35,
  movement: 0.5,
};

export const baseOf = (x: Technique) => BASE[x.kind];
export const sectorName = (x: Technique) => (x.sector === "fund" ? "Fundament" : SECTOR[x.sector].name);
export const branchName = (x: Technique) =>
  x.sector === "fund" ? "Fundament" : SECTOR[x.sector].branches.find((b) => b.id === x.branch)?.name ?? x.branch;
