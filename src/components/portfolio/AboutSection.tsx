import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowUpRight, Database, SearchCheck, Swords } from "lucide-react";

const focusAreas = [
  { title: "Account-level prep", text: "Reviewing modes, deck trends, and repeated patterns across multiple accounts." },
  { title: "Decision support", text: "Separating signal from noise before bans, card burn, and set decisions." },
  { title: "Private tooling", text: "Turning raw battle logs into usable prep workflows for competitive players." },
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
          <p className="text-[10px] uppercase tracking-[0.28em] text-clash-gold">Analyst focus</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            <span className="gradient-primary bg-clip-text text-transparent">Structured prep for high-pressure matches.</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1.4fr]">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card h-full border-border/50 p-6 sm:p-8 shadow-card">
              <p className="mb-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                I work at the intersection of competitive analysis and tooling: turning battle history into useful prep,
                clearer decisions, and more confident player-facing recommendations.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                The goal is not more dashboards for their own sake. It is simple visibility into what a player tends to
                do, what is already exposed, and what is still worth planning around.
              </p>
            </Card>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {focusAreas.map((item, index) => {
              const Icon = [Database, SearchCheck, Swords][index];

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <Card className="gradient-card h-full border-border/50 p-5 shadow-card transition-transform duration-300 hover:-translate-y-1">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">0{index + 1}</span>
                      <div className="rounded-full border border-clash-gold/30 bg-clash-gold/10 p-2 text-clash-gold">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-clash-gold">
                      View
                      <ArrowUpRight className="h-3 w-3" />
                    </div>
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
