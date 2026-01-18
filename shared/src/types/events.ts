import type { GameMode } from '../constants/game-rules.js';
import type { PlayerNumber } from '../constants/colors.js';
import type { GameState, StageResult, TargetState } from './game-state.js';
import type { PlayerState } from './player.js';

// ==========================================
// Phone Controller -> Server Events
// ==========================================

export interface AimEvent {
  type: 'aim';
  x: number; // -1 to 1
  y: number; // -1 to 1
  timestamp: number;
}

export interface ShootEvent {
  type: 'shoot';
  x: number;
  y: number;
  timestamp: number;
}

export interface JoinRoomEvent {
  type: 'join';
  roomCode: string;
  playerName: string;
}

export interface PlayerReadyEvent {
  type: 'ready';
}

export type ControllerToServerEvent =
  | AimEvent
  | ShootEvent
  | JoinRoomEvent
  | PlayerReadyEvent;

// ==========================================
// Game Client -> Server Events
// ==========================================

export interface CreateRoomEvent {
  type: 'create-room';
}

export interface SelectModeEvent {
  type: 'select-mode';
  mode: GameMode;
}

export interface SelectStageEvent {
  type: 'select-stage';
  stageId: string;
}

export interface StartGameEvent {
  type: 'start-game';
}

export type GameClientToServerEvent =
  | CreateRoomEvent
  | SelectModeEvent
  | SelectStageEvent
  | StartGameEvent;

// ==========================================
// Server -> All Clients Events
// ==========================================

export interface RoomCreatedEvent {
  type: 'room-created';
  roomCode: string;
}

export interface PlayerJoinedEvent {
  type: 'player-joined';
  player: PlayerState;
}

export interface PlayerLeftEvent {
  type: 'player-left';
  playerId: string;
}

export interface GameStateUpdateEvent {
  type: 'state-update';
  state: GameState;
}

export interface PhaseChangedEvent {
  type: 'phase-changed';
  phase: GameState['phase'];
  data?: Record<string, unknown>;
}

export interface TimerUpdateEvent {
  type: 'timer-update';
  timeRemaining: number;
}

export interface TargetSpawnedEvent {
  type: 'target-spawned';
  target: TargetState;
}

export interface TargetHitEvent {
  type: 'target-hit';
  targetId: string;
  playerId: string;
  playerNumber: PlayerNumber;
  points: number;
  hitZone?: string;
}

export interface TargetRemovedEvent {
  type: 'target-removed';
  targetId: string;
  reason: 'hit' | 'expired' | 'missed';
}

export interface ScoreUpdateEvent {
  type: 'score-update';
  playerId: string;
  score: number;
  delta: number;
}

export interface LivesUpdateEvent {
  type: 'lives-update';
  playerId: string;
  lives: number;
  delta: number;
  reason?: string;
}

export interface StageCompleteEvent {
  type: 'stage-complete';
  result: StageResult;
}

export interface GameOverEvent {
  type: 'game-over';
  finalScores: Record<string, number>;
  rankings: Array<{ playerId: string; rank: number; score: number }>;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  code?: string;
}

export type ServerToClientEvent =
  | RoomCreatedEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameStateUpdateEvent
  | PhaseChangedEvent
  | TimerUpdateEvent
  | TargetSpawnedEvent
  | TargetHitEvent
  | TargetRemovedEvent
  | ScoreUpdateEvent
  | LivesUpdateEvent
  | StageCompleteEvent
  | GameOverEvent
  | ErrorEvent;

// ==========================================
// Server -> Phone Controller Events
// ==========================================

export interface AssignedPlayerEvent {
  type: 'assigned-player';
  playerNumber: PlayerNumber;
  color: string;
}

export interface ShootFeedbackEvent {
  type: 'shoot-feedback';
  hit: boolean;
  points?: number;
}

export type ServerToControllerEvent =
  | ServerToClientEvent
  | AssignedPlayerEvent
  | ShootFeedbackEvent;
