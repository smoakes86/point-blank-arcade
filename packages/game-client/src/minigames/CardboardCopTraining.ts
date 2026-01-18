import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { CardboardTarget } from '../objects/CardboardTarget';

export interface CardboardCopTrainingConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class CardboardCopTraining extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1000; // ms between spawns
  private maxTargets: number = 6;
  private cardboardTargets: CardboardTarget[] = [];
  private enemyRatio: number = 0.6; // 60% robbers, 40% civilians
  private civilianPenalties: number = 0;

  constructor(config: CardboardCopTrainingConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new targets
    if (this.spawnTimer >= this.spawnInterval && this.cardboardTargets.length < this.maxTargets) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Gradually increase spawn rate and difficulty
      this.spawnInterval = Math.max(600, this.spawnInterval - 25);
    }

    // Remove destroyed targets
    this.cardboardTargets = this.cardboardTargets.filter((target) => target.active);
  }

  spawnTargets(): void {
    // Find a position that doesn't overlap
    let x: number, y: number;
    let attempts = 0;
    const margin = 80;

    do {
      x = margin + Math.random() * (this.screenWidth - margin * 2);
      y = 150 + Math.random() * (this.screenHeight - 300);
      attempts++;
    } while (attempts < 20 && this.isPositionOccupied(x, y, 100));

    // Decide if enemy or civilian
    const isEnemy = Math.random() < this.enemyRatio;
    const cardboardType = isEnemy ? 'robber' : 'civilian';

    const target = new CardboardTarget(this.scene, {
      id: `cardboard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x,
      y,
      width: 60,
      height: 120,
      points: 100, // Points for hitting an enemy
      cardboardType,
    });

    // Auto-hide after a while if not hit
    this.scene.time.delayedCall(3000 + Math.random() * 2000, () => {
      if (target.active) {
        this.hideTarget(target);
      }
    });

    this.cardboardTargets.push(target);
    this.addTarget(target);
  }

  private hideTarget(target: CardboardTarget): void {
    if (!target.active) return;

    // Target drops down
    this.scene.tweens.add({
      targets: target,
      y: target.y + 100,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        const index = this.cardboardTargets.indexOf(target);
        if (index > -1) {
          this.cardboardTargets.splice(index, 1);
        }
        this.targets.delete(target.targetId);
        target.destroy();
      },
    });
  }

  private isPositionOccupied(x: number, y: number, minDistance: number): boolean {
    for (const target of this.cardboardTargets) {
      const dx = target.x - x;
      const dy = target.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        return true;
      }
    }
    return false;
  }

  handleCardboardHit(targetId: string, playerNumber: number): { success: boolean; points: number; wasEnemy: boolean } {
    const target = this.cardboardTargets.find((t) => t.targetId === targetId);
    if (!target || !target.active) return { success: false, points: 0, wasEnemy: false };

    const result = target.hit(playerNumber);
    const wasEnemy = target.isEnemyTarget();

    target.playHitAnimation(result.correct, () => {
      this.targets.delete(targetId);
    });

    const index = this.cardboardTargets.indexOf(target);
    if (index > -1) {
      this.cardboardTargets.splice(index, 1);
    }

    if (result.correct) {
      // Shot an enemy
      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);
      this.showHitFeedback(target.x, target.y, true);
    } else {
      // Shot a civilian - penalty!
      this.civilianPenalties++;
      this.onTargetHit(targetId, playerNumber, -100, false);
      this.showHitFeedback(target.x, target.y, false);
    }

    return { success: true, points: result.points, wasEnemy };
  }

  private showHitFeedback(x: number, y: number, correct: boolean): void {
    const text = correct ? 'CRIMINAL!' : 'INNOCENT!';
    const color = correct ? '#00ff00' : '#ff0000';

    const feedback = this.scene.add.text(x, y - 80, text, {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    feedback.setDepth(1000);

    this.scene.tweens.add({
      targets: feedback,
      y: y - 140,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => feedback.destroy(),
    });
  }

  getCivilianPenalties(): number {
    return this.civilianPenalties;
  }

  destroy(): void {
    this.cardboardTargets = [];
    super.destroy();
  }
}
