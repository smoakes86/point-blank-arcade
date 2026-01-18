import Phaser from 'phaser';
import { Target } from '../objects/Target';
import type { TargetData } from '../services/NetworkService';

export interface MiniGameConfig {
  scene: Phaser.Scene;
  quota: number;
  timer: number;
  onQuotaUpdate: (current: number, total: number) => void;
  onTargetHit: (targetId: string, playerNumber: number, points: number, correct: boolean) => void;
}

export abstract class MiniGame {
  protected scene: Phaser.Scene;
  protected targets: Map<string, Target> = new Map();
  protected quota: number;
  protected quotaMet: number = 0;
  protected timer: number;
  protected isActive: boolean = true;
  protected onQuotaUpdate: (current: number, total: number) => void;
  protected onTargetHit: (targetId: string, playerNumber: number, points: number, correct: boolean) => void;

  constructor(config: MiniGameConfig) {
    this.scene = config.scene;
    this.quota = config.quota;
    this.timer = config.timer;
    this.onQuotaUpdate = config.onQuotaUpdate;
    this.onTargetHit = config.onTargetHit;
  }

  abstract update(delta: number): void;
  abstract spawnTargets(): void;

  syncTargets(serverTargets: TargetData[]): void {
    // Remove targets that no longer exist on server
    for (const [id, target] of this.targets) {
      if (!serverTargets.find((t) => t.id === id)) {
        target.destroy();
        this.targets.delete(id);
      }
    }
  }

  handleTargetHit(targetId: string, playerNumber: number, points: number, correct: boolean): void {
    const target = this.targets.get(targetId);
    if (target) {
      target.playHitAnimation(correct, () => {
        this.targets.delete(targetId);
      });

      if (correct) {
        this.quotaMet++;
        this.onQuotaUpdate(this.quotaMet, this.quota);
      }

      this.onTargetHit(targetId, playerNumber, points, correct);
    }
  }

  getTarget(targetId: string): Target | undefined {
    return this.targets.get(targetId);
  }

  hasTarget(targetId: string): boolean {
    return this.targets.has(targetId);
  }

  addTarget(target: Target): void {
    this.targets.set(target.targetId, target);
  }

  destroy(): void {
    this.isActive = false;
    this.targets.forEach((target) => target.destroy());
    this.targets.clear();
  }
}
