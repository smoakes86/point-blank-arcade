import Phaser from 'phaser';
import { NetworkService, type PlayerData } from '../services/NetworkService';
import { MODE_CONFIGS, PLAYER_COLORS, type GameMode, type PlayerNumber } from '@point-blank/shared';

export class ModeSelectScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private modeButtons: Map<GameMode, Phaser.GameObjects.Container> = new Map();
  private playerCursors: Map<string, Phaser.GameObjects.Container> = new Map();
  private timer: number = 20;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'ModeSelectScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add.text(width / 2, 80, 'SELECT DIFFICULTY', {
      fontFamily: 'Arial Black',
      fontSize: '56px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(width / 2, 160, '20', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ff6b6b',
    }).setOrigin(0.5);

    // Mode buttons
    const modes: GameMode[] = ['training', 'beginner', 'expert', 'veryhard'];
    const buttonY = 400;
    const spacing = 400;
    const startX = width / 2 - ((modes.length - 1) * spacing) / 2;

    modes.forEach((mode, index) => {
      const x = startX + index * spacing;
      const button = this.createModeButton(x, buttonY, mode);
      this.modeButtons.set(mode, button);
    });

    // Instructions
    this.add.text(width / 2, height - 100, 'SHOOT to select difficulty!', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#888888',
    }).setOrigin(0.5);

    // Start countdown timer
    this.timer = 20;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Listen for phase changes
    NetworkService.onMessage('phase-changed', (data: unknown) => {
      const { phase } = data as { phase: string };
      if (phase === 'stage-select') {
        this.scene.start('StageSelectScene');
      }
    });

    NetworkService.onStateChange((state) => {
      if (state.phase === 'stage-select') {
        this.scene.start('StageSelectScene');
      }
    });
  }

  private createModeButton(x: number, y: number, mode: GameMode): Phaser.GameObjects.Container {
    const config = MODE_CONFIGS[mode];
    const container = this.add.container(x, y);

    // Colors based on difficulty
    const colors: Record<GameMode, number> = {
      training: 0x4ecdc4,
      beginner: 0x45b7d1,
      expert: 0xf9ca24,
      veryhard: 0xff6b6b,
    };

    const color = colors[mode];

    // Background
    const bg = this.add.rectangle(0, 0, 320, 400, color, 0.2);
    bg.setStrokeStyle(4, color);

    // Mode name
    const nameText = this.add.text(0, -140, config.name.toUpperCase(), {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Stages info
    const stagesText = this.add.text(0, -60, `${config.stages} STAGES`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Difficulty indicator
    const difficultyBars = this.add.container(0, 20);
    const barCount = mode === 'training' ? 1 : mode === 'beginner' ? 2 : mode === 'expert' ? 3 : 4;

    for (let i = 0; i < 4; i++) {
      const barColor = i < barCount ? color : 0x333333;
      const bar = this.add.rectangle(-60 + i * 40, 0, 30, 60, barColor);
      difficultyBars.add(bar);
    }

    // Description
    const descriptions: Record<GameMode, string> = {
      training: 'Learn the basics',
      beginner: 'Standard challenge',
      expert: 'For skilled players',
      veryhard: 'Maximum difficulty!',
    };

    const descText = this.add.text(0, 120, descriptions[mode], {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, nameText, stagesText, difficultyBars, descText]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(color, 0.4));
    bg.on('pointerout', () => bg.setFillStyle(color, 0.2));
    bg.on('pointerdown', () => {
      this.selectMode(mode);
    });

    // Store bounds for hit detection
    container.setData('bounds', {
      x: x - 160,
      y: y - 200,
      width: 320,
      height: 400,
    });
    container.setData('mode', mode);

    return container;
  }

  private updateTimer(): void {
    this.timer--;
    this.timerText.setText(this.timer.toString());

    if (this.timer <= 5) {
      this.timerText.setColor('#ff0000');
      this.timerText.setScale(1.2);
      this.time.delayedCall(100, () => this.timerText.setScale(1));
    }

    if (this.timer <= 0) {
      // Auto-select beginner if time runs out
      this.selectMode('beginner');
    }
  }

  private selectMode(mode: GameMode): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // Visual feedback
    const button = this.modeButtons.get(mode);
    if (button) {
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 200,
        yoyo: true,
      });
    }

    NetworkService.selectMode(mode);
  }

  update(): void {
    const players = NetworkService.getPlayers();
    this.updatePlayerCursors(players);
  }

  private updatePlayerCursors(players: PlayerData[]): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Remove cursors for disconnected players
    for (const [id, cursor] of this.playerCursors) {
      if (!players.find((p) => p.id === id)) {
        cursor.destroy();
        this.playerCursors.delete(id);
      }
    }

    // Update or create cursors
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
    const size = 30;
    const graphics = this.add.graphics();
    graphics.lineStyle(3, colorNum);
    graphics.moveTo(-size, 0);
    graphics.lineTo(-8, 0);
    graphics.moveTo(8, 0);
    graphics.lineTo(size, 0);
    graphics.moveTo(0, -size);
    graphics.lineTo(0, -8);
    graphics.moveTo(0, 8);
    graphics.lineTo(0, size);
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
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
    this.playerCursors.forEach((cursor) => cursor.destroy());
    this.playerCursors.clear();
  }
}
