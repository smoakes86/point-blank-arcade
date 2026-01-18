import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { CardboardTarget } from '../objects/CardboardTarget';

export interface WildWestShowdownConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class WildWestShowdown extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 900; // Slightly faster than cop training
  private maxTargets: number = 7;
  private cardboardTargets: CardboardTarget[] = [];
  private banditRatio: number = 0.55; // 55% bandits, 45% townspeople (harder!)
  private innocentCasualties: number = 0;
  private banditsEliminated: number = 0;

  constructor(config: WildWestShowdownConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    // Draw western scenery
    this.createScenery();
  }

  private createScenery(): void {
    // Desert ground
    const ground = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight - 40,
      this.screenWidth,
      80,
      0xdaa520
    );
    ground.setDepth(-10);

    // Saloon sign
    const saloon = this.scene.add.text(this.screenWidth / 2, 60, 'WILD WEST SHOWDOWN', {
      fontFamily: 'Georgia',
      fontSize: '36px',
      color: '#8b4513',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    saloon.setDepth(-5);

    // Warning text
    const warning = this.scene.add.text(this.screenWidth / 2, 100, "Shoot Bandits - Spare Townspeople!", {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    warning.setDepth(-5);
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new targets
    if (this.spawnTimer >= this.spawnInterval && this.cardboardTargets.length < this.maxTargets) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Increase difficulty
      this.spawnInterval = Math.max(500, this.spawnInterval - 30);
      // Make it harder - more townspeople over time
      this.banditRatio = Math.max(0.4, this.banditRatio - 0.01);
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
      y = 160 + Math.random() * (this.screenHeight - 320);
      attempts++;
    } while (attempts < 20 && this.isPositionOccupied(x, y, 100));

    // Decide if bandit or townsperson
    const isBandit = Math.random() < this.banditRatio;
    const cardboardType = isBandit ? 'bandit' : 'townsperson';

    const target = new CardboardTarget(this.scene, {
      id: `western-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x,
      y,
      width: 60,
      height: 120,
      points: 100,
      cardboardType,
    });

    // Bandits hide faster (they're sneaky!)
    const hideDelay = isBandit ? 2000 + Math.random() * 1500 : 3500 + Math.random() * 2000;

    this.scene.time.delayedCall(hideDelay, () => {
      if (target.active) {
        this.hideTarget(target, isBandit);
      }
    });

    this.cardboardTargets.push(target);
    this.addTarget(target);
  }

  private hideTarget(target: CardboardTarget, wasBandit: boolean): void {
    if (!target.active) return;

    // If a bandit escaped, penalize
    if (wasBandit) {
      this.showEscapeFeedback(target.x, target.y);
    }

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

  private showEscapeFeedback(x: number, y: number): void {
    const text = this.scene.add.text(x, y - 60, 'ESCAPED!', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    text.setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: y - 120,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
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

  handleWesternHit(targetId: string, playerNumber: number): { success: boolean; points: number; wasBandit: boolean } {
    const target = this.cardboardTargets.find((t) => t.targetId === targetId);
    if (!target || !target.active) return { success: false, points: 0, wasBandit: false };

    const result = target.hit(playerNumber);
    const wasBandit = target.isEnemyTarget();

    target.playHitAnimation(result.correct, () => {
      this.targets.delete(targetId);
    });

    const index = this.cardboardTargets.indexOf(target);
    if (index > -1) {
      this.cardboardTargets.splice(index, 1);
    }

    if (result.correct) {
      // Shot a bandit
      this.banditsEliminated++;
      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);
      this.showHitFeedback(target.x, target.y, true);
    } else {
      // Shot a townsperson - big penalty!
      this.innocentCasualties++;
      this.onTargetHit(targetId, playerNumber, -100, false);
      this.showHitFeedback(target.x, target.y, false);
    }

    return { success: true, points: result.points, wasBandit };
  }

  private showHitFeedback(x: number, y: number, correct: boolean): void {
    const text = correct ? 'BANDIT DOWN!' : 'INNOCENT!';
    const color = correct ? '#00ff00' : '#ff0000';

    const feedback = this.scene.add.text(x, y - 80, text, {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    feedback.setDepth(1000);

    if (!correct) {
      // Extra dramatic for hitting innocent
      this.scene.cameras.main.shake(200, 0.01);
    }

    this.scene.tweens.add({
      targets: feedback,
      y: y - 140,
      alpha: 0,
      scale: correct ? 1.2 : 1.5,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => feedback.destroy(),
    });
  }

  getInnocentCasualties(): number {
    return this.innocentCasualties;
  }

  getBanditsEliminated(): number {
    return this.banditsEliminated;
  }

  destroy(): void {
    this.cardboardTargets = [];
    super.destroy();
  }
}
