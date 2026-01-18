import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { MeteorTarget } from '../objects/MeteorTarget';

export interface MeteorStrikeConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class MeteorStrike extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 800;
  private maxMeteors: number = 8;
  private meteorTargets: MeteorTarget[] = [];
  private earthHealth: number = 3;
  private earthDamaged: boolean = false;

  constructor(config: MeteorStrikeConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    // Create Earth indicator at bottom
    this.createEarthIndicator();
  }

  private createEarthIndicator(): void {
    // Earth at bottom of screen
    const earth = this.scene.add.circle(
      this.screenWidth / 2,
      this.screenHeight - 50,
      60,
      0x4444ff
    );
    earth.setStrokeStyle(4, 0x00ff00);

    // Continents (rough approximation)
    const landMass = this.scene.add.graphics();
    landMass.fillStyle(0x228b22);
    landMass.fillCircle(this.screenWidth / 2 - 20, this.screenHeight - 60, 15);
    landMass.fillCircle(this.screenWidth / 2 + 10, this.screenHeight - 40, 20);
    landMass.fillCircle(this.screenWidth / 2 + 25, this.screenHeight - 65, 12);

    // "EARTH" label
    this.scene.add.text(this.screenWidth / 2, this.screenHeight - 120, 'PROTECT EARTH!', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#4ecdc4',
    }).setOrigin(0.5);
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    // Spawn new meteors
    if (this.spawnTimer >= this.spawnInterval && this.meteorTargets.length < this.maxMeteors) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Increase difficulty over time
      this.spawnInterval = Math.max(400, this.spawnInterval - 10);
    }

    // Update all meteors
    const time = this.scene.time.now;
    this.meteorTargets.forEach((meteor) => {
      if (meteor.active) {
        meteor.update(time, delta);
      }
    });

    // Check for meteors that hit Earth
    this.meteorTargets = this.meteorTargets.filter((meteor) => {
      if (!meteor.active) {
        // Meteor hit Earth!
        if (!this.earthDamaged) {
          this.earthDamaged = true;
          this.earthHealth--;
          this.onTargetHit(meteor.targetId, 0, -100, false);

          // Flash screen red
          this.showEarthDamage();

          this.scene.time.delayedCall(500, () => {
            this.earthDamaged = false;
          });
        }
        return false;
      }
      return true;
    });
  }

  private showEarthDamage(): void {
    // Big screen shake
    this.scene.cameras.main.shake(500, 0.03);

    // Red flash
    const flash = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0xff0000,
      0.4
    );
    flash.setDepth(1000);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Damage text
    const damageText = this.scene.add.text(
      this.screenWidth / 2,
      this.screenHeight / 2,
      'EARTH DAMAGED!',
      {
        fontFamily: 'Arial Black',
        fontSize: '48px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 4,
      }
    ).setOrigin(0.5);
    damageText.setDepth(1001);

    this.scene.tweens.add({
      targets: damageText,
      alpha: 0,
      y: damageText.y - 100,
      duration: 1000,
      onComplete: () => damageText.destroy(),
    });
  }

  spawnTargets(): void {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const size = Phaser.Utils.Array.GetRandom(sizes);

    const x = 100 + Math.random() * (this.screenWidth - 200);
    const y = -80;

    const meteor = new MeteorTarget(this.scene, {
      id: `meteor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x,
      y,
      width: 60,
      height: 60,
      points: size === 'large' ? 30 : size === 'medium' ? 20 : 10,
      size,
    });

    this.meteorTargets.push(meteor);
    this.addTarget(meteor);
  }

  handleMeteorHit(meteorId: string): boolean {
    const meteor = this.meteorTargets.find((m) => m.targetId === meteorId);
    if (!meteor || !meteor.active) return false;

    meteor.playHitAnimation(true, () => {
      this.targets.delete(meteorId);
    });

    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    const index = this.meteorTargets.indexOf(meteor);
    if (index > -1) {
      this.meteorTargets.splice(index, 1);
    }

    return true;
  }

  getEarthHealth(): number {
    return this.earthHealth;
  }

  isEarthDestroyed(): boolean {
    return this.earthHealth <= 0;
  }

  destroy(): void {
    this.meteorTargets = [];
    super.destroy();
  }
}
