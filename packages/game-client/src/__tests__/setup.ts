import { vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => {
  const createMockGameObject = () => ({
    setOrigin: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setData: vi.fn().mockReturnThis(),
    getData: vi.fn(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    add: vi.fn(),
  });

  return {
    default: {
      Scene: class MockScene {
        cameras = {
          main: { width: 1920, height: 1080 },
        };
        add = {
          text: vi.fn().mockReturnValue(createMockGameObject()),
          rectangle: vi.fn().mockReturnValue(createMockGameObject()),
          container: vi.fn().mockReturnValue({
            ...createMockGameObject(),
            add: vi.fn(),
          }),
          graphics: vi.fn().mockReturnValue({
            lineStyle: vi.fn().mockReturnThis(),
            moveTo: vi.fn().mockReturnThis(),
            lineTo: vi.fn().mockReturnThis(),
            strokeCircle: vi.fn().mockReturnThis(),
          }),
        };
        time = {
          addEvent: vi.fn().mockReturnValue({ destroy: vi.fn() }),
          delayedCall: vi.fn(),
        };
        tweens = {
          add: vi.fn(),
        };
        scene = {
          start: vi.fn(),
        };
      },
    },
  };
});

// Mock NetworkService
vi.mock('../services/NetworkService', () => ({
  NetworkService: {
    getState: vi.fn().mockReturnValue({
      roomCode: 'ABCD12',
      phase: 'stage-select',
      mode: 'beginner',
      currentStage: 0,
      currentMiniGame: '',
      timer: 10,
      quota: 0,
      quotaMet: 0,
      stagesCompleted: [],
      availableStages: ['color-target-blitz', 'cuckoo-clock', 'leaf-shooting', 'skeleton-coffins'],
      hostPlayerId: 'player1',
    }),
    getPlayers: vi.fn().mockReturnValue([]),
    onMessage: vi.fn().mockReturnValue(() => {}),
    onStateChange: vi.fn().mockReturnValue(() => {}),
    selectStage: vi.fn(),
  },
}));
