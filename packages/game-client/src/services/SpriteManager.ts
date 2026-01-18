/**
 * SpriteManager - Handles loading and management of game sprites
 * Provides fallback to procedural graphics when sprites aren't available
 */

export interface SpriteDefinition {
  key: string;
  path: string;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
}

// All game sprites with their definitions (matching generated files)
export const SPRITE_DEFINITIONS: Record<string, SpriteDefinition[]> = {
  targets: [
    { key: 'target-red', path: 'assets/sprites/targets/target-red.png' },
    { key: 'target-blue', path: 'assets/sprites/targets/target-blue.png' },
    { key: 'target-green', path: 'assets/sprites/targets/target-green.png' },
    { key: 'target-yellow', path: 'assets/sprites/targets/target-yellow.png' },
    { key: 'bomb', path: 'assets/sprites/targets/bomb.png' },
    { key: 'bullseye', path: 'assets/sprites/targets/bullseye.png' },
  ],
  animals: [
    { key: 'bunny', path: 'assets/sprites/animals/bunny.png' },
    { key: 'squirrel', path: 'assets/sprites/animals/squirrel.png' },
    { key: 'hedgehog', path: 'assets/sprites/animals/hedgehog.png' },
    { key: 'mole', path: 'assets/sprites/animals/mole.png' },
    { key: 'hole', path: 'assets/sprites/animals/hole.png' },
  ],
  western: [
    { key: 'bandit', path: 'assets/sprites/western/bandit.png' },
    { key: 'townsperson', path: 'assets/sprites/western/townsperson.png' },
    { key: 'robber', path: 'assets/sprites/western/robber.png' },
    { key: 'civilian', path: 'assets/sprites/western/civilian.png' },
  ],
  spooky: [
    { key: 'skeleton', path: 'assets/sprites/spooky/skeleton.png' },
    { key: 'coffin-closed', path: 'assets/sprites/spooky/coffin-closed.png' },
    { key: 'cuckoo-bird', path: 'assets/sprites/spooky/cuckoo-bird.png' },
  ],
  nature: [
    { key: 'leaf-maple', path: 'assets/sprites/nature/leaf-maple.png' },
    { key: 'leaf-oak', path: 'assets/sprites/nature/leaf-oak.png' },
    { key: 'meteor-small', path: 'assets/sprites/nature/meteor-small.png' },
    { key: 'meteor-medium', path: 'assets/sprites/nature/meteor-medium.png' },
    { key: 'meteor-large', path: 'assets/sprites/nature/meteor-large.png' },
  ],
  rewards: [
    { key: 'chest-closed', path: 'assets/sprites/rewards/chest-closed.png' },
    { key: 'chest-open', path: 'assets/sprites/rewards/chest-open.png' },
    { key: 'coin', path: 'assets/sprites/rewards/coin.png' },
  ],
  fireworks: [
    { key: 'firework-rocket', path: 'assets/sprites/fireworks/rocket.png' },
  ],
  particles: [
    { key: 'particle-spark', path: 'assets/particles/spark.png' },
    { key: 'particle-star', path: 'assets/particles/star.png' },
  ],
  ui: [
    { key: 'crosshair', path: 'assets/ui/crosshair.png' },
    { key: 'button-red', path: 'assets/ui/button-red.png' },
    { key: 'button-blue', path: 'assets/ui/button-blue.png' },
    { key: 'button-green', path: 'assets/ui/button-green.png' },
    { key: 'button-yellow', path: 'assets/ui/button-yellow.png' },
    { key: 'card-back', path: 'assets/ui/card-back.png' },
  ],
};

class SpriteManagerClass {
  private loadedSprites: Set<string> = new Set();
  private failedSprites: Set<string> = new Set();

  /**
   * Check if a sprite is available
   */
  hasSprite(key: string): boolean {
    return this.loadedSprites.has(key) && !this.failedSprites.has(key);
  }

  /**
   * Mark a sprite as loaded
   */
  markLoaded(key: string): void {
    this.loadedSprites.add(key);
  }

  /**
   * Mark a sprite as failed to load
   */
  markFailed(key: string): void {
    this.failedSprites.add(key);
  }

  /**
   * Get all sprite definitions flattened
   */
  getAllDefinitions(): SpriteDefinition[] {
    return Object.values(SPRITE_DEFINITIONS).flat();
  }

  /**
   * Get sprite definitions by category
   */
  getDefinitionsByCategory(category: string): SpriteDefinition[] {
    return SPRITE_DEFINITIONS[category] || [];
  }

  /**
   * Reset the manager (useful for testing)
   */
  reset(): void {
    this.loadedSprites.clear();
    this.failedSprites.clear();
  }
}

// Singleton instance
export const SpriteManager = new SpriteManagerClass();
