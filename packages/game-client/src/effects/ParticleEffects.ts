import Phaser from 'phaser';

/**
 * ParticleEffects - Pre-built particle effect configurations for the game
 */

export interface ParticleConfig {
  texture: string;
  emitZone?: Phaser.Types.GameObjects.Particles.EmitZoneData;
  lifespan?: number;
  speed?: { min: number; max: number };
  scale?: { start: number; end: number };
  alpha?: { start: number; end: number };
  rotate?: { min: number; max: number };
  gravityY?: number;
  quantity?: number;
  frequency?: number;
  tint?: number | number[];
  blendMode?: number;
}

/**
 * Creates a burst of particles at a position
 */
export function createBurstEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    color?: number;
    count?: number;
    speed?: number;
    size?: number;
    lifespan?: number;
    gravity?: number;
  } = {}
): void {
  const {
    color = 0xffffff,
    count = 12,
    speed = 200,
    size = 8,
    lifespan = 500,
    gravity = 300,
  } = config;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const velocity = speed * (0.5 + Math.random() * 0.5);

    const particle = scene.add.circle(x, y, size * (0.5 + Math.random() * 0.5), color);
    particle.setDepth(1000);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * velocity,
      y: y + Math.sin(angle) * velocity + gravity * (lifespan / 1000),
      scale: 0,
      alpha: 0,
      duration: lifespan,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Creates a star burst effect (for hits)
 */
export function createStarBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    colors?: number[];
    count?: number;
    speed?: number;
  } = {}
): void {
  const {
    colors = [0xffff00, 0xffd700, 0xfffacd, 0xffffff],
    count = 8,
    speed = 80,
  } = config;

  for (let i = 0; i < count; i++) {
    const color = Phaser.Utils.Array.GetRandom(colors);
    const angle = (i / count) * Math.PI * 2;
    const distance = speed + Math.random() * speed;

    // Create star shape
    const star = scene.add.text(x, y, '✦', {
      fontSize: `${16 + Math.random() * 12}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    star.setDepth(1001);

    scene.tweens.add({
      targets: star,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      rotation: Math.random() * Math.PI * 2,
      scale: 0.5,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => star.destroy(),
    });
  }
}

/**
 * Creates a confetti burst (for celebrations)
 */
export function createConfettiBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    count?: number;
    spread?: number;
  } = {}
): void {
  const { count = 30, spread = 300 } = config;
  const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181, 0xaa96da];
  const shapes = ['■', '●', '▲', '◆'];

  for (let i = 0; i < count; i++) {
    const color = Phaser.Utils.Array.GetRandom(colors);
    const shape = Phaser.Utils.Array.GetRandom(shapes);

    const confetti = scene.add.text(x, y, shape, {
      fontSize: `${8 + Math.random() * 8}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    confetti.setDepth(1002);

    const targetX = x + (Math.random() - 0.5) * spread;
    const targetY = y - Math.random() * 200 - 100;

    scene.tweens.add({
      targets: confetti,
      x: targetX,
      y: targetY + 400, // Fall down
      rotation: Math.random() * Math.PI * 4,
      duration: 1500 + Math.random() * 500,
      ease: 'Quad.easeIn',
      onComplete: () => confetti.destroy(),
    });

    scene.tweens.add({
      targets: confetti,
      alpha: 0,
      delay: 1200,
      duration: 800,
    });
  }
}

/**
 * Creates a smoke puff effect
 */
export function createSmokePuff(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    color?: number;
    count?: number;
    size?: number;
  } = {}
): void {
  const { color = 0x888888, count = 6, size = 20 } = config;

  for (let i = 0; i < count; i++) {
    const puff = scene.add.circle(
      x + (Math.random() - 0.5) * 20,
      y + (Math.random() - 0.5) * 20,
      size * (0.5 + Math.random() * 0.5),
      color,
      0.6
    );
    puff.setDepth(999);

    scene.tweens.add({
      targets: puff,
      y: puff.y - 50 - Math.random() * 50,
      scale: 2,
      alpha: 0,
      duration: 800 + Math.random() * 400,
      ease: 'Quad.easeOut',
      onComplete: () => puff.destroy(),
    });
  }
}

/**
 * Creates sparkle trail effect
 */
export function createSparkleTrail(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    color?: number;
    count?: number;
  } = {}
): void {
  const { color = 0xffffff, count = 5 } = config;

  for (let i = 0; i < count; i++) {
    scene.time.delayedCall(i * 50, () => {
      const sparkle = scene.add.circle(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        3 + Math.random() * 3,
        color
      );
      sparkle.setDepth(1000);

      scene.tweens.add({
        targets: sparkle,
        scale: 0,
        alpha: 0,
        duration: 300,
        onComplete: () => sparkle.destroy(),
      });
    });
  }
}

