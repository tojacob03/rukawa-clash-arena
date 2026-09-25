// The five progress systems of Waza Arc and the one question each answers.
// They must not compete: every system measures something the others do not,
// has one home in the app, and says plainly whether it can go down.
//
//   Level (XP)   What you put in. Every training, quest, note and tournament
//                adds XP; it never goes down. It paces the RPG: rank titles,
//                items, the level seal.
//   Power Level  How strong you are right now, next to others. An Elo rating
//                from rolls and tournament fights; it rises and falls. The
//                Scouter compares it with partners, opponents and the boss.
//   Branch       What you can do. Mastery per technique, from a closed bud to
//                a gold blossom; techniques you leave alone wilt. It chooses
//                what the quests ask of you.
//   Hexagon      How you fight. The shape of the branch per sector (breadth
//                and recent form); it names your class and your weakest axis.
//   Sea chart    Whether you keep going, and with whom. Sea miles come from
//                every session of any sport, faster with a steady rhythm;
//                belts and stripes are harbours on the way, a crew sails one
//                ship together.

export type SystemId = "level" | "power" | "branch" | "hexagon" | "sea";

export interface ProgressSystem {
  id: SystemId;
  name: string;
  kanji: string;
  /** The one question it answers for the player. */
  question: string;
  /** What moves it. */
  grows: string;
  /** Whether it can go down, and why. */
  falls: string;
  /** Where it lives in the app. */
  home: string;
}

export const SYSTEMS: ProgressSystem[] = [
  {
    id: "level",
    name: "Level",
    kanji: "稽",
    question: "Wie viel steckst du hinein?",
    grows: "Jedes Training, jede Quest, jede Notiz und jedes Turnier bringt XP.",
    falls: "Sinkt nie. Einsatz bleibt Einsatz.",
    home: "Goldnaht am oberen Rand, Level-Siegel, Titel und Ausrüstung",
  },
  {
    id: "power",
    name: "Power Level",
    kanji: "測",
    question: "Wie stark bist du gerade, verglichen mit anderen?",
    grows: "Rolls und Turnierkämpfe, gewichtet nach Gürtel und Größe der Partner.",
    falls: "Steigt und fällt mit deinen Ergebnissen, wie ein Elo-Wert.",
    home: "Oben rechts und im Scouter",
  },
  {
    id: "branch",
    name: "Zweig",
    kanji: "技",
    question: "Was kannst du, und woran arbeitest du?",
    grows: "Versuche und Treffer pro Technik, aus Quests, Rolls und Kursen.",
    falls: "Techniken, die du 60 Tage nicht trainierst, welken.",
    home: "Karte, Zweig",
  },
  {
    id: "hexagon",
    name: "Hexagon",
    kanji: "型",
    question: "Wie kämpfst du, wo bist du stark und wo schwach?",
    grows: "Die Breite deines Zweigs je Sektor und deine Form der letzten acht Wochen.",
    falls: "Die Form folgt deinen letzten Rolls, der Umriss verändert sich mit dir.",
    home: "Held, Übersicht",
  },
  {
    id: "sea",
    name: "Seekarte",
    kanji: "海",
    question: "Bleibst du dran, und mit wem?",
    grows: "Seemeilen aus jedem Training, auch Nebensport, schneller mit regelmäßigem Rhythmus. Gürtel und Streifen sind Häfen.",
    falls: "Das Schiff fährt nie zurück; in der Flaute kommt es nur langsamer voran.",
    home: "Karte, Seekarte, mit deiner Crew",
  },
];

export const SYSTEM = Object.fromEntries(SYSTEMS.map((s) => [s.id, s])) as Record<SystemId, ProgressSystem>;
