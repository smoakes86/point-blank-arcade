import { MiniGame, type MiniGameConfig } from './MiniGame';
import { ColorTarget } from '../objects/ColorTarget';
import { BombTarget } from '../objects/BombTarget';
import type { TargetData, PlayerData } from '../services/NetworkService';
import { PLAYER_COLORS, type PlayerNumber } from '@point-blank/shared';

export interface ColorTargetBlitzConfig extends MiniGameConfig {
  players: PlayerData[];
  screenWidth: number;
  screenHeight: number;
}

export class ColorTargetBlitz extends MiniGame {
  private players: PlayerData[];
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 800; // ms between spawns
  private maxTargets: number = 8;
  private bombChance: number = 0.15; // 15% chance for bomb

  constructor(config: ColorTargetBlitzConfig) {
    super(config);
    this.players = config.players;
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnInterval && this.targets.size < this.maxTargets) {
      this.spawnTimer = 0;
      this.spawnTargets();
    }
  }

  spawnTargets(): void {
    if (this.players.length === 0) return;

    // Determine if we spawn a bomb or a color target
    const isBomb = Math.random() < this.bombChance;

    // Find a valid spawn position (not overlapping other targets)
    const position = this.findValidSpawnPosition();
    if (!position) return;

    const targetId = `target-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (isBomb) {
      const bomb = new BombTarget(this.scene, {
        id: targetId,
        x: position.x,
        y: position.y,
        width: 60,
        height: 60,
        points: -100,
      });
      this.addTarget(bomb);
    } else {
      // Pick a random player for the target
      const player = this.players[Math.floor(Math.random() * this.players.length)];

      const target = new ColorTarget(this.scene, {
        id: targetId,
        x: position.x,
        y: position.y,
        width: 70,
        height: 70,
        points: 50,
        ownerPlayerNumber: player.playerNumber,
        color: parseInt(PLAYER_COLORS[player.playerNumber as PlayerNumber].hex.replace('#', ''), 16),
      });
      this.addTarget(target);
    }
  }

  private findValidSpawnPosition(): { x: number; y: number } | null {
    const margin = 100;
    const minX = margin;
    const maxX = this.screenWidth - margin;
    const minY = 150; // Below UI elements
    const maxY = this.screenHeight - 150; // Above player scores

    const minDistance = 100; // Minimum distance between targets

    for (let attempts = 0; attempts < 20; attempts++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);

      let valid = true;
      for (const target of this.targets.values()) {
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          valid = false;
          break;
        }
      }

      if (valid) {
        return { x, y };
      }
    }

    // If no valid position found after attempts, just pick a random one
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    };
  }

  syncTargets(serverTargets: TargetData[]): void {
    const width = this.screenWidth;
    const height = this.screenHeight;

    // Remove targets not on server
    for (const [id, target] of this.targets) {
      if (!serverTargets.find((t) => t.id === id)) {
        target.playHitAnimation(true);
        this.targets.delete(id);
      }
    }

    // Add targets from server that we don't have
    for (const serverTarget of serverTargets) {
      if (!this.targets.has(serverTarget.id)) {
        const x = serverTarget.x * width;
        const y = serverTarget.y * height;

        if (serverTarget.targetType === 'bomb') {
          const bomb = new BombTarget(this.scene, {
            id: serverTarget.id,
            x,
            y,
            width: serverTarget.width,
            height: serverTarget.height,
            points: serverTarget.points,
          });
          this.addTarget(bomb);
        } else {
          const target = new ColorTarget(this.scene, {
            id: serverTarget.id,
            x,
            y,
            width: serverTarget.width,
            height: serverTarget.height,
            points: serverTarget.points,
            ownerPlayerNumber: serverTarget.ownerPlayerNumber,
          });
          this.addTarget(target);
        }
      }
    }
  }
}