/**
 * Creates a ring expansion effect
 */
export function createRingEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    color?: number;
    size?: number;
    duration?: number;
    lineWidth?: number;
  } = {}
): void {
  const { color = 0x4ecdc4, size = 100, duration = 400, lineWidth = 4 } = config;

  const ring = scene.add.circle(x, y, 10, undefined, 0);
  ring.setStrokeStyle(lineWidth, color);
  ring.setDepth(999);

  scene.tweens.add({
    targets: ring,
    radius: size,
    alpha: 0,
    duration,
    ease: 'Quad.easeOut',
    onUpdate: () => {
      ring.setStrokeStyle(lineWidth * (1 - ring.alpha), color);
    },
    onComplete: () => ring.destroy(),
  });
}

/**
 * Creates screen flash effect
 */
export function createScreenFlash(
  scene: Phaser.Scene,
  config: {
    color?: number;
    alpha?: number;
    duration?: number;
  } = {}
): void {
  const { color = 0xffffff, alpha = 0.5, duration = 150 } = config;

  const flash = scene.add.rectangle(
    scene.cameras.main.centerX,
    scene.cameras.main.centerY,
    scene.cameras.main.width,
    scene.cameras.main.height,
    color,
    alpha
  );
  flash.setDepth(2000);
  flash.setScrollFactor(0);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration,
    onComplete: () => flash.destroy(),
  });
}

/**
 * Creates number popup effect (for scores)
 */
export function createScorePopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  value: number,
  config: {
    positive?: boolean;
    size?: string;
  } = {}
): void {
  const { positive = value > 0, size = '28px' } = config;

  const color = positive ? '#4ecdc4' : '#ff6b6b';
  const text = positive ? `+${value}` : `${value}`;

  const popup = scene.add.text(x, y, text, {
    fontFamily: 'Arial Black',
    fontSize: size,
    color,
    stroke: '#000000',
    strokeThickness: 4,
  }).setOrigin(0.5);
  popup.setDepth(1500);

  // Scale in
  popup.setScale(0);
  scene.tweens.add({
    targets: popup,
    scale: 1.2,
    duration: 150,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: popup,
        scale: 1,
        duration: 100,
      });
    },
  });

  // Float up and fade
  scene.tweens.add({
    targets: popup,
    y: y - 60,
    alpha: 0,
    duration: 800,
    delay: 300,
    ease: 'Quad.easeOut',
    onComplete: () => popup.destroy(),
  });
}

/**
 * Creates text feedback effect
 */
