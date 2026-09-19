import { motion } from "framer-motion";
import { usePublicStats } from "@/hooks/usePublicStats";

type MetaCard = NonNullable<ReturnType<typeof usePublicStats>["data"]>["topMetaDeck"] extends infer Deck
  ? Deck extends { cards: Array<infer Card> }
    ? Card
    : never
  : never;

const getCardPresentation = (card: MetaCard, slotIndex: number) => {
  // The first deck position is the Evolution slot and the second is the Hero
  // slot. The payload also includes optional form images for cards outside
  // those positions, so those must not determine the displayed form.
  if (slotIndex === 0 && card.evolutionIcon) {
    return { image: card.evolutionIcon, label: "Evolution" };
  }

  if (slotIndex === 1 && card.heroIcon) {
    return { image: card.heroIcon, label: "Hero" };
  }

  return { image: card.icon, label: null };
};

const MetaPulse = () => {
  const { data, isLoading } = usePublicStats();
  const deck = data?.topMetaDeck;

  // Nothing to show and nothing loading (fetch failed) - stay silent rather
  // than showing an empty/broken strip.
  if (!deck && !isLoading) return null;

  return (
    <div className="w-full bg-secondary/5 py-4 border-b border-border/40">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            Meta Pulse · {deck?.timeWindow ?? "7d"} window
          </span>

          {deck && (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <span className="font-semibold text-clash-gold">{deck.usageRate}% usage</span>
              <span className="text-border">·</span>
              <span>{deck.winRate}% win rate</span>
              <span className="text-border">·</span>
              <span>{deck.games.toLocaleString("en-US")} games</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-center sm:justify-start gap-1.5 sm:gap-2">
          {!deck
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-12 sm:w-12 sm:h-14 rounded-md bg-muted animate-pulse"
                />
              ))
            : deck.cards.map((card, i) => {
                const presentation = getCardPresentation(card, i);

                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="relative w-10 sm:w-12"
                    title={`${card.name}${presentation.label ? ` (${presentation.label})` : ""}`}
                  >
                    <img
                      src={presentation.image ?? card.icon ?? undefined}
                      alt={`${card.name}${presentation.label ? ` — ${presentation.label}` : ""}`}
                      loading="lazy"
                      onError={(event) => {
                        if (card.icon && event.currentTarget.src !== card.icon) {
                          event.currentTarget.src = card.icon;
                        }
                      }}
                      className="block w-full aspect-[19/28] rounded-md bg-background/60 object-contain shadow-sm transition-transform hover:-translate-y-1"
                    />
                  </motion.div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default MetaPulse;
