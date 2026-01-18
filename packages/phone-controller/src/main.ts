import { Client, Room } from 'colyseus.js';
import { PLAYER_COLORS, type PlayerNumber } from '@point-blank/shared';
import { GyroscopeService } from './services/GyroscopeService.js';

// Auto-detect server URL based on current host
function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  // In production, connect to the main server (remove /controller path)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  return 'ws://localhost:3001';
}

const SERVER_URL = getServerUrl();

class PhoneController {
  private client: Client;
  private room: Room | null = null;
  private gyroscope: GyroscopeService;

  private playerNumber: PlayerNumber | null = null;
  private playerColor: string = '#ffffff';
  private score: number = 0;
  private lives: number = 3;

  // DOM Elements
  private screens: Record<string, HTMLElement>;
  private elements: Record<string, HTMLElement>;

  constructor() {
    this.client = new Client(SERVER_URL);
    this.gyroscope = new GyroscopeService();

    this.screens = {
      join: document.getElementById('join-screen')!,
      waiting: document.getElementById('waiting-screen')!,
      controller: document.getElementById('controller-screen')!,
      permission: document.getElementById('permission-screen')!,
    };

    this.elements = {
      roomCodeInput: document.getElementById('room-code-input')!,
      playerNameInput: document.getElementById('player-name-input')!,
      joinBtn: document.getElementById('join-btn')!,
      joinError: document.getElementById('join-error')!,
      calibrateBtn: document.getElementById('calibrate-btn')!,
      permissionBtn: document.getElementById('permission-btn')!,
      playerColorIndicator: document.getElementById('player-color-indicator')!,
      playerInfo: document.getElementById('player-info')!,
      crosshair: document.getElementById('crosshair')!,
      crosshairContainer: document.getElementById('crosshair-container')!,
      shootArea: document.getElementById('shoot-area')!,
      scoreDisplay: document.getElementById('score-display')!,
      livesDisplay: document.getElementById('lives-display')!,
    };

    this.init();
  }

  private async init() {
    // Check for room code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
      (this.elements.roomCodeInput as HTMLInputElement).value = roomCode.toUpperCase();
    }

    // Setup event listeners
    this.elements.joinBtn.addEventListener('click', () => this.joinRoom());
    this.elements.calibrateBtn.addEventListener('click', () => this.calibrate());
    this.elements.permissionBtn.addEventListener('click', () => this.requestPermission());

