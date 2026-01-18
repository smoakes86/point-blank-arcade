import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { BullseyeTarget } from '../objects/BullseyeTarget';

export interface SingleBulletChallengeConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class SingleBulletChallenge extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private currentTarget: BullseyeTarget | null = null;
  private roundNumber: number = 0;
  private maxRounds: number;
  private shotFired: boolean = false;
  private roundTimer: number = 0;
  private roundDuration: number = 5000; // 5 seconds per shot
  private bulletIndicator!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;

  constructor(config: SingleBulletChallengeConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.maxRounds = config.quota;

    this.createUI();
    this.startRound();
  }

  private createUI(): void {
    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 40, 'ONE SHOT CHALLENGE', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Bullet indicator
    this.bulletIndicator = this.scene.add.text(this.screenWidth / 2, 80, '🔫 ONE BULLET', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.bulletIndicator.setDepth(100);

    // Round counter
    this.roundText = this.scene.add.text(50, 50, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.roundText.setDepth(100);

    this.updateRoundText();
  }

  private updateRoundText(): void {
    this.roundText.setText(`Round: ${this.roundNumber + 1} / ${this.maxRounds}`);
  }

  private startRound(): void {
    this.shotFired = false;
    this.roundTimer = 0;

    // Reset bullet indicator
    this.bulletIndicator.setText('🔫 ONE BULLET');
    this.bulletIndicator.setColor('#ffff00');

    // Create tiny, fast-moving target
    const targetSize = Math.max(15, 35 - this.roundNumber * 2); // Gets smaller each round
    const moveSpeed = 1.5 + this.roundNumber * 0.3; // Gets faster each round
    const moveRange = 150 + this.roundNumber * 20;

    const startX = this.screenWidth / 2;
    const startY = this.screenHeight / 2;

    this.currentTarget = new BullseyeTarget(this.scene, {
      id: `singlebullet-${Date.now()}`,
      x: startX,
      y: startY,
      width: targetSize * 2,
      height: targetSize * 2,
      points: 100,
      moving: true,
      moveSpeed,
      moveRange,
    });

    // Override the target scale to make it smaller
    this.currentTarget.setScale(targetSize / 50);

    this.addTarget(this.currentTarget);
    this.updateRoundText();

    // Show "READY" message
    const readyText = this.scene.add.text(this.screenWidth / 2, this.screenHeight / 2, 'READY...', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    readyText.setDepth(200);

    this.scene.tweens.add({
      targets: readyText,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      onComplete: () => readyText.destroy(),
    });
  }

  update(delta: number): void {
    if (!this.isActive) return;

    // Update target movement
    if (this.currentTarget && this.currentTarget.active) {
      const time = this.scene.time.now;
      this.currentTarget.update(time, delta);
    }

    // Round timer
    if (!this.shotFired && this.currentTarget) {
      this.roundTimer += delta;

      // Warning when time is running out
      if (this.roundTimer > this.roundDuration - 2000) {
        this.bulletIndicator.setColor('#ff6600');
      }

      // Time up - missed!
      if (this.roundTimer >= this.roundDuration) {
        this.handleMiss();
      }
    }
  }

  spawnTargets(): void {
    // Targets are spawned via startRound, not this method
  }

  handleShot(hitX: number, hitY: number): { success: boolean; points: number } {
    if (this.shotFired || !this.currentTarget || !this.currentTarget.active) {
      return { success: false, points: 0 };
    }

    this.shotFired = true;
    this.bulletIndicator.setText('🔫 FIRED!');
    this.bulletIndicator.setColor('#ff4444');

    // Check if we hit the target
    const points = this.currentTarget.calculateHitPoints(hitX, hitY);

    if (points > 0) {
      // HIT!
      this.currentTarget.playHitAnimation(true, () => {
        if (this.currentTarget) {
          this.targets.delete(this.currentTarget.targetId);
          this.currentTarget = null;
        }
        this.onRoundComplete(true, points);
      });

      this.showHitEffect(hitX, hitY, points);
      return { success: true, points };
    } else {
      // MISS!
      this.showMissEffect(hitX, hitY);

      this.scene.time.delayedCall(500, () => {
        this.handleMiss();
      });

      return { success: false, points: 0 };
    }
  }

  private handleMiss(): void {
    if (this.currentTarget) {
      this.currentTarget.playHitAnimation(false, () => {
        if (this.currentTarget) {
          this.targets.delete(this.currentTarget.targetId);
          this.currentTarget = null;
        }
      });
    }

    this.onRoundComplete(false, 0);
  }

  private onRoundComplete(success: boolean, points: number): void {
    if (success) {
      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);
    }

    this.roundNumber++;

    // Show round result
    const resultText = success ? 'HIT!' : 'MISS!';
    const resultColor = success ? '#00ff00' : '#ff0000';

    const result = this.scene.add.text(this.screenWidth / 2, this.screenHeight / 2, resultText, {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: resultColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    result.setDepth(200);

    this.scene.tweens.add({
      targets: result,
      alpha: 0,
      scale: 2,
      duration: 800,
      onComplete: () => {
        result.destroy();

        // Start next round or end
        if (this.roundNumber < this.maxRounds) {
          this.startRound();
        }
      },
    });
  }

  private showHitEffect(x: number, y: number, points: number): void {
    // Big point display
    let message = `+${points}`;
    if (points === 100) {
      message = 'PERFECT! +100';
    }

    const pointText = this.scene.add.text(x, y, message, {
      fontFamily: 'Arial Black',
      fontSize: points === 100 ? '40px' : '32px',
      color: points === 100 ? '#ffff00' : '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    pointText.setDepth(150);

    this.scene.tweens.add({
      targets: pointText,
      y: y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      onComplete: () => pointText.destroy(),
    });

    // Screen flash green
    const flash = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x00ff00,
      0.2
    );
    flash.setDepth(100);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  private showMissEffect(x: number, y: number): void {
    // Miss marker
    const miss = this.scene.add.text(x, y, 'X', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    miss.setDepth(150);

    this.scene.tweens.add({
      targets: miss,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => miss.destroy(),
    });

    // Screen shake
    this.scene.cameras.main.shake(200, 0.02);
  }

  destroy(): void {
    this.currentTarget = null;
    super.destroy();
  }
}
