import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export class SkeletonTarget extends Target {
  private coffin!: Phaser.GameObjects.Container;
  private skeleton!: Phaser.GameObjects.Container;
  private lid!: Phaser.GameObjects.Rectangle;
  private isOut: boolean = false;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, config: TargetConfig) {
    super(scene, config);
    this.createVisuals();
    this.startAnimation();
  }

  createVisuals(): void {
    // Coffin container
    this.coffin = this.scene.add.container(0, 0);

    // Coffin base (hexagonal shape approximation)
    const base = this.scene.add.polygon(0, 0, [
      -25, -50,
      25, -50,
      35, -30,
      35, 50,
      -35, 50,
      -35, -30,
    ], 0x4a3728);
    base.setStrokeStyle(3, 0x2d1f14);
    this.coffin.add(base);

    // Coffin details
    const cross = this.scene.add.graphics();
    cross.fillStyle(0x8b7355);
    cross.fillRect(-3, -40, 6, 30);
    cross.fillRect(-12, -35, 24, 6);
    this.coffin.add(cross);

    this.add(this.coffin);

    // Lid (will open)
    this.lid = this.scene.add.rectangle(0, -25, 50, 50, 0x5d4037);
    this.lid.setStrokeStyle(2, 0x3e2723);
    this.add(this.lid);

    // Skeleton (hidden initially)
    this.skeleton = this.scene.add.container(0, 0);

    // Skull
    const skull = this.scene.add.circle(0, -35, 18, 0xf5f5dc);
    skull.setStrokeStyle(2, 0xd4d4aa);

    // Eye sockets
    const leftEye = this.scene.add.ellipse(-7, -37, 8, 10, 0x000000);
    const rightEye = this.scene.add.ellipse(7, -37, 8, 10, 0x000000);

    // Nose hole
    const nose = this.scene.add.triangle(0, -30, -4, 0, 4, 0, 0, -8, 0x000000);

    // Teeth
    const teeth = this.scene.add.rectangle(0, -23, 16, 6, 0xf5f5dc);
    teeth.setStrokeStyle(1, 0x000000);

    // Jaw line
    const jaw = this.scene.add.arc(0, -20, 12, 0, Math.PI, false, 0xf5f5dc);
    jaw.setStrokeStyle(2, 0xd4d4aa);

    // Rib cage
    const ribs = this.scene.add.graphics();
    ribs.fillStyle(0xf5f5dc);
    for (let i = 0; i < 4; i++) {
      ribs.fillRoundedRect(-15, -5 + i * 12, 30, 6, 2);
    }
    ribs.lineStyle(1, 0xd4d4aa);
    ribs.strokeRoundedRect(-15, -5, 30, 6, 2);

    // Arms (raised spooky pose)
    const leftArm = this.scene.add.rectangle(-25, -10, 6, 35, 0xf5f5dc);
    leftArm.setAngle(-30);
    const rightArm = this.scene.add.rectangle(25, -10, 6, 35, 0xf5f5dc);
    rightArm.setAngle(30);

    // Hands
    const leftHand = this.scene.add.circle(-32, -25, 8, 0xf5f5dc);
    const rightHand = this.scene.add.circle(32, -25, 8, 0xf5f5dc);

    this.skeleton.add([ribs, leftArm, rightArm, leftHand, rightHand, skull, leftEye, rightEye, nose, teeth, jaw]);
    this.skeleton.setVisible(false);
    this.skeleton.setY(60); // Start below coffin
    this.add(this.skeleton);

    this.hitCircle = this.scene.add.circle(0, -20, 35, 0x000000, 0);
    this.add(this.hitCircle);
  }

  private startAnimation(): void {
    // Open coffin after short delay
    this.scene.time.delayedCall(300 + Math.random() * 500, () => {
      this.openCoffin();
    });
  }

  private openCoffin(): void {
    // Lid swings open
    this.scene.tweens.add({
      targets: this.lid,
      angle: -90,
      y: -50,
      x: -35,
      scaleY: 0.3,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Skeleton rises!
        this.skeleton.setVisible(true);
        this.isOut = true;

        this.scene.tweens.add({
          targets: this.skeleton,
          y: 0,
          duration: 300,
          ease: 'Back.easeOut',
        });

        // Skeleton wobbles
        this.scene.tweens.add({
          targets: this.skeleton,
          angle: 5,
          duration: 200,
          yoyo: true,
          repeat: -1,
        });

        // Hide after a while
        this.hideTimer = this.scene.time.delayedCall(2500, () => {
          this.hideSkeleton();
        });
      },
    });
  }

  private hideSkeleton(): void {
    if (!this.isActive) return;

    this.scene.tweens.killTweensOf(this.skeleton);

    // Skeleton goes back down
    this.scene.tweens.add({
      targets: this.skeleton,
      y: 60,
      duration: 200,
      onComplete: () => {
        this.skeleton.setVisible(false);
        this.isOut = false;

        // Close lid
        this.scene.tweens.add({
          targets: this.lid,
          angle: 0,
          y: -25,
          x: 0,
          scaleY: 1,
          duration: 200,
          onComplete: () => {
            this.playMissAnimation();
          },
        });
      },
    });
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    if (!this.isOut) {
      return { points: 0, correct: false };
    }

    this.isActive = false;
    if (this.hideTimer) {
      this.hideTimer.destroy();
    }
    return { points: this.points, correct: true };
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    if (!correct) {
      super.playMissAnimation(onComplete);
      return;
    }

    this.scene.tweens.killTweensOf(this.skeleton);

    // Bone particles
    const boneColors = [0xf5f5dc, 0xd4d4aa, 0xffffff];

    for (let i = 0; i < 12; i++) {
      const color = Phaser.Utils.Array.GetRandom(boneColors);
      const bone = this.scene.add.rectangle(
        this.x,
        this.y - 20,
        6 + Math.random() * 8,
        3 + Math.random() * 4,
        color
      );
      bone.setDepth(this.depth + 1);

      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 80;

      this.scene.tweens.add({
        targets: bone,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance + 40,
        rotation: Math.random() * 8,
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => bone.destroy(),
      });
    }

    // Skull flies up
    const flyingSkull = this.scene.add.circle(this.x, this.y - 35, 15, 0xf5f5dc);
    flyingSkull.setStrokeStyle(2, 0xd4d4aa);
    flyingSkull.setDepth(this.depth + 2);

    this.scene.tweens.add({
      targets: flyingSkull,
      y: this.y - 200,
      rotation: 5,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => flyingSkull.destroy(),
    });

    // Main target fades
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  getHitRadius(): number {
    return this.isOut ? 35 : 0;
  }
}
