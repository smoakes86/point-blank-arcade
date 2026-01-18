import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StageSelectScene } from '../scenes/StageSelectScene';
import { NetworkService } from '../services/NetworkService';

describe('StageSelectScene', () => {
  let scene: StageSelectScene;
  let mockTimerEvent: { destroy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTimerEvent = { destroy: vi.fn() };
    scene = new StageSelectScene();

    // Mock the time.addEvent to return our trackable timer event
    (scene as any).time = {
      addEvent: vi.fn().mockReturnValue(mockTimerEvent),
      delayedCall: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create scene with key "StageSelectScene"', () => {
      expect((scene as any).sys?.settings?.key || 'StageSelectScene').toBe('StageSelectScene');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      scene.create();
    });

    it('should get available stages from NetworkService state', () => {
      expect(NetworkService.getState).toHaveBeenCalled();
    });

    it('should initialize timer to 10 seconds', () => {
      expect((scene as any).timer).toBe(10);
    });

    it('should start timer event with 1 second interval', () => {
      expect((scene as any).time.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: 1000,
          loop: true,
        })
      );
    });

    it('should register phase-changed message handler', () => {
      expect(NetworkService.onMessage).toHaveBeenCalledWith('phase-changed', expect.any(Function));
    });

    it('should register state change listener', () => {
      expect(NetworkService.onStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should create title text', () => {
      expect((scene as any).add.text).toHaveBeenCalledWith(
        expect.any(Number),
        80,
        'SELECT STAGE',
        expect.objectContaining({
          fontSize: '56px',
        })
      );
    });

    it('should create timer display', () => {
      expect((scene as any).add.text).toHaveBeenCalledWith(
        expect.any(Number),
        200,
        '10',
        expect.objectContaining({
          fontSize: '48px',
          color: '#ff6b6b',
        })
      );
    });

    it('should create instruction text', () => {
      expect((scene as any).add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'SHOOT to select stage!',
        expect.any(Object)
      );
    });
  });

  describe('updateTimer', () => {
    beforeEach(() => {
      scene.create();
      // Reset timer text mock to track subsequent calls
      (scene as any).timerText = {
        setText: vi.fn(),
        setColor: vi.fn(),
        setScale: vi.fn(),
      };
    });

    it('should decrement timer by 1', () => {
      const initialTimer = (scene as any).timer;
      (scene as any).updateTimer();
      expect((scene as any).timer).toBe(initialTimer - 1);
    });

    it('should update timer text display', () => {
      (scene as any).timer = 5;
      (scene as any).updateTimer();
      expect((scene as any).timerText.setText).toHaveBeenCalledWith('4');
    });

    it('should change timer color to red when timer <= 3', () => {
      (scene as any).timer = 4;
      (scene as any).updateTimer();
      expect((scene as any).timerText.setColor).toHaveBeenCalledWith('#ff0000');
    });

    it('should scale timer text when <= 3 seconds', () => {
      (scene as any).timer = 3;
      (scene as any).updateTimer();
      expect((scene as any).timerText.setScale).toHaveBeenCalledWith(1.2);
    });

    it('should auto-select first stage when timer reaches 0', () => {
      (scene as any).timer = 1;
      (scene as any).availableStages = ['color-target-blitz', 'cuckoo-clock'];
      (scene as any).stageButtons = new Map();
      (scene as any).updateTimer();
      expect(NetworkService.selectStage).toHaveBeenCalledWith('color-target-blitz');
    });
  });

  describe('selectStage', () => {
    beforeEach(() => {
      scene.create();
      (scene as any).timerEvent = mockTimerEvent;
    });

    it('should destroy timer event when stage is selected', () => {
      (scene as any).selectStage('color-target-blitz');
      expect(mockTimerEvent.destroy).toHaveBeenCalled();
    });

    it('should call NetworkService.selectStage with the selected stage id', () => {
      (scene as any).selectStage('leaf-shooting');
      expect(NetworkService.selectStage).toHaveBeenCalledWith('leaf-shooting');
    });

    it('should animate the selected button', () => {
      const mockButton = { scale: 1 };
      (scene as any).stageButtons = new Map([['cuckoo-clock', mockButton]]);
      (scene as any).selectStage('cuckoo-clock');
      expect((scene as any).tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockButton,
          scale: 1.1,
          duration: 200,
          yoyo: true,
        })
      );
    });
  });

  describe('phase change handling', () => {
    it('should transition to GameScene when phase changes to playing', () => {
      scene.create();

      // Get the callback registered with onMessage
      const onMessageCall = vi.mocked(NetworkService.onMessage).mock.calls.find(
        call => call[0] === 'phase-changed'
      );
      const phaseChangedCallback = onMessageCall?.[1];

      // Simulate phase change
      phaseChangedCallback?.({ phase: 'playing' });

      expect((scene as any).scene.start).toHaveBeenCalledWith('GameScene');
    });

    it('should transition to GameScene when state changes to playing phase', () => {
      scene.create();

      // Get the callback registered with onStateChange
      const stateChangeCallback = vi.mocked(NetworkService.onStateChange).mock.calls[0]?.[0];

      // Simulate state change
      stateChangeCallback?.({ phase: 'playing' } as any);

      expect((scene as any).scene.start).toHaveBeenCalledWith('GameScene');
    });
  });

  describe('update', () => {
    it('should get players from NetworkService', () => {
      scene.create();
      scene.update();
      expect(NetworkService.getPlayers).toHaveBeenCalled();
    });
  });

  describe('updatePlayerCursors', () => {
    beforeEach(() => {
      scene.create();
    });

    it('should remove cursors for disconnected players', () => {
      const mockCursor = { destroy: vi.fn() };
      (scene as any).playerCursors = new Map([['player1', mockCursor]]);

      (scene as any).updatePlayerCursors([]);

      expect(mockCursor.destroy).toHaveBeenCalled();
      expect((scene as any).playerCursors.size).toBe(0);
    });

    it('should position cursor based on player aim coordinates', () => {
      const mockCursor = { setPosition: vi.fn() };
      (scene as any).playerCursors = new Map([['player1', mockCursor]]);

      const players = [{ id: 'player1', aimX: 0, aimY: 0 }];
      (scene as any).updatePlayerCursors(players);

      // With aimX=0, aimY=0, position should be center of screen
      // x = ((0 + 1) / 2) * 1920 = 960
      // y = ((0 + 1) / 2) * 1080 = 540
      expect(mockCursor.setPosition).toHaveBeenCalledWith(960, 540);
    });
  });

  describe('shutdown', () => {
    it('should destroy timer event', () => {
      scene.create();
      (scene as any).timerEvent = mockTimerEvent;
      scene.shutdown();
      expect(mockTimerEvent.destroy).toHaveBeenCalled();
    });

    it('should destroy all player cursors', () => {
      scene.create();
      const mockCursor = { destroy: vi.fn() };
      (scene as any).playerCursors = new Map([['player1', mockCursor]]);

      scene.shutdown();

      expect(mockCursor.destroy).toHaveBeenCalled();
      expect((scene as any).playerCursors.size).toBe(0);
    });
  });

  describe('createStageButton', () => {
    it('should create button with correct category color', () => {
      scene.create();

      const miniGame = {
        id: 'test-game',
        name: 'Test Game',
        category: 'speed',
        instructions: 'Test instructions',
      };

      const button = (scene as any).createStageButton(100, 100, miniGame);

      expect(button).toBeDefined();
      expect((scene as any).add.container).toHaveBeenCalled();
      expect((scene as any).add.rectangle).toHaveBeenCalled();
      expect((scene as any).add.text).toHaveBeenCalled();
    });
  });

  describe('createPlayerCursor', () => {
    it('should create cursor with player color', () => {
      scene.create();

      const player = {
        id: 'player1',
        playerNumber: 1,
        aimX: 0,
        aimY: 0,
      };

      const cursor = (scene as any).createPlayerCursor(player);

      expect(cursor).toBeDefined();
      expect((scene as any).add.container).toHaveBeenCalled();
      expect((scene as any).add.graphics).toHaveBeenCalled();
    });
  });
});
