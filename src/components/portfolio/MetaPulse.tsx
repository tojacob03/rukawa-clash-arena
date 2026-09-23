import { motion } from "framer-motion";
import { usePublicStats } from "@/hooks/usePublicStats";

type MetaCard = NonNullable<ReturnType<typeof usePublicStats>["data"]>["topMetaDeck"] extends infer Deck
  ? Deck extends { cards: Array<infer Card> }
    ? Card
    : never
  : never;

type CardPresentation = {
  image: string | null;
  fallback?: string;
  label: "Evolution" | "Hero" | null;
};

const getCardPresentation = (card: MetaCard, slotIndex: number): CardPresentation => {
  const baseIcon = card.icon ?? null;
  const evolutionIcon = card.evolutionIcon ?? null;
  const heroIcon = card.heroIcon ?? null;

  // Keep the same slot semantics as Deck Suggestions:
  // slot 1 = Evolution, slot 2 = Hero, slot 3 = Evolution (or Hero).
  if (slotIndex === 0 && evolutionIcon) {
    return { image: evolutionIcon, fallback: baseIcon ?? undefined, label: "Evolution" };
  }

  if (slotIndex === 1 && heroIcon) {
    return { image: heroIcon, fallback: baseIcon ?? undefined, label: "Hero" };
  }

  if (slotIndex === 2) {
    if (evolutionIcon) {
      return { image: evolutionIcon, fallback: baseIcon ?? undefined, label: "Evolution" };
    }

    if (heroIcon) {
      return { image: heroIcon, fallback: baseIcon ?? undefined, label: "Hero" };
    }
  }

  return { image: baseIcon, label: null };
};

const MetaPulse = () => {
  const { data, isLoading } = usePublicStats();
  const deck = data?.topMetaDeck;

  // Nothing to show and nothing loading (fetch failed) - stay silent rather
  // than showing an empty/broken strip.
  if (!deck && !isLoading) return null;

  const slots: (MetaCard | null)[] = deck
    ? [...deck.cards, ...Array(Math.max(0, 8 - deck.cards.length)).fill(null)].slice(0, 8)
    : Array.from({ length: 8 }, () => null);

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

        <div className="mt-3 grid grid-cols-8 gap-0.5 sm:gap-2">
          {slots.map((card, i) => {
            if (!card) {
              return (
                <div
                  key={`empty-${i}`}
                  className={`aspect-[3/4] rounded-md bg-muted ${!deck ? "animate-pulse" : "bg-muted/40"}`}
                />
              );
            }

            const presentation = getCardPresentation(card, i);

            return (
              <motion.div
                key={`${card.id}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="relative"
                title={`${card.name}${presentation.label ? ` (${presentation.label})` : ""}`}
              >
                <img
                  src={presentation.image ?? undefined}
                  alt={`${card.name}${presentation.label ? ` — ${presentation.label}` : ""}`}
                  loading="lazy"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (presentation.fallback && img.src !== presentation.fallback) {
                      img.src = presentation.fallback;
                    }
                  }}
                  className="block w-full aspect-[3/4] rounded-md bg-background/60 object-contain shadow-sm transition-transform hover:-translate-y-1"
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
