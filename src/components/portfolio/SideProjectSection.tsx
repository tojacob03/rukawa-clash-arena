import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import SectionIntro from "@/components/portfolio/SectionIntro";

// Non-esports projects: the same pipeline pattern as my esports tooling
// (collect -> clean -> analyse -> decide), applied to other domains.

// Real data for the card previews, so the cards show what each project
// actually produces.
// Average day-ahead price by hour, Sep 2025 - Aug 2026 (docs/strompreis-kompass/analysis.sql, query 1).
const HOURLY_PRICE = [103.4, 98.1, 94.6, 93.4, 94.4, 99.6, 112.5, 122.3, 116.1, 96.3, 76.7, 62.5,
  52.2, 47.0, 51.7, 65.7, 84.4, 110.3, 133.9, 150.7, 146.6, 133.5, 122.0, 108.3];
// Tyre stints of the top 5, Spanish Grand Prix 2026 (57 laps).
const STINTS: [string, [string, number, number][]][] = [
  ["ANT", [["MEDIUM", 1, 14], ["HARD", 15, 57]]],
  ["VER", [["SOFT", 1, 14], ["HARD", 15, 57]]],
  ["NOR", [["MEDIUM", 1, 15], ["HARD", 16, 57]]],
  ["LEC", [["HARD", 1, 48], ["SOFT", 49, 57]]],
  ["RUS", [["HARD", 1, 14], ["MEDIUM", 15, 28], ["HARD", 29, 57]]],
];
const COMPOUND: Record<string, string> = { SOFT: "#E8002D", MEDIUM: "#FFD12E", HARD: "#EDEDE8" };

const PriceProfile = () => (
  <figure>
    <div className="flex h-28 items-end gap-[3px]" aria-hidden>
      {HOURLY_PRICE.map((p, h) => (
        <motion.div
          key={h}
          className="flex-1 origin-bottom rounded-t-[2px] transition-opacity duration-300 group-hover:opacity-100"
          style={{
            height: `${(p / 160) * 100}%`,
            background: p < 70 ? "#3DBE9E" : p > 125 ? "#E8705F" : "#5B6474",
            opacity: 0.85,
          }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: h * 0.02, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
    <figcaption className="mt-2 text-xs text-muted-foreground">
      Average price by hour: cheapest at 13:00, 3.2x as expensive at 19:00
    </figcaption>
  </figure>
);

const StintPreview = () => (
  <figure>
    <div className="space-y-2" aria-hidden>
      {STINTS.map(([code, stints], row) => (
        <div key={code} className="flex items-center gap-3">
          <span className="w-9 font-mono text-[11px] text-muted-foreground">{code}</span>
          <div className="relative h-3.5 flex-1">
            {stints.map(([c, a, b]) => (
              <motion.span
                key={a}
                className="absolute inset-y-0 origin-left rounded-sm"
                style={{ left: `${((a - 1) / 57) * 100}%`, width: `calc(${((b - a + 1) / 57) * 100}% - 2px)`, background: COMPOUND[c] }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, delay: row * 0.06 + a * 0.004, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
    <figcaption className="mt-2 text-xs text-muted-foreground">Tyre stints of the top 5, Spanish Grand Prix 2026</figcaption>
  </figure>
);

const projects = [
  {
    title: "Race Strategy Lab",
    href: "/race-strategy",
    linkLabel: "Open Race Strategy Lab",
    caseStudy: null,
    Chart: StintPreview,
    body: "Tyre strategy, tyre wear, race pace and pit stops for every Grand Prix since 2023. A database job pulls lap and pit data after each race, SQL cleans it (safety cars, in- and out-laps, fuel burn) and fits a regression of lap time against tyre age for every stint.",
    note: null,
    facts: [
      { value: "Since 2023", label: "every race analysed" },
      { value: "Per stint", label: "tyre wear regression" },
    ],
  },
  {
    title: "Strompreis-Kompass",
    href: "/strompreis",
    linkLabel: "Open Strompreis-Kompass (German)",
    caseStudy: { href: "/work/strompreis-kompass", label: "Read the case study (German)" },
    Chart: PriceProfile,
    body: "A live dashboard that shows when electricity is cheapest on the exchange, how wind and solar push prices down, and how often prices turn negative, built on official data from the German Federal Network Agency (Bundesnetzagentur).",
    note: "The project page is in German, because it covers German electricity prices and is written for people in Germany.",
    facts: [
      { value: "Every 3 h", label: "automatic data refresh" },
      { value: "15 min", label: "price resolution" },
    ],
  },
];

const SideProjectSection = () => {
  return (
    <section id="projects" className="scroll-mt-20 px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          eyebrow="Beyond esports"
          title="Other projects"
          description="The same approach as my esports tooling, applied to other domains."
          titleClassName="text-3xl font-bold sm:text-4xl md:text-5xl"
          descriptionClassName="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <Card
              key={p.title}
              className="group gradient-card flex flex-col border-border/50 p-6 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-clash-gold/30 hover:shadow-glow sm:p-8"
            >
              <div className="mb-7 rounded-xl border border-border/50 bg-background/50 p-4">
                <p.Chart />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{p.body}</p>
              {p.note && <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80">{p.note}</p>}

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border/50 pt-5">
                {p.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="sr-only">{fact.label}</dt>
                    <dd>
                      <span className="block text-xl font-semibold text-foreground">{fact.value}</span>
                      <span className="text-sm text-muted-foreground">{fact.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                <Link
                  to={p.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
                >
                  {p.linkLabel}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                {p.caseStudy && (
                  <Link
                    to={p.caseStudy.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {p.caseStudy.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SideProjectSection;
