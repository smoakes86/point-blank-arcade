import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export class LeafTarget extends Target {
  private leaf!: Phaser.GameObjects.Container;
  private fallSpeed: number = 50;
  private swayAmount: number = 30;
  private swaySpeed: number = 2;
  private swayOffset: number = 0;
  private initialX: number;

  constructor(scene: Phaser.Scene, config: TargetConfig) {
    super(scene, config);
    this.initialX = config.x;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.fallSpeed = 40 + Math.random() * 40;
    this.createVisuals();
  }

  createVisuals(): void {
    this.leaf = this.scene.add.container(0, 0);

    // Random leaf color
    const leafColors = [0x228b22, 0x32cd32, 0x9acd32, 0xff8c00, 0xff4500, 0xffd700];
    const color = Phaser.Utils.Array.GetRandom(leafColors);

    // Leaf shape (main body)
    const leafBody = this.scene.add.ellipse(0, 0, 30, 45, color);
    leafBody.setStrokeStyle(2, Phaser.Display.Color.ValueToColor(color).darken(30).color);

    // Leaf vein (center line)
    const vein = this.scene.add.graphics();
    vein.lineStyle(2, Phaser.Display.Color.ValueToColor(color).darken(20).color);
    vein.beginPath();
    vein.moveTo(0, -20);
    vein.lineTo(0, 20);
    vein.strokePath();

    // Side veins
    vein.lineStyle(1, Phaser.Display.Color.ValueToColor(color).darken(20).color);
    vein.moveTo(0, -10);
    vein.lineTo(-10, -5);
    vein.moveTo(0, -10);
    vein.lineTo(10, -5);
    vein.moveTo(0, 0);
    vein.lineTo(-12, 5);
    vein.moveTo(0, 0);
    vein.lineTo(12, 5);
    vein.moveTo(0, 10);
    vein.lineTo(-8, 15);
    vein.moveTo(0, 10);
    vein.lineTo(8, 15);
    vein.strokePath();

    // Stem
    const stem = this.scene.add.rectangle(0, -25, 3, 10, 0x8b4513);

    this.leaf.add([leafBody, vein, stem]);
    this.add(this.leaf);

    // Random initial rotation
    this.leaf.rotation = (Math.random() - 0.5) * 0.5;

    this.hitCircle = this.scene.add.circle(0, 0, 25, 0x000000, 0);
    this.add(this.hitCircle);
  }

  update(time: number, delta: number): void {
    if (!this.isActive) return;

    // Fall down
    this.y += this.fallSpeed * (delta / 1000);

    // Sway left and right
    const sway = Math.sin((time / 1000) * this.swaySpeed + this.swayOffset) * this.swayAmount;
    this.x = this.initialX + sway;

    // Gentle rotation
    this.leaf.rotation = Math.sin((time / 1000) * this.swaySpeed + this.swayOffset) * 0.3;

    // Check if fallen off screen
    if (this.y > this.scene.cameras.main.height + 50) {
      this.playMissAnimation();
    }
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;
    return { points: this.points, correct: true };
  }

  playHitAnimation(_correct: boolean, onComplete?: () => void): void {
    // Leaf crumbles
    const leafColors = [0x228b22, 0x32cd32, 0x9acd32, 0x8b4513];

    for (let i = 0; i < 8; i++) {
      const color = Phaser.Utils.Array.GetRandom(leafColors);
      const piece = this.scene.add.ellipse(this.x, this.y, 8, 12, color);
      piece.rotation = Math.random() * Math.PI;
      piece.setDepth(this.depth + 1);

      const angle = (i / 8) * Math.PI * 2;
      const distance = 40 + Math.random() * 40;

      this.scene.tweens.add({
        targets: piece,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance + 20,
        rotation: piece.rotation + Math.random() * 4,
        scale: 0,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: this,
      scale: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  getHitRadius(): number {
    return 25;
  }
}
