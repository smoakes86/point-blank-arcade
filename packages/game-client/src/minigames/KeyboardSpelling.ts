import Phaser from 'phaser';
import { MiniGame, type MiniGameConfig } from './MiniGame';
import { LetterTarget } from '../objects/LetterTarget';

export interface KeyboardSpellingConfig extends MiniGameConfig {
  screenWidth: number;
  screenHeight: number;
}

const WORD_LIST = [
  'CAT', 'DOG', 'SUN', 'RUN', 'FUN',
  'PLAY', 'GAME', 'SHOT', 'BANG', 'FIRE',
  'POINT', 'BLANK', 'SCORE', 'SHOOT', 'QUICK',
  'ARCADE', 'TARGET', 'PLAYER', 'WINNER',
];

export class KeyboardSpelling extends MiniGame {
  private screenWidth: number;
  private screenHeight: number;
  private currentWord: string = '';
  private currentLetterIndex: number = 0;
  private letterTargets: LetterTarget[] = [];
  private wordDisplay!: Phaser.GameObjects.Text;
  private progressDisplay!: Phaser.GameObjects.Text;
  private roundNumber: number = 0;
  private maxRounds: number;
  private wrongLetters: number = 0;

  constructor(config: KeyboardSpellingConfig) {
    super(config);
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.maxRounds = config.quota;

    this.createUI();
    this.startRound();
  }

