import { Room, Client } from '@colyseus/core';
import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import {
  PLAYER_COLORS,
  MAX_PLAYERS,
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  INITIAL_LIVES,
  MODE_CONFIGS,
  MINI_GAMES,
  SCORE_VALUES,
  type PlayerNumber,
  type GameMode,
  type GamePhase,
} from '@point-blank/shared';

// Schema classes for Colyseus state synchronization
class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('number') playerNumber: number = 0;
  @type('string') name: string = '';
  @type('number') aimX: number = 0;
  @type('number') aimY: number = 0;
  @type('number') score: number = 0;
  @type('number') lives: number = INITIAL_LIVES;
  @type('boolean') connected: boolean = true;
  @type('boolean') ready: boolean = false;
}

class TargetSchema extends Schema {
  @type('string') id: string = '';
  @type('string') targetType: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') width: number = 50;
  @type('number') height: number = 50;
  @type('boolean') active: boolean = true;
  @type('number') ownerPlayerNumber: number = 0;
  @type('number') points: number = 50;
}

class GameStateSchema extends Schema {
  @type('string') roomCode: string = '';
  @type('string') phase: string = 'lobby';
  @type('string') mode: string = '';
  @type('number') currentStage: number = 0;
  @type('string') currentMiniGame: string = '';

  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type([TargetSchema]) targets = new ArraySchema<TargetSchema>();

  @type('number') timer: number = 0;
  @type('number') quota: number = 0;
  @type('number') quotaMet: number = 0;

  @type(['string']) stagesCompleted = new ArraySchema<string>();
  @type(['string']) availableStages = new ArraySchema<string>();

  @type('string') hostPlayerId: string = '';
}

export class GameRoom extends Room<GameStateSchema> {
  maxClients = MAX_PLAYERS + 1; // 4 phone controllers + 1 game display
  private gameLoopInterval: ReturnType<typeof setInterval> | null = null;
  private usedPlayerNumbers: Set<number> = new Set();

  onCreate() {
    this.setState(new GameStateSchema());
    this.state.roomCode = this.generateRoomCode();

    console.log(`🎮 Room created: ${this.state.roomCode}`);

    // Set up message handlers
    this.setupMessageHandlers();
  }

