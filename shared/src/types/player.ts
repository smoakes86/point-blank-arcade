import type { PlayerNumber } from '../constants/colors.js';

export interface PlayerState {
  id: string;
  playerNumber: PlayerNumber;
  name: string;
  aimX: number; // -1 to 1
  aimY: number; // -1 to 1
  score: number;
  lives: number;
  connected: boolean;
  ready: boolean;
}

export interface PlayerInput {
  aimX: number;
  aimY: number;
  shooting: boolean;
  timestamp: number;
}
