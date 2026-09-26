// The face the fighter makes at the end of a chapter (fighter3d/face.ts, Mood).

import type { ArcState } from "./core/types.ts";
import type { Mood } from "./fighter3d/face.ts";
import type { ChapterWays } from "./components/ChapterEnd.tsx";

/**
 * How the fighter looks when the page is read: a battle cry for a new
 * Tokui-Waza, tired eyes after a hard week, a smile after a good training.
 */
export function moodOf(before: ArcState, after: ArcState, ways: ChapterWays): Mood | undefined {
  if (after.tokui.length > before.tokui.length) return "cry";
  if (after.weekNow >= Math.max(4, after.weekGoal + 2)) return "tired";
  const goal = before.weekNow < before.weekGoal && after.weekNow >= after.weekGoal;
  if (after.lvl > before.lvl || ways.skill.length || goal || after.comps.medals.some((m, i) => m > before.comps.medals[i])) return "smile";
  return undefined;
}
