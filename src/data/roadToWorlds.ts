// Road to Worlds: the only file to edit for this section.
//
// Before the event the section counts down, during it shows "live", and
// afterwards it switches to a recap on its own. Once the World Finals are
// played, fill in `result` (and optionally `caseStudy`) - nothing else.

export interface Milestone {
  month: string;
  event: string;
  results: { player: string; place: string }[];
}

export const MILESTONES: Milestone[] = [
  {
    month: "May 2026",
    event: "CRL Monthly Finals",
    results: [
      { player: "Morten", place: "3rd" },
      { player: "Viiper", place: "4th" },
    ],
  },
  {
    month: "June 2026",
    event: "CRL Monthly Finals",
    results: [{ player: "Viiper", place: "3rd" }],
  },
  {
    month: "July 2026",
    event: "CRL Monthly Finals",
    results: [{ player: "Morten", place: "8th" }],
  },
];

export const WORLDS = {
  name: "CRL World Finals 2026",
  city: "Shanghai, China",
  dates: "Nov 6-8",
  // China Standard Time
  start: new Date("2026-11-06T00:00:00+08:00"),
  end: new Date("2026-11-09T00:00:00+08:00"),
  // Everyone I prepare this season qualified.
  qualified: "Morten & Viiper",
  // After the event, e.g. "Viiper: Top 8 · Morten: Top 16"
  result: null as string | null,
  // Optional link to a recap case study, e.g. "/work/road-to-worlds-2026"
  caseStudy: null as string | null,
};

export type WorldsPhase = "upcoming" | "live" | "done";

export const worldsPhase = (now: Date): WorldsPhase =>
  now < WORLDS.start ? "upcoming" : now < WORLDS.end ? "live" : "done";
