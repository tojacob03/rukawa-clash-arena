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
    const input = (deckLink || '').trim();
    if (!input) return { cards: [], isValid: false };

    // 1) Try to extract the deck param anywhere in the string (case-insensitive)
    const deckMatch = input.match(/deck=([^&\s]+)/i);
    let deckParam = deckMatch ? deckMatch[1] : '';

    if (deckParam) {
      // Decode URL-encoded sequences like %3B
      deckParam = decodeURIComponent(deckParam);
    } else {
      // 2) Fallback: accept 8 IDs entered directly, separated by semicolons/commas/spaces
      const parts = input
        .split(/[;_,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const asNums = parts
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      if (asNums.length === 8) {
        return { cards: asNums, isValid: true };
      }

      return { cards: [], isValid: false };
    }

    // Convert the deckParam (e.g. "26000017;27000006;...") to integers
    const cardIds = deckParam
      .split(/[;_,\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    const isValid = cardIds.length === 8;
    return { cards: cardIds, isValid };
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
 * Normalizes any supported Clash Royale deck link to canonical scheme form.
 * Supports link.clashroyale.com links and raw clashroyale:// links.
 */
export function normalizeDeckLink(input: string): string | null {
  const parsed = parseDeckLink(input);
  if (!parsed.isValid || parsed.cards.length !== 8) return null;
  return createDeckLink(parsed.cards);
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