    // Enter key to join
    this.elements.roomCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });
    this.elements.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });

    // Shoot area touch handling
    this.elements.shootArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.shoot();
    });
    this.elements.shootArea.addEventListener('mousedown', () => this.shoot());

    // Check if gyroscope needs permission (iOS)
    if (this.gyroscope.needsPermission()) {
      // Will show permission screen after joining
    }
  }

  private showScreen(screenName: string) {
    Object.values(this.screens).forEach((screen) => {
      screen.classList.remove('active');
    });
    this.screens[screenName]?.classList.add('active');
  }

  private async joinRoom() {
    const roomCode = (this.elements.roomCodeInput as HTMLInputElement).value
      .toUpperCase()
      .trim();
    const playerName = (this.elements.playerNameInput as HTMLInputElement).value.trim() || 'Player';

    if (roomCode.length !== 4) {
      this.elements.joinError.textContent = 'Room code must be 4 characters';
      return;
    }

    try {
      this.elements.joinError.textContent = '';
      (this.elements.joinBtn as HTMLButtonElement).disabled = true;

      this.room = await this.client.joinById(roomCode.toLowerCase(), {
        playerName,
      });

      this.setupRoomListeners();
    } catch (error) {
      console.error('Failed to join room:', error);
      this.elements.joinError.textContent = 'Failed to join. Check room code.';
      (this.elements.joinBtn as HTMLButtonElement).disabled = false;
    }
  }

  private setupRoomListeners() {
    if (!this.room) return;

    this.room.onMessage('assigned-player', (data) => {
      this.playerNumber = data.playerNumber;
      this.playerColor = data.color;

      this.elements.playerColorIndicator.style.backgroundColor = data.color;
      this.elements.playerColorIndicator.style.color = data.color;
      this.elements.playerInfo.textContent = `Player ${data.playerNumber} - ${data.colorName}`;
      this.elements.crosshair.style.color = data.color;

      // Check if we need gyroscope permission
      if (this.gyroscope.needsPermission()) {
        this.showScreen('permission');
      } else {
        this.startGyroscope();
        this.showScreen('waiting');
      }
    });

    this.room.onMessage('phase-changed', (data) => {
      if (data.phase === 'playing') {
        this.showScreen('controller');
      } else if (data.phase === 'lobby' || data.phase === 'mode-select' || data.phase === 'stage-select') {
        this.showScreen('waiting');
      }
    });

    this.room.onMessage('shoot-feedback', (data) => {
      if (data.hit) {
        this.elements.crosshair.classList.add('hit-pulse');
        setTimeout(() => this.elements.crosshair.classList.remove('hit-pulse'), 200);

        if (data.points) {
          this.score += data.points;
          this.updateDisplay();
        }
      }

      if (data.penalty) {
        // Vibrate for wrong target
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    });

    this.room.onMessage('score-update', (data) => {
      if (this.room && data.playerId === this.room.sessionId) {
        this.score = data.score;
        this.updateDisplay();
      }
    });

    this.room.onMessage('lives-update', (data) => {
      if (this.room && data.playerId === this.room.sessionId) {
        this.lives = data.lives;
        this.updateDisplay();
      }
    });

    this.room.onMessage('error', (data) => {
      this.elements.joinError.textContent = data.message;
      (this.elements.joinBtn as HTMLButtonElement).disabled = false;
    });

    this.room.onLeave(() => {
      this.showScreen('join');
      this.elements.joinError.textContent = 'Disconnected from room';
      (this.elements.joinBtn as HTMLButtonElement).disabled = false;
    });
  }

  private async requestPermission() {
    const granted = await this.gyroscope.requestPermission();
    if (granted) {
      this.startGyroscope();
      this.showScreen('waiting');
    } else {
      alert('Motion permission is required to play. Please allow access and try again.');
    }
  }

  private startGyroscope() {
    this.gyroscope.start((x, y) => {
      this.updateCrosshair(x, y);
      this.sendAim(x, y);
    });
  }

  private calibrate() {
    this.gyroscope.calibrate();

    // Visual feedback
    this.elements.calibrateBtn.textContent = 'CALIBRATED!';
    setTimeout(() => {
      this.elements.calibrateBtn.textContent = 'CALIBRATE';
    }, 1000);
  }

  private updateCrosshair(x: number, y: number) {
    const container = this.elements.crosshairContainer;
    const crosshair = this.elements.crosshair;

    // Map -1 to 1 range to container bounds
    const containerRect = container.getBoundingClientRect();
    const posX = ((x + 1) / 2) * containerRect.width;
    const posY = ((y + 1) / 2) * containerRect.height;

    crosshair.style.left = `${posX}px`;
    crosshair.style.top = `${posY}px`;
  }

  private sendAim(x: number, y: number) {
    if (this.room) {
      this.room.send('aim', { x, y });
    }
  }

  private shoot() {
    if (!this.room) return;

    const aim = this.gyroscope.getCurrentAim();
    this.room.send('shoot', { x: aim.x, y: aim.y, timestamp: Date.now() });

    // Visual feedback
    this.elements.shootArea.classList.add('shoot-flash');
    setTimeout(() => this.elements.shootArea.classList.remove('shoot-flash'), 150);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  private updateDisplay() {
    this.elements.scoreDisplay.textContent = `Score: ${this.score}`;
    this.elements.livesDisplay.textContent = '❤️'.repeat(this.lives);
  }
}

// Start the controller
new PhoneController();
