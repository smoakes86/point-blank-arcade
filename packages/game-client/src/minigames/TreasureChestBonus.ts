import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { TreasureChestTarget, type TreasureType } from '../objects/TreasureChestTarget';

export interface TreasureChestBonusConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class TreasureChestBonus extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private chestTargets: TreasureChestTarget[] = [];
  private totalPoints: number = 0;
  private livesEarned: number = 0;
  private chestsOpened: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 600; // Fast spawning for bonus round
  private maxChests: number = 8;

  constructor(config: TreasureChestBonusConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    // Show bonus round title
    this.showBonusTitle();
  }

  private showBonusTitle(): void {
    const title = this.scene.add.text(this.screenWidth / 2, 50, 'BONUS ROUND!', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ffd700',
      stroke: '#8b4513',
      strokeThickness: 6,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Pulsing animation
    this.scene.tweens.add({
      targets: title,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.scene.add.text(this.screenWidth / 2, 100, 'Shoot the chests for rewards!', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    subtitle.setDepth(100);
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new chests
    if (this.spawnTimer >= this.spawnInterval && this.chestTargets.length < this.maxChests) {
      this.spawnTimer = 0;
      this.spawnTargets();
    }

    // Remove destroyed chests
    this.chestTargets = this.chestTargets.filter((chest) => chest.active);
  }

  spawnTargets(): void {
    // Find position that doesn't overlap
    let x: number, y: number;
    let attempts = 0;
    const margin = 100;

    do {
      x = margin + Math.random() * (this.screenWidth - margin * 2);
      y = 150 + Math.random() * (this.screenHeight - 300);
      attempts++;
    } while (attempts < 20 && this.isPositionOccupied(x, y, 100));

    // Determine treasure type with weighted probabilities
    const treasureType = this.getRandomTreasureType();
    const treasureValue = this.getTreasureValue(treasureType);

    const chest = new TreasureChestTarget(this.scene, {
      id: `chest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x,
      y,
      width: 80,
      height: 60,
      points: treasureValue,
      treasureType,
      treasureValue,
    });

    // Chests disappear if not shot in time
    this.scene.time.delayedCall(4000, () => {
      if (chest.active) {
        this.fadeOutChest(chest);
      }
    });

    this.chestTargets.push(chest);
    this.addTarget(chest);
  }

  private getRandomTreasureType(): TreasureType {
    const roll = Math.random();
    if (roll < 0.5) return 'points';      // 50% chance
    if (roll < 0.7) return 'bonus';       // 20% chance
    if (roll < 0.85) return 'life';       // 15% chance
    return 'nothing';                      // 15% chance
  }

  private getTreasureValue(type: TreasureType): number {
    switch (type) {
      case 'points': return 200 + Math.floor(Math.random() * 300); // 200-500
      case 'bonus': return 1000;
      case 'life': return 0;
      case 'nothing': return 0;
    }
  }

  private isPositionOccupied(x: number, y: number, minDistance: number): boolean {
    for (const chest of this.chestTargets) {
      const dx = chest.x - x;
      const dy = chest.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        return true;
      }
    }
    return false;
  }

  private fadeOutChest(chest: TreasureChestTarget): void {
    this.scene.tweens.add({
      targets: chest,
      alpha: 0,
      y: chest.y + 50,
      duration: 300,
      onComplete: () => {
        const index = this.chestTargets.indexOf(chest);
        if (index > -1) {
          this.chestTargets.splice(index, 1);
        }
        this.targets.delete(chest.targetId);
        chest.destroy();
      },
    });
  }

  handleChestHit(chestId: string, playerNumber: number): {
    success: boolean;
    treasureType: TreasureType | null;
    points: number;
  } {
    const chest = this.chestTargets.find((c) => c.targetId === chestId);
    if (!chest || !chest.active) {
      return { success: false, treasureType: null, points: 0 };
    }

    const treasureType = chest.getTreasureType();
    const treasureValue = chest.getTreasureValue();

    chest.playHitAnimation(true, () => {
      this.targets.delete(chestId);
    });

    const index = this.chestTargets.indexOf(chest);
    if (index > -1) {
      this.chestTargets.splice(index, 1);
    }

    this.chestsOpened++;

    // Track rewards
    switch (treasureType) {
      case 'points':
      case 'bonus':
        this.totalPoints += treasureValue;
        this.quotaMet++;
        this.onQuotaUpdate(this.quotaMet, this.quota);
        break;
      case 'life':
        this.livesEarned++;
        this.quotaMet++;
        this.onQuotaUpdate(this.quotaMet, this.quota);
        break;
      case 'nothing':
        // No reward, but still counts as opened
        break;
    }

    return { success: true, treasureType, points: treasureValue };
  }

  getTotalPoints(): number {
    return this.totalPoints;
  }

  getLivesEarned(): number {
    return this.livesEarned;
  }

  getChestsOpened(): number {
    return this.chestsOpened;
  }

  destroy(): void {
    this.chestTargets = [];
    super.destroy();
  }
}
