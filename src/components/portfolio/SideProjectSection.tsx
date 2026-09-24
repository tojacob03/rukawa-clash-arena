import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import SectionIntro from "@/components/portfolio/SectionIntro";

// Non-esports projects: the same pipeline pattern as my esports tooling
// (collect -> clean -> analyse -> decide), applied to other domains.
const projects = [
  {
    title: "Race Strategy Lab",
    href: "/race-strategy",
    linkLabel: "Open Race Strategy Lab",
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
            <Card key={p.title} className="gradient-card flex flex-col border-border/50 p-6 shadow-card sm:p-8">
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

              <Link
                to={p.href}
                className="mt-6 inline-flex items-center gap-2 self-start text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
              >
                {p.linkLabel}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SideProjectSection;
