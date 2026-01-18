import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export type CardboardType = 'robber' | 'civilian' | 'bandit' | 'townsperson';

export interface CardboardConfig extends TargetConfig {
  cardboardType: CardboardType;
}

export class CardboardTarget extends Target {
  private cardboardType: CardboardType;
  private figure!: Phaser.GameObjects.Container;
  private isEnemy: boolean;

  constructor(scene: Phaser.Scene, config: CardboardConfig) {
    super(scene, config);
    this.cardboardType = config.cardboardType;
    this.isEnemy = config.cardboardType === 'robber' || config.cardboardType === 'bandit';
    this.createVisuals();
  }

  createVisuals(): void {
    this.figure = this.scene.add.container(0, 0);

    // Cardboard base
    const baseColor = 0xd4a574; // Cardboard brown
    const base = this.scene.add.rectangle(0, 20, 60, 120, baseColor);
    base.setStrokeStyle(3, 0x8b6914);
    this.figure.add(base);

    // Draw figure based on type
    switch (this.cardboardType) {
      case 'robber':
        this.drawRobber();
        break;
      case 'civilian':
        this.drawCivilian();
        break;
      case 'bandit':
        this.drawBandit();
        break;
      case 'townsperson':
        this.drawTownsperson();
        break;
    }

    this.add(this.figure);

    // Pop-up animation
    this.figure.y = 80;
    this.scene.tweens.add({
      targets: this.figure,
      y: 0,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.hitCircle = this.scene.add.circle(0, 0, 40, 0x000000, 0);
    this.add(this.hitCircle);
  }

  private drawRobber(): void {
    // Head (with ski mask)
    const head = this.scene.add.circle(0, -30, 20, 0x333333);
    head.setStrokeStyle(2, 0x222222);

    // Eyes (white showing through mask)
    const leftEye = this.scene.add.circle(-8, -32, 5, 0xffffff);
    const rightEye = this.scene.add.circle(8, -32, 5, 0xffffff);
    const leftPupil = this.scene.add.circle(-8, -32, 2, 0x000000);
    const rightPupil = this.scene.add.circle(8, -32, 2, 0x000000);

    // Body (dark clothes)
    const body = this.scene.add.rectangle(0, 10, 40, 50, 0x222222);

    // Gun
    const gun = this.scene.add.rectangle(25, 5, 30, 8, 0x444444);

    // Money bag
    const bag = this.scene.add.circle(-20, 20, 15, 0x8b7355);
    const dollarSign = this.scene.add.text(-20, 20, '$', {
      fontSize: '16px',
      color: '#228b22',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.figure.add([body, head, leftEye, rightEye, leftPupil, rightPupil, gun, bag, dollarSign]);
  }

  private drawCivilian(): void {
    // Head
    const head = this.scene.add.circle(0, -30, 20, 0xffd5b4);
    head.setStrokeStyle(2, 0xd4a574);

    // Hair
    const hair = this.scene.add.arc(0, -38, 18, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false, 0x4a3728);

    // Eyes
    const leftEye = this.scene.add.circle(-7, -32, 3, 0x000000);
    const rightEye = this.scene.add.circle(7, -32, 3, 0x000000);

    // Smile
    const smile = this.scene.add.arc(0, -25, 8, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(180), false, 0x000000, 0);
    smile.setStrokeStyle(2, 0x000000);

    // Body (casual clothes)
    const body = this.scene.add.rectangle(0, 10, 40, 50, 0x4169e1);

    // Hands up (innocent pose)
    const leftArm = this.scene.add.rectangle(-30, -10, 8, 30, 0xffd5b4);
    leftArm.rotation = -0.3;
    const rightArm = this.scene.add.rectangle(30, -10, 8, 30, 0xffd5b4);
    rightArm.rotation = 0.3;

    this.figure.add([body, leftArm, rightArm, head, hair, leftEye, rightEye, smile]);
  }

  private drawBandit(): void {
    // Head with cowboy hat
    const head = this.scene.add.circle(0, -25, 18, 0xdaa520);
    head.setStrokeStyle(2, 0x8b6914);

    // Hat brim
    const hatBrim = this.scene.add.ellipse(0, -42, 50, 12, 0x4a3728);
    // Hat top
    const hatTop = this.scene.add.rectangle(0, -52, 30, 20, 0x4a3728);

    // Bandana (covering lower face)
    const bandana = this.scene.add.arc(0, -18, 15, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(180), false, 0xff0000);

    // Eyes (mean look)
    const leftEye = this.scene.add.ellipse(-7, -30, 6, 4, 0x000000);
    const rightEye = this.scene.add.ellipse(7, -30, 6, 4, 0x000000);

    // Body (western vest)
    const body = this.scene.add.rectangle(0, 15, 40, 50, 0x8b4513);
    const vest = this.scene.add.rectangle(0, 15, 30, 45, 0x654321);

    // Guns
    const leftGun = this.scene.add.rectangle(-35, 10, 25, 6, 0x333333);
    leftGun.rotation = 0.3;
    const rightGun = this.scene.add.rectangle(35, 10, 25, 6, 0x333333);
    rightGun.rotation = -0.3;

    this.figure.add([body, vest, leftGun, rightGun, head, hatBrim, hatTop, bandana, leftEye, rightEye]);
  }

  private drawTownsperson(): void {
    // Head
    const head = this.scene.add.circle(0, -28, 18, 0xffd5b4);
    head.setStrokeStyle(2, 0xd4a574);

    // Bonnet/hat
    const bonnet = this.scene.add.ellipse(0, -38, 35, 15, 0xffe4c4);
    bonnet.setStrokeStyle(2, 0xdeb887);

    // Eyes
    const leftEye = this.scene.add.circle(-6, -30, 3, 0x000000);
    const rightEye = this.scene.add.circle(6, -30, 3, 0x000000);

    // Concerned expression
    const mouth = this.scene.add.ellipse(0, -22, 6, 4, 0x000000);

    // Dress
    const dress = this.scene.add.rectangle(0, 20, 45, 60, 0x87ceeb);
    dress.setStrokeStyle(2, 0x4682b4);

    // Apron
    const apron = this.scene.add.rectangle(0, 25, 30, 40, 0xffffff);

    this.figure.add([dress, apron, head, bonnet, leftEye, rightEye, mouth]);
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;

    if (this.isEnemy) {
      // Correct - shot an enemy
      return { points: this.points, correct: true };
    } else {
      // Wrong - shot a civilian!
      return { points: -100, correct: false };
    }
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    if (correct) {
      // Enemy hit - falls backward
      this.scene.tweens.add({
        targets: this.figure,
        y: this.figure.y + 100,
        rotation: -0.5,
        duration: 300,
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
    } else {
      // Civilian hit - dramatic reaction
      // Screen flash red
      const flash = this.scene.add.rectangle(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0xff0000,
        0.3
      );
      flash.setDepth(1000);

      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 300,
        onComplete: () => flash.destroy(),
      });

      // Target shakes and falls
      this.scene.tweens.add({
        targets: this,
        x: this.x + 10,
        duration: 30,
        yoyo: true,
        repeat: 5,
      });

      this.scene.tweens.add({
        targets: this.figure,
        y: this.figure.y + 80,
        duration: 400,
        delay: 200,
      });

      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        delay: 200,
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    }
  }

  isEnemyTarget(): boolean {
    return this.isEnemy;
  }

  getHitRadius(): number {
    return 40;
  }
}
