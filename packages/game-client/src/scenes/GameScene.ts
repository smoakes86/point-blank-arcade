import Phaser from 'phaser';
import { NetworkService, type PlayerData, type TargetData } from '../services/NetworkService';
import { AudioService } from '../services/AudioService';
import { PLAYER_COLORS, MINI_GAMES, type PlayerNumber } from '@point-blank/shared';

// Import all mini-games
import {
  type MiniGame,
  ColorTargetBlitz,
  NumberSequence,
  CardMatching,
  LeafShooting,
  MeteorStrike,
  CuckooClock,
  BullseyeChallenge,
  CardboardCopTraining,
  WildWestShowdown,
  TreasureChestBonus,
  SkeletonCoffins,
  PopupAnimals,
  SingleBulletChallenge,
  TargetRange,
  MathProblems,
  KeyboardSpelling,
  SequenceRecall,
  ShapeMatching,
  FireworksFinale,
} from '../minigames';

export class GameScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private quotaText!: Phaser.GameObjects.Text;
  private quotaBar!: Phaser.GameObjects.Graphics;
  private instructionText!: Phaser.GameObjects.Text;
  private playerCursors: Map<string, Phaser.GameObjects.Container> = new Map();
  private scoreDisplays: Map<string, Phaser.GameObjects.Text> = new Map();

  private currentMiniGame: MiniGame | null = null;
  private miniGameId: string = '';
  private gameTimer: number = 0;
  private quota: number = 0;
  private quotaMet: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const state = NetworkService.getState();
    this.miniGameId = state?.currentMiniGame || 'color-target-blitz';
    const miniGameConfig = MINI_GAMES.find((g) => g.id === this.miniGameId);

    this.quota = miniGameConfig?.baseQuota || 10;
    this.gameTimer = (miniGameConfig?.baseTime || 15) * 1000;
    this.quotaMet = 0;

    // Game name
    this.add.text(width / 2, 40, miniGameConfig?.name || 'STAGE', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Instructions
    this.instructionText = this.add.text(width / 2, 90, miniGameConfig?.instructions || '', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#4ecdc4',
    }).setOrigin(0.5);

    // Timer (top right)
    this.add.text(width - 150, 30, 'TIME', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);

    this.timerText = this.add.text(width - 150, 70, Math.ceil(this.gameTimer / 1000).toString(), {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Quota display (top left)
    this.add.text(150, 30, 'QUOTA', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);

    this.quotaText = this.add.text(150, 70, `0 / ${this.quota}`, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Quota progress bar
    this.quotaBar = this.add.graphics();
    this.drawQuotaBar(0, this.quota);

    // Player scores (bottom)
    this.createPlayerScoreDisplay();

    // Initialize the appropriate mini-game
    this.initializeMiniGame();

    // Listen for phase changes
    NetworkService.onMessage('stage-complete', () => {
      this.endGame();
    });

    NetworkService.onStateChange((state) => {
      if (state.phase === 'results') {
        this.endGame();
      }
    });

    // Countdown animation
    this.showCountdown();
  }

  private showCountdown(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const countdownTexts = ['3', '2', '1', 'GO!'];
    let index = 0;

    const showNext = () => {
      if (index >= countdownTexts.length) {
        return;
      }

      const text = this.add.text(width / 2, height / 2, countdownTexts[index], {
        fontFamily: 'Arial Black',
        fontSize: index === 3 ? '96px' : '128px',
        color: index === 3 ? '#4ecdc4' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5);
      text.setDepth(2000);

      AudioService.play('countdown');

      this.tweens.add({
        targets: text,
        scale: 1.5,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          text.destroy();
          index++;
          if (index < countdownTexts.length) {
            this.time.delayedCall(300, showNext);
          }
        },
      });
    };

    showNext();
  }

  private initializeMiniGame(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const config = {
      scene: this,
      quota: this.quota,
      timer: this.gameTimer,
      screenWidth: width,
      screenHeight: height,
      onQuotaUpdate: (current: number, total: number) => {
        this.quotaMet = current;
        this.updateQuotaDisplay();
      },
      onTargetHit: (targetId: string, playerNumber: number, points: number, correct: boolean) => {
        this.handleTargetHit(targetId, playerNumber, points, correct);
      },
    };

    // Create the appropriate mini-game instance
    switch (this.miniGameId) {
      case 'color-target-blitz':
        this.currentMiniGame = new ColorTargetBlitz({ ...config, players: NetworkService.getPlayers() });
        break;
      case 'cuckoo-clock':
        this.currentMiniGame = new CuckooClock(config);
        break;
      case 'leaf-shooting':
        this.currentMiniGame = new LeafShooting(config);
        break;
      case 'skeleton-coffins':
        this.currentMiniGame = new SkeletonCoffins(config);
        break;
      case 'popup-animals':
        this.currentMiniGame = new PopupAnimals(config);
        break;
      case 'bullseye-targets':
        this.currentMiniGame = new BullseyeChallenge(config);
        break;
      case 'single-bullet':
        this.currentMiniGame = new SingleBulletChallenge(config);
        break;
      case 'target-range':
        this.currentMiniGame = new TargetRange(config);
        break;
      case 'cardboard-cop':
        this.currentMiniGame = new CardboardCopTraining(config);
        break;
      case 'wild-west':
        this.currentMiniGame = new WildWestShowdown(config);
        break;
      case 'number-sequence':
        this.currentMiniGame = new NumberSequence(config);
        break;
      case 'math-problems':
        this.currentMiniGame = new MathProblems(config);
        break;
      case 'keyboard-spelling':
        this.currentMiniGame = new KeyboardSpelling(config);
        break;
      case 'card-matching':
        this.currentMiniGame = new CardMatching(config);
        break;
      case 'sequence-recall':
        this.currentMiniGame = new SequenceRecall(config);
        break;
      case 'shape-matching':
        this.currentMiniGame = new ShapeMatching(config);
        break;
      case 'meteor-strike':
        this.currentMiniGame = new MeteorStrike(config);
        break;
      case 'treasure-chest':
        this.currentMiniGame = new TreasureChestBonus(config);
        break;
      case 'fireworks-finale':
        this.currentMiniGame = new FireworksFinale(config);
        break;
      default:
        // Default to color target blitz
        this.currentMiniGame = new ColorTargetBlitz({ ...config, players: NetworkService.getPlayers() });
    }
  }

  private drawQuotaBar(current: number, total: number): void {
    this.quotaBar.clear();

    const barWidth = 200;
    const barHeight = 20;
    const x = 50;
    const y = 100;

    // Background
    this.quotaBar.fillStyle(0x333333);
    this.quotaBar.fillRect(x, y, barWidth, barHeight);

    // Progress
    const progress = total > 0 ? Math.min(current / total, 1) : 0;
    const progressColor = progress >= 1 ? 0x4ecdc4 : 0xff6b6b;
    this.quotaBar.fillStyle(progressColor);
    this.quotaBar.fillRect(x, y, barWidth * progress, barHeight);

    // Border
    this.quotaBar.lineStyle(2, 0xffffff);
    this.quotaBar.strokeRect(x, y, barWidth, barHeight);
  }

  private updateQuotaDisplay(): void {
    this.quotaText.setText(`${this.quotaMet} / ${this.quota}`);
    this.drawQuotaBar(this.quotaMet, this.quota);

    if (this.quotaMet >= this.quota) {
      this.quotaText.setColor('#4ecdc4');
    }
  }

  private createPlayerScoreDisplay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const players = NetworkService.getPlayers();

    const startX = width / 2 - ((players.length - 1) * 150) / 2;
    const y = height - 60;

    players.forEach((player, index) => {
      const x = startX + index * 150;
      const color = PLAYER_COLORS[player.playerNumber as PlayerNumber];

      // Player box
      this.add.rectangle(x, y, 120, 50, parseInt(color.hex.replace('#', ''), 16), 0.3)
        .setStrokeStyle(2, parseInt(color.hex.replace('#', ''), 16));

      // Player label
      this.add.text(x, y - 12, `P${player.playerNumber}`, {
        fontFamily: 'Arial Black',
        fontSize: '16px',
        color: color.hex,
      }).setOrigin(0.5);

      // Score
      const scoreText = this.add.text(x, y + 10, '0', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.scoreDisplays.set(player.id, scoreText);
    });
  }

  private handleTargetHit(targetId: string, playerNumber: number, points: number, correct: boolean): void {
    const color = PLAYER_COLORS[playerNumber as PlayerNumber];

    // Play sound
    if (correct) {
      AudioService.play('hit');
    } else {
      AudioService.play('miss');
    }

    // Update player score display
    const players = NetworkService.getPlayers();
    const player = players.find((p) => p.playerNumber === playerNumber);
    if (player) {
      const scoreDisplay = this.scoreDisplays.get(player.id);
      if (scoreDisplay) {
        const currentScore = parseInt(scoreDisplay.text) || 0;
        scoreDisplay.setText((currentScore + points).toString());
      }
    }
  }

  private handleShoot(x: number, y: number, playerNumber: number): void {
    if (!this.currentMiniGame) return;

    // Check all targets for hit
    for (const [targetId, target] of (this.currentMiniGame as any).targets || new Map()) {
      if (!target || !target.active) continue;

      const hitRadius = target.getHitRadius ? target.getHitRadius() : 40;
      const dx = x - target.x;
      const dy = y - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= hitRadius) {
        // Hit detected - let the mini-game handle it
        this.processMiniGameHit(targetId, x, y, playerNumber);
        return;
      }
    }

    // Miss
    AudioService.play('miss');
  }

  private processMiniGameHit(targetId: string, x: number, y: number, playerNumber: number): void {
    const mg = this.currentMiniGame as any;

    // Call the appropriate hit handler based on mini-game type
    if (mg.handleClockHit) {
      mg.handleClockHit(targetId, playerNumber);
    } else if (mg.handleLeafHit) {
      mg.handleLeafHit(targetId);
    } else if (mg.handleSkeletonHit) {
      mg.handleSkeletonHit(targetId, playerNumber);
    } else if (mg.handleAnimalHit) {
      mg.handleAnimalHit(targetId, playerNumber);
    } else if (mg.handleBullseyeHit) {
      mg.handleBullseyeHit(targetId, x, y);
    } else if (mg.handleShot) {
      mg.handleShot(x, y);
    } else if (mg.handleRangeHit) {
      mg.handleRangeHit(targetId, x, y);
    } else if (mg.handleCardboardHit) {
      mg.handleCardboardHit(targetId, playerNumber);
    } else if (mg.handleWesternHit) {
      mg.handleWesternHit(targetId, playerNumber);
    } else if (mg.handleMathHit) {
      mg.handleMathHit(targetId, playerNumber);
    } else if (mg.handleLetterHit) {
      mg.handleLetterHit(targetId, playerNumber);
    } else if (mg.handleButtonHit) {
      mg.handleButtonHit(targetId, playerNumber);
    } else if (mg.handleShapeHit) {
      mg.handleShapeHit(targetId, playerNumber);
    } else if (mg.handleMeteorHit) {
      mg.handleMeteorHit(targetId);
    } else if (mg.handleChestHit) {
      mg.handleChestHit(targetId, playerNumber);
    } else if (mg.handleFireworkHit) {
      mg.handleFireworkHit(targetId, playerNumber);
    } else if (mg.handleTargetHit) {
      mg.handleTargetHit(targetId, playerNumber, 10, true);
    }
  }

  update(time: number, delta: number): void {
    // Update timer
    this.gameTimer -= delta;
    const timeDisplay = Math.max(0, Math.ceil(this.gameTimer / 1000));
    this.timerText.setText(timeDisplay.toString());

    if (timeDisplay <= 5) {
      this.timerText.setColor('#ff0000');
    } else {
      this.timerText.setColor('#ffffff');
    }

    // Check for time up
    if (this.gameTimer <= 0) {
      this.endGame();
      return;
    }

    // Update mini-game
    if (this.currentMiniGame) {
      this.currentMiniGame.update(delta);
    }

    // Update player cursors
    const players = NetworkService.getPlayers();
    this.updatePlayerCursors(players);

    // Handle shooting from players
    players.forEach((player) => {
      if (player.shooting) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const x = ((player.aimX + 1) / 2) * width;
        const y = ((player.aimY + 1) / 2) * height;
        this.handleShoot(x, y, player.playerNumber);
      }
    });
  }

  private endGame(): void {
    if (this.currentMiniGame) {
      this.currentMiniGame.destroy();
      this.currentMiniGame = null;
    }

    // Determine pass/fail
    const passed = this.quotaMet >= this.quota;

    // Send result to server
    NetworkService.sendMessage('stage-complete', {
      passed,
      quotaMet: this.quotaMet,
      quota: this.quota,
    });

    this.scene.start('ResultsScene', {
      passed,
      quotaMet: this.quotaMet,
      quota: this.quota,
      miniGameId: this.miniGameId,
    });
  }

  private updatePlayerCursors(players: PlayerData[]): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    for (const [id, cursor] of this.playerCursors) {
      if (!players.find((p) => p.id === id)) {
        cursor.destroy();
        this.playerCursors.delete(id);
      }
    }

    players.forEach((player) => {
      let cursor = this.playerCursors.get(player.id);

      if (!cursor) {
        cursor = this.createPlayerCursor(player);
        this.playerCursors.set(player.id, cursor);
      }

      const x = ((player.aimX + 1) / 2) * width;
      const y = ((player.aimY + 1) / 2) * height;
      cursor.setPosition(x, y);
    });
  }

  private createPlayerCursor(player: PlayerData): Phaser.GameObjects.Container {
    const color = PLAYER_COLORS[player.playerNumber as PlayerNumber];
    const colorNum = parseInt(color.hex.replace('#', ''), 16);

    const container = this.add.container(0, 0);
    const graphics = this.add.graphics();
    graphics.lineStyle(3, colorNum);
    graphics.moveTo(-30, 0);
    graphics.lineTo(-8, 0);
    graphics.moveTo(8, 0);
    graphics.lineTo(30, 0);
    graphics.moveTo(0, -30);
    graphics.lineTo(0, -8);
    graphics.moveTo(0, 8);
    graphics.lineTo(0, 30);
    graphics.strokeCircle(0, 0, 6);

    const label = this.add.text(15, -25, `P${player.playerNumber}`, {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: color.hex,
    });

    container.add([graphics, label]);
    container.setDepth(1000);

    return container;
  }

  shutdown(): void {
    if (this.currentMiniGame) {
      this.currentMiniGame.destroy();
      this.currentMiniGame = null;
    }
    this.playerCursors.forEach((cursor) => cursor.destroy());
    this.playerCursors.clear();
    this.scoreDisplays.clear();
  }
}
