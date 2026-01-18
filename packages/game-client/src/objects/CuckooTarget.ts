import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export class CuckooTarget extends Target {
  private bird!: Phaser.GameObjects.Container;
  private door!: Phaser.GameObjects.Rectangle;
  private doorOpen: boolean = false;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, config: TargetConfig) {
    super(scene, config);
    this.createVisuals();
    this.startAnimation();
  }

  createVisuals(): void {
    // Clock door frame
    const frame = this.scene.add.rectangle(0, 0, 80, 100, 0x8b4513);
    frame.setStrokeStyle(4, 0x5d3a1a);
    this.add(frame);

    // Door (closed initially)
    this.door = this.scene.add.rectangle(0, 0, 70, 90, 0x654321);
    this.door.setStrokeStyle(2, 0x3d2817);
    this.add(this.door);

    // Bird container (hidden initially)
    this.bird = this.scene.add.container(0, 0);

    // Bird body
    const body = this.scene.add.ellipse(0, 0, 40, 30, 0xffcc00);
    body.setStrokeStyle(2, 0xcc9900);

    // Bird head
    const head = this.scene.add.circle(-18, -8, 12, 0xffcc00);
    head.setStrokeStyle(2, 0xcc9900);

    // Eye
    const eye = this.scene.add.circle(-20, -10, 4, 0x000000);

    // Beak
    const beak = this.scene.add.triangle(-32, -8, 0, 5, 0, -5, -12, 0, 0xff6600);

    // Wings
    const wing = this.scene.add.ellipse(5, 5, 20, 15, 0xddaa00);

    this.bird.add([body, head, eye, beak, wing]);
    this.bird.setVisible(false);
    this.add(this.bird);

    this.hitCircle = this.scene.add.circle(0, 0, 40, 0x000000, 0);
    this.add(this.hitCircle);
  }

  private startAnimation(): void {
    // Open door after short delay
    this.scene.time.delayedCall(200, () => {
      this.openDoor();
    });
  }

  private openDoor(): void {
    this.doorOpen = true;

    // Animate door opening
    this.scene.tweens.add({
      targets: this.door,
      scaleX: 0.1,
      x: -35,
      duration: 150,
      onComplete: () => {
        // Bird pops out
        this.bird.setVisible(true);
        this.bird.setScale(0);
        this.bird.x = 20;

        this.scene.tweens.add({
          targets: this.bird,
          scale: 1,
          x: 0,
          duration: 200,
          ease: 'Back.easeOut',
        });

        // Bird bobbing animation
        this.scene.tweens.add({
          targets: this.bird,
          y: -5,
          duration: 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Hide after a while if not hit
        this.hideTimer = this.scene.time.delayedCall(2000, () => {
          this.hideBird();
        });
      },
    });
  }

  private hideBird(): void {
    if (!this.isActive) return;

    this.scene.tweens.killTweensOf(this.bird);

    this.scene.tweens.add({
      targets: this.bird,
      x: 30,
      scale: 0,
      duration: 150,
      onComplete: () => {
        this.bird.setVisible(false);

        // Close door
        this.scene.tweens.add({
          targets: this.door,
          scaleX: 1,
          x: 0,
          duration: 150,
          onComplete: () => {
            this.doorOpen = false;
            // Miss - didn't shoot in time
            this.playMissAnimation();
          },
        });
      },
    });
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    if (!this.doorOpen || !this.bird.visible) {
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

    this.scene.tweens.killTweensOf(this.bird);

    // Bird flies away
    const featherColors = [0xffcc00, 0xddaa00, 0xffdd44];

    // Feather particles
    for (let i = 0; i < 10; i++) {
      const color = Phaser.Utils.Array.GetRandom(featherColors);
      const feather = this.scene.add.ellipse(this.x, this.y, 8, 4, color);
      feather.setDepth(this.depth + 1);

      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 60;

      this.scene.tweens.add({
        targets: feather,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance + 30,
        rotation: Math.random() * 6,
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => feather.destroy(),
      });
    }

    // Bird spins and flies up
    this.scene.tweens.add({
      targets: this.bird,
      y: -200,
      rotation: 10,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeIn',
    });

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
    return this.doorOpen ? 40 : 0;
  }
}
