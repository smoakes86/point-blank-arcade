import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { Target, type TargetConfig } from '../objects/Target';
import { createFireworkExplosion, createScreenFlash, createConfettiBurst } from '../effects/ParticleEffects';

export interface FireworksFinaleConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

class FireworkTarget extends Target {
  private rocket!: Phaser.GameObjects.Container;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private fireworkColor: number;
  private isLaunching: boolean = true;
  private targetY: number;
  private launchSpeed: number;

  constructor(scene: Phaser.Scene, config: TargetConfig & { color: number; targetY: number }) {
    super(scene, config);
    this.fireworkColor = config.color;
    this.targetY = config.targetY;
    this.launchSpeed = 3 + Math.random() * 2;
    this.createVisuals();
  }

  createVisuals(): void {
    this.rocket = this.scene.add.container(0, 0);

    // Rocket body
    const body = this.scene.add.rectangle(0, 0, 10, 30, this.fireworkColor);
    body.setStrokeStyle(1, 0xffffff);

    // Rocket tip
    const tip = this.scene.add.triangle(0, -20, -6, 0, 6, 0, 0, -12, 0xffffff);

    // Fins
    const leftFin = this.scene.add.triangle(-8, 12, 0, -5, 0, 5, -8, 5, this.fireworkColor);
    const rightFin = this.scene.add.triangle(8, 12, 0, -5, 0, 5, 8, 5, this.fireworkColor);

    this.rocket.add([body, tip, leftFin, rightFin]);
    this.add(this.rocket);

    // Trail particles
    const particles = this.scene.add.particles(0, 15, 'flare', {
      speed: { min: 20, max: 50 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.3, end: 0 },
      lifespan: 300,
      frequency: 30,
      tint: [0xff6600, 0xffff00, 0xff0000],
    });

    // If no flare texture, create simple particle effect
    if (!this.scene.textures.exists('flare')) {
      particles.destroy();
      // Simpler trail
      this.scene.time.addEvent({
        delay: 50,
        callback: () => {
          if (this.active && this.isLaunching) {
            const spark = this.scene.add.circle(this.x, this.y + 15, 3, 0xff6600);
            spark.setDepth(this.depth - 1);
            this.scene.tweens.add({
              targets: spark,
              alpha: 0,
              scale: 0,
              y: spark.y + 20,
              duration: 300,
              onComplete: () => spark.destroy(),
            });
          }
        },
        loop: true,
      });
    } else {
      this.add(particles);
    }

    this.hitCircle = this.scene.add.circle(0, 0, 25, 0x000000, 0);
    this.add(this.hitCircle);
  }

  update(_time: number, _delta: number): void {
    if (!this.isActive || !this.isLaunching) return;

    // Move upward
    this.y -= this.launchSpeed;

    // Check if reached target height
    if (this.y <= this.targetY) {
      this.isLaunching = false;
      this.autoExplode();
    }
  }

