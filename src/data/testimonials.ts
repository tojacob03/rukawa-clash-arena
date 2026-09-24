// Testimonials on the homepage. Only quotes with `approved: true` are shown:
// set it once the person has confirmed the exact final wording and how they
// are named. The section stays hidden until at least one is approved.

export type Testimonial = {
  quote: string;
  name: string;
  /** Role and context, e.g. "CRL pro, Joblife Esports" */
  role: string;
  /** What it is about, so a visitor can place it */
  context: string;
  /** Public profile, e.g. their X account */
  profile?: { label: string; href: string };
  /** A phrase from the quote to set in gold - emphasis only, never new words */
  highlight?: string;
  approved: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "This season Lorenzo picked our decks based on Rukawa's opponent analysis, so I knew the picks were backed by data, which made me more confident in them. Later he also built a hub for Morten and me with all the resources we needed to prepare smoothly for the World Finals. Easy to work with and always quick to adjust things when we needed something.",
    name: "Viiper",
    role: "CRL pro, Joblife Esports",
    context: "Qualified for the CRL World Finals 2026",
    profile: { label: "@Viiper__1", href: "https://x.com/Viiper__1" },
    highlight: "backed by data",
    // Wording and name line confirmed by Viiper.
    approved: true,
  },
];
