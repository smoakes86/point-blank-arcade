import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { BullseyeTarget } from '../objects/BullseyeTarget';

export interface TargetRangeConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

interface MovingTargetData {
  target: BullseyeTarget;
  direction: number; // 1 = right, -1 = left
  speed: number;
  row: number;
}

export class TargetRange extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1200;
  private maxTargets: number = 8;
  private movingTargets: MovingTargetData[] = [];
  private rows: number[] = [];

  constructor(config: TargetRangeConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    // Define shooting gallery rows
    this.rows = [180, 280, 380, 480];

    this.createBackground();
  }

  private createBackground(): void {
    // Shooting range backdrop
    const backdrop = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x2c3e50
    );
    backdrop.setDepth(-30);

    // Row lanes
    this.rows.forEach((rowY, index) => {
      // Lane background
      const lane = this.scene.add.rectangle(
        this.screenWidth / 2,
        rowY,
        this.screenWidth,
        80,
        index % 2 === 0 ? 0x34495e : 0x2c3e50
      );
      lane.setDepth(-20);

      // Lane markers
      const leftMarker = this.scene.add.rectangle(30, rowY, 40, 60, 0x1a252f);
      leftMarker.setDepth(-15);
      const rightMarker = this.scene.add.rectangle(this.screenWidth - 30, rowY, 40, 60, 0x1a252f);
      rightMarker.setDepth(-15);
    });

    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 50, 'SHOOTING GALLERY', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Instructions
    const instructions = this.scene.add.text(this.screenWidth / 2, 90, 'Hit the moving targets!', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ecf0f1',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    instructions.setDepth(100);
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new targets
    if (this.spawnTimer >= this.spawnInterval && this.movingTargets.length < this.maxTargets) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Increase difficulty
      this.spawnInterval = Math.max(600, this.spawnInterval - 30);
    }

    // Update all targets - move horizontally
    this.movingTargets.forEach((data) => {
      if (data.target.active) {
        data.target.x += data.speed * data.direction * (delta / 16);

        // Remove if off screen
        if (data.direction === 1 && data.target.x > this.screenWidth + 60) {
          this.removeTarget(data);
        } else if (data.direction === -1 && data.target.x < -60) {
          this.removeTarget(data);
        }
      }
    });

    // Clean up destroyed targets
    this.movingTargets = this.movingTargets.filter((data) => data.target.active);
  }

  spawnTargets(): void {
    // Pick a random row
    const row = Phaser.Utils.Array.GetRandom(this.rows);

    // Alternate direction based on row index
    const rowIndex = this.rows.indexOf(row);
    const direction = rowIndex % 2 === 0 ? 1 : -1;

    // Starting position
    const startX = direction === 1 ? -50 : this.screenWidth + 50;

    // Random speed
    const speed = 2 + Math.random() * 3;

    // Random target size
    const scale = 0.6 + Math.random() * 0.4;

    const target = new BullseyeTarget(this.scene, {
      id: `range-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: startX,
      y: row,
      width: 100,
      height: 100,
      points: Math.round(50 / scale), // Smaller targets = more points
      moving: false, // We handle movement ourselves
    });

    target.setScale(scale);

    const data: MovingTargetData = {
      target,
      direction,
      speed,
      row,
    };

    this.movingTargets.push(data);
    this.addTarget(target);
  }

  private removeTarget(data: MovingTargetData): void {
    data.target.destroy();
    this.targets.delete(data.target.targetId);

    const index = this.movingTargets.indexOf(data);
    if (index > -1) {
      this.movingTargets.splice(index, 1);
    }
  }

  handleRangeHit(targetId: string, hitX: number, hitY: number): { success: boolean; points: number } {
    const data = this.movingTargets.find((d) => d.target.targetId === targetId);
    if (!data || !data.target.active) return { success: false, points: 0 };

    // Calculate points based on accuracy
    const points = data.target.calculateHitPoints(hitX, hitY);

    if (points > 0) {
      data.target.playHitAnimation(true, () => {
        this.targets.delete(targetId);
      });

      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);

      // Show score popup with speed bonus
      const speedBonus = Math.round(data.speed * 5);
      const totalPoints = points + speedBonus;
      this.showScorePopup(hitX, hitY, points, speedBonus);

      const index = this.movingTargets.indexOf(data);
      if (index > -1) {
        this.movingTargets.splice(index, 1);
      }

      return { success: true, points: totalPoints };
    }

    return { success: false, points: 0 };
  }

  private showScorePopup(x: number, y: number, points: number, speedBonus: number): void {
    // Points display
    const pointText = this.scene.add.text(x, y, `+${points}`, {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: points === 100 ? '#f1c40f' : '#2ecc71',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    pointText.setDepth(150);

    this.scene.tweens.add({
      targets: pointText,
      y: y - 40,
      alpha: 0,
      duration: 600,
      onComplete: () => pointText.destroy(),
    });

    // Speed bonus
    if (speedBonus > 0) {
      const bonusText = this.scene.add.text(x, y + 25, `SPEED +${speedBonus}`, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#3498db',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      bonusText.setDepth(150);

      this.scene.tweens.add({
        targets: bonusText,
        y: y - 20,
        alpha: 0,
        delay: 200,
        duration: 500,
        onComplete: () => bonusText.destroy(),
      });
    }
  }

  destroy(): void {
    this.movingTargets = [];
    super.destroy();
  }
}
