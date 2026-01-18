import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { AnimalTarget, type AnimalType } from '../objects/AnimalTarget';

export interface PopupAnimalsConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

export class PopupAnimals extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private spawnTimer: number = 0;
  private spawnInterval: number = 800;
  private maxAnimals: number = 6;
  private animalTargets: AnimalTarget[] = [];
  private holePositions: { x: number; y: number; occupied: boolean }[] = [];

  constructor(config: PopupAnimalsConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;

    this.createBackground();
    this.initializeHolePositions();
  }

  private createBackground(): void {
    // Green grass background
    const grass = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x228b22,
      0.3
    );
    grass.setDepth(-20);

    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 50, 'WHACK-A-CRITTER!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#8b4513',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(-5);

    const subtitle = this.scene.add.text(this.screenWidth / 2, 90, 'Shoot the fuzzy critters!', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#228b22',
      strokeThickness: 3,
    }).setOrigin(0.5);
    subtitle.setDepth(-5);
  }

  private initializeHolePositions(): void {
    const cols = 4;
    const rows = 2;
    const marginX = 130;
    const marginY = 180;
    const spacingX = (this.screenWidth - marginX * 2) / (cols - 1);
    const spacingY = (this.screenHeight - marginY - 150) / (rows - 1);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.holePositions.push({
          x: marginX + col * spacingX,
          y: marginY + row * spacingY,
          occupied: false,
        });
      }
    }
  }

  update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    const availablePositions = this.holePositions.filter((p) => !p.occupied);
    if (
      this.spawnTimer >= this.spawnInterval &&
      this.animalTargets.length < this.maxAnimals &&
      availablePositions.length > 0
    ) {
      this.spawnTimer = 0;
      this.spawnTargets();

      // Increase spawn rate
      this.spawnInterval = Math.max(500, this.spawnInterval - 25);
    }

    // Clean up destroyed animals
    this.animalTargets = this.animalTargets.filter((animal) => {
      if (!animal.active) {
        const pos = this.holePositions.find(
          (p) => Math.abs(p.x - animal.x) < 10 && Math.abs(p.y - animal.y) < 10
        );
        if (pos) pos.occupied = false;
        return false;
      }
      return true;
    });
  }

  spawnTargets(): void {
    const availablePositions = this.holePositions.filter((p) => !p.occupied);
    if (availablePositions.length === 0) return;

    const position = Phaser.Utils.Array.GetRandom(availablePositions);
    position.occupied = true;

    const animalTypes: AnimalType[] = ['bunny', 'squirrel', 'hedgehog', 'mole'];
    const animalType = Phaser.Utils.Array.GetRandom(animalTypes);

    const animal = new AnimalTarget(this.scene, {
      id: `animal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: position.x,
      y: position.y,
      width: 80,
      height: 80,
      points: 10,
      animalType,
    });

    // Listen for miss
    animal.on('miss', () => {
      this.onTargetHit(animal.targetId, 0, 0, false);
      const pos = this.holePositions.find(
        (p) => Math.abs(p.x - animal.x) < 10 && Math.abs(p.y - animal.y) < 10
      );
      if (pos) pos.occupied = false;

      const index = this.animalTargets.indexOf(animal);
      if (index > -1) {
        this.animalTargets.splice(index, 1);
      }
      this.targets.delete(animal.targetId);
    });

    this.animalTargets.push(animal);
    this.addTarget(animal);
  }

  handleAnimalHit(animalId: string, playerNumber: number): boolean {
    const animal = this.animalTargets.find((a) => a.targetId === animalId);
    if (!animal || !animal.active) return false;

    const result = animal.hit(playerNumber);
    if (!result.correct) return false;

    animal.playHitAnimation(true, () => {
      this.targets.delete(animalId);
    });

    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    // Show cute feedback
    this.showHitFeedback(animal.x, animal.y, animal.getAnimalType());

    // Free up position
    const pos = this.holePositions.find(
      (p) => Math.abs(p.x - animal.x) < 10 && Math.abs(p.y - animal.y) < 10
    );
    if (pos) pos.occupied = false;

    const index = this.animalTargets.indexOf(animal);
    if (index > -1) {
      this.animalTargets.splice(index, 1);
    }

    return true;
  }

  private showHitFeedback(x: number, y: number, animalType: AnimalType): void {
    const messages: Record<AnimalType, string> = {
      bunny: 'HOP!',
      squirrel: 'NUTS!',
      hedgehog: 'PRICKLY!',
      mole: 'DIG IT!',
    };

    const text = this.scene.add.text(x, y - 50, messages[animalType], {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#8b4513',
      strokeThickness: 3,
    }).setOrigin(0.5);
    text.setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  destroy(): void {
    this.animalTargets = [];
    this.holePositions.forEach((p) => (p.occupied = false));
    super.destroy();
  }
}
