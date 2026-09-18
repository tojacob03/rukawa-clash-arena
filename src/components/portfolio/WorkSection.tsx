import { Card } from "@/components/ui/card";
import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AnimatedStatProps = {
  value: number;
  label: string;
  suffix?: string;
  accent?: "default" | "gold" | "blue";
};

const AnimatedStat = ({ value, label, suffix = "", accent = "default" }: AnimatedStatProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [isInView, value]);

  const accentStyles = {
    default: "text-foreground",
    gold: "text-clash-gold",
    blue: "text-clash-blue",
  };

  return (
    <div ref={ref} className="text-center">
      <div className={`text-xl sm:text-2xl font-bold ${accentStyles[accent]}`}>
        {displayValue}
        {suffix}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
};

const WorkSection = () => {
  const stats = [
    { value: 186, label: "Analyzed", accent: "default" as const },
    { value: 11, label: "CRL duels", accent: "gold" as const },
    { value: 8, label: "Ingame duels", accent: "blue" as const },
    { value: 6, label: "Modes", accent: "default" as const },
  ];

  return (
    <section id="work" className="scroll-mt-20 py-14 sm:py-20 px-5 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Player Analysis Tooling
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Internal app used with the players I support. Player tags, names, and clans are omitted. The live tool is
            private - these are the three steps that matter in Solo CRL prep.
          </p>
        </motion.div>

        <div className="space-y-10">
          <motion.article
            className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start"
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-clash-gold mb-2">01 · Ingest</p>
              <h3 className="text-2xl font-bold mb-3">Player tag → battle log</h3>
              <p className="text-muted-foreground leading-relaxed">
                A tag (or several alts) pulls the official API profile, stores battles, and runs duel detection on
                recent friendlies so CRL sets show up immediately - not after a nightly sweep.
              </p>
            </div>

            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Card className="gradient-card border-border/50 p-4 sm:p-5 font-mono text-sm overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>PLAYER ANALYSIS</span>
                  <span className="text-clash-gold">INTERNAL</span>
                </div>

                <div className="rounded-md bg-background/60 border border-border/40 p-3 mb-3">
                  <div className="text-[11px] text-muted-foreground mb-1">Player tag</div>
                  <div className="text-foreground tracking-widest">#········</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-secondary/40 p-3">
                    <div className="text-lg font-bold text-foreground">1</div>
                    <div className="text-[10px] text-muted-foreground">Profile</div>
                  </div>

                  <div className="rounded-md bg-secondary/40 p-3">
                    <AnimatedStat value={214} label="Battles stored" accent="gold" />
                  </div>

                  <div className="rounded-md bg-secondary/40 p-3">
                    <AnimatedStat value={12} label="Duels detected" accent="blue" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.article>

          <motion.article
            className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start"
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 0.06, ease: "easeOut" }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-clash-gold mb-2">02 · Profile</p>
              <h3 className="text-2xl font-bold mb-3">Decks, cards, Game 1</h3>
              <p className="text-muted-foreground leading-relaxed">
                Filtered by mode and season: deck win rates, card usage, tower troop, and Game-1 habits in Bo3/Bo5.
              </p>
            </div>

            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
            >
              <Card className="gradient-card border-border/50 p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.1)]">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-3">
                  Statistics & analysis · Player A
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {stats.map((item) => (
                    <AnimatedStat key={item.label} value={item.value} label={item.label} accent={item.accent} />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Decks', 'Cards', 'Duels', 'Game 1'].map((label) => (
                    <div
                      key={label}
                      className="rounded-md border border-border/40 bg-background/40 py-3 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </motion.article>

          <motion.article
            className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start"
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-clash-gold mb-2">03 · Decision</p>
              <h3 className="text-2xl font-bold mb-3">Remaining decks under bans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Once cards and slots are burned, remaining-deck scoring ranks what they still have based on history for
                mid-set Solo CRL decisions.
              </p>
            </div>

            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
            >
              <Card className="gradient-card border-border/50 p-4 sm:p-5 overflow-x-auto shadow-[0_18px_40px_rgba(0,0,0,0.1)]">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-3">
                  Remaining decks advisor · anonymized
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground text-xs border-b border-border/40">
                      <th className="pb-2 font-medium">Deck</th>
                      <th className="pb-2 font-medium">WR</th>
                      <th className="pb-2 font-medium">n</th>
                      <th className="pb-2 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr className="border-b border-border/20">
                      <td className="py-2">Cycle A</td>
                      <td>64%</td>
                      <td>22</td>
                      <td className="text-clash-gold font-semibold">1.00</td>
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="py-2">Beatdown B</td>
                      <td>58%</td>
                      <td>17</td>
                      <td>0.81</td>
                    </tr>
                    <tr>
                      <td className="py-2">Control C</td>
                      <td>51%</td>
                      <td>14</td>
                      <td>0.62</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Figures are illustrative of layout, not a live player dump.
                </p>
              </Card>
            </motion.div>
          </motion.article>
        </div>
      </div>
    </section>
  );
};

export default WorkSection;
