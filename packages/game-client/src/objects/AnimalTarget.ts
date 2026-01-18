import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export type AnimalType = 'bunny' | 'squirrel' | 'hedgehog' | 'mole';

export interface AnimalConfig extends TargetConfig {
  animalType?: AnimalType;
}

export class AnimalTarget extends Target {
  private hole!: Phaser.GameObjects.Container;
  private animal!: Phaser.GameObjects.Container;
  private animalType: AnimalType;
  private isOut: boolean = false;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, config: AnimalConfig) {
    super(scene, config);
    this.animalType = config.animalType || this.getRandomAnimalType();
    this.createVisuals();
    this.startAnimation();
  }

  private getRandomAnimalType(): AnimalType {
    const types: AnimalType[] = ['bunny', 'squirrel', 'hedgehog', 'mole'];
    return Phaser.Utils.Array.GetRandom(types);
  }

  createVisuals(): void {
    // Hole container
    this.hole = this.scene.add.container(0, 0);

    // Hole back (dark)
    const holeBack = this.scene.add.ellipse(0, 20, 70, 35, 0x2d1f14);
    this.hole.add(holeBack);

    // Hole rim (grass/ground)
    const holeRim = this.scene.add.ellipse(0, 15, 80, 40, 0x228b22);
    holeRim.setStrokeStyle(3, 0x1a6b1a);
    this.hole.add(holeRim);

    // Hole front cover (to hide animal)
    const holeFront = this.scene.add.ellipse(0, 25, 80, 40, 0x3d2817);
    this.hole.add(holeFront);

    this.add(this.hole);

    // Animal container (starts below)
    this.animal = this.scene.add.container(0, 50);

    switch (this.animalType) {
      case 'bunny':
        this.drawBunny();
        break;
      case 'squirrel':
        this.drawSquirrel();
        break;
      case 'hedgehog':
        this.drawHedgehog();
        break;
      case 'mole':
        this.drawMole();
        break;
    }

    this.animal.setVisible(false);
    this.add(this.animal);

    this.hitCircle = this.scene.add.circle(0, -10, 30, 0x000000, 0);
    this.add(this.hitCircle);
  }

  private drawBunny(): void {
    // Ears
    const leftEar = this.scene.add.ellipse(-12, -45, 10, 30, 0xffc0cb);
    leftEar.setStrokeStyle(2, 0xffa0a0);
    leftEar.setAngle(-15);
    const rightEar = this.scene.add.ellipse(12, -45, 10, 30, 0xffc0cb);
    rightEar.setStrokeStyle(2, 0xffa0a0);
    rightEar.setAngle(15);

    // Inner ears
    const leftInner = this.scene.add.ellipse(-12, -43, 5, 20, 0xffb6c1);
    leftInner.setAngle(-15);
    const rightInner = this.scene.add.ellipse(12, -43, 5, 20, 0xffb6c1);
    rightInner.setAngle(15);

    // Head
    const head = this.scene.add.circle(0, -15, 22, 0xffc0cb);
    head.setStrokeStyle(2, 0xffa0a0);

    // Eyes
    const leftEye = this.scene.add.circle(-8, -18, 5, 0x000000);
    const rightEye = this.scene.add.circle(8, -18, 5, 0x000000);
    const leftShine = this.scene.add.circle(-7, -19, 2, 0xffffff);
    const rightShine = this.scene.add.circle(9, -19, 2, 0xffffff);

    // Nose
    const nose = this.scene.add.triangle(0, -10, -4, 4, 4, 4, 0, -2, 0xff69b4);

    // Cheeks
    const leftCheek = this.scene.add.circle(-15, -10, 6, 0xffb6c1, 0.5);
    const rightCheek = this.scene.add.circle(15, -10, 6, 0xffb6c1, 0.5);

    this.animal.add([leftEar, rightEar, leftInner, rightInner, head, leftEye, rightEye, leftShine, rightShine, nose, leftCheek, rightCheek]);
  }

  private drawSquirrel(): void {
    // Tail
    const tail = this.scene.add.ellipse(20, -25, 20, 40, 0xcd853f);
    tail.setStrokeStyle(2, 0x8b6914);
    tail.setAngle(30);

    // Body
    const body = this.scene.add.ellipse(0, 0, 30, 25, 0xcd853f);
    body.setStrokeStyle(2, 0x8b6914);

    // Head
    const head = this.scene.add.circle(0, -20, 18, 0xcd853f);
    head.setStrokeStyle(2, 0x8b6914);

    // Ears
    const leftEar = this.scene.add.triangle(-12, -35, -5, 8, 5, 8, 0, -8, 0xcd853f);
    const rightEar = this.scene.add.triangle(12, -35, -5, 8, 5, 8, 0, -8, 0xcd853f);

    // Eyes
    const leftEye = this.scene.add.circle(-6, -22, 4, 0x000000);
    const rightEye = this.scene.add.circle(6, -22, 4, 0x000000);

    // Nose
    const nose = this.scene.add.circle(0, -15, 4, 0x333333);

    // Cheeks (stuffed with acorn look)
    const leftCheek = this.scene.add.ellipse(-10, -12, 8, 6, 0xdaa520);
    const rightCheek = this.scene.add.ellipse(10, -12, 8, 6, 0xdaa520);

    this.animal.add([tail, body, head, leftEar, rightEar, leftEye, rightEye, nose, leftCheek, rightCheek]);
  }

  private drawHedgehog(): void {
    // Spikes
    const spikesGraphics = this.scene.add.graphics();
    spikesGraphics.fillStyle(0x654321);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI + Math.PI;
      const x = Math.cos(angle) * 25;
      const y = Math.sin(angle) * 20 - 10;
      spikesGraphics.fillTriangle(
        x, y,
        x + Math.cos(angle) * 15, y + Math.sin(angle) * 15,
        x + Math.cos(angle + 0.3) * 5, y + Math.sin(angle + 0.3) * 5
      );
    }

    // Body
    const body = this.scene.add.ellipse(0, 0, 40, 30, 0xdeb887);
    body.setStrokeStyle(2, 0xcd853f);

    // Face
    const face = this.scene.add.circle(0, -15, 15, 0xffd5b4);
    face.setStrokeStyle(2, 0xd4a574);

    // Eyes
    const leftEye = this.scene.add.circle(-5, -17, 3, 0x000000);
    const rightEye = this.scene.add.circle(5, -17, 3, 0x000000);

    // Nose
    const nose = this.scene.add.circle(0, -10, 4, 0x333333);

    this.animal.add([spikesGraphics, body, face, leftEye, rightEye, nose]);
  }

  private drawMole(): void {
    // Body
    const body = this.scene.add.ellipse(0, 0, 35, 30, 0x4a4a4a);
    body.setStrokeStyle(2, 0x333333);

    // Head
    const head = this.scene.add.circle(0, -18, 18, 0x4a4a4a);
    head.setStrokeStyle(2, 0x333333);

    // Snout
    const snout = this.scene.add.ellipse(0, -10, 20, 12, 0xffc0cb);
    snout.setStrokeStyle(2, 0xffa0a0);

    // Big nose
    const nose = this.scene.add.circle(0, -8, 6, 0xff69b4);

    // Tiny eyes (moles have bad vision)
    const leftEye = this.scene.add.circle(-8, -22, 2, 0x000000);
    const rightEye = this.scene.add.circle(8, -22, 2, 0x000000);

    // Whiskers
    const whiskers = this.scene.add.graphics();
    whiskers.lineStyle(1, 0x333333);
    whiskers.moveTo(-15, -10);
    whiskers.lineTo(-25, -8);
    whiskers.moveTo(-15, -7);
    whiskers.lineTo(-25, -7);
    whiskers.moveTo(15, -10);
    whiskers.lineTo(25, -8);
    whiskers.moveTo(15, -7);
    whiskers.lineTo(25, -7);
    whiskers.strokePath();

    // Claws/paws
    const leftPaw = this.scene.add.circle(-18, 5, 8, 0xffc0cb);
    const rightPaw = this.scene.add.circle(18, 5, 8, 0xffc0cb);

    this.animal.add([body, head, snout, nose, leftEye, rightEye, whiskers, leftPaw, rightPaw]);
  }

  private startAnimation(): void {
    // Pop up after random delay
    this.scene.time.delayedCall(200 + Math.random() * 400, () => {
      this.popUp();
    });
  }

  private popUp(): void {
    this.animal.setVisible(true);
    this.isOut = true;

    // Animal pops up
    this.scene.tweens.add({
      targets: this.animal,
      y: -10,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Cute bobbing
    this.scene.tweens.add({
      targets: this.animal,
      y: -15,
      duration: 300,
      yoyo: true,
      repeat: -1,
      delay: 200,
      ease: 'Sine.easeInOut',
    });

    // Hide after a while
    this.hideTimer = this.scene.time.delayedCall(1800, () => {
      this.hideAnimal();
    });
  }

  private hideAnimal(): void {
    if (!this.isActive) return;

    this.scene.tweens.killTweensOf(this.animal);

    this.scene.tweens.add({
      targets: this.animal,
      y: 50,
      duration: 150,
      onComplete: () => {
        this.animal.setVisible(false);
        this.isOut = false;
        this.playMissAnimation();
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

    this.scene.tweens.killTweensOf(this.animal);

    // Stars/sparkles for hitting
    const starColors = [0xffff00, 0xffd700, 0xfffacd];

    for (let i = 0; i < 8; i++) {
      const color = Phaser.Utils.Array.GetRandom(starColors);
      const star = this.scene.add.text(this.x, this.y - 10, '✦', {
        fontSize: '20px',
        color: `#${color.toString(16)}`,
      }).setOrigin(0.5);
      star.setDepth(this.depth + 1);

      const angle = (i / 8) * Math.PI * 2;
      const distance = 40 + Math.random() * 40;

      this.scene.tweens.add({
        targets: star,
        x: this.x + Math.cos(angle) * distance,
        y: this.y - 10 + Math.sin(angle) * distance,
        alpha: 0,
        rotation: Math.random() * 2,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }

    // Animal ducks down quickly
    this.scene.tweens.add({
      targets: this.animal,
      y: 50,
      duration: 150,
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

  getAnimalType(): AnimalType {
    return this.animalType;
  }

  getHitRadius(): number {
    return this.isOut ? 30 : 0;
  }
}
