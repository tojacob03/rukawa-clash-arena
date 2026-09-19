import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import SectionIntro from "@/components/portfolio/SectionIntro";

const WorkSection = () => {
  return (
    <section id="work" className="scroll-mt-20 bg-muted/30 px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          eyebrow="Featured system"
          title="Player Analysis Tooling"
          description="A private workflow that moves from raw battle logs to a useful decision before a set. The interface is anonymized; the process is real."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
          <motion.div
            className="lg:col-span-5 lg:row-span-2"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card h-full border-border/50 p-6 shadow-card sm:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-clash-gold">01 · Ingest</p>
              <h3 className="mt-4 text-2xl font-bold">Player tag → battle log</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Profiles, alternate accounts, recent battles, and friendly-set detection arrive in one place instead of
                being assembled manually before every session.
              </p>
              <div className="mt-10 rounded-xl border border-border/50 bg-background/50 p-4 font-mono text-sm">
                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>PLAYER ANALYSIS</span>
                  <span className="text-clash-gold">INTERNAL</span>
                </div>
                <div className="mb-3 rounded-md border border-border/40 bg-background/60 p-3">
                  <div className="text-[11px] text-muted-foreground">Player tag</div>
                  <div className="mt-1 tracking-widest text-foreground">#········</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-secondary/40 p-3">
                    <strong className="block text-lg">1</strong>
                    <span className="text-[10px] text-muted-foreground">Profile</span>
                  </div>
                  <div className="rounded-md bg-secondary/40 p-3">
                    <strong className="block text-lg text-clash-gold">214</strong>
                    <span className="text-[10px] text-muted-foreground">Battles</span>
                  </div>
                  <div className="rounded-md bg-secondary/40 p-3">
                    <strong className="block text-lg text-clash-blue">12</strong>
                    <span className="text-[10px] text-muted-foreground">Duels</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.06 }}
          >
            <Card className="gradient-card h-full border-border/50 p-6 shadow-card sm:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-clash-gold">02 · Profile</p>
              <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row">
                <div>
                  <h3 className="text-2xl font-bold">Decks, cards, Game 1</h3>
                  <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                    Filtered by mode and season to expose repeatable habits rather than one-off results.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-right sm:min-w-[170px]">
                  <span className="text-xl font-bold text-foreground">
                    186<small className="ml-1 text-[10px] font-normal text-muted-foreground">ANALYZED</small>
                  </span>
                  <span className="text-xl font-bold text-clash-gold">
                    11<small className="ml-1 text-[10px] font-normal text-muted-foreground">CRL DUELS</small>
                  </span>
                  <span className="text-xl font-bold text-clash-blue">
                    8<small className="ml-1 text-[10px] font-normal text-muted-foreground">DUELS</small>
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    6<small className="ml-1 text-[10px] font-normal text-muted-foreground">MODES</small>
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <Card className="gradient-card border-border/50 p-6 shadow-card sm:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-clash-gold">03 · Decision</p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Remaining decks under bans</h3>
                  <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
                    A compact ranking of what is still available once cards and slots are burned.
                  </p>
                </div>
                <div className="w-full max-w-xs space-y-2 text-sm sm:w-56">
                  {[
                    ["Cycle A", "64%", "1.00"],
                    ["Beatdown B", "58%", "0.81"],
                    ["Control C", "51%", "0.62"],
                  ].map(([deck, winRate, score], index) => (
                    <div key={deck}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{deck}</span>
                        <span className={index === 0 ? "text-clash-gold" : "text-muted-foreground"}>{score}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${index === 0 ? "bg-clash-gold" : "bg-clash-blue/60"}`}
                          style={{ width: winRate }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-sm font-medium text-clash-gold transition-colors hover:text-foreground"
          >
            Read the case studies
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WorkSection;
