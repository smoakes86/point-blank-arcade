import Phaser from 'phaser';
import { NetworkService } from '../services/NetworkService';
import { PLAYER_COLORS, MINI_GAMES, type PlayerNumber } from '@point-blank/shared';
import { createConfettiBurst, createStarBurst, createScreenFlash } from '../effects/ParticleEffects';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const state = NetworkService.getState();
    const players = NetworkService.getPlayers();
    const miniGame = MINI_GAMES.find((g) => g.id === state?.currentMiniGame);

    // Determine pass/fail
    const passed = state ? state.quotaMet >= state.quota : false;

    // Enhanced background flash
    createScreenFlash(this, {
      color: passed ? 0x4ecdc4 : 0xff6b6b,
      alpha: 0.4,
      duration: 600,
    });

    // Celebration effects for passing
    if (passed) {
      // Initial confetti burst
      createConfettiBurst(this, width / 2, 100, { count: 40, spread: 400 });

      // Delayed bursts
      this.time.delayedCall(300, () => {
        createConfettiBurst(this, 150, 150, { count: 20, spread: 200 });
        createConfettiBurst(this, width - 150, 150, { count: 20, spread: 200 });
      });

      // Star bursts around the screen
      this.time.delayedCall(500, () => {
        createStarBurst(this, 100, 300, { colors: [0xffd700, 0xffff00], count: 6 });
        createStarBurst(this, width - 100, 300, { colors: [0xffd700, 0xffff00], count: 6 });
      });
    } else {
      // Shake camera for failure
      this.cameras.main.shake(300, 0.01);
    }

    // Result text
    const resultText = passed ? 'STAGE CLEAR!' : 'STAGE FAILED';
    const resultColor = passed ? '#4ecdc4' : '#ff6b6b';

    const title = this.add.text(width / 2, 150, resultText, {
      fontFamily: 'Arial Black',
      fontSize: '72px',
      color: resultColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Enhanced title animation
    title.setScale(0);
    title.setAngle(-10);
    this.tweens.add({
      targets: title,
      scale: 1.1,
      angle: 0,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Settle bounce
        this.tweens.add({
          targets: title,
          scale: 1,
          duration: 150,
          ease: 'Sine.easeInOut',
        });

        // Continuous subtle pulse for passed
        if (passed) {
          this.tweens.add({
            targets: title,
            scale: 1.05,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      },
    });

    // Stage name
    this.add.text(width / 2, 240, miniGame?.name || '', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Quota result
    const quotaText = `${state?.quotaMet || 0} / ${state?.quota || 0}`;
    this.add.text(width / 2, 320, `Quota: ${quotaText}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: passed ? '#4ecdc4' : '#ff6b6b',
    }).setOrigin(0.5);

    // Player scores
    this.add.text(width / 2, 420, 'SCORES', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    sortedPlayers.forEach((player, index) => {
      const y = 500 + index * 80;
      const color = PLAYER_COLORS[player.playerNumber as PlayerNumber];
      const colorNum = parseInt(color.hex.replace('#', ''), 16);

      // Player row background
      const rowBg = this.add.rectangle(width / 2, y, 500, 60, colorNum, 0.2);
      rowBg.setStrokeStyle(2, colorNum);

      // Rank
      this.add.text(width / 2 - 200, y, `#${index + 1}`, {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#888888',
      }).setOrigin(0.5);

      // Player name
      this.add.text(width / 2 - 50, y, `P${player.playerNumber} - ${player.name}`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: color.hex,
      }).setOrigin(0.5);

      // Score
      this.add.text(width / 2 + 150, y, player.score.toString(), {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // Lives
      const livesText = '❤️'.repeat(player.lives);
      this.add.text(width / 2 + 220, y, livesText, {
        fontFamily: 'Arial',
        fontSize: '20px',
      }).setOrigin(0, 0.5);

      // Animate row
      rowBg.setScale(0, 1);
      this.tweens.add({
        targets: rowBg,
        scaleX: 1,
        duration: 300,
        delay: index * 100,
      });
    });

    // Continue button / auto-advance
    const continueText = this.add.text(width / 2, height - 80, 'Continuing...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5);

    // Auto-advance after delay
    this.time.delayedCall(3000, () => {
      this.advanceToNextStage();
    });

    // Listen for state changes
    NetworkService.onStateChange((state) => {
      if (state.phase === 'stage-select') {
        this.scene.start('StageSelectScene');
      } else if (state.phase === 'game-over') {
        this.scene.start('GameOverScene');
      } else if (state.phase === 'bonus') {
        // Handle bonus stage
        this.scene.start('StageSelectScene');
      }
    });
  }

  private advanceToNextStage(): void {
    const state = NetworkService.getState();

    // Check if all players are out of lives
    const players = NetworkService.getPlayers();
    const allDead = players.every((p) => p.lives <= 0);

    if (allDead) {
      this.scene.start('GameOverScene');
      return;
    }

    // Check if all stages complete
    if (state && state.stagesCompleted.length >= 16) {
      this.scene.start('GameOverScene');
      return;
    }

    // Continue to stage select
    this.scene.start('StageSelectScene');
  }
}
