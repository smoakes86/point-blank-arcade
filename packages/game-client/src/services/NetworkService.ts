import { Client, Room } from 'colyseus.js';
import type { GameMode } from '@point-blank/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001';

export interface PlayerData {
  id: string;
  playerNumber: number;
  name: string;
  aimX: number;
  aimY: number;
  score: number;
  lives: number;
  connected: boolean;
  ready: boolean;
}

export interface TargetData {
  id: string;
  targetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  ownerPlayerNumber: number;
  points: number;
}

export interface GameStateData {
  roomCode: string;
  phase: string;
  mode: string;
  currentStage: number;
  currentMiniGame: string;
  timer: number;
  quota: number;
  quotaMet: number;
  stagesCompleted: string[];
  availableStages: string[];
  hostPlayerId: string;
}

type MessageCallback = (data: unknown) => void;

class NetworkServiceClass {
  private client: Client;
  private room: Room | null = null;
  private messageHandlers: Map<string, Set<MessageCallback>> = new Map();
  private stateChangeCallbacks: Set<(state: GameStateData) => void> = new Set();

  constructor() {
    this.client = new Client(SERVER_URL);
  }

  async createRoom(): Promise<string> {
    try {
      this.room = await this.client.create('game', { isHost: true });
      this.setupRoomListeners();
      return this.room.id;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    try {
      this.room = await this.client.joinById(roomId, { isHost: true });
      this.setupRoomListeners();
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  private setupRoomListeners(): void {
    if (!this.room) return;

    this.room.onStateChange((state) => {
      const gameState = this.extractGameState(state);
      this.stateChangeCallbacks.forEach((cb) => cb(gameState));
    });

    this.room.onMessage('*', (type, message) => {
      const handlers = this.messageHandlers.get(type as string);
      if (handlers) {
        handlers.forEach((handler) => handler(message));
      }
    });

    this.room.onLeave(() => {
      console.log('Left room');
    });
  }

  private extractGameState(state: unknown): GameStateData {
    const s = state as Record<string, unknown>;
    return {
      roomCode: (s.roomCode as string) || '',
      phase: (s.phase as string) || 'lobby',
      mode: (s.mode as string) || '',
      currentStage: (s.currentStage as number) || 0,
      currentMiniGame: (s.currentMiniGame as string) || '',
      timer: (s.timer as number) || 0,
      quota: (s.quota as number) || 0,
      quotaMet: (s.quotaMet as number) || 0,
      stagesCompleted: Array.from((s.stagesCompleted as Iterable<string>) || []),
      availableStages: Array.from((s.availableStages as Iterable<string>) || []),
      hostPlayerId: (s.hostPlayerId as string) || '',
    };
  }

  getPlayers(): PlayerData[] {
    if (!this.room?.state) return [];
    const state = this.room.state as { players: Map<string, unknown> };
    const players: PlayerData[] = [];

    state.players?.forEach((player: unknown, id: string) => {
      const p = player as Record<string, unknown>;
      players.push({
        id,
        playerNumber: (p.playerNumber as number) || 0,
        name: (p.name as string) || '',
        aimX: (p.aimX as number) || 0,
        aimY: (p.aimY as number) || 0,
        score: (p.score as number) || 0,
        lives: (p.lives as number) || 0,
        connected: (p.connected as boolean) ?? true,
        ready: (p.ready as boolean) ?? false,
      });
    });

    return players;
  }

  getTargets(): TargetData[] {
    if (!this.room?.state) return [];
    const state = this.room.state as { targets: unknown[] };
    const targets: TargetData[] = [];

    state.targets?.forEach((target: unknown) => {
      const t = target as Record<string, unknown>;
      if (t.active) {
        targets.push({
          id: (t.id as string) || '',
          targetType: (t.targetType as string) || '',
          x: (t.x as number) || 0,
          y: (t.y as number) || 0,
          width: (t.width as number) || 50,
          height: (t.height as number) || 50,
          active: (t.active as boolean) ?? true,
          ownerPlayerNumber: (t.ownerPlayerNumber as number) || 0,
          points: (t.points as number) || 0,
        });
      }
    });

    return targets;
  }

  getState(): GameStateData | null {
    if (!this.room?.state) return null;
    return this.extractGameState(this.room.state);
  }

  getRoomCode(): string {
    const state = this.getState();
    return state?.roomCode || this.room?.id || '';
  }

  onStateChange(callback: (state: GameStateData) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onMessage(type: string, callback: MessageCallback): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(callback);
    return () => this.messageHandlers.get(type)?.delete(callback);
  }

  send(type: string, data?: unknown): void {
    this.room?.send(type, data);
  }

  selectMode(mode: GameMode): void {
    this.send('select-mode', { mode });
  }

  selectStage(stageId: string): void {
    this.send('select-stage', { stageId });
  }

  startGame(): void {
    this.send('start-game');
  }

  isConnected(): boolean {
    return this.room !== null;
  }

  disconnect(): void {
    this.room?.leave();
    this.room = null;
  }
}

export const NetworkService = new NetworkServiceClass();
