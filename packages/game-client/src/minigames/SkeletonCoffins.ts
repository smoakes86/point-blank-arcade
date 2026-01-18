import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { SkeletonTarget } from '../objects/SkeletonTarget';

export interface SkeletonCoffinsConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class SkeletonCoffins extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1100;
  private maxCoffins: number = 5;
  private skeletonTargets: SkeletonTarget[] = [];
  private coffinPositions: { x: number; y: number; occupied: boolean }[] = [];

  constructor(config: SkeletonCoffinsConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    // Create spooky atmosphere
    this.createAtmosphere();
    this.initializeCoffinPositions();
  }

  private createAtmosphere(): void {
    // Dark background overlay
    const fog = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x1a1a2e,
      0.3
    );
    fog.setDepth(-20);

    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 50, 'GRAVEYARD SHIFT', {
      fontFamily: 'Georgia',
      fontSize: '36px',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(-5);

    // Subtitle
    const subtitle = this.scene.add.text(this.screenWidth / 2, 90, 'Shoot the skeletons!', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    subtitle.setDepth(-5);
  }

  private initializeCoffinPositions(): void {
    const cols = 4;
    const rows = 2;
    const marginX = 120;
    const marginY = 180;
    const spacingX = (this.screenWidth - marginX * 2) / (cols - 1);
    const spacingY = (this.screenHeight - marginY - 150) / (rows - 1);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.coffinPositions.push({
          x: marginX + col * spacingX,
          y: marginY + row * spacingY,
          occupied: false,
        });
      }
    }
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    const availablePositions = this.coffinPositions.filter((p) => !p.occupied);
    if (
      this.spawnTimer >= this.spawnInterval &&
      this.skeletonTargets.length < this.maxCoffins &&
      availablePositions.length > 0
    ) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Increase spawn rate
      this.spawnInterval = Math.max(700, this.spawnInterval - 30);
    }

    // Clean up destroyed skeletons
    this.skeletonTargets = this.skeletonTargets.filter((skeleton) => {
      if (!skeleton.active) {
        const pos = this.coffinPositions.find(
          (p) => Math.abs(p.x - skeleton.x) < 10 && Math.abs(p.y - skeleton.y) < 10
        );
        if (pos) pos.occupied = false;
        return false;
      }
      return true;
    });
  }

  spawnTargets(): void {
    const availablePositions = this.coffinPositions.filter((p) => !p.occupied);
    if (availablePositions.length === 0) return;

    const position = Phaser.Utils.Array.GetRandom(availablePositions);
    position.occupied = true;

    const skeleton = new SkeletonTarget(this.scene, {
      id: `skeleton-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: position.x,
      y: position.y,
      width: 70,
      height: 120,
      points: 10,
    });

    // Listen for miss
    skeleton.on('miss', () => {
      this.onTargetHit(skeleton.targetId, 0, 0, false);
      const pos = this.coffinPositions.find(
        (p) => Math.abs(p.x - skeleton.x) < 10 && Math.abs(p.y - skeleton.y) < 10
      );
      if (pos) pos.occupied = false;

      const index = this.skeletonTargets.indexOf(skeleton);
      if (index > -1) {
        this.skeletonTargets.splice(index, 1);
      }
      this.targets.delete(skeleton.targetId);
    });

    this.skeletonTargets.push(skeleton);
    this.addTarget(skeleton);
  }

  handleSkeletonHit(skeletonId: string, playerNumber: number): boolean {
    const skeleton = this.skeletonTargets.find((s) => s.targetId === skeletonId);
    if (!skeleton || !skeleton.active) return false;

    const result = skeleton.hit(playerNumber);
    if (!result.correct) return false;

    skeleton.playHitAnimation(true, () => {
      this.targets.delete(skeletonId);
    });

    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    // Free up position
    const pos = this.coffinPositions.find(
      (p) => Math.abs(p.x - skeleton.x) < 10 && Math.abs(p.y - skeleton.y) < 10
    );
    if (pos) pos.occupied = false;

    const index = this.skeletonTargets.indexOf(skeleton);
    if (index > -1) {
      this.skeletonTargets.splice(index, 1);
    }

    return true;
  }

  destroy(): void {
    this.skeletonTargets = [];
    this.coffinPositions.forEach((p) => (p.occupied = false));
    super.destroy();
  }
}
