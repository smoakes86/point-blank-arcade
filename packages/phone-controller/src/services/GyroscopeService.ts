export class GyroscopeService {
  private calibrationOffset = { beta: 0, gamma: 0 };
  private currentAim = { x: 0, y: 0 };
  private smoothedAim = { x: 0, y: 0 };
  private callback: ((x: number, y: number) => void) | null = null;

  // Smoothing factor (0-1, higher = less smoothing)
  private readonly SMOOTHING_FACTOR = 0.3;

  // Sensitivity (degrees to reach edge of screen)
  private readonly SENSITIVITY = 30;

  // Is gyroscope available
  private available = false;

  constructor() {
    this.available = 'DeviceOrientationEvent' in window;
  }

  needsPermission(): boolean {
    // iOS 13+ requires permission
    return (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    );
  }

  async requestPermission(): Promise<boolean> {
    if (!this.needsPermission()) {
      return true;
    }

    try {
      const DeviceOrientationEventWithPermission = DeviceOrientationEvent as unknown as {
        requestPermission: () => Promise<string>;
      };
      const permission = await DeviceOrientationEventWithPermission.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request gyroscope permission:', error);
      return false;
    }
  }

  start(callback: (x: number, y: number) => void) {
    this.callback = callback;

    if (!this.available) {
      console.warn('DeviceOrientation not available, using mouse fallback');
      this.startMouseFallback();
      return;
    }

    window.addEventListener('deviceorientation', this.handleOrientation);

    // Start update loop for smooth interpolation
    this.startUpdateLoop();
  }

  stop() {
    window.removeEventListener('deviceorientation', this.handleOrientation);
    this.callback = null;
  }

  calibrate() {
    // Set current orientation as the center point
    // Will be applied on next orientation event
    this.calibrationOffset = {
      beta: this.currentAim.y * this.SENSITIVITY + 45, // Store raw beta
      gamma: this.currentAim.x * this.SENSITIVITY, // Store raw gamma
    };
  }

  getCurrentAim(): { x: number; y: number } {
    return { ...this.smoothedAim };
  }

  private handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;

    // gamma: left-right tilt (-90 to 90)
    // beta: front-back tilt (-180 to 180)

    // Apply calibration offset
    let gamma = event.gamma - this.calibrationOffset.gamma;
    let beta = event.beta - this.calibrationOffset.beta;

    // Handle wrap-around for gamma
    if (gamma > 90) gamma -= 180;
    if (gamma < -90) gamma += 180;

    // Map to -1 to 1 range based on sensitivity
    // gamma controls X (left-right)
    // beta controls Y (forward-back, adjusted for typical holding position)
    this.currentAim.x = Math.max(-1, Math.min(1, gamma / this.SENSITIVITY));
    this.currentAim.y = Math.max(-1, Math.min(1, (beta - 45) / this.SENSITIVITY));
  };

  private startUpdateLoop() {
    const update = () => {
      // Apply exponential smoothing
      this.smoothedAim.x =
        this.smoothedAim.x * (1 - this.SMOOTHING_FACTOR) +
        this.currentAim.x * this.SMOOTHING_FACTOR;
      this.smoothedAim.y =
        this.smoothedAim.y * (1 - this.SMOOTHING_FACTOR) +
        this.currentAim.y * this.SMOOTHING_FACTOR;

      if (this.callback) {
        this.callback(this.smoothedAim.x, this.smoothedAim.y);
      }

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }

  private startMouseFallback() {
    // For desktop testing - use mouse position
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;

      this.currentAim.x = x;
      this.currentAim.y = y;
    };

    window.addEventListener('mousemove', handleMouseMove);
    this.startUpdateLoop();
  }
}
