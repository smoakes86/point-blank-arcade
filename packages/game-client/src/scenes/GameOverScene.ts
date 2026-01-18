import Phaser from 'phaser';
import { NetworkService } from '../services/NetworkService';
import { PLAYER_COLORS, type PlayerNumber } from '@point-blank/shared';
import { createConfettiBurst, createFireworkExplosion, createStarBurst, createScreenFlash } from '../effects/ParticleEffects';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const state = NetworkService.getState();
    const players = NetworkService.getPlayers();

    // Determine if it's a victory or game over
    const stagesCompleted = state?.stagesCompleted.length || 0;
    const isVictory = stagesCompleted >= 16;

    // Background with gradient feel
    const bgColor = isVictory ? 0x1a1a4e : 0x2a1a1a;
    this.cameras.main.setBackgroundColor(bgColor);

    // Add ambient stars/particles in background
    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Math.random() * width,
        Math.random() * height,
        1 + Math.random() * 2,
        isVictory ? 0xffffff : 0x444444,
        0.3 + Math.random() * 0.4
      );
      star.setDepth(-10);

      // Twinkling effect
      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: 1000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Screen flash for impact
    createScreenFlash(this, {
      color: isVictory ? 0xffd700 : 0xff0000,
      alpha: 0.3,
      duration: 500,
    });

    // Title
    const titleText = isVictory ? 'CONGRATULATIONS!' : 'GAME OVER';
    const titleColor = isVictory ? '#ffd700' : '#ff6b6b';

    const title = this.add.text(width / 2, 120, titleText, {
      fontFamily: 'Arial Black',
      fontSize: '72px',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Animate title
    title.setScale(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });

    // Stages completed
    this.add.text(width / 2, 220, `Stages Completed: ${stagesCompleted} / 16`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Final rankings
    this.add.text(width / 2, 320, 'FINAL RANKINGS', {
      fontFamily: 'Arial Black',
      fontSize: '40px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    sortedPlayers.forEach((player, index) => {
      const y = 420 + index * 100;
      const color = PLAYER_COLORS[player.playerNumber as PlayerNumber];
      const colorNum = parseInt(color.hex.replace('#', ''), 16);

      // Rank medal colors
      const medalColors = [0xffd700, 0xc0c0c0, 0xcd7f32, 0x888888];
      const medalColor = medalColors[index] || 0x888888;

      // Player row
      const rowBg = this.add.rectangle(width / 2, y, 600, 80, colorNum, 0.2);
      rowBg.setStrokeStyle(3, colorNum);

      // Medal/Rank
      const medal = this.add.circle(width / 2 - 250, y, 25, medalColor);
      this.add.text(width / 2 - 250, y, `${index + 1}`, {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#000000',
      }).setOrigin(0.5);

      // Player info
      this.add.text(width / 2 - 100, y - 15, `Player ${player.playerNumber}`, {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: color.hex,
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 - 100, y + 15, player.name, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#aaaaaa',
      }).setOrigin(0, 0.5);

      // Score
      this.add.text(width / 2 + 150, y, player.score.toString(), {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // Animate row
      rowBg.setAlpha(0);
      this.tweens.add({
        targets: rowBg,
        alpha: 1,
        duration: 500,
        delay: 500 + index * 200,
      });
    });

    // Play again button
    const playAgainBtn = this.createButton(width / 2, height - 100, 'PLAY AGAIN', () => {
      NetworkService.disconnect();
      this.scene.start('BootScene');
    });

    // Fireworks for victory
    if (isVictory) {
      this.createFireworks();
    }
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 60, 0x4ecdc4);
    bg.setStrokeStyle(3, 0xffffff);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg, text]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x5dddd5));
    bg.on('pointerout', () => bg.setFillStyle(0x4ecdc4));
    bg.on('pointerdown', onClick);

    return container;
  }

  private createFireworks(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const colors = [0xff6b6b, 0x4ecdc4, 0xffd700, 0xf9ca24, 0x6c5ce7, 0xff00ff, 0x00ffff];

    // Create enhanced firework burst
    const createBurst = () => {
      const x = Phaser.Math.Between(100, width - 100);
      const y = Phaser.Math.Between(100, height / 2);

      // Use enhanced firework explosion
      createFireworkExplosion(this, x, y, {
        colors,
        particleCount: 35,
        radius: 120,
      });

      // Add star burst for extra sparkle
      this.time.delayedCall(100, () => {
        createStarBurst(this, x, y, {
          colors: [0xffffff, 0xffd700],
          count: 6,
          speed: 60,
        });
      });
    };

    // Create confetti rain
    const createConfetti = () => {
      const x = Phaser.Math.Between(50, width - 50);
      createConfettiBurst(this, x, -20, { count: 15, spread: 150 });
    };

    // Burst every 800ms for more frequent celebration
    this.time.addEvent({
      delay: 800,
      callback: createBurst,
      loop: true,
    });

    // Confetti every 1.5s
    this.time.addEvent({
      delay: 1500,
      callback: createConfetti,
      loop: true,
    });

    // Initial bursts with staggered timing
    createBurst();
    this.time.delayedCall(200, createBurst);
    this.time.delayedCall(400, createBurst);
    this.time.delayedCall(600, () => createConfettiBurst(this, width / 2, 50, { count: 50, spread: 500 }));
  }
}
