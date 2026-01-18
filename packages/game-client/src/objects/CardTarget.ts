import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export interface CardConfig extends TargetConfig {
  symbol: string;
  symbolColor: number;
  pairId: number;
}

export class CardTarget extends Target {
  private symbol: string;
  private symbolColor: number;
  private pairId: number;
  private isFlipped: boolean = false;
  private cardFront!: Phaser.GameObjects.Container;
  private cardBack!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: CardConfig) {
    super(scene, config);
    this.symbol = config.symbol;
    this.symbolColor = config.symbolColor;
    this.pairId = config.pairId;
    this.createVisuals();
  }

  createVisuals(): void {
    // Card back (shown when face-down)
    this.cardBack = this.scene.add.container(0, 0);

    const backBg = this.scene.add.rectangle(0, 0, 80, 100, 0x2244aa);
    backBg.setStrokeStyle(3, 0x1133aa);

    // Pattern on back
    const pattern = this.scene.add.graphics();
    pattern.lineStyle(2, 0x3355cc);
    for (let i = -30; i <= 30; i += 15) {
      pattern.moveTo(-35, i);
      pattern.lineTo(35, i);
      pattern.moveTo(i, -45);
      pattern.lineTo(i, 45);
    }
    pattern.strokePath();

    // Question mark
    const questionMark = this.scene.add.text(0, 0, '?', {
      fontFamily: 'Arial Black',
      fontSize: '40px',
      color: '#6688ff',
    }).setOrigin(0.5);

    this.cardBack.add([backBg, pattern, questionMark]);
    this.add(this.cardBack);

    // Card front (shown when face-up)
    this.cardFront = this.scene.add.container(0, 0);
    this.cardFront.setVisible(false);

    const frontBg = this.scene.add.rectangle(0, 0, 80, 100, 0xffffff);
    frontBg.setStrokeStyle(3, 0xcccccc);

    const symbolText = this.scene.add.text(0, 0, this.symbol, {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: Phaser.Display.Color.IntegerToColor(this.symbolColor).rgba,
    }).setOrigin(0.5);

    this.cardFront.add([frontBg, symbolText]);
    this.add(this.cardFront);

    this.hitCircle = this.scene.add.circle(0, 0, 50, 0x000000, 0);
    this.add(this.hitCircle);
  }

  flip(): void {
    if (this.isFlipped) return;
    this.isFlipped = true;

    // Flip animation
    this.scene.tweens.add({
      targets: this.cardBack,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        this.cardBack.setVisible(false);
        this.cardFront.setVisible(true);
        this.cardFront.setScale(0, 1);

        this.scene.tweens.add({
          targets: this.cardFront,
          scaleX: 1,
          duration: 150,
        });
      },
    });
  }

  unflip(): void {
    if (!this.isFlipped) return;
    this.isFlipped = false;

    // Flip back animation
    this.scene.tweens.add({
      targets: this.cardFront,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        this.cardFront.setVisible(false);
        this.cardBack.setVisible(true);
        this.cardBack.setScale(0, 1);

        this.scene.tweens.add({
          targets: this.cardBack,
          scaleX: 1,
          duration: 150,
        });
      },
    });
  }

  isCardFlipped(): boolean {
    return this.isFlipped;
  }

  getPairId(): number {
    return this.pairId;
  }

  getSymbol(): string {
    return this.symbol;
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    // Flip the card when hit
    if (!this.isFlipped) {
      this.flip();
    }
    return { points: 0, correct: true }; // Points determined by matching logic
  }

  playMatchAnimation(onComplete?: () => void): void {
    // Matched pair - celebrate and remove
    this.scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 200,
      yoyo: true,
    });

    // Sparkle effect
    for (let i = 0; i < 6; i++) {
      const sparkle = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * 60,
        this.y + (Math.random() - 0.5) * 80,
        4,
        0xffff00
      );
      sparkle.setDepth(this.depth + 1);

      this.scene.tweens.add({
        targets: sparkle,
        scale: 0,
        alpha: 0,
        y: sparkle.y - 30,
        duration: 500,
        delay: i * 50,
        onComplete: () => sparkle.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0,
      duration: 300,
      delay: 400,
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  playMismatchAnimation(onComplete?: () => void): void {
    // Shake and flip back
    this.scene.tweens.add({
      targets: this,
      x: this.x + 5,
      duration: 40,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // Delay before flipping back
        this.scene.time.delayedCall(500, () => {
          this.unflip();
          onComplete?.();
        });
      },
    });
  }

  getHitRadius(): number {
    return 50;
  }
}