  private autoExplode(): void {
    // Auto-explode if not shot in time
    this.scene.time.delayedCall(500, () => {
      if (this.active && !this.isLaunching) {
        this.playHitAnimation(false);
      }
    });
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;
    // More points if shot while still launching (harder)
    const bonus = this.isLaunching ? 50 : 0;
    return { points: this.points + bonus, correct: true };
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    this.rocket.setVisible(false);

    // Use enhanced firework explosion effect
    createFireworkExplosion(this.scene, this.x, this.y, {
      colors: [this.fireworkColor, 0xffffff, 0xffff00, 0xff00ff, 0x00ffff],
      particleCount: correct ? 50 : 25,
      radius: correct ? 180 : 120,
    });

    // Additional burst patterns for correct hits
    if (correct) {
      // Secondary explosion ring
      this.scene.time.delayedCall(100, () => {
        createFireworkExplosion(this.scene, this.x, this.y - 30, {
          colors: [0xffffff, this.fireworkColor],
          particleCount: 20,
          radius: 100,
        });
      });

      // Trailing sparkles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 60;
        this.scene.time.delayedCall(150 + i * 30, () => {
          const sparkX = this.x + Math.cos(angle) * dist;
          const sparkY = this.y + Math.sin(angle) * dist;
          for (let j = 0; j < 5; j++) {
            const spark = this.scene.add.circle(sparkX, sparkY, 2, this.fireworkColor);
            spark.setDepth(1002);
            this.scene.tweens.add({
              targets: spark,
              y: sparkY + 30 + Math.random() * 40,
              alpha: 0,
              duration: 500,
              delay: j * 50,
              onComplete: () => spark.destroy(),
            });
          }
        });
      }

      // Screen flash with firework color
      createScreenFlash(this.scene, {
        color: this.fireworkColor,
        alpha: 0.2,
        duration: 200,
      });
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  isStillLaunching(): boolean {
    return this.isLaunching;
  }

  getHitRadius(): number {
    return 25;
  }
}

export class FireworksFinale extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 400; // Fast spawns for finale
  private maxFireworks: number = 15;
  private fireworkTargets: FireworkTarget[] = [];
  private totalPoints: number = 0;
  private fireworkColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff6600, 0xff0066];

  constructor(config: FireworksFinaleConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    this.createBackground();
  }

  private createBackground(): void {
    // Night sky
    const sky = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x0a0a2e
    );
    sky.setDepth(-30);

    // Stars
    for (let i = 0; i < 50; i++) {
      const star = this.scene.add.circle(
        Math.random() * this.screenWidth,
        Math.random() * (this.screenHeight - 100),
        1 + Math.random() * 2,
        0xffffff,
        0.5 + Math.random() * 0.5
      );
      star.setDepth(-25);

      // Twinkle
      this.scene.tweens.add({
        targets: star,
        alpha: 0.3,
        duration: 500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
      });
    }

    // City silhouette
    const buildings = this.scene.add.graphics();
    buildings.fillStyle(0x1a1a2e);
    buildings.setDepth(-20);

    for (let x = 0; x < this.screenWidth; x += 40 + Math.random() * 30) {
      const height = 50 + Math.random() * 100;
      const width = 30 + Math.random() * 40;
      buildings.fillRect(x, this.screenHeight - height, width, height);

      // Windows
      const windowGraphics = this.scene.add.graphics();
      windowGraphics.fillStyle(0xffff00, 0.3);
      for (let wy = this.screenHeight - height + 10; wy < this.screenHeight - 10; wy += 15) {
        for (let wx = x + 5; wx < x + width - 5; wx += 12) {
          if (Math.random() > 0.3) {
            windowGraphics.fillRect(wx, wy, 6, 8);
          }
        }
      }
      windowGraphics.setDepth(-19);
    }

    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 50, 'FIREWORKS FINALE!', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Rainbow cycle on title
    let hue = 0;
    this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        hue = (hue + 5) % 360;
        const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
        title.setColor(Phaser.Display.Color.RGBToString(color.red, color.green, color.blue));
      },
      loop: true,
    });

    // Instructions
    const instructions = this.scene.add.text(this.screenWidth / 2, 100, 'Shoot the fireworks for bonus points!', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    instructions.setDepth(100);
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new fireworks
    if (this.spawnTimer >= this.spawnInterval && this.fireworkTargets.length < this.maxFireworks) {
      this.spawnTimer = 0;
      this.spawnTargets();
    }

    // Update all fireworks
    const time = this.scene.time.now;
    this.fireworkTargets.forEach((firework) => {
      if (firework.active) {
        firework.update(time, delta);
      }
    });

    // Clean up
    this.fireworkTargets = this.fireworkTargets.filter((f) => f.active);
  }

  spawnTargets(): void {
    const x = 80 + Math.random() * (this.screenWidth - 160);
    const startY = this.screenHeight + 30;
    const targetY = 150 + Math.random() * 200;
    const color = Phaser.Utils.Array.GetRandom(this.fireworkColors);

    const firework = new FireworkTarget(this.scene, {
      id: `firework-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x,
      y: startY,
      width: 30,
      height: 50,
      points: 50,
      color,
      targetY,
    });

    this.fireworkTargets.push(firework);
    this.addTarget(firework);
  }

  handleFireworkHit(fireworkId: string, playerNumber: number): { success: boolean; points: number } {
    const firework = this.fireworkTargets.find((f) => f.targetId === fireworkId);
    if (!firework || !firework.active) return { success: false, points: 0 };

    const result = firework.hit(playerNumber);

    firework.playHitAnimation(true, () => {
      this.targets.delete(fireworkId);
    });

    this.totalPoints += result.points;
    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    // Show points
    this.showPointsPopup(firework.x, firework.y, result.points, firework.isStillLaunching());

    const index = this.fireworkTargets.indexOf(firework);
    if (index > -1) {
      this.fireworkTargets.splice(index, 1);
    }

    return { success: true, points: result.points };
  }

  private showPointsPopup(x: number, y: number, points: number, wasLaunching: boolean): void {
    const text = wasLaunching ? `PERFECT! +${points}` : `+${points}`;
    const color = wasLaunching ? '#f1c40f' : '#ffffff';

    const popup = this.scene.add.text(x, y, text, {
      fontFamily: 'Arial Black',
      fontSize: wasLaunching ? '32px' : '24px',
      color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    popup.setDepth(200);

    this.scene.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      scale: wasLaunching ? 1.5 : 1.2,
      duration: 800,
      onComplete: () => popup.destroy(),
    });
  }

  getTotalPoints(): number {
    return this.totalPoints;
  }

  destroy(): void {
    this.fireworkTargets = [];
    super.destroy();
  }
}
