import React, { useEffect, useMemo, useState } from 'react';
import { ClashRoyaleCard, getCardsByIds, getCardById } from '@/data/clashRoyaleCards';
import { parseDeckLink } from '@/utils/deckParser';
import { Card } from '@/components/ui/card';
import goblinMachineImg from '@/assets/cards/goblin-machine.png';
interface DeckPreviewProps {
  deckLink: string;
  cardIds?: number[];
  className?: string;
}

export function DeckPreview({ deckLink, cardIds, className = '' }: DeckPreviewProps) {
  // Determine IDs to use
  let idsUsed: number[] = [];

  if (cardIds && cardIds.length === 8) {
    idsUsed = cardIds;
    console.log('DeckPreview - Using provided cardIds:', cardIds);
  } else {
    const parsedDeck = parseDeckLink(deckLink);
    idsUsed = parsedDeck.cards;
    console.log('DeckPreview - Parsed from deckLink:', deckLink, 'cards:', parsedDeck.cards);
  }

  // Remote fallback for unknown cards (RoyaleAPI)
  const [remoteMap, setRemoteMap] = useState<Map<number, ClashRoyaleCard> | null>(null);
  const idsKey = useMemo(() => idsUsed.join(','), [idsUsed]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://royaleapi.github.io/cr-api-data/json/cards.json');
        const data = await res.json();
        // Build a map for all ids in this deck
        const map = new Map<number, ClashRoyaleCard>();
        const idSet = new Set(idsUsed);
        for (const entry of data) {
          if (idSet.has(entry.id)) {
            const typeLower = String(entry.type || '').toLowerCase();
            const keySanitized = String(entry.key || '').toLowerCase().replace(/_/g, '-');
            let imageUrl = `https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards/${keySanitized}.png`;
            if (keySanitized === 'goblin-machine') {
              imageUrl = goblinMachineImg as string;
            }
            map.set(entry.id, {
              id: entry.id,
              name: entry.name,
              imageUrl,
              elixir: Number(entry.elixir ?? 0),
              type: (typeLower === 'troop' || typeLower === 'spell' || typeLower === 'building')
                ? typeLower
                : 'troop',
            });
          }
        }
        if (!cancelled) setRemoteMap(map);
      } catch (e) {
        console.warn('Failed to fetch RoyaleAPI cards.json', e);
      }
    })();

    return () => { cancelled = true; };
  }, [idsKey]);

  // Resolve cards with access to both local and remote
  const entries = idsUsed.map((id) => ({
    id,
    local: getCardById(id),
    remote: remoteMap?.get(id),
  }));

  const missing = entries
    .filter((e) => !e.local && !e.remote)
    .map((e) => e.id);

  const resolvedCards = entries
    .map((e) => {
      if (e.local && e.remote) {
        // Prefer local metadata like type to avoid remote overrides (e.g., Furnace rework)
        return { ...e.remote, type: e.local.type };
      }
      return (e.local ?? e.remote) ?? undefined;
    })
    .filter(Boolean) as ClashRoyaleCard[];

  if (missing.length > 0) {
    console.warn('DeckPreview - Missing card IDs (local + remote fallback):', missing, 'from ids:', idsUsed);
  }

  console.log('DeckPreview - Final cards resolved:', resolvedCards.length);

  const totalElixir = resolvedCards.reduce((sum, card) => sum + card.elixir, 0);
  const averageElixir = resolvedCards.length ? (totalElixir / resolvedCards.length).toFixed(1) : '0.0';

  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="space-y-4">
        {/* Elixir Cost Display */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground leading-none">Average Elixir Cost</span>
          <div className="flex items-center gap-1 leading-none text-right">
            <span className="text-sm sm:text-base font-bold text-primary leading-none">{averageElixir}</span>
            <span className="text-[10px] text-muted-foreground leading-none">elixir</span>
          </div>
        </div>

        {/* Missing cards notice */}
        {missing.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {missing.length} unknown card{missing.length > 1 ? 's' : ''}: {missing.join(', ')}
          </div>
        )}

        {/* Card Grid */}
        <div className="grid grid-cols-4 gap-2">
          {entries.map(({ id, local, remote }, index) => {
            const base = (remote ?? local) as ClashRoyaleCard | undefined;
            const name = (remote?.name ?? local?.name) ?? `Unknown ${id}`;
            const elixir = (remote?.elixir ?? local?.elixir ?? 0);
            const displaySrc = (remote?.imageUrl) ?? base?.imageUrl;
            const isSuspiciousBush = id === 26000097 || name.toLowerCase() === 'suspicious bush';

            if (id === 26000096) {
              console.log('DeckPreview - Goblin Machine debug', { id, name, elixir, src: displaySrc, hasRemote: !!remote, hasLocal: !!local });
            }

            return (
              <div key={`${id}-${index}`} className="relative group">
                <div className="relative overflow-visible rounded-lg bg-card border shadow-sm transition-transform hover:scale-105 aspect-[3/4]">
                  {base ? (
                    <img
                      src={displaySrc ?? ''}
                      alt={name}
                      className={`h-full w-full object-contain ${isSuspiciousBush ? 'transform origin-center scale-90' : ''}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (id === 26000096 || name.toLowerCase() === 'goblin machine') {
                          img.src = goblinMachineImg as string;
                        } else {
                          img.src = '/placeholder.svg';
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      Unknown {id}
                    </div>
                  )}
                  
                  <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground text-[8px] sm:text-[10px] font-bold rounded-full w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
                    {(base || id === 26000096) ? (id === 26000096 ? (elixir || 5) : elixir) : '?'}
                  </div>

                  {/* Card Name Tooltip */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium block truncate">
                      {base ? name : 'Unbekannte Karte'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Type Distribution */}
        <div className="flex flex-wrap justify-center gap-3 text-[11px] text-muted-foreground">
          {['troop', 'spell', 'building'].map(type => {
            const count = resolvedCards.filter(card => card.type === type).length;
            if (count === 0) return null;
            
            return (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  type === 'troop' ? 'bg-orange-500' :
                  type === 'spell' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`} />
                <span className="capitalize">{type}s: {count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}