import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export interface MeteorConfig extends TargetConfig {
  fallSpeed?: number;
  size?: 'small' | 'medium' | 'large';
}

export class MeteorTarget extends Target {
  private meteor!: Phaser.GameObjects.Container;
  private trail!: Phaser.GameObjects.Graphics;
  private fallSpeed: number;
  private size: 'small' | 'medium' | 'large';
  private rotationSpeed: number;

  constructor(scene: Phaser.Scene, config: MeteorConfig) {
    super(scene, config);
    this.size = config.size || 'medium';
    this.fallSpeed = config.fallSpeed || this.getSizeSpeed();
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.createVisuals();
  }

  private getSizeSpeed(): number {
    switch (this.size) {
      case 'small': return 80;
      case 'medium': return 60;
      case 'large': return 40;
    }
  }

  private getSizeRadius(): number {
    switch (this.size) {
      case 'small': return 20;
      case 'medium': return 35;
      case 'large': return 50;
    }
  }

  createVisuals(): void {
    const radius = this.getSizeRadius();

    // Fire trail
    this.trail = this.scene.add.graphics();
    this.updateTrail();
    this.add(this.trail);

    this.meteor = this.scene.add.container(0, 0);

    // Meteor body (rocky texture)
    const colors = [0x8b4513, 0x654321, 0x4a3728, 0x3d2817];
    const mainColor = Phaser.Utils.Array.GetRandom(colors);

    const body = this.scene.add.circle(0, 0, radius, mainColor);
    body.setStrokeStyle(3, 0x2a1a0a);
    this.meteor.add(body);

    // Craters
    for (let i = 0; i < 3; i++) {
      const craterX = (Math.random() - 0.5) * radius;
      const craterY = (Math.random() - 0.5) * radius;
      const craterRadius = 5 + Math.random() * (radius * 0.2);
      const crater = this.scene.add.circle(craterX, craterY, craterRadius, 0x1a0a00, 0.5);
      this.meteor.add(crater);
    }

    // Glowing edge (atmospheric entry)
    const glow = this.scene.add.circle(0, 0, radius + 5, 0xff4400, 0);
    glow.setStrokeStyle(8, 0xff6600, 0.6);
    this.meteor.add(glow);

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    this.add(this.meteor);

    this.hitCircle = this.scene.add.circle(0, 0, radius, 0x000000, 0);
    this.add(this.hitCircle);

    // Spawn from top with slight animation
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  private updateTrail(): void {
    this.trail.clear();

    const radius = this.getSizeRadius();
    const trailLength = radius * 3;

    // Create gradient trail
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const alpha = 0.6 * (1 - t);
      const width = radius * (1 - t * 0.5);
      const y = -radius - t * trailLength;

      const colors = [0xff6600, 0xff4400, 0xff2200, 0xffaa00, 0xffcc00];
      this.trail.fillStyle(colors[i], alpha);
      this.trail.fillCircle(0, y, width);
    }
  }

  update(_time: number, delta: number): void {
    if (!this.isActive) return;

    // Fall down
    this.y += this.fallSpeed * (delta / 1000);

    // Rotate
    this.meteor.rotation += this.rotationSpeed;

    // Update trail
    this.updateTrail();

    // Check if hit Earth (bottom of screen)
    if (this.y > this.scene.cameras.main.height - 100) {
      this.impactEarth();
    }
  }

  private impactEarth(): void {
    this.isActive = false;

    // Big explosion at bottom
    const impactX = this.x;
    const impactY = this.scene.cameras.main.height - 50;

    // Screen shake
    this.scene.cameras.main.shake(500, 0.02);

    // Flash
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xff0000,
      0.5
    );
    flash.setDepth(1000);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Explosion particles
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(
        impactX,
        impactY,
        10 + Math.random() * 20,
        Phaser.Utils.Array.GetRandom([0xff4400, 0xff6600, 0xffaa00])
      );
      particle.setDepth(500);

      const angle = Math.random() * Math.PI;
      const distance = 100 + Math.random() * 200;

      this.scene.tweens.add({
        targets: particle,
        x: impactX + Math.cos(angle) * distance,
        y: impactY - Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 600,
        onComplete: () => particle.destroy(),
      });
    }

    this.destroy();
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;
    return { points: this.points, correct: true };
  }

  playHitAnimation(_correct: boolean, onComplete?: () => void): void {
    // Meteor explodes in space!
    const explosionColors = [0xff4400, 0xff6600, 0xffaa00, 0x8b4513];

    // Explosion flash
    const flash = this.scene.add.circle(this.x, this.y, 20, 0xffffff);
    this.scene.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Rock debris
    for (let i = 0; i < 12; i++) {
      const color = Phaser.Utils.Array.GetRandom(explosionColors);
      const size = 5 + Math.random() * 15;
      const debris = this.scene.add.circle(this.x, this.y, size, color);
      debris.setDepth(this.depth + 1);

      const angle = (i / 12) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;

      this.scene.tweens.add({
        targets: debris,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => debris.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  getHitRadius(): number {
    return this.getSizeRadius();
  }
}
