import Phaser from 'phaser';
import {
  createBurstEffect,
  createStarBurst,
  createRingEffect,
  createScorePopup,
  createSmokePuff,
} from '../effects/ParticleEffects';

export interface TargetConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  points: number;
  ownerPlayerNumber?: number;
  color?: number;
}

export abstract class Target extends Phaser.GameObjects.Container {
  public targetId: string;
  public points: number;
  public ownerPlayerNumber: number;
  protected isActive: boolean = true;
  protected hitCircle: Phaser.GameObjects.Arc | null = null;
  protected glowEffect: Phaser.GameObjects.Arc | null = null;

  constructor(scene: Phaser.Scene, config: TargetConfig) {
    super(scene, config.x, config.y);

    this.targetId = config.id;
    this.points = config.points;
    this.ownerPlayerNumber = config.ownerPlayerNumber || 0;

    scene.add.existing(this);

    // Enhanced spawn animation with squash and stretch
    this.setScale(0);
    this.setAlpha(0);

    scene.tweens.add({
      targets: this,
      scale: { from: 0, to: 1.15 },
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Settle bounce
        scene.tweens.add({
          targets: this,
          scale: 1,
          duration: 100,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // Subtle idle animation (breathing effect)
    this.startIdleAnimation();
  }

  protected startIdleAnimation(): void {
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.03 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  protected addGlowEffect(color: number, radius: number): void {
    this.glowEffect = this.scene.add.circle(0, 0, radius, color, 0.3);
    this.glowEffect.setDepth(-1);
    this.add(this.glowEffect);

    // Pulsing glow
    this.scene.tweens.add({
      targets: this.glowEffect,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 0.3, to: 0.15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  abstract createVisuals(): void;

  hit(playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;

    // Stop idle animations
    this.scene.tweens.killTweensOf(this);
    if (this.glowEffect) {
      this.scene.tweens.killTweensOf(this.glowEffect);
    }

    // Default behavior - override in subclasses
    const correct = this.ownerPlayerNumber === 0 || this.ownerPlayerNumber === playerNumber;
    return { points: correct ? this.points : -Math.abs(this.points) / 2, correct };
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    const color = correct ? 0x4ecdc4 : 0xff6b6b;

    // Ring expansion effect
    createRingEffect(this.scene, this.x, this.y, {
      color,
      size: 80,
      duration: 300,
    });

    if (correct) {
      // Star burst for successful hits
      createStarBurst(this.scene, this.x, this.y, {
        colors: [0xffff00, 0xffd700, 0xfffacd, color],
        count: 10,
        speed: 100,
      });

      // Particle burst
      createBurstEffect(this.scene, this.x, this.y, {
        color,
        count: 14,
        speed: 180,
        size: 6,
        lifespan: 400,
      });

      // Score popup
      createScorePopup(this.scene, this.x, this.y - 30, this.points);
    } else {
      // Smoke puff for misses
      createSmokePuff(this.scene, this.x, this.y, {
        color: 0x666666,
        count: 6,
      });

      // Red burst
      createBurstEffect(this.scene, this.x, this.y, {
        color: 0xff6b6b,
        count: 8,
        speed: 100,
        lifespan: 300,
      });
    }

    // Squash effect before destroy
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 0.5,
      duration: 50,
      onComplete: () => {
        // Pop and fade
        this.scene.tweens.add({
          targets: this,
          scale: 0,
          alpha: 0,
          duration: 150,
          ease: 'Back.easeIn',
          onComplete: () => {
            this.destroy();
            onComplete?.();
          },
        });
      },
    });
  }

  playMissAnimation(onComplete?: () => void): void {
    // Shake effect
    const startX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: startX + 8,
      duration: 40,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.x = startX;
      },
    });

    // Sad wiggle rotation
    this.scene.tweens.add({
      targets: this,
      angle: { from: -5, to: 5 },
      duration: 80,
      yoyo: true,
      repeat: 2,
    });

    // Fade and shrink
    this.scene.tweens.add({
      targets: this,
      scale: 0.5,
      alpha: 0,
      duration: 400,
      delay: 200,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  isTargetActive(): boolean {
    return this.isActive;
  }

  getHitRadius(): number {
    return this.hitCircle?.radius || 30;
  }

  checkHit(worldX: number, worldY: number): boolean {
    if (!this.isActive) return false;

    const dx = worldX - this.x;
    const dy = worldY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= this.getHitRadius();
  }
}
