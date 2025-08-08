// Utility functions for parsing Clash Royale deck links and handling deck data

export interface ParsedDeck {
  cards: number[];
  isValid: boolean;
}

/**
 * Parses a Clash Royale deck link and extracts card IDs
 * Format: clashroyale://copyDeck?deck=26000035;28000008;26000021;27000006;26000030;28000002;26000001;28000001
 */
export function parseDeckLink(deckLink: string): ParsedDeck {
  try {
    // Check if it's a valid Clash Royale deck link
    if (!deckLink.includes('clashroyale://') && !deckLink.includes('deck=')) {
      return { cards: [], isValid: false };
    }

    // Extract the deck parameter
    const deckMatch = deckLink.match(/deck=([^&]+)/);
    if (!deckMatch) {
      return { cards: [], isValid: false };
    }

    // Split by semicolon and convert to numbers
    const cardIds = deckMatch[1]
      .split(';')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    // Clash Royale decks should have exactly 8 cards
    const isValid = cardIds.length === 8;

    return {
      cards: cardIds,
      isValid
    };
  } catch (error) {
    console.error('Error parsing deck link:', error);
    return { cards: [], isValid: false };
  }
}

/**
 * Creates a Clash Royale deck link from card IDs
 */
export function createDeckLink(cardIds: number[]): string {
  if (cardIds.length !== 8) {
    throw new Error('Deck must contain exactly 8 cards');
  }
  
  const deckString = cardIds.join(';');
  return `clashroyale://copyDeck?deck=${deckString}`;
}

/**
 * Validates if a deck link is properly formatted
 */
export function isValidDeckLink(deckLink: string): boolean {
  const parsed = parseDeckLink(deckLink);
  return parsed.isValid;
}

/**
 * Opens a Clash Royale deck link in the app (or web fallback)
 */
export function openDeckInClashRoyale(deckLink: string): void {
  // Try to open in Clash Royale app
  window.open(deckLink, '_blank');
  
  // Fallback could be added here for web version if needed
  // For now, the clashroyale:// protocol should open the app if installed
}