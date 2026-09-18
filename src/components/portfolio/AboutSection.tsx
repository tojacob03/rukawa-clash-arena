import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowUpRight, Code2, Crosshair, LineChart } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-clash-gold">The short version</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">What I bring to a set.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
            Analysis is only useful when it changes what happens next.
          </p>
        </div>

        <div className="grid auto-rows-[minmax(150px,auto)] gap-4 md:grid-cols-4">
          <motion.div
            className="md:col-span-2 md:row-span-2"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card flex h-full flex-col justify-between border-border/50 p-6 shadow-card sm:p-8">
              <div>
                <Badge variant="outline" className="border-clash-gold/40 text-clash-gold">
                  Analyst + builder
                </Badge>
                <p className="mt-8 max-w-xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                  I turn scattered match history into a smaller, sharper set of decisions.
                </p>
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
                <span>Competitive Clash Royale</span>
                <ArrowUpRight className="h-4 w-4 text-clash-gold" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: 0.06 }}
          >
            <Card className="gradient-card flex h-full items-center gap-4 border-border/50 p-5 shadow-card sm:p-6">
              <div className="rounded-xl border border-clash-gold/30 bg-clash-gold/10 p-3 text-clash-gold">
                <Crosshair className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Focus</p>
                <h3 className="mt-1 text-xl font-semibold">Solo CRL preparation</h3>
                <p className="mt-1 text-sm text-muted-foreground">Opponent tendencies, Game 1 habits, and set context.</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <Card className="gradient-card h-full border-border/50 p-5 shadow-card">
              <LineChart className="mb-5 h-5 w-5 text-clash-blue" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Output</p>
              <p className="mt-2 text-lg font-semibold">Clearer prep</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Less noise before the next set.</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <Card className="gradient-card h-full border-border/50 p-5 shadow-card">
              <Code2 className="mb-5 h-5 w-5 text-clash-gold" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Medium</p>
              <p className="mt-2 text-lg font-semibold">Private tooling</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Built around the actual workflow.</p>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
