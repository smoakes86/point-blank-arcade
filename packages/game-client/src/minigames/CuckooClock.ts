import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { CuckooTarget } from '../objects/CuckooTarget';

export interface CuckooClockConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class CuckooClock extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1200; // ms between spawns
  private maxClocks: number = 6;
  private clockTargets: CuckooTarget[] = [];
  private clockPositions: { x: number; y: number; occupied: boolean }[] = [];

  constructor(config: CuckooClockConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    // Create fixed clock positions in a grid pattern
    this.initializeClockPositions();
  }

  private initializeClockPositions(): void {
    const cols = 4;
    const rows = 2;
    const marginX = 120;
    const marginY = 150;
    const spacingX = (this.screenWidth - marginX * 2) / (cols - 1);
    const spacingY = (this.screenHeight - marginY * 2) / (rows - 1);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.clockPositions.push({
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

    // Spawn new clocks
    const availablePositions = this.clockPositions.filter((p) => !p.occupied);
    if (
      this.spawnTimer >= this.spawnInterval &&
      this.clockTargets.length < this.maxClocks &&
      availablePositions.length > 0
    ) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Gradually increase spawn rate
      this.spawnInterval = Math.max(800, this.spawnInterval - 20);
    }

    // Clean up destroyed clocks
    this.clockTargets = this.clockTargets.filter((clock) => {
      if (!clock.active) {
        // Find and free up the position
        const pos = this.clockPositions.find(
          (p) => Math.abs(p.x - clock.x) < 10 && Math.abs(p.y - clock.y) < 10
        );
        if (pos) pos.occupied = false;
        return false;
      }
      return true;
    });
  }

  spawnTargets(): void {
    const availablePositions = this.clockPositions.filter((p) => !p.occupied);
    if (availablePositions.length === 0) return;

    const position = Phaser.Utils.Array.GetRandom(availablePositions);
    position.occupied = true;

    const clock = new CuckooTarget(this.scene, {
      id: `cuckoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: position.x,
      y: position.y,
      width: 80,
      height: 100,
      points: 10,
    });

    // Listen for miss (bird hid without being shot)
    clock.on('miss', () => {
      this.onTargetHit(clock.targetId, 0, 0, false);
      const pos = this.clockPositions.find(
        (p) => Math.abs(p.x - clock.x) < 10 && Math.abs(p.y - clock.y) < 10
      );
      if (pos) pos.occupied = false;

      const index = this.clockTargets.indexOf(clock);
      if (index > -1) {
        this.clockTargets.splice(index, 1);
      }
      this.targets.delete(clock.targetId);
    });

    this.clockTargets.push(clock);
    this.addTarget(clock);
  }

  handleClockHit(clockId: string, playerNumber: number): boolean {
    const clock = this.clockTargets.find((c) => c.targetId === clockId);
    if (!clock || !clock.active) return false;

    const result = clock.hit(playerNumber);
    if (!result.correct) return false;

    clock.playHitAnimation(true, () => {
      this.targets.delete(clockId);
    });

    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    // Free up position
    const pos = this.clockPositions.find(
      (p) => Math.abs(p.x - clock.x) < 10 && Math.abs(p.y - clock.y) < 10
    );
    if (pos) pos.occupied = false;

    const index = this.clockTargets.indexOf(clock);
    if (index > -1) {
      this.clockTargets.splice(index, 1);
    }

    return true;
  }

  destroy(): void {
    this.clockTargets = [];
    this.clockPositions.forEach((p) => (p.occupied = false));
    super.destroy();
  }
}
