import React from 'react';
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

  const cards: ClashRoyaleCard[] = getCardsByIds(idsUsed);

  if (cards.length !== 8) {
    const missing = idsUsed.filter((id) => !getCardById(id));
    console.warn('DeckPreview - Missing card IDs in dataset:', missing, 'from ids:', idsUsed);
  }

  console.log('DeckPreview - Final cards found:', cards.length);

  if (cards.length !== 8) {
    return (
      <div className={`flex items-center justify-center p-4 text-muted-foreground ${className}`}>
        <span className="text-sm">Invalid deck format (found {cards.length} cards)</span>
      </div>
    );
  }

  const totalElixir = cards.reduce((sum, card) => sum + card.elixir, 0);
  const averageElixir = (totalElixir / cards.length).toFixed(1);

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

        {/* Card Grid */}
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card, index) => (
            <div key={`${card.id}-${index}`} className="relative group">
              <div className="relative overflow-hidden rounded-lg bg-card border shadow-sm transition-transform hover:scale-105">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-16 object-cover"
                  loading="lazy"
                />
                
                {/* Elixir Cost Badge */}
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {card.elixir}
                </div>

                {/* Card Name Tooltip */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium block truncate">
                    {card.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Card Type Distribution */}
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          {['troop', 'spell', 'building'].map(type => {
            const count = cards.filter(card => card.type === type).length;
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