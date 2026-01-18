export interface PlayerColor {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

export const PLAYER_COLORS: Record<1 | 2 | 3 | 4, PlayerColor> = {
  1: { name: 'Red', hex: '#FF4444', rgb: { r: 255, g: 68, b: 68 } },
  2: { name: 'Blue', hex: '#4444FF', rgb: { r: 68, g: 68, b: 255 } },
  3: { name: 'Green', hex: '#44FF44', rgb: { r: 68, g: 255, b: 68 } },
  4: { name: 'Yellow', hex: '#FFFF44', rgb: { r: 255, g: 255, b: 68 } },
};

export type PlayerNumber = 1 | 2 | 3 | 4;

export const MAX_PLAYERS = 4;

// Room code generation characters (excluding ambiguous: O, 0, I, 1)
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;
