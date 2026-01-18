import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { MathTarget } from '../objects/MathTarget';

export interface MathProblemsConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

interface MathProblem {
  num1: number;
  num2: number;
  operator: '+' | '-' | '×';
  answer: number;
}

export class MathProblems extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private currentProblem: MathProblem | null = null;
  private answerTargets: MathTarget[] = [];
  private problemText!: Phaser.GameObjects.Text;
  private roundNumber: number = 0;
  private maxRounds: number;
  private difficulty: number = 1;
  private wrongAnswers: number = 0;

  constructor(config: MathProblemsConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.maxRounds = config.quota;

    this.createUI();
    this.startRound();
  }

  private createUI(): void {
    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 40, 'MATH ATTACK!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#9b59b6',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Problem display area
    const problemBg = this.scene.add.rectangle(
      this.screenWidth / 2,
      150,
      400,
      100,
      0x2c3e50,
      0.9
    );
    problemBg.setStrokeStyle(4, 0x34495e);
    problemBg.setDepth(50);

    // Problem text
    this.problemText = this.scene.add.text(this.screenWidth / 2, 150, '', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.problemText.setDepth(51);

    // Instructions
    const instructions = this.scene.add.text(this.screenWidth / 2, 220, 'Shoot the correct answer!', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#bdc3c7',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    instructions.setDepth(50);
  }

  private generateProblem(): MathProblem {
    const operators: Array<'+' | '-' | '×'> = ['+', '-', '×'];
    let operator = operators[Math.min(this.difficulty - 1, 2)];

    // Mix it up after difficulty 3
    if (this.difficulty > 3) {
      operator = Phaser.Utils.Array.GetRandom(operators);
    }

    let num1: number, num2: number, answer: number;
    const maxNum = Math.min(5 + this.difficulty * 2, 20);

    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * maxNum) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * maxNum) + 5;
        num2 = Math.floor(Math.random() * Math.min(num1, maxNum)) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * Math.min(maxNum, 10)) + 1;
        num2 = Math.floor(Math.random() * Math.min(maxNum, 10)) + 1;
        answer = num1 * num2;
        break;
    }

    return { num1, num2, operator, answer };
  }

  private generateWrongAnswers(correctAnswer: number): number[] {
    const wrongAnswers: number[] = [];
    const offsets = [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10];

    while (wrongAnswers.length < 3) {
      const offset = Phaser.Utils.Array.GetRandom(offsets);
      const wrong = correctAnswer + offset;

      if (wrong > 0 && wrong !== correctAnswer && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong);
      }
    }

    return wrongAnswers;
  }

  private startRound(): void {
    // Clear previous targets
    this.answerTargets.forEach((target) => {
      if (target.active) target.destroy();
    });
    this.answerTargets = [];
    this.targets.clear();

    // Generate new problem
    this.currentProblem = this.generateProblem();

    // Display problem
    this.problemText.setText(
      `${this.currentProblem.num1} ${this.currentProblem.operator} ${this.currentProblem.num2} = ?`
    );

    // Generate answers
    const wrongAnswers = this.generateWrongAnswers(this.currentProblem.answer);
    const allAnswers = [this.currentProblem.answer, ...wrongAnswers];

    // Shuffle answers
    Phaser.Utils.Array.Shuffle(allAnswers);

    // Create answer targets in a grid
    const positions = [
      { x: this.screenWidth / 2 - 150, y: 350 },
      { x: this.screenWidth / 2 + 150, y: 350 },
      { x: this.screenWidth / 2 - 150, y: 450 },
      { x: this.screenWidth / 2 + 150, y: 450 },
    ];

    allAnswers.forEach((answer, index) => {
      const isCorrect = answer === this.currentProblem!.answer;

      const target = new MathTarget(this.scene, {
        id: `math-${this.roundNumber}-${index}`,
        x: positions[index].x,
        y: positions[index].y,
        width: 80,
        height: 60,
        points: 50 + this.difficulty * 10,
        answer,
        isCorrect,
      });

      this.answerTargets.push(target);
      this.addTarget(target);
    });

    // Increase difficulty every 3 rounds
    if (this.roundNumber > 0 && this.roundNumber % 3 === 0) {
      this.difficulty++;
    }
  }

  update(_delta: number): void {
    // Math problems are event-driven, no continuous updates needed
  }

  spawnTargets(): void {
    // Targets are spawned via startRound
  }

  handleMathHit(targetId: string, playerNumber: number): { success: boolean; correct: boolean; points: number } {
    const target = this.answerTargets.find((t) => t.targetId === targetId);
    if (!target || !target.active) {
      return { success: false, correct: false, points: 0 };
    }

    const isCorrect = target.isCorrectAnswer();

    // Play animation on hit target
    target.playHitAnimation(isCorrect, () => {
      this.targets.delete(targetId);
    });

    if (isCorrect) {
      // Correct! Destroy all other targets and move to next round
      this.answerTargets.forEach((t) => {
        if (t.targetId !== targetId && t.active) {
          t.alpha = 0.5;
          this.scene.tweens.add({
            targets: t,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              this.targets.delete(t.targetId);
              t.destroy();
            },
          });
        }
      });

      this.quotaMet++;
      this.onQuotaUpdate(this.quotaMet, this.quota);
      this.showCorrectFeedback();

      this.roundNumber++;

      // Start next round after delay
      if (this.roundNumber < this.maxRounds) {
        this.scene.time.delayedCall(1000, () => {
          this.startRound();
        });
      }

      return { success: true, correct: true, points: target.hit(playerNumber).points };
    } else {
      // Wrong answer - penalty
      this.wrongAnswers++;
      this.onTargetHit(targetId, playerNumber, -50, false);
      this.showWrongFeedback();

      return { success: true, correct: false, points: -50 };
    }
  }

  private showCorrectFeedback(): void {
    const feedback = this.scene.add.text(this.screenWidth / 2, 280, 'CORRECT!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#2ecc71',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    feedback.setDepth(200);

    this.scene.tweens.add({
      targets: feedback,
      y: 260,
      alpha: 0,
      scale: 1.3,
      duration: 800,
      onComplete: () => feedback.destroy(),
    });
  }

  private showWrongFeedback(): void {
    const feedback = this.scene.add.text(this.screenWidth / 2, 280, 'WRONG!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    feedback.setDepth(200);

    this.scene.cameras.main.shake(200, 0.01);

    this.scene.tweens.add({
      targets: feedback,
      y: 260,
      alpha: 0,
      scale: 1.3,
      duration: 800,
      onComplete: () => feedback.destroy(),
    });
  }

  getWrongAnswers(): number {
    return this.wrongAnswers;
  }

  destroy(): void {
    this.answerTargets = [];
    super.destroy();
  }
}