export function createTextFeedback(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  config: {
    color?: string;
    size?: string;
    duration?: number;
    shake?: boolean;
  } = {}
): void {
  const {
    color = '#ffffff',
    size = '32px',
    duration = 1000,
    shake = false,
  } = config;

  const feedback = scene.add.text(x, y, text, {
    fontFamily: 'Arial Black',
    fontSize: size,
    color,
    stroke: '#000000',
    strokeThickness: 4,
  }).setOrigin(0.5);
  feedback.setDepth(1500);

  // Scale in with bounce
  feedback.setScale(0);
  scene.tweens.add({
    targets: feedback,
    scale: 1,
    duration: 200,
    ease: 'Back.easeOut',
  });

  // Optional shake
  if (shake) {
    scene.tweens.add({
      targets: feedback,
      x: x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
  }

  // Float up and fade
  scene.tweens.add({
    targets: feedback,
    y: y - 40,
    alpha: 0,
    duration: duration * 0.6,
    delay: duration * 0.4,
    ease: 'Quad.easeOut',
    onComplete: () => feedback.destroy(),
  });
}

/**
 * Creates impact shake effect on camera
 */
export function createCameraShake(
  scene: Phaser.Scene,
  config: {
    intensity?: number;
    duration?: number;
  } = {}
): void {
  const { intensity = 0.01, duration = 100 } = config;
  scene.cameras.main.shake(duration, intensity);
}

/**
 * Creates firework explosion effect
 */
export function createFireworkExplosion(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    colors?: number[];
    particleCount?: number;
    radius?: number;
  } = {}
): void {
  const {
    colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff],
    particleCount = 40,
    radius = 150,
  } = config;

  const mainColor = Phaser.Utils.Array.GetRandom(colors);

  // Main burst
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = radius * (0.6 + Math.random() * 0.4);
    const particleColor = Math.random() > 0.3 ? mainColor : Phaser.Utils.Array.GetRandom(colors);

    const particle = scene.add.circle(x, y, 4 + Math.random() * 4, particleColor);
    particle.setDepth(1000);

    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;

    scene.tweens.add({
      targets: particle,
      x: targetX,
      y: targetY + 50, // Gravity
      scale: 0,
      alpha: 0,
      duration: 800 + Math.random() * 400,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    });

    // Trailing sparkles
    if (Math.random() > 0.5) {
      scene.time.delayedCall(100, () => {
        const trail = scene.add.circle(
          x + Math.cos(angle) * distance * 0.3,
          y + Math.sin(angle) * distance * 0.3,
          2,
          particleColor,
          0.8
        );
        trail.setDepth(999);

        scene.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 400,
          onComplete: () => trail.destroy(),
        });
      });
    }
  }

  // Central flash
  const flash = scene.add.circle(x, y, 30, 0xffffff, 0.8);
  flash.setDepth(1001);

  scene.tweens.add({
    targets: flash,
    scale: 3,
    alpha: 0,
    duration: 300,
    onComplete: () => flash.destroy(),
  });
}

/**
 * Creates a coin collection effect
 */
export function createCoinCollect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  targetX: number,
  targetY: number
): void {
  const coin = scene.add.circle(x, y, 10, 0xffd700);
  coin.setStrokeStyle(2, 0xb8860b);
  coin.setDepth(1500);

  // Arc to target
  scene.tweens.add({
    targets: coin,
    x: targetX,
    y: targetY,
    scale: 0.5,
    duration: 500,
    ease: 'Quad.easeIn',
    onComplete: () => {
      coin.destroy();
      createStarBurst(scene, targetX, targetY, { count: 4 });
    },
  });
}

/**
 * Creates dust cloud effect (for landings/impacts)
 */
export function createDustCloud(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    color?: number;
    count?: number;
    spread?: number;
  } = {}
): void {
  const { color = 0xc4a574, count = 8, spread = 40 } = config;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI; // Only bottom half
    const distance = spread * (0.5 + Math.random() * 0.5);

    const dust = scene.add.circle(x, y, 6 + Math.random() * 6, color, 0.6);
    dust.setDepth(998);

    scene.tweens.add({
      targets: dust,
      x: x + Math.cos(angle) * distance,
      y: y - Math.sin(angle) * distance * 0.3,
      scale: 0,
      alpha: 0,
      duration: 400 + Math.random() * 200,
      ease: 'Quad.easeOut',
      onComplete: () => dust.destroy(),
    });
  }
}
