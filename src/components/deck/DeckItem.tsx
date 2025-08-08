import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Copy } from 'lucide-react';
import { DeckPreview } from './DeckPreview';
import { openDeckInClashRoyale } from '@/utils/deckParser';
import { useToast } from '@/hooks/use-toast';

interface DeckFile {
  id: string;
  deck_name: string;
  deck_link: string;
  deck_number: number;
  card_ids?: number[];
}

interface DeckItemProps {
  deckFile: DeckFile;
}

export function DeckItem({ deckFile }: DeckItemProps) {
  const { toast } = useToast();

  const handleCopyDeck = () => {
    openDeckInClashRoyale(deckFile.deck_link);
    toast({
      title: "Deck opened",
      description: "The deck should open in Clash Royale if you have the app installed.",
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deckFile.deck_link);
      toast({
        title: "Link copied",
        description: "Deck link copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 space-y-4 shadow-card hover:shadow-glow transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {deckFile.deck_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Deck #{deckFile.deck_number}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </Button>
          
          <Button
            onClick={handleCopyDeck}
            className="flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Game
          </Button>
        </div>
      </div>

      {/* Deck Preview */}
      <DeckPreview deckLink={deckFile.deck_link} cardIds={deckFile.card_ids} />
    </Card>
  );
}