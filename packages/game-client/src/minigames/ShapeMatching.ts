import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { Target, type TargetConfig } from '../objects/Target';

export interface ShapeMatchingConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon';

class ShapeTarget extends Target {
  private shapeType: ShapeType;
  private shapeColor: number;
  private shapeGraphics!: Phaser.GameObjects.Graphics;
  private isTarget: boolean;

  constructor(scene: Phaser.Scene, config: TargetConfig & { shapeType: ShapeType; shapeColor: number; isTarget: boolean }) {
    super(scene, config);
    this.shapeType = config.shapeType;
    this.shapeColor = config.shapeColor;
    this.isTarget = config.isTarget;
    this.createVisuals();
  }

  createVisuals(): void {
    // Background circle
    const bg = this.scene.add.circle(0, 0, 40, 0x2c3e50);
    bg.setStrokeStyle(3, this.isTarget ? 0xf1c40f : 0x34495e);
    this.add(bg);

    // Shape
    this.shapeGraphics = this.scene.add.graphics();
    this.shapeGraphics.fillStyle(this.shapeColor);
    this.shapeGraphics.lineStyle(2, 0xffffff);

    this.drawShape();
    this.add(this.shapeGraphics);

    this.hitCircle = this.scene.add.circle(0, 0, 40, 0x000000, 0);
    this.add(this.hitCircle);

    // Pop-in animation
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  private drawShape(): void {
    const size = 25;

    switch (this.shapeType) {
      case 'circle':
        this.shapeGraphics.fillCircle(0, 0, size);
        this.shapeGraphics.strokeCircle(0, 0, size);
        break;
      case 'square':
        this.shapeGraphics.fillRect(-size, -size, size * 2, size * 2);
        this.shapeGraphics.strokeRect(-size, -size, size * 2, size * 2);
        break;
      case 'triangle':
        this.shapeGraphics.fillTriangle(0, -size, -size, size, size, size);
        this.shapeGraphics.strokeTriangle(0, -size, -size, size, size, size);
        break;
      case 'star':
        this.drawStar(size);
        break;
      case 'diamond':
        this.shapeGraphics.fillPoints([
          { x: 0, y: -size },
          { x: size, y: 0 },
          { x: 0, y: size },
          { x: -size, y: 0 },
        ], true);
        this.shapeGraphics.strokePoints([
          { x: 0, y: -size },
          { x: size, y: 0 },
          { x: 0, y: size },
          { x: -size, y: 0 },
        ], true);
        break;
      case 'hexagon':
        this.drawHexagon(size);
        break;
    }
  }

  private drawStar(size: number): void {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? size : size * 0.5;
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    this.shapeGraphics.fillPoints(points, true);
    this.shapeGraphics.strokePoints(points, true);
  }

  private drawHexagon(size: number): void {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2;
      points.push({ x: Math.cos(angle) * size, y: Math.sin(angle) * size });
    }
    this.shapeGraphics.fillPoints(points, true);
    this.shapeGraphics.strokePoints(points, true);
  }

  hit(_playerNumber: number): { points: number; correct: boolean } {
    this.isActive = false;
    return { points: this.isTarget ? this.points : -25, correct: this.isTarget };
  }

