import { MiniGame, type MiniGameConfig } from './MiniGame';
import { CardTarget } from '../objects/CardTarget';

export interface CardMatchingConfig extends MiniGameConfig {
  pairsCount: number;
  screenWidth: number;
  screenHeight: number;
}

const CARD_SYMBOLS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '⭐', '🌙', '❤️', '💎', '🎯', '🎮'];
const CARD_COLORS = [0xff4444, 0xff8844, 0xffff44, 0x8844ff, 0xff4488, 0xcc4444, 0xffcc00, 0x4444ff, 0xff6666, 0x44ffff, 0x44ff44, 0xff44ff];

export class CardMatching extends MiniGame {
  private pairsCount: number;
  private screenWidth: number;
  private screenHeight: number;
  private cardTargets: CardTarget[] = [];
  private flippedCards: CardTarget[] = [];
  private matchedPairs: number = 0;
  private canFlip: boolean = true;

  constructor(config: CardMatchingConfig) {
    super(config);
    this.pairsCount = config.pairsCount;
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.spawnTargets();
  }

  spawnTargets(): void {
    // Create pairs of cards
    const cards: { symbol: string; color: number; pairId: number }[] = [];

    for (let i = 0; i < this.pairsCount; i++) {
      const symbol = CARD_SYMBOLS[i % CARD_SYMBOLS.length];
      const color = CARD_COLORS[i % CARD_COLORS.length];

      // Two cards per pair
      cards.push({ symbol, color, pairId: i });
      cards.push({ symbol, color, pairId: i });
    }

    // Shuffle cards
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    // Calculate grid layout
    const totalCards = cards.length;
    const cols = Math.ceil(Math.sqrt(totalCards * 1.5));
    const rows = Math.ceil(totalCards / cols);
    const cellWidth = (this.screenWidth - 200) / cols;
    const cellHeight = (this.screenHeight - 300) / rows;
    const startX = 100 + cellWidth / 2;
    const startY = 180 + cellHeight / 2;

    cards.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * cellWidth;
      const y = startY + row * cellHeight;

      const cardTarget = new CardTarget(this.scene, {
        id: `card-${index}`,
        x,
        y,
        width: 80,
        height: 100,
        points: 50,
        symbol: card.symbol,
        symbolColor: card.color,
        pairId: card.pairId,
      });

      this.cardTargets.push(cardTarget);
      this.addTarget(cardTarget);
    });
  }

  update(_delta: number): void {
    // Cards are static
  }

  handleCardFlip(cardId: string): { matched: boolean; complete: boolean } | null {
    if (!this.canFlip) return null;

    const card = this.cardTargets.find((c) => c.targetId === cardId);
    if (!card || card.isCardFlipped()) return null;

    // Flip the card
    card.flip();
    this.flippedCards.push(card);

    // Check for pair
    if (this.flippedCards.length === 2) {
      this.canFlip = false;

      const [card1, card2] = this.flippedCards;

      if (card1.getPairId() === card2.getPairId()) {
        // Match!
        this.matchedPairs++;
        this.quotaMet++;
        this.onQuotaUpdate(this.quotaMet, this.quota);

        // Remove matched cards
        this.scene.time.delayedCall(500, () => {
          card1.playMatchAnimation(() => {
            this.targets.delete(card1.targetId);
          });
          card2.playMatchAnimation(() => {
            this.targets.delete(card2.targetId);
          });

          this.flippedCards = [];
          this.canFlip = true;
        });

        return { matched: true, complete: this.matchedPairs >= this.pairsCount };
      } else {
        // No match - flip back after delay
        this.scene.time.delayedCall(1000, () => {
          card1.unflip();
          card2.unflip();
          this.flippedCards = [];
          this.canFlip = true;
        });

        return { matched: false, complete: false };
      }
    }

    return null;
  }

  getMatchedPairs(): number {
    return this.matchedPairs;
  }

  isComplete(): boolean {
    return this.matchedPairs >= this.pairsCount;
  }
}
