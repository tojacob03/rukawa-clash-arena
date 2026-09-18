import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Database, ScanSearch, Target } from "lucide-react";

const methodology = [
  {
    title: "Observe patterns",
    description: "Track deck usage, card tendencies, and Game 1 habits across accounts and modes.",
    icon: Database,
  },
  {
    title: "Reduce uncertainty",
    description: "Filter out noise after bans, burn-through, and seasonal changes to focus on relevant matches.",
    icon: ScanSearch,
  },
  {
    title: "Make decisions",
    description: "Turn raw stats into a clear recommendation before the next match, set or decision point.",
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
          <Badge className="border border-clash-gold/40 bg-clash-gold/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-clash-gold">
            How I work
          </Badge>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            <span className="gradient-primary bg-clip-text text-transparent">Analyst. Builder. Decision layer.</span>
          </h2>
        </motion.div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1.5fr]">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card border-border/50 p-6 shadow-card sm:p-8">
              <p className="mb-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Since May 2026 I have been back in competitive Clash Royale as an analyst focused on Solo CRL player
                preparation: how someone actually plays across accounts, which decks they default to in Game 1, and what
                remains once cards and openings are burned.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                I build the systems behind that work — not just the conclusions. That includes private analysis tooling,
                scouting flows, and live decision support for players like Morten and Viiper.
              </p>
            </Card>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {methodology.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <Card className="gradient-card h-full border-border/50 p-5 shadow-card transition-transform duration-300 hover:-translate-y-1">
                    <div className="mb-4 inline-flex rounded-full border border-clash-gold/40 bg-clash-gold/10 p-2 text-clash-gold">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">0{index + 1}</div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
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
