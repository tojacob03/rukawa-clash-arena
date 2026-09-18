import { Card } from "@/components/ui/card";
import { Search, Layers, GitBranch, Gauge } from "lucide-react";

const skills = [
  {
    name: "Battle-log profiling",
    icon: Search,
    description: "Official API ingest across main + alt tags, stored battles, season and mode filters.",
  },
  {
    name: "Duel & Game 1 models",
    icon: GitBranch,
    description: "Detect CRL/friendly duels and read first-game deck habits in Bo3/Bo5.",
  },
  {
    name: "Remaining-deck support",
    icon: Layers,
    description: "Score what a player still has after burned cards - mid-set.",
  },
  {
    name: "Prep under time pressure",
    icon: Gauge,
    description: "Hub tools around the same data: draft practice, clutch scenarios, tower math.",
  },
];

const SkillsSection = () => {
  return (
    <section id="method" className="scroll-mt-20 py-14 sm:py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Method
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill) => (
            <Card key={skill.name} className="gradient-card shadow-card border-border/50 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 gradient-primary rounded-lg">
                  <skill.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{skill.name}</h3>
              </div>
              <p className="text-muted-foreground">{skill.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