  private generateRoomCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS.charAt(
        Math.floor(Math.random() * ROOM_CODE_CHARS.length)
      );
    }
    return code;
  }

  private getNextPlayerNumber(): PlayerNumber | null {
    for (let i = 1; i <= MAX_PLAYERS; i++) {
      if (!this.usedPlayerNumbers.has(i)) {
        return i as PlayerNumber;
      }
    }
    return null;
  }

  private setupMessageHandlers() {
    // Handle aim updates from phone controllers
    this.onMessage('aim', (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.aimX = Math.max(-1, Math.min(1, data.x));
        player.aimY = Math.max(-1, Math.min(1, data.y));
      }
    });

    // Handle shoot events
    this.onMessage('shoot', (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || this.state.phase !== 'playing') return;

      this.handleShoot(client, player, data.x, data.y);
    });

    // Handle player ready
    this.onMessage('ready', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.ready = true;
        this.checkAllPlayersReady();
      }
    });

    // Handle mode selection (from host)
    this.onMessage('select-mode', (client, data: { mode: GameMode }) => {
      if (client.sessionId === this.state.hostPlayerId) {
        this.setGameMode(data.mode);
      }
    });

    // Handle stage selection (from host)
    this.onMessage('select-stage', (client, data: { stageId: string }) => {
      if (client.sessionId === this.state.hostPlayerId) {
        this.selectStage(data.stageId);
      }
    });

    // Handle start game
    this.onMessage('start-game', (client) => {
      if (client.sessionId === this.state.hostPlayerId) {
        this.startModeSelection();
      }
    });

    // Handle join as game display (host)
    this.onMessage('join-as-host', (client) => {
      if (!this.state.hostPlayerId) {
        this.state.hostPlayerId = client.sessionId;
        client.send('host-assigned', { roomCode: this.state.roomCode });
        console.log(`🖥️ Host joined: ${client.sessionId}`);
      }
    });
  }

  onJoin(client: Client, options: { playerName?: string; isHost?: boolean }) {
    console.log(`👤 Client joined: ${client.sessionId}`);

    if (options.isHost) {
      // Game display joining as host
      if (!this.state.hostPlayerId) {
        this.state.hostPlayerId = client.sessionId;
        client.send('host-assigned', { roomCode: this.state.roomCode });
      }
      return;
    }

    // Phone controller joining as player
    const playerNumber = this.getNextPlayerNumber();
    if (!playerNumber) {
      client.send('error', { message: 'Room is full' });
      client.leave();
      return;
    }

    this.usedPlayerNumbers.add(playerNumber);

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.playerNumber = playerNumber;
    player.name = options.playerName || `Player ${playerNumber}`;
    player.lives = INITIAL_LIVES;
    player.score = 0;

    this.state.players.set(client.sessionId, player);

    const color = PLAYER_COLORS[playerNumber];
    client.send('assigned-player', {
      playerNumber,
      color: color.hex,
      colorName: color.name,
    });

    this.broadcast('player-joined', {
      playerId: client.sessionId,
      playerNumber,
      name: player.name,
      color: color.hex,
    });
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.usedPlayerNumbers.delete(player.playerNumber);
      this.state.players.delete(client.sessionId);

      this.broadcast('player-left', { playerId: client.sessionId });
      console.log(`👋 Player left: ${client.sessionId}`);
    }

    if (client.sessionId === this.state.hostPlayerId) {
      this.state.hostPlayerId = '';
      console.log(`🖥️ Host left`);
    }
  }

  onDispose() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    console.log(`🗑️ Room disposed: ${this.state.roomCode}`);
  }

  // Game flow methods
  private checkAllPlayersReady() {
    const players = Array.from(this.state.players.values());
    if (players.length > 0 && players.every((p) => p.ready)) {
      // All players ready
      this.broadcast('all-ready', {});
    }
  }

  private startModeSelection() {
    this.state.phase = 'mode-select';
    this.state.timer = 20; // MODE_SELECT_TIME
    this.broadcast('phase-changed', { phase: 'mode-select' });
  }

  private setGameMode(mode: GameMode) {
    const config = MODE_CONFIGS[mode];
    if (!config) return;

    this.state.mode = mode;
    this.state.phase = 'stage-select';

    // Set up available stages (first group of 4)
    this.updateAvailableStages();

    this.broadcast('phase-changed', {
      phase: 'stage-select',
      mode,
      config,
    });
  }

  private updateAvailableStages() {
    const completedCount = this.state.stagesCompleted.length;
    const groupStart = Math.floor(completedCount / 4) * 4;

    this.state.availableStages.clear();
    for (let i = groupStart; i < groupStart + 4 && i < MINI_GAMES.length; i++) {
      if (!this.state.stagesCompleted.includes(MINI_GAMES[i].id)) {
        this.state.availableStages.push(MINI_GAMES[i].id);
      }
    }
  }

  private selectStage(stageId: string) {
    const miniGame = MINI_GAMES.find((g) => g.id === stageId);
    if (!miniGame) return;

    this.state.currentMiniGame = stageId;
    this.state.phase = 'playing';

    const modeConfig = MODE_CONFIGS[this.state.mode as GameMode] || MODE_CONFIGS.beginner;
    this.state.quota = Math.ceil(miniGame.baseQuota * modeConfig.quotaMultiplier);
    this.state.timer = Math.ceil(miniGame.baseTime * modeConfig.timeMultiplier);
    this.state.quotaMet = 0;

    // Clear previous targets
    this.state.targets.clear();

    this.broadcast('phase-changed', {
      phase: 'playing',
      miniGame: miniGame,
      quota: this.state.quota,
      timer: this.state.timer,
    });

    // Start game loop
    this.startGameLoop();
  }

  private startGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }

    this.gameLoopInterval = setInterval(() => {
      if (this.state.phase !== 'playing') {
        if (this.gameLoopInterval) {
          clearInterval(this.gameLoopInterval);
          this.gameLoopInterval = null;
        }
        return;
      }

      // Update timer
      this.state.timer -= 0.1;

      if (this.state.timer <= 0) {
        this.endStage();
      }

      // Spawn targets based on current mini-game
      this.updateMiniGame();
    }, 100); // 10 updates per second
  }

  private updateMiniGame() {
    // Base target spawning logic for Color Target Blitz
    if (this.state.currentMiniGame === 'color-target-blitz') {
      this.updateColorTargetBlitz();
    }
  }

  private updateColorTargetBlitz() {
    // Keep a certain number of targets on screen
    const activeTargets = this.state.targets.filter((t) => t.active);
    const playerCount = this.state.players.size;
    const targetCount = Math.max(4, playerCount * 2);

    while (activeTargets.length < targetCount) {
      this.spawnColorTarget();
    }
  }

  private spawnColorTarget() {
    const players = Array.from(this.state.players.values());
    if (players.length === 0) return;

    // Pick a random player to assign the target to
    const player = players[Math.floor(Math.random() * players.length)];

    const target = new TargetSchema();
    target.id = `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    target.targetType = 'color-target';
    target.x = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
    target.y = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
    target.width = 60;
    target.height = 60;
    target.ownerPlayerNumber = player.playerNumber;
    target.points = SCORE_VALUES.TARGET_HIT;
    target.active = true;

    this.state.targets.push(target);

    this.broadcast('target-spawned', {
      id: target.id,
      type: target.targetType,
      x: target.x,
      y: target.y,
      ownerPlayerNumber: target.ownerPlayerNumber,
      color: PLAYER_COLORS[target.ownerPlayerNumber as PlayerNumber].hex,
    });
  }

  private handleShoot(client: Client, player: PlayerSchema, x: number, y: number) {
    // Find target at position
    const hitTarget = this.state.targets.find((t) => {
      if (!t.active) return false;

      // Simple bounding box check (normalized coordinates)
      const halfWidth = (t.width / 1920) / 2; // Assuming 1920 base width
      const halfHeight = (t.height / 1080) / 2;

      return (
        x >= t.x - halfWidth &&
        x <= t.x + halfWidth &&
        y >= t.y - halfHeight &&
        y <= t.y + halfHeight
      );
    });

    if (hitTarget) {
      const isOwnTarget = hitTarget.ownerPlayerNumber === player.playerNumber;

      if (isOwnTarget) {
        // Correct hit
        player.score += hitTarget.points;
        this.state.quotaMet++;
        hitTarget.active = false;

        this.broadcast('target-hit', {
          targetId: hitTarget.id,
          playerId: player.id,
          playerNumber: player.playerNumber,
          points: hitTarget.points,
          correct: true,
        });

        client.send('shoot-feedback', { hit: true, points: hitTarget.points });
      } else {
        // Wrong target - penalty
        player.score += SCORE_VALUES.WRONG_TARGET;

        this.broadcast('target-hit', {
          targetId: hitTarget.id,
          playerId: player.id,
          playerNumber: player.playerNumber,
          points: SCORE_VALUES.WRONG_TARGET,
          correct: false,
        });

        client.send('shoot-feedback', { hit: false, penalty: true });
      }

      // Remove target
      const idx = this.state.targets.findIndex((t) => t.id === hitTarget.id);
      if (idx >= 0) {
        this.state.targets.splice(idx, 1);
      }
    } else {
      client.send('shoot-feedback', { hit: false });
    }
  }

  private endStage() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    const passed = this.state.quotaMet >= this.state.quota;

    // Update lives for players who didn't meet quota
    if (!passed) {
      this.state.players.forEach((player) => {
        player.lives = Math.max(0, player.lives - 1);
      });
    }

    // Mark stage as completed
    if (this.state.currentMiniGame) {
      this.state.stagesCompleted.push(this.state.currentMiniGame);
    }

    this.state.phase = 'results';

    const result = {
      miniGameId: this.state.currentMiniGame,
      passed,
      quotaMet: this.state.quotaMet,
      quotaRequired: this.state.quota,
      playerScores: {} as Record<string, number>,
    };

    this.state.players.forEach((player, id) => {
      result.playerScores[id] = player.score;
    });

    this.broadcast('stage-complete', result);

    // Check for game over
    const allDead = Array.from(this.state.players.values()).every(
      (p) => p.lives <= 0
    );

    if (allDead) {
      this.state.phase = 'game-over';
      this.broadcast('game-over', {
        finalScores: result.playerScores,
      });
    }
  }
}
