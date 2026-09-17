import { Card } from "@/components/ui/card";

const WorkSection = () => {
  return (
    <section id="work" className="scroll-mt-20 py-14 sm:py-20 px-5 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Player Analysis Tooling
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full" />
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Internal app used with the players I support. Player tags, names, and
            clans are omitted. The live tool is private — these are the three
            steps that matter in Solo CRL prep.
          </p>
        </div>

        <div className="space-y-10">
          <article className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-clash-gold mb-2">01 · Ingest</p>
              <h3 className="text-2xl font-bold mb-3">Player tag → battle log</h3>
              <p className="text-muted-foreground leading-relaxed">
                A tag (or several alts) pulls the official API profile, stores
                battles, and runs duel detection on recent friendlies so CRL
                sets show up immediately — not after a nightly sweep.
              </p>
            </div>
            <Card className="gradient-card border-border/50 p-4 sm:p-5 font-mono text-sm overflow-hidden">
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
                  <div className="text-lg font-bold text-clash-gold">214</div>
                  <div className="text-[10px] text-muted-foreground">Battles stored</div>
                </div>
                <div className="rounded-md bg-secondary/40 p-3">
                  <div className="text-lg font-bold text-clash-blue">12</div>
                  <div className="text-[10px] text-muted-foreground">Duels detected</div>
                </div>
              </div>
            </Card>
          </article>

          <article className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-clash-gold mb-2">02 · Profile</p>
              <h3 className="text-2xl font-bold mb-3">Decks, cards, Game 1</h3>
              <p className="text-muted-foreground leading-relaxed">
                Filtered by mode and season: deck win rates, card usage, tower
                troop, and Game-1 habits in Bo3/Bo5. That is the player model —
                not a matchup PDF against a named opponent.
              </p>
            </div>
            <Card className="gradient-card border-border/50 p-4 sm:p-5">
              <div className="text-xs text-muted-foreground mb-3">Statistics & analysis · Player A</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  ["186", "Analyzed"],
                  ["11", "CRL duels"],
                  ["8", "Ingame duels"],
                  ["6", "Modes"],
                ].map(([n, l]) => (
                  <div key={l} className="text-center">
                    <div className="text-xl font-bold text-foreground">{n}</div>
                    <div className="text-[11px] text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["Decks", "Cards", "Duels", "Game 1"].map((label) => (
                  <div
                    key={label}
                    className="rounded-md border border-border/40 bg-background/40 py-3 text-center text-xs font-medium text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </Card>
          </article>

          <article className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-clash-gold mb-2">03 · Decision</p>
              <h3 className="text-2xl font-bold mb-3">Remaining decks under bans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Once cards and slots are burned, remaining-deck scoring ranks
                what they still have based on history — the output a Solo CRL
                player needs mid-set, not a post-match write-up.
              </p>
            </div>
            <Card className="gradient-card border-border/50 p-4 sm:p-5 overflow-x-auto">
              <div className="text-xs text-muted-foreground mb-3">Remaining decks advisor · anonymized</div>
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
                    <td className="text-clash-gold">1.00</td>
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
          </article>
        </div>
      </div>
    </section>
  );
};

export default WorkSection;
