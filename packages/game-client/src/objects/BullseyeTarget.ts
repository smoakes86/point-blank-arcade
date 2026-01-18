import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export interface BullseyeConfig extends TargetConfig {
  moving?: boolean;
  moveSpeed?: number;
  moveRange?: number;
}

export class BullseyeTarget extends Target {
  private rings: Phaser.GameObjects.Arc[] = [];
  private moving: boolean;
  private moveSpeed: number;
  private moveRange: number;
  private initialX: number;
  private initialY: number;
  private moveAngle: number = 0;

  constructor(scene: Phaser.Scene, config: BullseyeConfig) {
    super(scene, config);
    this.moving = config.moving ?? false;
    this.moveSpeed = config.moveSpeed ?? 1;
    this.moveRange = config.moveRange ?? 100;
    this.initialX = config.x;
    this.initialY = config.y;
    this.moveAngle = Math.random() * Math.PI * 2;
    this.createVisuals();
  }

  createVisuals(): void {
    const ringColors = [
      { color: 0xffffff, radius: 50, points: 20 },
      { color: 0x000000, radius: 42, points: 30 },
      { color: 0x4444ff, radius: 34, points: 40 },
      { color: 0xff4444, radius: 26, points: 60 },
      { color: 0xffff44, radius: 18, points: 80 },
      { color: 0xffff44, radius: 10, points: 100 },
    ];

    ringColors.forEach((ring) => {
      const circle = this.scene.add.circle(0, 0, ring.radius, ring.color);
      circle.setStrokeStyle(2, 0x333333);
      circle.setData('points', ring.points);
      this.rings.push(circle);
      this.add(circle);
    });

    // Center dot
    const center = this.scene.add.circle(0, 0, 5, 0xff0000);
    center.setData('points', 100);
    this.rings.push(center);
    this.add(center);

    this.hitCircle = this.rings[0];
  }

  update(time: number, _delta: number): void {
    if (!this.isActive || !this.moving) return;

    // Move in a pattern
    this.moveAngle += this.moveSpeed * 0.02;
    this.x = this.initialX + Math.cos(this.moveAngle) * this.moveRange;
    this.y = this.initialY + Math.sin(this.moveAngle * 0.7) * (this.moveRange * 0.5);
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;
    // Points will be calculated based on where the hit lands
    return { points: this.points, correct: true };
  }

  calculateHitPoints(hitX: number, hitY: number): number {
    const dx = hitX - this.x;
    const dy = hitY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check rings from center outward
    if (distance <= 5) return 100;   // Bullseye!
    if (distance <= 10) return 100;  // Center yellow
    if (distance <= 18) return 80;   // Yellow ring
    if (distance <= 26) return 60;   // Red ring
    if (distance <= 34) return 40;   // Blue ring
    if (distance <= 42) return 30;   // Black ring
    if (distance <= 50) return 20;   // White ring

    return 0; // Miss
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    if (!correct) {
      super.playMissAnimation(onComplete);
      return;
    }

    // Hole punch effect
    const hole = this.scene.add.circle(0, 0, 8, 0x000000);
    hole.setDepth(100);
    this.add(hole);

    // Paper debris
    for (let i = 0; i < 6; i++) {
      const debris = this.scene.add.rectangle(
        this.x,
        this.y,
        4 + Math.random() * 4,
        4 + Math.random() * 4,
        0xffffff
      );
      debris.setDepth(this.depth + 1);

      const angle = (i / 6) * Math.PI * 2;
      const distance = 30 + Math.random() * 30;

      this.scene.tweens.add({
        targets: debris,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance + 20,
        rotation: Math.random() * 4,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => debris.destroy(),
      });
    }

    // Target shakes
    this.scene.tweens.add({
      targets: this,
      x: this.x + 5,
      duration: 30,
      yoyo: true,
      repeat: 3,
    });

    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      delay: 300,
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  getHitRadius(): number {
    return 50;
  }
}
