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
            const typeLower = (entry.type || '').toLowerCase();
            const imageUrl = `https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards/${entry.key}.png`;
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
    .map((e) => e.remote ?? e.local)
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
            const base = (remote ?? local) as ClashRoyaleCard | undefined;
            const name = (remote?.name ?? local?.name) ?? `Unknown ${id}`;
            const elixir = (remote?.elixir ?? local?.elixir ?? 0);
            const displaySrc = (local?.imageUrl) ?? (remote?.imageUrl) ?? base?.imageUrl;

            return (
              <div key={`${id}-${index}`} className="relative group">
                <div className="relative overflow-hidden rounded-lg bg-card border shadow-sm transition-transform hover:scale-105 aspect-[3/4]">
                  {base ? (
                    <img
                      src={displaySrc ?? ''}
                      alt={name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
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