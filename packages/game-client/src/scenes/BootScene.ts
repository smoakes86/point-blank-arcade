import Phaser from 'phaser';
import { NetworkService } from '../services/NetworkService';
import { SpriteManager, SPRITE_DEFINITIONS } from '../services/SpriteManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    // Loading progress
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xff6b6b, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load all sprite assets
    this.loadSprites();

    // Create fallback placeholder textures
    this.createPlaceholderTextures();
  }

  private loadSprites(): void {
    // Load all defined sprites
    const allDefinitions = SpriteManager.getAllDefinitions();

    for (const def of allDefinitions) {
      this.load.image(def.key, def.path);

      // Track loading success/failure
      this.load.on(`filecomplete-image-${def.key}`, () => {
        SpriteManager.markLoaded(def.key);
      });
    }

    // Handle load errors gracefully (will use fallback graphics)
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Failed to load sprite: ${file.key}, using procedural fallback`);
      SpriteManager.markFailed(file.key);
    });
  }

  private createPlaceholderTextures(): void {
    // Create procedural placeholder textures for common sprites
    // These will be used as fallbacks when actual sprites aren't loaded

    // Particle textures
    this.createCircleTexture('particle-circle', 16, 0xffffff);
    this.createStarTexture('particle-star', 16, 0xffffff);

    // UI elements
    this.createCrosshairTexture('crosshair-default', 64);
  }

  private createCircleTexture(key: string, size: number, color: number): void {
    if (this.textures.exists(key)) return;

    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color);
    graphics.fillCircle(size / 2, size / 2, size / 2);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createStarTexture(key: string, size: number, color: number): void {
    if (this.textures.exists(key)) return;

    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color);

    // Draw a simple star shape
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = size / 2;
    const innerRadius = size / 4;
    const points = 5;

    const path: { x: number; y: number }[] = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      path.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }

    graphics.beginPath();
    graphics.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      graphics.lineTo(path[i].x, path[i].y);
    }
    graphics.closePath();
    graphics.fill();

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createCrosshairTexture(key: string, size: number): void {
    if (this.textures.exists(key)) return;

    const graphics = this.make.graphics({ x: 0, y: 0 });
    const cx = size / 2;
    const cy = size / 2;

    graphics.lineStyle(3, 0xffffff, 1);

    // Cross lines with gap in center
    const gap = 8;
    const length = size / 2 - 4;

    // Left line
    graphics.moveTo(cx - length, cy);
    graphics.lineTo(cx - gap, cy);

    // Right line
    graphics.moveTo(cx + gap, cy);
    graphics.lineTo(cx + length, cy);

    // Top line
    graphics.moveTo(cx, cy - length);
    graphics.lineTo(cx, cy - gap);

    // Bottom line
    graphics.moveTo(cx, cy + gap);
    graphics.lineTo(cx, cy + length);

    graphics.strokePath();

    // Center circle
    graphics.strokeCircle(cx, cy, gap - 2);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  async create(): Promise<void> {
    // Show connecting text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const connectingText = this.add.text(width / 2, height / 2, 'Creating room...', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
    });
    connectingText.setOrigin(0.5, 0.5);

    try {
      await NetworkService.createRoom();
      this.scene.start('LobbyScene');
    } catch (error) {
      connectingText.setText('Failed to connect. Retrying...');
      this.time.delayedCall(2000, () => {
        this.scene.restart();
      });
    }
  }
}
