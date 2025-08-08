import React, { useEffect, useMemo, useState } from 'react';
import { ClashRoyaleCard, getCardsByIds, getCardById } from '@/data/clashRoyaleCards';
import { parseDeckLink } from '@/utils/deckParser';
import { Card } from '@/components/ui/card';

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
  const [useRemote, setUseRemote] = useState<Set<number>>(new Set());
  const idsKey = useMemo(() => idsUsed.join(','), [idsUsed]);

  useEffect(() => {
    const unknownIds = idsUsed.filter((id) => !getCardById(id));
    if (unknownIds.length === 0) {
      setRemoteMap(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://royaleapi.github.io/cr-api-data/json/cards.json');
        const data = await res.json();
        // Build a map only for the missing ids
        const map = new Map<number, ClashRoyaleCard>();
        for (const entry of data) {
          if (unknownIds.includes(entry.id)) {
            const typeLower = (entry.type || '').toLowerCase();
            const imageUrl = `https://royaleapi.github.io/cr-api-assets/cards-300/${entry.key}.png`;
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
    .map((e) => e.local ?? e.remote)
    .filter(Boolean) as ClashRoyaleCard[];

  if (missing.length > 0) {
    console.warn('DeckPreview - Missing card IDs (local + remote fallback):', missing, 'from ids:', idsUsed);
  }

  console.log('DeckPreview - Final cards resolved:', resolvedCards.length);

  const totalElixir = resolvedCards.reduce((sum, card) => sum + card.elixir, 0);
  const averageElixir = resolvedCards.length ? (totalElixir / resolvedCards.length).toFixed(1) : '0.0';

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Elixir Cost Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Average Elixir Cost</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-primary">{averageElixir}</span>
            <span className="text-xs text-muted-foreground">elixir</span>
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
            const base = (local ?? remote) as ClashRoyaleCard | undefined;
            const name = base?.name ?? `Unknown ${id}`;
            const elixir = base?.elixir ?? (remote?.elixir ?? (local?.elixir ?? 0));
            const displaySrc = (remote && useRemote.has(id))
              ? remote.imageUrl
              : base?.imageUrl;

            return (
              <div key={`${id}-${index}`} className="relative group">
                <div className="relative overflow-hidden rounded-lg bg-card border shadow-sm transition-transform hover:scale-105">
                  {base ? (
                    <img
                      src={displaySrc ?? ''}
                      alt={name}
                      className="w-full h-16 object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={async (e) => {
                        // Prefer switching to remote image if available
                        if (!Array.from(useRemote).includes(id) && remote?.imageUrl) {
                          setUseRemote((prev) => {
                            const next = new Set(prev);
                            next.add(id);
                            return next;
                          });
                          return;
                        }
                        // If remote not yet available, try to fetch it on-demand
                        if (!remote) {
                          try {
                            const res = await fetch('https://royaleapi.github.io/cr-api-data/json/cards.json');
                            const data = await res.json();
                            const entry = data.find((d: any) => d.id === id);
                            if (entry) {
                              const typeLower = (entry.type || '').toLowerCase();
                              const imageUrl = `https://royaleapi.github.io/cr-api-assets/cards-300/${entry.key}.png`;
                              setRemoteMap((prev) => {
                                const map = new Map(prev ?? []);
                                map.set(entry.id, {
                                  id: entry.id,
                                  name: entry.name,
                                  imageUrl,
                                  elixir: Number(entry.elixir ?? 0),
                                  type: (typeLower === 'troop' || typeLower === 'spell' || typeLower === 'building') ? typeLower : 'troop',
                                });
                                return map;
                              });
                              setUseRemote((prev) => {
                                const next = new Set(prev);
                                next.add(id);
                                return next;
                              });
                              return;
                            }
                          } catch {}
                        }
                        // Final fallback: show placeholder image
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-16 flex items-center justify-center text-xs text-muted-foreground">
                      Unknown {id}
                    </div>
                  )}
                  
                  {/* Elixir Cost Badge */}
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {base ? elixir : '?'}
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
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
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