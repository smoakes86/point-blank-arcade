import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export interface LetterTargetConfig extends TargetConfig {
  letter: string;
  isNextLetter: boolean;
}

export class LetterTarget extends Target {
  private letter: string;
  private isNextLetter: boolean;
  private background!: Phaser.GameObjects.Rectangle;
  private letterText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: LetterTargetConfig) {
    super(scene, config);
    this.letter = config.letter.toUpperCase();
    this.isNextLetter = config.isNextLetter;
    this.createVisuals();
  }

  createVisuals(): void {
    // Keyboard key style background
    this.background = this.scene.add.rectangle(0, 0, 55, 55, 0xecf0f1);
    this.background.setStrokeStyle(3, 0xbdc3c7);
    this.add(this.background);

    // 3D key effect (shadow)
    const shadow = this.scene.add.rectangle(0, 4, 55, 55, 0x95a5a6);
    shadow.setDepth(-1);
    this.add(shadow);

    // Letter
    this.letterText = this.scene.add.text(0, 0, this.letter, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#2c3e50',
    }).setOrigin(0.5);
    this.add(this.letterText);

    // Highlight if this is the next expected letter
    if (this.isNextLetter) {
      this.highlight(true);
    }

    this.hitCircle = this.scene.add.circle(0, 0, 30, 0x000000, 0);
    this.add(this.hitCircle);

    // Pop-in animation
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;

    if (this.isNextLetter) {
      return { points: this.points, correct: true };
    } else {
      return { points: -25, correct: false };
    }
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    if (correct) {
      // Correct letter - green press effect
      this.background.setFillStyle(0x27ae60);
      this.letterText.setColor('#ffffff');

      this.scene.tweens.add({
        targets: this,
        y: this.y + 3,
        duration: 50,
      });

      // Pop out
      this.scene.tweens.add({
        targets: this,
        scale: 1.2,
        alpha: 0,
        duration: 200,
        delay: 100,
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    } else {
      // Wrong letter - red shake
      this.background.setFillStyle(0xe74c3c);
      this.letterText.setColor('#ffffff');

      this.scene.tweens.add({
        targets: this,
        x: this.x + 8,
        duration: 40,
        yoyo: true,
        repeat: 3,
      });

      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 300,
        delay: 200,
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    }
  }

  highlight(enable: boolean): void {
    if (enable) {
      this.background.setFillStyle(0xf1c40f);
      this.background.setStrokeStyle(4, 0xf39c12);

      // Pulsing animation
      this.scene.tweens.add({
        targets: this,
        scale: 1.1,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.background.setFillStyle(0xecf0f1);
      this.background.setStrokeStyle(3, 0xbdc3c7);
      this.scene.tweens.killTweensOf(this);
      this.setScale(1);
    }
    this.isNextLetter = enable;
  }

  getLetter(): string {
    return this.letter;
  }

  isCorrectLetter(): boolean {
    return this.isNextLetter;
  }

  setAsNextLetter(isNext: boolean): void {
    this.isNextLetter = isNext;
    this.highlight(isNext);
  }

  getHitRadius(): number {
    return 30;
  }
}
