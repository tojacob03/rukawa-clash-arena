import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Database, Target, Sparkles } from "lucide-react";

const points = [
  {
    number: "01",
    title: "Scout the signal",
    description: "I track how players actually perform across accounts, decks, and game states — not just headline win rates.",
    icon: Database,
  },
  {
    number: "02",
    title: "Measure what matters",
    description: "A decent match summary is not enough. I focus on the decisions that show up under pressure: Game 1 habits, bans, burn-through, and remaining options.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Turn it into action",
    description: "The goal is simple: fewer blind spots, clearer prep, and better decisions before the next set starts.",
    icon: Target,
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-14 sm:py-20 px-5 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-14"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-clash-gold">About</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            <span className="gradient-primary bg-clip-text text-transparent">Built for the decisions that matter.</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.5fr] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card h-full border-border/50 p-6 sm:p-8 shadow-card">
              <p className="mb-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Since May 2026 I have been working as a competitive Clash Royale analyst focused on Solo CRL player
                preparation.
              </p>
              <p className="mb-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                The work is not about collecting numbers for the sake of it. It is about understanding how a player
                behaves across accounts, which decks repeat under pressure, and what remains once cards and openings
                have been burned.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                That analysis is delivered through private tooling and live decision support for players in competitive
                environments.
              </p>
            </Card>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {points.map((point, index) => {
              const Icon = point.icon;

              return (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <Card className="gradient-card h-full border-border/50 p-5 shadow-card transition-transform duration-300 hover:-translate-y-1">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{point.number}</span>
                      <div className="rounded-full border border-clash-gold/30 bg-clash-gold/10 p-2 text-clash-gold">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{point.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{point.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
