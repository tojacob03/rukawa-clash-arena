import React, { useEffect, useMemo, useState } from 'react';
import { ClashRoyaleCard, getCardsByIds, getCardById } from '@/data/clashRoyaleCards';
import { parseDeckLink } from '@/utils/deckParser';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [loading, setLoading] = useState<boolean>(false);
  const idsKey = useMemo(() => idsUsed.join(','), [idsUsed]);

  useEffect(() => {
    if (!idsUsed || idsUsed.length === 0) {
      setRemoteMap(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('https://royaleapi.github.io/cr-api-data/json/cards.json', { cache: 'no-store' });
        const data = await res.json();
        const idsSet = new Set(idsUsed);
        const map = new Map<number, ClashRoyaleCard>();
        for (const entry of data) {
          if (idsSet.has(entry.id)) {
            const typeLower = (entry.type || '').toLowerCase();
            const imageUrl = `https://cdn.royaleapi.com/static/img/cards/300/${entry.key}.png`;
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
        if (!cancelled) setRemoteMap(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [idsKey]);

  // Resolve cards using local dataset first, then remote fallback
  const entries = idsUsed.map((id) => {
    const local = getCardById(id);
    const remote = remoteMap?.get(id);
    const merged: ClashRoyaleCard | undefined = local
      ? {
          ...local,
          imageUrl: local.imageUrl || remote?.imageUrl || '',
          elixir: typeof local.elixir === 'number' ? local.elixir : (remote?.elixir ?? 0),
          type: local.type || (remote?.type as any) || 'troop',
        }
      : remote;
    return { id, card: merged };
  });
  const missing = entries.filter((e) => !e.card).map((e) => e.id);

  const resolvedCards = entries
    .map((e) => e.card)
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
        {!loading && missing.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {missing.length} unknown card{missing.length > 1 ? 's' : ''}: {missing.join(', ')}
          </div>
        )}

        {/* Card Grid */}
        <div className="grid grid-cols-4 gap-2">
          {entries.map(({ id, card }, index) => (
            <div key={`${id}-${index}`} className="relative group">
              <div className="relative overflow-hidden rounded-lg bg-card border shadow-sm transition-transform hover:scale-105">
                {card ? (
                  <img
                    src={card.imageUrl}
                    alt={`Clash Royale card: ${card.name}`}
                    className="w-full h-16 object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const remoteUrl = remoteMap?.get(id)?.imageUrl;
                      if (remoteUrl && e.currentTarget.src !== remoteUrl) {
                        e.currentTarget.src = remoteUrl;
                      } else {
                        e.currentTarget.src = '/placeholder.svg';
                      }
                    }}
                  />
                ) : (
                  {loading ? (
                    <Skeleton className="w-full h-16" />
                  ) : (
                    <div className="w-full h-16 flex items-center justify-center text-xs text-muted-foreground">
                      Unknown {id}
                    </div>
                  )}
                )}
                
                {/* Elixir Cost Badge */}
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {card ? card.elixir : '?'}
                </div>

                {/* Card Name Tooltip */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium block truncate">
                    {card ? card.name : 'Unbekannte Karte'}
                  </span>
                </div>
              </div>
            </div>
          ))}
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