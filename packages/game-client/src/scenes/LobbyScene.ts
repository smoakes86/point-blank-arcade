import Phaser from 'phaser';
import { NetworkService, type PlayerData } from '../services/NetworkService';
import { PLAYER_COLORS, type PlayerNumber } from '@point-blank/shared';

export class LobbyScene extends Phaser.Scene {
  private roomCodeText!: Phaser.GameObjects.Text;
  private joinUrlText!: Phaser.GameObjects.Text;
  private playersContainer!: Phaser.GameObjects.Container;
  private startButton!: Phaser.GameObjects.Container;
  private playerCursors: Map<string, Phaser.GameObjects.Container> = new Map();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add.text(width / 2, 80, 'POINT BLANK', {
      fontFamily: 'Arial Black',
      fontSize: '72px',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Room code display
    const roomCode = NetworkService.getRoomCode().toUpperCase();

    this.add.text(width / 2, 180, 'ROOM CODE', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.roomCodeText = this.add.text(width / 2, 240, roomCode, {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ffffff',
      letterSpacing: 16,
    }).setOrigin(0.5);

    // QR Code placeholder
    const qrBox = this.add.rectangle(width / 2, 400, 200, 200, 0x333333);
    this.add.text(width / 2, 400, 'QR CODE\n(Coming Soon)', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#666666',
      align: 'center',
    }).setOrigin(0.5);

    // Join URL
    const joinUrl = `${window.location.origin.replace(':3002', ':3003')}/controller?room=${roomCode}`;
    this.joinUrlText = this.add.text(width / 2, 530, joinUrl, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#4ecdc4',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, 580, 'Scan QR code or visit URL on your phone to join', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#888888',
    }).setOrigin(0.5);

    // Players container
    this.add.text(width / 2, 660, 'PLAYERS', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.playersContainer = this.add.container(width / 2, 720);

    // Start button
    this.startButton = this.createStartButton(width / 2, 900);
    this.startButton.setAlpha(0.5);

    // Player cursors layer (on top of everything)
    // Will be updated in the update loop

    // Subscribe to state changes
    this.unsubscribe = NetworkService.onStateChange((state) => {
      // Update room code when state syncs (fixes race condition on initial load)
      if (state.roomCode && state.roomCode !== this.roomCodeText.text) {
        this.roomCodeText.setText(state.roomCode.toUpperCase());
        // Update join URL too
        const joinUrl = `${window.location.origin.replace(':3002', ':3003')}/controller?room=${state.roomCode.toUpperCase()}`;
        this.joinUrlText?.setText(joinUrl);
      }
      if (state.phase === 'mode-select') {
        this.scene.start('ModeSelectScene');
      }
    });

    // Also listen for phase changes via messages
    NetworkService.onMessage('phase-changed', (data: unknown) => {
      const { phase } = data as { phase: string };
      if (phase === 'mode-select') {
        this.scene.start('ModeSelectScene');
      }
    });
  }

  private createStartButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 70, 0x4ecdc4, 1);
    bg.setStrokeStyle(4, 0xffffff);

    const text = this.add.text(0, 0, 'START GAME', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg, text]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      if (container.alpha === 1) {
        bg.setFillStyle(0x5dddd5);
      }
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x4ecdc4);
    });
    bg.on('pointerdown', () => {
      if (container.alpha === 1) {
        NetworkService.startGame();
      }
    });

    return container;
  }

  update(): void {
    const players = NetworkService.getPlayers();

    // Update player list
    this.updatePlayerList(players);

    // Update player cursors
    this.updatePlayerCursors(players);

    // Enable start button if at least 1 player
    if (players.length > 0) {
      this.startButton.setAlpha(1);
    } else {
      this.startButton.setAlpha(0.5);
    }
  }

  private updatePlayerList(players: PlayerData[]): void {
    this.playersContainer.removeAll(true);

    const startX = -300;
    const spacing = 200;

    players.forEach((player, index) => {
      const x = startX + index * spacing;
      const color = PLAYER_COLORS[player.playerNumber as PlayerNumber];

      // Player box
      const box = this.add.rectangle(x, 0, 150, 80,
        parseInt(color.hex.replace('#', ''), 16), 0.3);
      box.setStrokeStyle(3, parseInt(color.hex.replace('#', ''), 16));

      // Player number
      const numText = this.add.text(x, -15, `P${player.playerNumber}`, {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: color.hex,
      }).setOrigin(0.5);

      // Player name
      const nameText = this.add.text(x, 20, player.name, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5);

      this.playersContainer.add([box, numText, nameText]);
    });
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

    // Update or create cursors for connected players
    players.forEach((player) => {
      let cursor = this.playerCursors.get(player.id);

      if (!cursor) {
        cursor = this.createPlayerCursor(player);
        this.playerCursors.set(player.id, cursor);
      }

      // Convert normalized aim (-1 to 1) to screen coordinates
      const x = ((player.aimX + 1) / 2) * width;
      const y = ((player.aimY + 1) / 2) * height;

      cursor.setPosition(x, y);
    });
  }

  private createPlayerCursor(player: PlayerData): Phaser.GameObjects.Container {
    const color = PLAYER_COLORS[player.playerNumber as PlayerNumber];
    const colorNum = parseInt(color.hex.replace('#', ''), 16);

    const container = this.add.container(0, 0);

    // Crosshair
    const size = 30;
    const graphics = this.add.graphics();
    graphics.lineStyle(3, colorNum);

    // Horizontal line
    graphics.moveTo(-size, 0);
    graphics.lineTo(-8, 0);
    graphics.moveTo(8, 0);
    graphics.lineTo(size, 0);

    // Vertical line
    graphics.moveTo(0, -size);
    graphics.lineTo(0, -8);
    graphics.moveTo(0, 8);
    graphics.lineTo(0, size);

    // Circle
    graphics.strokeCircle(0, 0, 6);

    // Player number label
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
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.playerCursors.forEach((cursor) => cursor.destroy());
    this.playerCursors.clear();
  }
}