  playHitAnimation(correct: boolean, onComplete?: () => void): void {
    if (correct) {
      this.scene.tweens.add({
        targets: this,
        scale: 1.5,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    } else {
      this.scene.tweens.add({
        targets: this,
        x: this.x + 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 300,
        delay: 200,
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    }
  }

  getShapeType(): ShapeType {
    return this.shapeType;
  }

  isTargetShape(): boolean {
    return this.isTarget;
  }

  getHitRadius(): number {
    return 40;
  }
}

export class ShapeMatching extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private targetShape: ShapeType = 'circle';
  private targetColor: number = 0xff4444;
  private shapeTargets: ShapeTarget[] = [];
  private roundNumber: number = 0;
  private maxRounds: number;
  private displayShape!: Phaser.GameObjects.Container;
  private instructionText!: Phaser.GameObjects.Text;

  private shapes: ShapeType[] = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'];
  private colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22];

  constructor(config: ShapeMatchingConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.maxRounds = config.quota;

    this.createUI();
    this.startRound();
  }

  private createUI(): void {
    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 30, 'SHAPE MATCH', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#1abc9c',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Instruction
    this.instructionText = this.scene.add.text(this.screenWidth / 2, 70, 'Shoot the matching shape!', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.instructionText.setDepth(100);

    // Target shape display container
    this.displayShape = this.scene.add.container(this.screenWidth / 2, 140);
    this.displayShape.setDepth(50);

    // Background for target shape
    const displayBg = this.scene.add.rectangle(0, 0, 120, 120, 0x1a252f);
    displayBg.setStrokeStyle(4, 0xf1c40f);
    this.displayShape.add(displayBg);
  }

  private pickRandomTarget(): void {
    this.targetShape = Phaser.Utils.Array.GetRandom(this.shapes);
    this.targetColor = Phaser.Utils.Array.GetRandom(this.colors);
  }

  private updateDisplayShape(): void {
    // Remove old shape display
    if (this.displayShape.length > 1) {
      this.displayShape.removeAt(1);
    }

    // Draw the target shape
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(this.targetColor);
    graphics.lineStyle(2, 0xffffff);

    const size = 35;
    switch (this.targetShape) {
      case 'circle':
        graphics.fillCircle(0, 0, size);
        graphics.strokeCircle(0, 0, size);
        break;
      case 'square':
        graphics.fillRect(-size, -size, size * 2, size * 2);
        graphics.strokeRect(-size, -size, size * 2, size * 2);
        break;
      case 'triangle':
        graphics.fillTriangle(0, -size, -size, size, size, size);
        graphics.strokeTriangle(0, -size, -size, size, size, size);
        break;
      case 'star':
        const starPoints: { x: number; y: number }[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? size : size * 0.5;
          starPoints.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
        graphics.fillPoints(starPoints, true);
        graphics.strokePoints(starPoints, true);
        break;
      case 'diamond':
        graphics.fillPoints([
          { x: 0, y: -size }, { x: size, y: 0 }, { x: 0, y: size }, { x: -size, y: 0 },
        ], true);
        graphics.strokePoints([
          { x: 0, y: -size }, { x: size, y: 0 }, { x: 0, y: size }, { x: -size, y: 0 },
        ], true);
        break;
      case 'hexagon':
        const hexPoints: { x: number; y: number }[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 2;
          hexPoints.push({ x: Math.cos(angle) * size, y: Math.sin(angle) * size });
        }
        graphics.fillPoints(hexPoints, true);
        graphics.strokePoints(hexPoints, true);
        break;
    }

    this.displayShape.add(graphics);
  }

  private startRound(): void {
    // Clear previous targets
    this.shapeTargets.forEach((t) => {
      if (t.active) t.destroy();
    });
    this.shapeTargets = [];
    this.targets.clear();

    // Pick new target
    this.pickRandomTarget();
    this.updateDisplayShape();

    // Create shape options (1-2 correct, rest distractors)
    const numShapes = Math.min(6, 4 + Math.floor(this.roundNumber / 2));
    const numCorrect = Math.random() > 0.5 ? 2 : 1;

    const allShapes: Array<{ shape: ShapeType; color: number; isTarget: boolean }> = [];

    // Add correct shapes
    for (let i = 0; i < numCorrect; i++) {
      allShapes.push({ shape: this.targetShape, color: this.targetColor, isTarget: true });
    }

    // Add distractors
    while (allShapes.length < numShapes) {
      const shape = Phaser.Utils.Array.GetRandom(this.shapes);
      const color = Phaser.Utils.Array.GetRandom(this.colors);

      // Make sure it's different from target
      if (shape !== this.targetShape || color !== this.targetColor) {
        allShapes.push({ shape, color, isTarget: false });
      }
    }

    // Shuffle and place
    Phaser.Utils.Array.Shuffle(allShapes);

    const cols = Math.ceil(Math.sqrt(numShapes));
    const startX = this.screenWidth / 2 - ((cols - 1) * 100) / 2;
    const startY = 280;

    allShapes.forEach((data, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const target = new ShapeTarget(this.scene, {
        id: `shape-${this.roundNumber}-${index}`,
        x: startX + col * 100,
        y: startY + row * 100,
        width: 80,
        height: 80,
        points: 25,
        shapeType: data.shape,
        shapeColor: data.color,
        isTarget: data.isTarget,
      });

      this.shapeTargets.push(target);
      this.addTarget(target);
    });
  }

  update(_delta: number): void {
    // Shape matching is event-driven
  }

  spawnTargets(): void {
    // Managed via startRound
  }

  handleShapeHit(targetId: string, playerNumber: number): { success: boolean; correct: boolean; points: number } {
    const target = this.shapeTargets.find((t) => t.targetId === targetId);
    if (!target || !target.active) {
      return { success: false, correct: false, points: 0 };
    }

    const result = target.hit(playerNumber);

    target.playHitAnimation(result.correct, () => {
      this.targets.delete(targetId);
    });

    const index = this.shapeTargets.indexOf(target);
    if (index > -1) {
      this.shapeTargets.splice(index, 1);
    }

    if (result.correct) {
      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);
      this.showFeedback(target.x, target.y, true);

      // Check if all correct shapes hit
      const remainingCorrect = this.shapeTargets.filter((t) => t.active && t.isTargetShape());
      if (remainingCorrect.length === 0) {
        this.roundNumber++;
        if (this.roundNumber < this.maxRounds) {
          this.scene.time.delayedCall(500, () => {
            this.startRound();
          });
        }
      }

      return { success: true, correct: true, points: result.points };
    } else {
      this.onTargetHit(targetId, playerNumber, -25, false);
      this.showFeedback(target.x, target.y, false);
      return { success: true, correct: false, points: -25 };
    }
  }

  private showFeedback(x: number, y: number, correct: boolean): void {
    const text = correct ? 'MATCH!' : 'WRONG!';
    const color = correct ? '#2ecc71' : '#e74c3c';

    const feedback = this.scene.add.text(x, y - 50, text, {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    feedback.setDepth(200);

    this.scene.tweens.add({
      targets: feedback,
      y: y - 90,
      alpha: 0,
      duration: 600,
      onComplete: () => feedback.destroy(),
    });
  }

  destroy(): void {
    this.shapeTargets = [];
    super.destroy();
  }
}
