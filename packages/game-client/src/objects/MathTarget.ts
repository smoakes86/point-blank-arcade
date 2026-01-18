import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export interface MathTargetConfig extends TargetConfig {
  answer: number;
  isCorrect: boolean;
}

export class MathTarget extends Target {
  private answer: number;
  private isCorrect: boolean;
  private answerText!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, config: MathTargetConfig) {
    super(scene, config);
    this.answer = config.answer;
    this.isCorrect = config.isCorrect;
    this.createVisuals();
  }

  createVisuals(): void {
    // Background button
    this.background = this.scene.add.rectangle(0, 0, 80, 60, 0x3498db);
    this.background.setStrokeStyle(4, 0x2980b9);
    this.add(this.background);

    // Answer text
    this.answerText = this.scene.add.text(0, 0, this.answer.toString(), {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add(this.answerText);

    // Hover effect
    this.background.setInteractive();

    this.hitCircle = this.scene.add.circle(0, 0, 45, 0x000000, 0);
    this.add(this.hitCircle);

    // Pop-in animation
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;

    if (this.isCorrect) {
      return { points: this.points, correct: true };
    } else {
      return { points: -50, correct: false };
    }
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    if (correct) {
      // Correct answer - green flash and expand
      this.background.setFillStyle(0x27ae60);

      // Checkmark
      const check = this.scene.add.text(this.x, this.y, '✓', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#ffffff',
      }).setOrigin(0.5);
      check.setDepth(this.depth + 10);

      this.scene.tweens.add({
        targets: check,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => check.destroy(),
      });

      this.scene.tweens.add({
        targets: this,
        scale: 1.3,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    } else {
      // Wrong answer - red flash and shake
      this.background.setFillStyle(0xe74c3c);

      // X mark
      const xMark = this.scene.add.text(this.x, this.y, '✗', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#ffffff',
      }).setOrigin(0.5);
      xMark.setDepth(this.depth + 10);

      this.scene.tweens.add({
        targets: xMark,
        scale: 1.5,
        alpha: 0,
        duration: 500,
        onComplete: () => xMark.destroy(),
      });

      // Shake
      this.scene.tweens.add({
        targets: this,
        x: this.x + 10,
        duration: 50,
        yoyo: true,
        repeat: 4,
      });

      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 400,
        delay: 200,
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    }
  }

  getAnswer(): number {
    return this.answer;
  }

  isCorrectAnswer(): boolean {
    return this.isCorrect;
  }

  highlight(enable: boolean): void {
    if (enable) {
      this.background.setStrokeStyle(4, 0xf1c40f);
      this.scene.tweens.add({
        targets: this,
        scale: 1.1,
        duration: 200,
      });
    } else {
      this.background.setStrokeStyle(4, 0x2980b9);
      this.scene.tweens.add({
        targets: this,
        scale: 1,
        duration: 200,
      });
    }
  }

  getHitRadius(): number {
    return 45;
  }
}
