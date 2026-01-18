import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { ColorTarget } from '../objects/ColorTarget';

export interface SequenceRecallConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

type Phase = 'showing' | 'playing' | 'result';

export class SequenceRecall extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private sequence: number[] = [];
  private playerSequence: number[] = [];
  private buttonTargets: ColorTarget[] = [];
  private roundNumber: number = 0;
  private maxRounds: number;
  private phase: Phase = 'showing';
  private currentShowIndex: number = 0;
  private buttonColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
  private buttonPositions: { x: number; y: number }[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private sequenceLength: number = 3;

  constructor(config: SequenceRecallConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.maxRounds = config.quota;

    this.initializeButtons();
    this.createUI();
    this.startRound();
  }

  private initializeButtons(): void {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2 + 50;
    const offset = 100;

    this.buttonPositions = [
      { x: centerX, y: centerY - offset },       // Top (Red)
      { x: centerX + offset, y: centerY },       // Right (Green)
      { x: centerX, y: centerY + offset },       // Bottom (Blue)
      { x: centerX - offset, y: centerY },       // Left (Yellow)
    ];
  }

  private createUI(): void {
    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 40, 'SEQUENCE RECALL', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#9b59b6',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Status text
    this.statusText = this.scene.add.text(this.screenWidth / 2, 100, '', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.statusText.setDepth(100);

    // Instructions
    const instructions = this.scene.add.text(this.screenWidth / 2, 140, 'Watch the sequence, then repeat it!', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#bdc3c7',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    instructions.setDepth(50);
  }

  private createButtons(): void {
    // Clear existing buttons
    this.buttonTargets.forEach((btn) => {
      if (btn.active) btn.destroy();
    });
    this.buttonTargets = [];
    this.targets.clear();

    // Create 4 colored buttons
    this.buttonPositions.forEach((pos, index) => {
      const button = new ColorTarget(this.scene, {
        id: `seqbtn-${this.roundNumber}-${index}`,
        x: pos.x,
        y: pos.y,
        width: 70,
        height: 70,
        points: 10,
        playerColor: this.buttonColors[index],
        playerNumber: index + 1,
      });

      // Make buttons dimmer during showing phase
      if (this.phase === 'showing') {
        button.setAlpha(0.5);
      }

      this.buttonTargets.push(button);
      this.addTarget(button);
    });
  }

  private generateSequence(): void {
    this.sequence = [];
    for (let i = 0; i < this.sequenceLength; i++) {
      this.sequence.push(Math.floor(Math.random() * 4));
    }
  }

  private startRound(): void {
    this.phase = 'showing';
    this.playerSequence = [];
    this.currentShowIndex = 0;

    // Increase sequence length every 2 rounds
    this.sequenceLength = 3 + Math.floor(this.roundNumber / 2);

    this.generateSequence();
    this.createButtons();

    this.statusText.setText('Watch carefully...');

    // Start showing sequence after a brief delay
    this.scene.time.delayedCall(1000, () => {
      this.showNextInSequence();
    });
  }

  private showNextInSequence(): void {
    if (this.currentShowIndex >= this.sequence.length) {
      // Done showing, switch to playing phase
      this.scene.time.delayedCall(500, () => {
        this.startPlayingPhase();
      });
      return;
    }

    const buttonIndex = this.sequence[this.currentShowIndex];
    const button = this.buttonTargets[buttonIndex];

    // Flash the button
    this.flashButton(button, () => {
      this.currentShowIndex++;
      this.scene.time.delayedCall(300, () => {
        this.showNextInSequence();
      });
    });
  }

  private flashButton(button: ColorTarget, onComplete: () => void): void {
    // Brighten
    button.setAlpha(1);
    this.scene.tweens.add({
      targets: button,
      scale: 1.3,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        button.setAlpha(0.5);
        onComplete();
      },
    });
  }

  private startPlayingPhase(): void {
    this.phase = 'playing';
    this.statusText.setText('Your turn! Repeat the sequence');

    // Make buttons fully visible and interactive
    this.buttonTargets.forEach((btn) => {
      btn.setAlpha(1);
    });
  }

  update(_delta: number): void {
    // Sequence recall is event-driven
  }

  spawnTargets(): void {
    // Targets managed through button creation
  }

  handleButtonHit(targetId: string, playerNumber: number): { success: boolean; correct: boolean } {
    if (this.phase !== 'playing') {
      return { success: false, correct: false };
    }

    const buttonIndex = this.buttonTargets.findIndex((b) => b.targetId === targetId);
    if (buttonIndex === -1) return { success: false, correct: false };

    const expectedIndex = this.sequence[this.playerSequence.length];
    const isCorrect = buttonIndex === expectedIndex;

    const button = this.buttonTargets[buttonIndex];

    // Visual feedback
    this.scene.tweens.add({
      targets: button,
      scale: 1.2,
      duration: 100,
      yoyo: true,
    });

    if (isCorrect) {
      this.playerSequence.push(buttonIndex);
      this.showFeedback(button.x, button.y, true);

      // Check if sequence complete
      if (this.playerSequence.length === this.sequence.length) {
        this.onRoundSuccess();
      }

      return { success: true, correct: true };
    } else {
      // Wrong button!
      this.onTargetHit(targetId, playerNumber, -50, false);
      this.showFeedback(button.x, button.y, false);
      this.onRoundFail();

      return { success: true, correct: false };
    }
  }

  private showFeedback(x: number, y: number, correct: boolean): void {
    const text = correct ? '✓' : '✗';
    const color = correct ? '#27ae60' : '#e74c3c';

    const feedback = this.scene.add.text(x, y - 50, text, {
      fontFamily: 'Arial',
      fontSize: '48px',
      color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    feedback.setDepth(200);

    this.scene.tweens.add({
      targets: feedback,
      y: y - 90,
      alpha: 0,
      duration: 500,
      onComplete: () => feedback.destroy(),
    });
  }

  private onRoundSuccess(): void {
    this.phase = 'result';
    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    this.statusText.setText('Correct!');
    this.statusText.setColor('#27ae60');

    // Celebration effect
    const success = this.scene.add.text(this.screenWidth / 2, this.screenHeight / 2, 'PERFECT!', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    success.setDepth(300);

    this.scene.tweens.add({
      targets: success,
      scale: 1.5,
      alpha: 0,
      duration: 800,
      onComplete: () => success.destroy(),
    });

    this.roundNumber++;

    if (this.roundNumber < this.maxRounds) {
      this.scene.time.delayedCall(1500, () => {
        this.statusText.setColor('#ffffff');
        this.startRound();
      });
    }
  }

  private onRoundFail(): void {
    this.phase = 'result';
    this.statusText.setText('Wrong sequence!');
    this.statusText.setColor('#e74c3c');

    this.scene.cameras.main.shake(200, 0.02);

    // Show correct sequence briefly
    this.scene.time.delayedCall(500, () => {
      this.showCorrectSequence();
    });

    this.roundNumber++;

    if (this.roundNumber < this.maxRounds) {
      this.scene.time.delayedCall(2500, () => {
        this.statusText.setColor('#ffffff');
        this.startRound();
      });
    }
  }

  private showCorrectSequence(): void {
    const text = this.scene.add.text(this.screenWidth / 2, this.screenHeight / 2 + 180,
      'Correct was: ' + this.sequence.map(i => ['R', 'G', 'B', 'Y'][i]).join(' → '), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    text.setDepth(150);

    this.scene.time.delayedCall(2000, () => {
      text.destroy();
    });
  }

  destroy(): void {
    this.buttonTargets = [];
    super.destroy();
  }
}
