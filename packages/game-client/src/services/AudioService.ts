// AudioService - handles all game audio
// Note: Actual audio files need to be added to assets folder

class AudioServiceClass {
  private context: AudioContext | null = null;
  private masterVolume: number = 1;
  private sfxVolume: number = 1;
  private musicVolume: number = 0.5;
  private muted: boolean = false;

  constructor() {
    // AudioContext created on user interaction to comply with browser policies
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    return this.context;
  }

  // Play a simple beep sound (for testing/placeholder)
  playBeep(frequency: number = 440, duration: number = 0.1, type: OscillatorType = 'sine'): void {
    if (this.muted) return;

    try {
      const ctx = this.ensureContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      gainNode.gain.value = this.masterVolume * this.sfxVolume * 0.3;
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  // Sound effect methods (placeholders using beeps)
  playShoot(): void {
    this.playBeep(800, 0.05, 'square');
  }

  playHit(): void {
    this.playBeep(1200, 0.1, 'sine');
    setTimeout(() => this.playBeep(1400, 0.05, 'sine'), 50);
  }

  playMiss(): void {
    this.playBeep(200, 0.2, 'sawtooth');
  }

  playWrongTarget(): void {
    this.playBeep(150, 0.15, 'square');
    setTimeout(() => this.playBeep(100, 0.2, 'square'), 100);
  }

  playBombExplosion(): void {
    // Explosion sound - low rumble
    this.playBeep(80, 0.3, 'sawtooth');
    setTimeout(() => this.playBeep(60, 0.4, 'triangle'), 100);
  }

  playTargetSpawn(): void {
    this.playBeep(600, 0.05, 'sine');
  }

  playCountdown(number: number): void {
    const frequencies: Record<number, number> = {
      3: 440,
      2: 523,
      1: 659,
      0: 880, // GO!
    };
    this.playBeep(frequencies[number] || 440, number === 0 ? 0.3 : 0.15, 'sine');
  }

  playStageComplete(passed: boolean): void {
    if (passed) {
      // Victory fanfare
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => this.playBeep(freq, 0.2, 'sine'), i * 100);
      });
    } else {
      // Failure sound
      [400, 350, 300, 250].forEach((freq, i) => {
        setTimeout(() => this.playBeep(freq, 0.2, 'triangle'), i * 150);
      });
    }
  }

  playGameOver(isVictory: boolean): void {
    if (isVictory) {
      // Victory music
      const melody = [523, 587, 659, 784, 880, 784, 659, 784, 1047];
      melody.forEach((freq, i) => {
        setTimeout(() => this.playBeep(freq, 0.25, 'sine'), i * 150);
      });
    } else {
      // Game over
      [392, 349, 330, 294, 262].forEach((freq, i) => {
        setTimeout(() => this.playBeep(freq, 0.3, 'triangle'), i * 200);
      });
    }
  }

  playButtonClick(): void {
    this.playBeep(1000, 0.03, 'sine');
  }

  playTimerWarning(): void {
    this.playBeep(880, 0.1, 'square');
  }

  playBonusCollected(): void {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.1, 'sine'), i * 50);
    });
  }

  playLifeLost(): void {
    this.playBeep(200, 0.3, 'sawtooth');
    setTimeout(() => this.playBeep(150, 0.3, 'sawtooth'), 200);
  }

  playLifeGained(): void {
    [659, 784, 880, 1047].forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.15, 'sine'), i * 80);
    });
  }

  // Volume controls
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  // Initialize audio context on first user interaction
  init(): void {
    this.ensureContext();
  }
}

export const AudioService = new AudioServiceClass();
