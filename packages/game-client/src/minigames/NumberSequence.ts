import { MiniGame, type MiniGameConfig } from './MiniGame';
import { NumberTarget } from '../objects/NumberTarget';

export interface NumberSequenceConfig extends MiniGameConfig {
  maxNumber: number;
  screenWidth: number;
  screenHeight: number;
}

export class NumberSequence extends MiniGame {
  private maxNumber: number;
  private currentExpected: number = 1;
  private screenWidth: number;
  private screenHeight: number;
  private numberTargets: Map<number, NumberTarget> = new Map();

  constructor(config: NumberSequenceConfig) {
    super(config);
    this.maxNumber = config.maxNumber;
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.spawnTargets();
  }

  spawnTargets(): void {
    // Create a shuffled grid of numbers
    const numbers: number[] = [];
    for (let i = 1; i <= this.maxNumber; i++) {
      numbers.push(i);
    }

    // Shuffle using Fisher-Yates
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Calculate grid layout
    const cols = 4;
    const rows = Math.ceil(this.maxNumber / cols);
    const cellWidth = (this.screenWidth - 200) / cols;
    const cellHeight = (this.screenHeight - 300) / rows;
    const startX = 100 + cellWidth / 2;
    const startY = 180 + cellHeight / 2;

    numbers.forEach((num, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * cellWidth;
      const y = startY + row * cellHeight;

      const isFirst = num === 1;
      const target = new NumberTarget(this.scene, {
        id: `number-${num}`,
        x,
        y,
        width: 70,
        height: 70,
        points: 10,
        number: num,
        isNextExpected: isFirst,
      });

      this.numberTargets.set(num, target);
      this.addTarget(target);
    });
  }

  update(_delta: number): void {
    // No spawning needed - all numbers placed at start
  }

  handleNumberHit(number: number): boolean {
    if (number === this.currentExpected) {
      // Correct number!
      const target = this.numberTargets.get(number);
      if (target) {
        target.playCorrectAnimation();
      }

      this.currentExpected++;
      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);

      // Highlight next expected number
      const nextTarget = this.numberTargets.get(this.currentExpected);
      if (nextTarget) {
        nextTarget.highlight();
      }

      return true;
    } else {
      // Wrong number!
      const target = this.numberTargets.get(number);
      if (target) {
        target.playHitAnimation(false);
      }
      return false;
    }
  }

  getCurrentExpected(): number {
    return this.currentExpected;
  }

  isComplete(): boolean {
    return this.currentExpected > this.maxNumber;
  }
}
