import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Code2, LineChart } from "lucide-react";

const techGroups = [
  {
    title: "Data pipeline",
    description: "From player tag to stored battles the analytics actually use.",
    icon: Database,
    items: [
      "Clash Royale API",
      "Python (Pandas, NumPy)",
      "Battle ingest & tracking",
      "Duel detection",
      "CS50 AI (HarvardX)",
    ],
  },
  {
    title: "Product",
    description: "Private React app for the players I work with - not a public dashboard.",
    icon: Code2,
    items: [
      "React & TypeScript",
      "Supabase (Postgres & Edge Functions)",
      "Auth / access gates",
      "Vite & Tailwind",
      "Framer Motion",
      "GSAP / ScrollTrigger",
    ],
  },
  {
    title: "Decision layer",
    description: "What the player sees when a set is live.",
    icon: LineChart,
    items: [
      "Deck & card win rates",
      "Game 1 aggregation",
      "Remaining-deck scoring",
      "Prep hub (draft, clutch, tower math)",
    ],
  },
];

const TechStackSection = () => {
  return (
    <section id="tech-stack" className="py-14 sm:py-20 px-5 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Stack
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Only the tools that sit in the player-analysis app.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {techGroups.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.title} className="gradient-card shadow-card border-border/50 p-6 sm:p-8 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 gradient-primary rounded-xl">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-clash-gold">{group.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{group.description}</p>
                <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border/30">
                  {group.items.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="px-3 py-1 text-xs sm:text-sm bg-secondary/60 border border-border/40"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
