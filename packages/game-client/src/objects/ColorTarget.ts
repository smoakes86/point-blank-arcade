import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';
import { PLAYER_COLORS, type PlayerNumber } from '@point-blank/shared';

export class ColorTarget extends Target {
  private outerCircle!: Phaser.GameObjects.Arc;
  private innerCircle!: Phaser.GameObjects.Arc;
  private playerLabel!: Phaser.GameObjects.Text;
  private targetGlow!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, config: TargetConfig) {
    super(scene, config);
    this.createVisuals();
  }

  createVisuals(): void {
    const playerColor = PLAYER_COLORS[this.ownerPlayerNumber as PlayerNumber];
    const color = playerColor ? parseInt(playerColor.hex.replace('#', ''), 16) : 0xff6b6b;
    const radius = 35;

    // Glow effect (pulsing)
    this.targetGlow = this.scene.add.circle(0, 0, radius + 15, color, 0.2);
    this.add(this.targetGlow);

    // Outer circle
    this.outerCircle = this.scene.add.circle(0, 0, radius, color, 0.9);
    this.outerCircle.setStrokeStyle(4, 0xffffff);
    this.add(this.outerCircle);

    // Inner ring
    this.innerCircle = this.scene.add.circle(0, 0, radius * 0.5, 0xffffff, 0.3);
    this.add(this.innerCircle);

    // Center dot
    const centerDot = this.scene.add.circle(0, 0, 5, 0xffffff, 1);
    this.add(centerDot);

    // Player number label
    this.playerLabel = this.scene.add.text(0, 0, `P${this.ownerPlayerNumber}`, {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add(this.playerLabel);

    // Store hit circle reference
    this.hitCircle = this.outerCircle;

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: this.targetGlow,
      scale: 1.3,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Slight rotation wobble
    this.scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  hit(playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;

    const correct = this.ownerPlayerNumber === playerNumber;
    const points = correct ? this.points : -25; // Penalty for wrong target

    return { points, correct };
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    // Stop existing tweens
    this.scene.tweens.killTweensOf(this.targetGlow);
    this.scene.tweens.killTweensOf(this);

    if (correct) {
      // Successful hit - satisfying pop
      const playerColor = PLAYER_COLORS[this.ownerPlayerNumber as PlayerNumber];
      const color = playerColor ? parseInt(playerColor.hex.replace('#', ''), 16) : 0x4ecdc4;

      // Expanding ring effect
      const ring = this.scene.add.circle(this.x, this.y, 35, color, 0);
      ring.setStrokeStyle(6, color);
      ring.setDepth(this.depth - 1);

      this.scene.tweens.add({
        targets: ring,
        scale: 3,
        alpha: 0,
        duration: 400,
        onComplete: () => ring.destroy(),
      });

      // Particle burst
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const particle = this.scene.add.circle(this.x, this.y, 6, color);
        particle.setDepth(this.depth + 1);

        this.scene.tweens.add({
          targets: particle,
          x: this.x + Math.cos(angle) * 120,
          y: this.y + Math.sin(angle) * 120,
          alpha: 0,
          scale: 0,
          duration: 400,
          ease: 'Quad.easeOut',
          onComplete: () => particle.destroy(),
        });
      }

      // Pop animation
      this.scene.tweens.add({
        targets: this,
        scale: 1.8,
        alpha: 0,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    } else {
      // Wrong target hit - error effect
      const errorFlash = this.scene.add.circle(this.x, this.y, 50, 0xff0000, 0.5);
      errorFlash.setDepth(this.depth - 1);

      this.scene.tweens.add({
        targets: errorFlash,
        scale: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => errorFlash.destroy(),
      });

      // Shake and shrink
      this.scene.tweens.add({
        targets: this,
        x: this.x + 15,
        duration: 50,
        yoyo: true,
        repeat: 2,
      });

      this.scene.tweens.add({
        targets: this,
        scale: 0,
        duration: 200,
        delay: 150,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    }
  }

  getHitRadius(): number {
    return 35; // Fixed radius for color targets
  }
}
