import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export class BombTarget extends Target {
  private bombBody!: Phaser.GameObjects.Arc;
  private fuse!: Phaser.GameObjects.Graphics;
  private spark!: Phaser.GameObjects.Arc;
  private skullText!: Phaser.GameObjects.Text;
  private warningGlow!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, config: TargetConfig) {
    // Bombs always have negative points
    config.points = -100;
    super(scene, config);
    this.createVisuals();
  }

  createVisuals(): void {
    const radius = 30;

    // Warning glow
    this.warningGlow = this.scene.add.circle(0, 0, radius + 20, 0xff0000, 0.15);
    this.add(this.warningGlow);

    // Bomb body (black sphere)
    this.bombBody = this.scene.add.circle(0, 5, radius, 0x222222);
    this.bombBody.setStrokeStyle(3, 0x444444);
    this.add(this.bombBody);

    // Highlight
    const highlight = this.scene.add.arc(0, 0, radius - 5, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(280), false, 0xffffff, 0.3);
    this.add(highlight);

    // Fuse (simple curved line using multiple segments)
    this.fuse = this.scene.add.graphics();
    this.fuse.lineStyle(4, 0x8b4513);
    this.fuse.beginPath();
    this.fuse.moveTo(0, -radius + 5);
    this.fuse.lineTo(3, -radius - 5);
    this.fuse.lineTo(8, -radius - 10);
    this.fuse.lineTo(10, -radius - 18);
    this.fuse.strokePath();
    this.add(this.fuse);

    // Spark at fuse tip
    this.spark = this.scene.add.circle(10, -radius - 18, 6, 0xff6600);
    this.add(this.spark);

    // Skull and crossbones
    this.skullText = this.scene.add.text(0, 8, '☠', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.skullText);

    // Store hit circle
    this.hitCircle = this.bombBody;

    // Pulsing warning glow
    this.scene.tweens.add({
      targets: this.warningGlow,
      scale: 1.4,
      alpha: 0.05,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Spark flicker
    this.scene.tweens.add({
      targets: this.spark,
      scale: { from: 0.8, to: 1.4 },
      alpha: { from: 0.7, to: 1 },
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // Slight wobble
    this.scene.tweens.add({
      targets: this,
      angle: { from: -2, to: 2 },
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;
    // Bombs are always wrong to hit
    return { points: -100, correct: false };
  }

  playHitAnimation(_correct: boolean, onComplete?: () => void): void {
    // Stop existing tweens
    this.scene.tweens.killTweensOf(this.warningGlow);
    this.scene.tweens.killTweensOf(this.spark);
    this.scene.tweens.killTweensOf(this);

    // Explosion effect!
    const explosionColors = [0xff0000, 0xff6600, 0xffff00, 0xff3300];

    // Central flash
    const flash = this.scene.add.circle(this.x, this.y, 10, 0xffffff);
    flash.setDepth(this.depth + 10);
    this.scene.tweens.add({
      targets: flash,
      scale: 8,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    // Explosion rings
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(this.x, this.y, 30, explosionColors[i], 0);
      ring.setStrokeStyle(8 - i * 2, explosionColors[i]);
      ring.setDepth(this.depth + 5);

      this.scene.tweens.add({
        targets: ring,
        scale: 4 + i,
        alpha: 0,
        duration: 400 + i * 100,
        delay: i * 50,
        onComplete: () => ring.destroy(),
      });
    }

    // Debris particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
      const distance = 100 + Math.random() * 100;
      const color = Phaser.Utils.Array.GetRandom(explosionColors);
      const size = 4 + Math.random() * 8;

      const debris = this.scene.add.circle(this.x, this.y, size, color);
      debris.setDepth(this.depth + 3);

      this.scene.tweens.add({
        targets: debris,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance + 50, // Gravity effect
        alpha: 0,
        scale: 0,
        duration: 500 + Math.random() * 300,
        ease: 'Quad.easeOut',
        onComplete: () => debris.destroy(),
      });
    }

    // Screen shake effect
    this.scene.cameras.main.shake(200, 0.01);

    // Destroy bomb
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
    return 30;
  }
}