  private createUI(): void {
    // Title
    const title = this.scene.add.text(this.screenWidth / 2, 40, 'SPELL IT OUT!', {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#e67e22',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    title.setDepth(100);

    // Word to spell display
    const wordBg = this.scene.add.rectangle(
      this.screenWidth / 2,
      120,
      500,
      80,
      0x2c3e50,
      0.9
    );
    wordBg.setStrokeStyle(4, 0x34495e);
    wordBg.setDepth(50);

    this.wordDisplay = this.scene.add.text(this.screenWidth / 2, 120, '', {
      fontFamily: 'Courier New',
      fontSize: '48px',
      color: '#ffffff',
      letterSpacing: 10,
    }).setOrigin(0.5);
    this.wordDisplay.setDepth(51);

    // Progress display
    this.progressDisplay = this.scene.add.text(this.screenWidth / 2, 170, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#27ae60',
    }).setOrigin(0.5);
    this.progressDisplay.setDepth(51);

    // Instructions
    const instructions = this.scene.add.text(this.screenWidth / 2, 210, 'Shoot the letters in order!', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#bdc3c7',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    instructions.setDepth(50);
  }

  private getRandomWord(): string {
    // Get harder words as rounds progress
    const maxLength = Math.min(3 + Math.floor(this.roundNumber / 2), 7);
    const eligibleWords = WORD_LIST.filter((w) => w.length <= maxLength);
    return Phaser.Utils.Array.GetRandom(eligibleWords);
  }

  private startRound(): void {
    // Clear previous targets
    this.letterTargets.forEach((target) => {
      if (target.active) target.destroy();
    });
    this.letterTargets = [];
    this.targets.clear();

    // Get new word
    this.currentWord = this.getRandomWord();
    this.currentLetterIndex = 0;

    // Update displays
    this.updateWordDisplay();

    // Create scrambled keyboard layout with word letters
    this.createLetterKeyboard();
  }

  private updateWordDisplay(): void {
    // Show word with completed letters highlighted
    let displayText = '';
    for (let i = 0; i < this.currentWord.length; i++) {
      if (i < this.currentLetterIndex) {
        displayText += this.currentWord[i];
      } else if (i === this.currentLetterIndex) {
        displayText += `[${this.currentWord[i]}]`;
      } else {
        displayText += '_';
      }
    }
    this.wordDisplay.setText(displayText);
    this.progressDisplay.setText(`Word ${this.roundNumber + 1} of ${this.maxRounds}`);
  }

  private createLetterKeyboard(): void {
    // Get all letters needed for the word (including duplicates)
    const wordLetters = this.currentWord.split('');

    // Add some random distractor letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const distractors: string[] = [];
    const numDistractors = Math.min(8, 12 - wordLetters.length);

    while (distractors.length < numDistractors) {
      const letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!wordLetters.includes(letter) && !distractors.includes(letter)) {
        distractors.push(letter);
      }
    }

    // Combine and shuffle all letters
    const allLetters = [...wordLetters, ...distractors];
    Phaser.Utils.Array.Shuffle(allLetters);

    // Create grid layout
    const cols = Math.ceil(Math.sqrt(allLetters.length));
    const rows = Math.ceil(allLetters.length / cols);
    const startX = this.screenWidth / 2 - ((cols - 1) * 70) / 2;
    const startY = 320;
    const spacingX = 70;
    const spacingY = 70;

    allLetters.forEach((letter, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      // Check if this is the next letter to type
      const isNextLetter = letter === this.currentWord[this.currentLetterIndex] &&
        !this.letterTargets.some((t) => t.getLetter() === letter && t.isCorrectLetter());

      // For duplicate letters in the word, only highlight the first unshot one
      const letterInWord = this.currentWord.includes(letter);
      let shouldHighlight = false;
      if (letterInWord && this.currentLetterIndex < this.currentWord.length) {
        shouldHighlight = letter === this.currentWord[this.currentLetterIndex];
      }

      const target = new LetterTarget(this.scene, {
        id: `letter-${this.roundNumber}-${index}`,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        width: 55,
        height: 55,
        points: 20,
        letter,
        isNextLetter: shouldHighlight,
      });

      this.letterTargets.push(target);
      this.addTarget(target);
    });
  }

  private updateLetterHighlights(): void {
    const nextLetter = this.currentWord[this.currentLetterIndex];

    // Find the first unhit letter that matches
    let found = false;
    this.letterTargets.forEach((target) => {
      if (target.active) {
        if (!found && target.getLetter() === nextLetter) {
          target.setAsNextLetter(true);
          found = true;
        } else {
          target.setAsNextLetter(false);
        }
      }
    });
  }

  update(_delta: number): void {
    // Keyboard spelling is event-driven
  }

  spawnTargets(): void {
    // Targets are spawned via startRound
  }

  handleLetterHit(targetId: string, playerNumber: number): { success: boolean; correct: boolean; points: number } {
    const target = this.letterTargets.find((t) => t.targetId === targetId);
    if (!target || !target.active) {
      return { success: false, correct: false, points: 0 };
    }

    const isCorrect = target.isCorrectLetter();
    const letter = target.getLetter();

    target.playHitAnimation(isCorrect, () => {
      this.targets.delete(targetId);
    });

    // Remove from tracking
    const index = this.letterTargets.indexOf(target);
    if (index > -1) {
      this.letterTargets.splice(index, 1);
    }

    if (isCorrect) {
      // Move to next letter
      this.currentLetterIndex++;
      this.updateWordDisplay();
      this.showLetterFeedback(target.x, target.y, letter, true);

      // Check if word is complete
      if (this.currentLetterIndex >= this.currentWord.length) {
        this.onWordComplete();
      } else {
        // Update which letter is highlighted
        this.updateLetterHighlights();
      }

      return { success: true, correct: true, points: 20 };
    } else {
      // Wrong letter
      this.wrongLetters++;
      this.onTargetHit(targetId, playerNumber, -25, false);
      this.showLetterFeedback(target.x, target.y, letter, false);

      return { success: true, correct: false, points: -25 };
    }
  }

  private showLetterFeedback(x: number, y: number, letter: string, correct: boolean): void {
    const color = correct ? '#27ae60' : '#e74c3c';
    const text = correct ? letter : '✗';

    const feedback = this.scene.add.text(x, y - 40, text, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    feedback.setDepth(200);

    this.scene.tweens.add({
      targets: feedback,
      y: y - 80,
      alpha: 0,
      duration: 500,
      onComplete: () => feedback.destroy(),
    });
  }

  private onWordComplete(): void {
    // Word spelled correctly!
    this.quotaMet++;
    this.onQuotaUpdate(this.quotaMet, this.quota);

    // Show celebration
    const complete = this.scene.add.text(this.screenWidth / 2, this.screenHeight / 2, this.currentWord + '!', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    complete.setDepth(300);

    this.scene.tweens.add({
      targets: complete,
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      onComplete: () => complete.destroy(),
    });

    this.roundNumber++;

    // Start next round
    if (this.roundNumber < this.maxRounds) {
      this.scene.time.delayedCall(1200, () => {
        this.startRound();
      });
    }
  }

  getWrongLetters(): number {
    return this.wrongLetters;
  }

  destroy(): void {
    this.letterTargets = [];
    super.destroy();
  }
}
