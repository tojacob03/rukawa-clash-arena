export interface CaseStudySection {
  heading: string;
  body: string;
}

export interface CaseStudy {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  sections: CaseStudySection[];
}

export const caseStudies: Record<string, CaseStudy> = {
  "player-analysis-tooling": {
    slug: "player-analysis-tooling",
    eyebrow: "Featured system",
    title: "From Battle Log to Set Decision",
    summary:
      "Why I built a private analysis platform instead of doing prep by hand - and the decisions that made it actually trustworthy under set pressure.",
    sections: [
      {
        heading: "The problem",
        body:
          "Before a set, prep used to mean the same manual routine every time: pull a player's recent battles by hand, scroll through them for patterns, and try to hold deck tendencies in your head while the clock is running. It worked, but it didn't scale past one player at a time, and it fell apart exactly when it mattered most - mid-set, under time pressure, with bans already burning cards.",
      },
      {
        heading: "Why matchup self-assessment, not win-rate",
        body:
          "The tooling deliberately does not surface historical win-rate comparisons between decks. In Clash Royale, a win-rate number mixes in opponent skill, ladder conditions and sample size noise to the point where it stops being a reliable signal. Instead, the system is built around matchup self-assessment - treating the analyst's own read of a matchup as the primary input, with the data organised to support that read (recent decks, Game 1 habits, remaining cards under bans) rather than replace it with a misleading average.",
      },
      {
        heading: "A quiet correctness bug that mattered",
        body:
          "Card IDs in the aggregated deck data are stored in ascending sorted order, not the original slot order they were played in. That's invisible until you try to render Evolution or Hero icons correctly - slot-aware icon resolution had to be handled separately (a small dedicated resolver) so a card's evolution state and hero form still line up correctly in the UI even though the underlying array order no longer matches how the deck was actually played.",
      },
      {
        heading: "Result",
        body:
          "What used to be a manual, per-player routine is now a repeatable pipeline: player tag in, profile and battle history assembled automatically, remaining-deck scoring under bans ready before the pick phase starts. It's the same system behind the live numbers on this page, currently supporting Solo CRL prep for Tier-1 players on the road to the 2026 World Championship.",
      },
    ],
  },
};
