import Phaser from 'phaser';
import { Target, type TargetConfig } from './Target';

export type TreasureType = 'points' | 'life' | 'nothing' | 'bonus';

export interface TreasureChestConfig extends TargetConfig {
  treasureType: TreasureType;
  treasureValue?: number;
}

export class TreasureChestTarget extends Target {
  private treasureType: TreasureType;
  private treasureValue: number;
  private chest!: Phaser.GameObjects.Container;
  private lid!: Phaser.GameObjects.Container;
  private isOpen: boolean = false;

  constructor(scene: Phaser.Scene, config: TreasureChestConfig) {
    super(scene, config);
    this.treasureType = config.treasureType;
    this.treasureValue = config.treasureValue || 500;
    this.createVisuals();
  }

  createVisuals(): void {
    this.chest = this.scene.add.container(0, 0);

    // Chest base
    const base = this.scene.add.rectangle(0, 15, 80, 50, 0x8b4513);
    base.setStrokeStyle(3, 0x654321);

    // Wood texture lines
    const woodLines = this.scene.add.graphics();
    woodLines.lineStyle(1, 0x654321, 0.5);
    for (let i = -30; i <= 30; i += 10) {
      woodLines.moveTo(i, -5);
      woodLines.lineTo(i, 35);
    }
    woodLines.strokePath();

    // Metal bands
    const band1 = this.scene.add.rectangle(0, 5, 80, 6, 0xffd700);
    band1.setStrokeStyle(1, 0xcc9900);
    const band2 = this.scene.add.rectangle(0, 30, 80, 6, 0xffd700);
    band2.setStrokeStyle(1, 0xcc9900);

    // Lock
    const lock = this.scene.add.rectangle(0, 17, 15, 20, 0xffd700);
    lock.setStrokeStyle(2, 0xcc9900);
    const keyhole = this.scene.add.circle(0, 20, 4, 0x000000);

    this.chest.add([base, woodLines, band1, band2, lock, keyhole]);
    this.add(this.chest);

    // Lid (separate for animation)
    this.lid = this.scene.add.container(0, -10);

    const lidBase = this.scene.add.arc(0, 0, 40, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false, 0x8b4513);
    lidBase.setStrokeStyle(3, 0x654321);

    const lidBand = this.scene.add.arc(0, -5, 35, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false, 0xffd700);
    lidBand.setStrokeStyle(1, 0xcc9900);

    this.lid.add([lidBase, lidBand]);
    this.add(this.lid);

    // Question mark
    const question = this.scene.add.text(0, 0, '?', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#8b4513',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.lid.add(question);

    // Sparkle effect
    this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.hitCircle = this.scene.add.circle(0, 0, 45, 0x000000, 0);
    this.add(this.hitCircle);
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    if (this.isOpen) return { points: 0, correct: false };
    this.isActive = false;
    this.isOpen = true;
    return { points: this.treasureValue, correct: true };
  }

  playHitAnimation(_correct: boolean, onComplete?: () => void): void {
    this.scene.tweens.killTweensOf(this);

    // Open the lid
    this.scene.tweens.add({
      targets: this.lid,
      angle: -120,
      y: -30,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.revealTreasure(onComplete);
      },
    });
  }

  private revealTreasure(onComplete?: () => void): void {
    const treasureContainer = this.scene.add.container(this.x, this.y - 30);
    treasureContainer.setDepth(this.depth + 10);

    switch (this.treasureType) {
      case 'points':
        this.showPointsTreasure(treasureContainer);
        break;
      case 'life':
        this.showLifeTreasure(treasureContainer);
        break;
      case 'bonus':
        this.showBonusTreasure(treasureContainer);
        break;
      case 'nothing':
        this.showNothingTreasure(treasureContainer);
        break;
    }

    // Fade out chest after delay
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({
        targets: [this, treasureContainer],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          treasureContainer.destroy();
          this.destroy();
          onComplete?.();
        },
      });
    });
  }

  private showPointsTreasure(container: Phaser.GameObjects.Container): void {
    // Gold coins burst
    for (let i = 0; i < 10; i++) {
      const coin = this.scene.add.circle(0, 0, 10, 0xffd700);
      coin.setStrokeStyle(2, 0xcc9900);
      container.add(coin);

      const angle = (i / 10) * Math.PI * 2;
      const distance = 50 + Math.random() * 50;

      this.scene.tweens.add({
        targets: coin,
        x: Math.cos(angle) * distance,
        y: -30 + Math.sin(angle) * distance,
        duration: 400,
        delay: i * 30,
        ease: 'Quad.easeOut',
      });
    }

    // Points text
    const text = this.scene.add.text(0, -60, `+${this.treasureValue}`, {
      fontFamily: 'Arial Black',
      fontSize: '40px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    container.add(text);

    this.scene.tweens.add({
      targets: text,
      y: -100,
      scale: 1.3,
      duration: 500,
    });
  }

  private showLifeTreasure(container: Phaser.GameObjects.Container): void {
    // Big heart
    const heart = this.scene.add.text(0, -30, '❤️', {
      fontSize: '64px',
    }).setOrigin(0.5);
    container.add(heart);

    heart.setScale(0);
    this.scene.tweens.add({
      targets: heart,
      scale: 1.5,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // 1-UP text
    const text = this.scene.add.text(0, -90, '1-UP!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    container.add(text);

    this.scene.tweens.add({
      targets: text,
      y: -120,
      duration: 500,
    });
  }

  private showBonusTreasure(container: Phaser.GameObjects.Container): void {
    // Rainbow stars
    const colors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0077ff, 0x9900ff];

    for (let i = 0; i < 12; i++) {
      const star = this.scene.add.text(0, 0, '⭐', {
        fontSize: '24px',
      }).setOrigin(0.5);
      star.setTint(colors[i % colors.length]);
      container.add(star);

      const angle = (i / 12) * Math.PI * 2;
      const distance = 80;

      this.scene.tweens.add({
        targets: star,
        x: Math.cos(angle) * distance,
        y: -40 + Math.sin(angle) * distance,
        rotation: Math.PI * 2,
        duration: 600,
        delay: i * 40,
      });
    }

    const text = this.scene.add.text(0, -60, 'BONUS!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffff00',
      stroke: '#ff6600',
      strokeThickness: 4,
    }).setOrigin(0.5);
    container.add(text);
  }

  private showNothingTreasure(container: Phaser.GameObjects.Container): void {
    // Dust cloud
    for (let i = 0; i < 5; i++) {
      const dust = this.scene.add.circle(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        15 + Math.random() * 10,
        0x888888,
        0.5
      );
      container.add(dust);

      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        scale: 2,
        y: dust.y - 50,
        duration: 600,
      });
    }

    const text = this.scene.add.text(0, -50, 'Empty!', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#888888',
    }).setOrigin(0.5);
    container.add(text);
  }

  getTreasureType(): TreasureType {
    return this.treasureType;
  }

  getTreasureValue(): number {
    return this.treasureValue;
  }

  getHitRadius(): number {
    return 45;
  }
}
