import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { LeafTarget } from '../objects/LeafTarget';

export interface LeafShootingConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class LeafShooting extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 400; // ms between spawns
  private maxLeaves: number = 15;
  private leafTargets: LeafTarget[] = [];

  constructor(config: LeafShootingConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new leaves
    if (this.spawnTimer >= this.spawnInterval && this.leafTargets.length < this.maxLeaves) {
      this.spawnTimer = 0;
      this.spawnTargets();
    }

    // Update all leaves (falling, swaying)
    const time = this.scene.time.now;
    this.leafTargets.forEach((leaf) => {
      if (leaf.active) {
        leaf.update(time, delta);
      }
    });

    // Remove leaves that fell off screen
    this.leafTargets = this.leafTargets.filter((leaf) => leaf.active);
  }

  spawnTargets(): void {
    const x = 100 + Math.random() * (this.screenWidth - 200);
    const y = -50; // Start above screen

    const leaf = new LeafTarget(this.scene, {
      id: `leaf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x,
      y,
      width: 30,
      height: 45,
      points: 10,
    });

    this.leafTargets.push(leaf);
    this.addTarget(leaf);
  }

  handleLeafHit(leafId: string): boolean {
    const leaf = this.leafTargets.find((l) => l.targetId === leafId);
    if (!leaf || !leaf.active) return false;

    leaf.playHitAnimation(true, () => {
      this.targets.delete(leafId);
    });

    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    // Remove from our tracking array
    const index = this.leafTargets.indexOf(leaf);
    if (index > -1) {
      this.leafTargets.splice(index, 1);
    }

    return true;
  }

  destroy(): void {
    this.leafTargets = [];
    super.destroy();
  }
}
