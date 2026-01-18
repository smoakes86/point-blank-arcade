import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export interface NumberConfig extends TargetConfig {
  number: number;
  isNextExpected?: boolean;
}

export class NumberTarget extends Target {
  private number: number;
  private numberText!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Rectangle;
  private isHighlighted: boolean = false;

  constructor(scene: Phaser.Scene, config: NumberConfig) {
    super(scene, config);
    this.number = config.number;
    this.createVisuals();

    if (config.isNextExpected) {
      this.highlight();
    }
  }

  createVisuals(): void {
    // Key-like background
    this.background = this.scene.add.rectangle(0, 0, 70, 70, 0x444444);
    this.background.setStrokeStyle(3, 0x666666);
    this.add(this.background);

    // Inner shadow
    const innerShadow = this.scene.add.rectangle(0, 2, 62, 62, 0x333333);
    this.add(innerShadow);

    // Key face
    const keyFace = this.scene.add.rectangle(0, -2, 62, 62, 0x555555);
    this.add(keyFace);

    // Number
    this.numberText = this.scene.add.text(0, -2, this.number.toString(), {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.numberText);

    this.hitCircle = this.scene.add.circle(0, 0, 35, 0x000000, 0);
    this.add(this.hitCircle);
  }

  highlight(): void {
    if (this.isHighlighted) return;
    this.isHighlighted = true;

    this.background.setFillStyle(0x4ecdc4);
    this.background.setStrokeStyle(3, 0x7fffff);

    // Pulse animation
    this.scene.tweens.add({
      targets: this,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  unhighlight(): void {
    this.isHighlighted = false;
    this.scene.tweens.killTweensOf(this);
    this.setScale(1);
    this.background.setFillStyle(0x444444);
    this.background.setStrokeStyle(3, 0x666666);
  }

  getNumber(): number {
    return this.number;
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;
    // The caller should validate if this is the correct number
    return { points: this.points, correct: true };
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    this.scene.tweens.killTweensOf(this);

    if (correct) {
      // Correct number - satisfying press
      this.scene.tweens.add({
        targets: this,
        scale: 0.9,
        duration: 50,
        yoyo: true,
      });

      this.background.setFillStyle(0x4ecdc4);

      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 200,
        delay: 100,
        onComplete: () => {
          onComplete?.();
        },
      });
    } else {
      // Wrong number - error
      this.background.setFillStyle(0xff4444);

      this.scene.tweens.add({
        targets: this,
        x: this.x + 8,
        duration: 40,
        yoyo: true,
        repeat: 3,
      });

      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 300,
        delay: 200,
        onComplete: () => {
          this.background.setFillStyle(0x444444);
          this.setAlpha(1);
          onComplete?.();
        },
      });
    }
  }

  // Don't destroy after hit - just mark as done
  playCorrectAnimation(onComplete?: () => void): void {
    this.isActive = false;
    this.background.setFillStyle(0x4ecdc4);
    this.scene.tweens.killTweensOf(this);
    this.setScale(1);

    this.scene.tweens.add({
      targets: this,
      scale: 1.1,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.setAlpha(0.5);
        onComplete?.();
      },
    });
  }

  getHitRadius(): number {
    return 35;
  }
}
