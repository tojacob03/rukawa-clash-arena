import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import SectionIntro from "@/components/portfolio/SectionIntro";

// Non-esports project: same pipeline pattern (collect -> analyse -> decide),
// applied to official German electricity market data. The project page itself
// is in German on purpose, so the card says so in English.
const facts = [
  { value: "Every 3 h", label: "automatic data refresh" },
  { value: "Since 2023", label: "hourly market history" },
  { value: "15 min", label: "price resolution since Oct 2025" },
];

const SideProjectSection = () => {
  return (
    <section id="projects" className="scroll-mt-20 px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          eyebrow="Beyond esports"
          title="Strompreis-Kompass"
          description="The same approach as my esports tooling, applied to the German electricity market."
          titleClassName="text-3xl font-bold sm:text-4xl md:text-5xl"
          descriptionClassName="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        />

        <Card className="gradient-card mt-10 border-border/50 p-6 shadow-card sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
            <div>
              <p className="text-lg leading-relaxed text-foreground">
                A live dashboard that shows when electricity is cheapest on the exchange, how wind and solar push prices
                down, and how often prices turn negative. A database job collects official market data from the German
                Federal Network Agency (Bundesnetzagentur), SQL turns it into the numbers, and the page answers one
                practical question: when should you use power tomorrow?
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                The project page is in German, because it covers German electricity prices and is written for people in
                Germany.
              </p>
              <Link
                to="/strompreis"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
              >
                Open Strompreis-Kompass (German)
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <dl className="grid content-start gap-5 border-t border-border/50 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="sr-only">{fact.label}</dt>
                  <dd>
                    <span className="block text-2xl font-semibold text-foreground">{fact.value}</span>
                    <span className="text-sm text-muted-foreground">{fact.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default SideProjectSection;
