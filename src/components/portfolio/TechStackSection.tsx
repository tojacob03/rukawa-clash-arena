import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Cpu, Code2, LineChart } from "lucide-react";

interface TechGroup {
  title: string;
  description: string;
  icon: typeof Database;
  items: string[];
}

const techGroups: TechGroup[] = [
  {
    title: "Data & Quantitative Analysis",
    description: "Statistical modeling, opponent profiling, and structured data extraction.",
    icon: Database,
    items: [
      "Python (Pandas, NumPy)",
      "Algorithmic Pattern Recognition",
      "Data Normalization & Fallbacks",
      "Harvard CS50 AI",
    ],
  },
  {
    title: "AI-Augmented Engineering",
    description: "Leveraging LLMs and generative systems for rapid tool design and automated workflows.",
    icon: Cpu,
    items: ["Prompt Architecture", "LLM Workflows (Claude / Gemini)", "Rapid Prototyping", "Automated Scripting"],
  },
  {
    title: "Web & Product Deployment",
    description: "Building responsive, low-latency analytics dashboards and client portals.",
    icon: Code2,
    items: [
      "React & TypeScript",
      "Supabase (PostgreSQL & Edge Functions)",
      "Recharts (Data Visualization)",
      "Vite / Lovable & Tailwind",
    ],
  },
  {
    title: "Performance & Decision Support",
    description: "Translating raw metrics into high-stakes tournament decisions under time pressure.",
    icon: LineChart,
    items: [
      "Decision Support Systems (DSS)",
      "Automated Rule/Violation Detection",
      "Opponent Scouting Engines",
      "Custom Metric Trackers",
    ],
  },
];

const TechStackSection = () => {
  return (
    <section id="tech-stack" className="py-14 sm:py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Technical & Analytical Stack
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Tools, frameworks, and workflows used to turn high-volume match data into competitive edge.
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {techGroups.map((group) => {
            const Icon = group.icon;
            return (
              <Card
                key={group.title}
                className="gradient-card shadow-card border-border/50 p-6 sm:p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 gradient-primary rounded-xl shadow-glow">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-clash-gold">{group.title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">{group.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                  {group.items.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="px-3 py-1 text-xs sm:text-sm bg-secondary/60 hover:bg-secondary/80 border border-border/40"
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
