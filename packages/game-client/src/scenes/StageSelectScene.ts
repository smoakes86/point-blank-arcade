import Phaser from 'phaser';
import { NetworkService, type PlayerData } from '../services/NetworkService';
import { MINI_GAMES, PLAYER_COLORS, type PlayerNumber } from '@point-blank/shared';

export class StageSelectScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private stageButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private playerCursors: Map<string, Phaser.GameObjects.Container> = new Map();
  private timer: number = 10;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private availableStages: string[] = [];

  constructor() {
    super({ key: 'StageSelectScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Get available stages from state
    const state = NetworkService.getState();
    this.availableStages = state?.availableStages || MINI_GAMES.slice(0, 4).map((g) => g.id);

    // Title
    this.add.text(width / 2, 80, 'SELECT STAGE', {
      fontFamily: 'Arial Black',
      fontSize: '56px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Progress indicator
    const completed = state?.stagesCompleted.length || 0;
    const total = 16;
    this.add.text(width / 2, 140, `Stage ${completed + 1} of ${total}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(width / 2, 200, '10', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ff6b6b',
    }).setOrigin(0.5);

    // Stage buttons (2x2 grid)
    const gridStartX = width / 2 - 300;
    const gridStartY = 400;
    const spacingX = 400;
    const spacingY = 280;

    this.availableStages.forEach((stageId, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = gridStartX + col * spacingX;
      const y = gridStartY + row * spacingY;

      const miniGame = MINI_GAMES.find((g) => g.id === stageId);
      if (miniGame) {
        const button = this.createStageButton(x, y, miniGame);
        this.stageButtons.set(stageId, button);
      }
    });

    // Instructions
    this.add.text(width / 2, height - 60, 'SHOOT to select stage!', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5);

    // Start timer
    this.timer = 10;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Listen for phase changes
    NetworkService.onMessage('phase-changed', (data: unknown) => {
      const { phase } = data as { phase: string };
      if (phase === 'playing') {
        this.scene.start('GameScene');
      }
    });

    NetworkService.onStateChange((state) => {
      if (state.phase === 'playing') {
        this.scene.start('GameScene');
      }
    });
  }

  private createStageButton(
    x: number,
    y: number,
    miniGame: { id: string; name: string; category: string; instructions: string }
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Category colors
    const categoryColors: Record<string, number> = {
      speed: 0xff6b6b,
      accuracy: 0x4ecdc4,
      simulation: 0xf9ca24,
      intelligence: 0x6c5ce7,
      memory: 0xa29bfe,
      visual: 0xfd79a8,
      special: 0x00cec9,
    };

    const color = categoryColors[miniGame.category] || 0x666666;

    // Background
    const bg = this.add.rectangle(0, 0, 350, 220, color, 0.2);
    bg.setStrokeStyle(3, color);

    // Category badge
    const badge = this.add.rectangle(0, -80, 120, 30, color, 1);
    const categoryText = this.add.text(0, -80, miniGame.category.toUpperCase(), {
      fontFamily: 'Arial Black',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Stage name
    const nameText = this.add.text(0, -20, miniGame.name, {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Instructions
    const instructionText = this.add.text(0, 40, miniGame.instructions, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 300 },
    }).setOrigin(0.5);

    container.add([bg, badge, categoryText, nameText, instructionText]);

    // Interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(color, 0.4));
    bg.on('pointerout', () => bg.setFillStyle(color, 0.2));
    bg.on('pointerdown', () => this.selectStage(miniGame.id));

    container.setData('stageId', miniGame.id);

    return container;
  }

  private updateTimer(): void {
    this.timer--;
    this.timerText.setText(this.timer.toString());

    if (this.timer <= 3) {
      this.timerText.setColor('#ff0000');
      this.timerText.setScale(1.2);
      this.time.delayedCall(100, () => this.timerText.setScale(1));
    }

    if (this.timer <= 0) {
      // Auto-select first available stage
      if (this.availableStages.length > 0) {
        this.selectStage(this.availableStages[0]);
      }
    }
  }

  private selectStage(stageId: string): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    const button = this.stageButtons.get(stageId);
    if (button) {
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 200,
        yoyo: true,
      });
    }

    NetworkService.selectStage(stageId);
  }

  update(): void {
    const players = NetworkService.getPlayers();
    this.updatePlayerCursors(players);
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
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
    this.playerCursors.forEach((cursor) => cursor.destroy());
    this.playerCursors.clear();
  }
}
