import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { BullseyeTarget } from '../objects/BullseyeTarget';

export interface BullseyeChallengeConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
  movingTargets?: boolean;
}

export class BullseyeChallenge extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private movingTargets: boolean;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1500; // ms between spawns
  private maxTargets: number = 4;
  private bullseyeTargets: BullseyeTarget[] = [];
  private totalScore: number = 0;

  constructor(config: BullseyeChallengeConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.movingTargets = config.movingTargets ?? false;
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new targets
    if (this.spawnTimer >= this.spawnInterval && this.bullseyeTargets.length < this.maxTargets) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Gradually increase spawn rate
      this.spawnInterval = Math.max(1000, this.spawnInterval - 30);
    }

    // Update all targets (for moving ones)
    const time = this.scene.time.now;
    this.bullseyeTargets.forEach((target) => {
      if (target.active) {
        target.update(time, delta);
      }
    });

    // Remove destroyed targets
    this.bullseyeTargets = this.bullseyeTargets.filter((target) => target.active);
  }

  spawnTargets(): void {
    // Find a position that doesn't overlap with existing targets
    let x: number, y: number;
    let attempts = 0;
    const margin = 100;

    do {
      x = margin + Math.random() * (this.screenWidth - margin * 2);
      y = margin + Math.random() * (this.screenHeight - margin * 2);
      attempts++;
    } while (attempts < 20 && this.isPositionOccupied(x, y, 120));

    const shouldMove = this.movingTargets || Math.random() > 0.7; // 30% chance to move if not forced

    const target = new BullseyeTarget(this.scene, {
      id: `bullseye-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x,
      y,
      width: 100,
      height: 100,
      points: 100, // Base points, actual calculated on hit
      moving: shouldMove,
      moveSpeed: 0.5 + Math.random() * 1.5,
      moveRange: 50 + Math.random() * 100,
    });

    this.bullseyeTargets.push(target);
    this.addTarget(target);
  }

  private isPositionOccupied(x: number, y: number, minDistance: number): boolean {
    for (const target of this.bullseyeTargets) {
      const dx = target.x - x;
      const dy = target.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        return true;
      }
    }
    return false;
  }

  handleBullseyeHit(targetId: string, hitX: number, hitY: number): { success: boolean; points: number } {
    const target = this.bullseyeTargets.find((t) => t.targetId === targetId);
    if (!target || !target.active) return { success: false, points: 0 };

    // Calculate points based on hit precision
    const points = target.calculateHitPoints(hitX, hitY);

    if (points > 0) {
      target.playHitAnimation(true, () => {
        this.targets.delete(targetId);
      });

      this.totalScore += points;
      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);

      const index = this.bullseyeTargets.indexOf(target);
      if (index > -1) {
        this.bullseyeTargets.splice(index, 1);
      }

      // Show precision score
      this.showPointsPopup(hitX, hitY, points);

      return { success: true, points };
    }

    return { success: false, points: 0 };
  }

  private showPointsPopup(x: number, y: number, points: number): void {
    let color = '#ffffff';
    let text = `+${points}`;

    if (points === 100) {
      color = '#ffff00';
      text = 'BULLSEYE! +100';
    } else if (points >= 60) {
      color = '#ff6644';
    } else if (points >= 40) {
      color = '#4444ff';
    }

    const popup = this.scene.add.text(x, y, text, {
      fontFamily: 'Arial Black',
      fontSize: points === 100 ? '32px' : '24px',
      color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    popup.setDepth(1000);

    this.scene.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      scale: points === 100 ? 1.5 : 1.2,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  getTotalScore(): number {
    return this.totalScore;
  }

  destroy(): void {
    this.bullseyeTargets = [];
    super.destroy();
  }
}
