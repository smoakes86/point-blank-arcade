// Game mode configurations
export type GameMode = 'training' | 'beginner' | 'expert' | 'veryhard';

export interface ModeConfig {
  name: string;
  stages: number;
  quotaMultiplier: number;
  timeMultiplier: number;
}

export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  training: {
    name: 'Training',
    stages: 4,
    quotaMultiplier: 0.5,
    timeMultiplier: 1.5,
  },
  beginner: {
    name: 'Beginner',
    stages: 16,
    quotaMultiplier: 1.0,
    timeMultiplier: 1.0,
  },
  expert: {
    name: 'Expert',
    stages: 16,
    quotaMultiplier: 1.5,
    timeMultiplier: 0.8,
  },
  veryhard: {
    name: 'Very Hard',
    stages: 16,
    quotaMultiplier: 2.0,
    timeMultiplier: 0.6,
  },
};

// Lives system
export const INITIAL_LIVES = 3;
export const MAX_LIVES = 5;

// Stage selection
export const STAGES_PER_GROUP = 4;
export const MODE_SELECT_TIME = 20; // seconds
export const STAGE_SELECT_TIME = 10; // seconds

// Bonus stage
export const BONUS_STAGE_AFTER = 8; // Appears after stage 8

// Mini-game categories
export type MiniGameCategory =
  | 'speed'
  | 'accuracy'
  | 'simulation'
  | 'intelligence'
  | 'memory'
  | 'visual'
  | 'special';

export interface MiniGameConfig {
  id: string;
  name: string;
  category: MiniGameCategory;
  baseQuota: number;
  baseTime: number; // seconds
  instructions: string;
}

export const MINI_GAMES: MiniGameConfig[] = [
  // ==================== SPEED ====================
  {
    id: 'color-target-blitz',
    name: 'Color Target Blitz',
    category: 'speed',
    baseQuota: 20,
    baseTime: 15,
    instructions: 'Shoot targets of YOUR color!',
  },
  {
    id: 'cuckoo-clock',
    name: 'Cuckoo Clock',
    category: 'speed',
    baseQuota: 15,
    baseTime: 12,
    instructions: 'Shoot the cuckoo birds!',
  },
  {
    id: 'leaf-shooting',
    name: 'Leaf Shooting',
    category: 'speed',
    baseQuota: 25,
    baseTime: 15,
    instructions: 'Shoot the falling leaves!',
  },
  {
    id: 'skeleton-coffins',
    name: 'Graveyard Shift',
    category: 'speed',
    baseQuota: 12,
    baseTime: 15,
    instructions: 'Shoot the rising skeletons!',
  },
  {
    id: 'popup-animals',
    name: 'Whack-a-Critter',
    category: 'speed',
    baseQuota: 15,
    baseTime: 12,
    instructions: 'Shoot the fuzzy critters!',
  },

  // ==================== ACCURACY ====================
  {
    id: 'bullseye-targets',
    name: 'Bullseye Targets',
    category: 'accuracy',
    baseQuota: 8,
    baseTime: 20,
    instructions: 'Hit the bullseye for max points!',
  },
  {
    id: 'single-bullet',
    name: 'Single Bullet',
    category: 'accuracy',
    baseQuota: 5,
    baseTime: 30,
    instructions: 'ONE shot per target. Don\'t miss!',
  },
  {
    id: 'target-range',
    name: 'Target Range',
    category: 'accuracy',
    baseQuota: 15,
    baseTime: 20,
    instructions: 'Hit the moving targets!',
  },

  // ==================== SIMULATION ====================
  {
    id: 'cardboard-cop',
    name: 'Cardboard Cop',
    category: 'simulation',
    baseQuota: 10,
    baseTime: 15,
    instructions: 'Shoot ROBBERS! Avoid civilians!',
  },
  {
    id: 'wild-west',
    name: 'Wild West',
    category: 'simulation',
    baseQuota: 12,
    baseTime: 15,
    instructions: 'Shoot BANDITS! Spare townspeople!',
  },

  // ==================== INTELLIGENCE ====================
  {
    id: 'number-sequence',
    name: 'Number Sequence',
    category: 'intelligence',
    baseQuota: 16,
    baseTime: 25,
    instructions: 'Shoot 1-16 in order!',
  },
  {
    id: 'math-problems',
    name: 'Math Attack',
    category: 'intelligence',
    baseQuota: 5,
    baseTime: 25,
    instructions: 'Shoot the correct answer!',
  },
  {
    id: 'keyboard-spelling',
    name: 'Spell It Out',
    category: 'intelligence',
    baseQuota: 3,
    baseTime: 30,
    instructions: 'Shoot letters to spell words!',
  },

  // ==================== MEMORY ====================
  {
    id: 'card-matching',
    name: 'Card Matching',
    category: 'memory',
    baseQuota: 6,
    baseTime: 30,
    instructions: 'Match the pairs!',
  },
  {
    id: 'sequence-recall',
    name: 'Sequence Recall',
    category: 'memory',
    baseQuota: 3,
    baseTime: 40,
    instructions: 'Watch and repeat the sequence!',
  },

  // ==================== VISUAL ====================
  {
    id: 'shape-matching',
    name: 'Shape Match',
    category: 'visual',
    baseQuota: 8,
    baseTime: 20,
    instructions: 'Shoot the matching shape!',
  },

  // ==================== SPECIAL ====================
  {
    id: 'meteor-strike',
    name: 'Meteor Strike',
    category: 'special',
    baseQuota: 15,
    baseTime: 20,
    instructions: 'Save Earth from meteors!',
  },
  {
    id: 'treasure-chest',
    name: 'Treasure Hunt',
    category: 'special',
    baseQuota: 10,
    baseTime: 15,
    instructions: 'Shoot chests for rewards!',
  },
  {
    id: 'fireworks-finale',
    name: 'Fireworks Finale',
    category: 'special',
    baseQuota: 20,
    baseTime: 20,
    instructions: 'Shoot fireworks for bonus points!',
  },
];

// Scoring
export const SCORE_VALUES = {
  TARGET_HIT: 50,
  BULLSEYE_CENTER: 100,
  BULLSEYE_INNER: 60,
  BULLSEYE_OUTER: 20,
  WRONG_TARGET: -25,
  BOMB_HIT: -100,
  CIVILIAN_HIT: -100,
  SPEED_BONUS_PER_SECOND: 10,
};
