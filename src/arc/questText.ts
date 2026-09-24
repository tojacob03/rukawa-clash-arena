import type { QuestKind } from "./core/types.ts";
import { TECH } from "./core/techniques.ts";

/** What to do on the mat for a quest, in one or two sentences. */
export function questTask(q: { node: string; kind: QuestKind }) {
  const x = TECH[q.node];
  if (q.kind === "kata") return "3 Runden à 10 Wiederholungen, beim Aufwärmen oder in der Open Mat. Abhaken reicht.";
  if (q.kind === "stand") return "Lass dich in einem Roll bewusst in die Lage bringen und arbeite dich heraus. Zähle Versuche und gelungene Escapes.";
  if (q.kind === "schmiede") return "Triff die Technik heute mindestens einmal live. Zähle Versuche und Treffer.";
  if (x?.kind === "position") return "Komm in jedem Roll in diese Position. Zähle Versuche und wie oft du sie wirklich hältst.";
  return "Versuche die Technik in jedem Roll. Zähle Versuche und Treffer.";
}

/** Label for the success counter of a quest. */
export function successLabel(q: { node: string; kind: QuestKind }) {
  if (q.kind === "stand") return "Escapes";
  if (TECH[q.node]?.kind === "position") return "Gehalten";
  return "Treffer";
}
