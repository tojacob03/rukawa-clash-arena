import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { CLASH_ROYALE_CARDS } from '@/data/clashRoyaleCards';

interface DeckFile {
  id: string;
  deck_name: string;
  deck_link: string;
  deck_number: number;
  card_ids?: any;
}

interface DeckItemProps {
  deckFile: DeckFile;
}

const CARDS_BY_ID = new Map(CLASH_ROYALE_CARDS.map((c) => [c.id, c]));

const normalizeCardIds = (raw: unknown): number[] => {
  if (!raw) return [];
  let value: unknown = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) =>
      typeof entry === 'number'
        ? entry
        : typeof entry === 'object' && entry !== null
          ? Number((entry as { id?: unknown }).id)
          : Number(entry),
    )
    .filter((id) => Number.isFinite(id));
};

export const DeckItem = ({ deckFile }: DeckItemProps) => {
  const cardIds = normalizeCardIds(deckFile.card_ids).slice(0, 8);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{deckFile.deck_name}</p>
          <Badge variant="secondary" className="mt-1">
            Deck {deckFile.deck_number}
          </Badge>
        </div>
        {deckFile.deck_link && (
          <Button asChild size="sm" variant="outline">
            <a href={deckFile.deck_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open deck</span>
            </a>
          </Button>
        )}
      </div>

      {cardIds.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {cardIds.map((id, index) => {
            const card = CARDS_BY_ID.get(id);
            return card ? (
              <img
                key={`${id}-${index}`}
                src={card.imageUrl}
                alt={card.name}
                title={card.name}
                loading="lazy"
                className="aspect-[3/4] w-full rounded object-contain"
              />
            ) : (
              <div
                key={`${id}-${index}`}
                className="aspect-[3/4] w-full rounded bg-muted/40"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeckItem;
