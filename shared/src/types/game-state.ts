import type { GameMode, MiniGameCategory } from '../constants/game-rules.js';
import type { PlayerState } from './player.js';

export type GamePhase =
  | 'lobby'           // Waiting for players
  | 'mode-select'     // Selecting difficulty
  | 'stage-select'    // Selecting stage
  | 'playing'         // In a mini-game
  | 'results'         // Showing stage results
  | 'bonus'           // Bonus stage (treasure chest)
  | 'finale'          // Fireworks finale
  | 'game-over'       // All players out of lives
  | 'ranking';        // Final ranking

export interface TargetState {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  ownerPlayerNumber?: 1 | 2 | 3 | 4; // For color-coded targets
  points?: number;
  metadata?: Record<string, unknown>;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  mode: GameMode | null;
  currentStage: number;
  currentMiniGame: string | null;

  players: Record<string, PlayerState>;
  targets: TargetState[];

  timer: number; // seconds remaining
  quota: number; // current stage quota
  quotaMet: number; // progress toward quota

  stagesCompleted: string[];
  availableStages: string[];

  hostPlayerId: string | null;
}

export interface StageResult {
  miniGameId: string;
  passed: boolean;
  playerScores: Record<string, number>;
  quotaMet: number;
  quotaRequired: number;
  timeRemaining: number;
}
