# Point Blank Arcade Game - Ralph Loop Task Document

## Project Overview

Build a browser-based recreation of Namco's Point Blank (1994) arcade game where:
- **Game Display**: Runs on a TV/monitor browser (Phaser 3 game engine)
- **Phone Controllers**: Players use their phones as light guns (gyroscope aiming)
- **Multiplayer**: Colyseus server syncs 1-4 players in real-time
- **Mini-Games**: 50+ rapid-fire skill challenges (speed, accuracy, memory, intelligence)

## Current State Summary

### Already Implemented (Phases 1-12)
- Monorepo structure (pnpm workspaces)
- Shared types/constants (`shared/`)
- Colyseus server with GameRoom (`packages/server/`)
- Phone controller with gyroscope aiming (`packages/phone-controller/`)
- **Game client with Phaser 3** (`packages/game-client/`)
  - All scenes: Boot, Lobby, ModeSelect, StageSelect, Game, Results, GameOver
  - NetworkService for Colyseus connection
  - AudioService with synthesized sounds
- **Target system with 10+ target types:**
  - ColorTarget, BombTarget, BullseyeTarget
  - CardboardTarget (robber/civilian/bandit/townsperson)
  - CuckooTarget, LeafTarget
  - NumberTarget, CardTarget
  - MeteorTarget, TreasureChestTarget
- **Mini-game implementations:**
  - ColorTargetBlitz, NumberSequence, CardMatching
- Game mode configurations (training, beginner, expert, veryhard)
- 16 mini-game definitions in constants

### Still Needs Work (Phases 13-15)
- Additional mini-game implementations
- QR code room joining
- Dr. Don/Dr. Dan character sprites
- Visual polish and particle effects
- End-to-end testing
- Production deployment

---

## Development Phases

### PHASE 1: Game Client Foundation
**Goal**: Get Phaser 3 rendering with basic Colyseus connection

Tasks:
1. Set up Phaser 3 in `packages/game-client/src/main.ts`
2. Create scene structure: BootScene, LobbyScene, GameScene
3. Connect to Colyseus server and display room code
4. Show player cursors based on `aimX`/`aimY` from server state
5. Display player colors and names in lobby

**Completion Criteria**: Room code visible, player cursors move when phones aim

---

### PHASE 2: Game Flow Screens
**Goal**: Implement full game flow navigation

Tasks:
1. LobbyScene: Show room code, QR code, connected players, "Start" button
2. ModeSelectScene: Display 4 difficulty options, 20-second timer
3. StageSelectScene: Show 4 available stages, 10-second timer
4. ResultsScene: Show pass/fail, scores, lives remaining
5. GameOverScene: Final rankings

**Completion Criteria**: Full flow from lobby → mode → stage → play → results → next stage

---

### PHASE 3: Target System & Color Target Blitz
**Goal**: Complete first playable mini-game

Tasks:
1. Create Target base class with spawn/hit/destroy animations
2. Implement ColorTarget that shows player colors
3. Render targets from server state in real-time
4. Show hit effects (explosion, score popup)
5. Add quota progress bar and timer display
6. Implement bomb targets (penalty for hitting)

**Completion Criteria**: Color Target Blitz fully playable with visual feedback

---

### PHASE 4: Speed Category Mini-Games
**Goal**: Implement remaining speed-based games

Tasks:
1. **Cuckoo Clock**: Birds pop from clock doors (whack-a-mole style)
2. **Leaf Shooting**: Falling leaves, shoot before they land
3. **Skeleton Coffins**: Skeletons pop from coffins
4. **Pop-up Animals**: Fuzzy animals appear/disappear from holes

**Completion Criteria**: 4 speed mini-games working with proper quotas

---

### PHASE 5: Accuracy Category Mini-Games
**Goal**: Precision shooting challenges

Tasks:
1. **Bullseye Targets**: Ring-based scoring (100/60/20 points)
2. **Single Bullet Challenge**: ONE shot, tiny moving target
3. **Target Range**: Classic shooting gallery with moving targets

**Completion Criteria**: Accuracy games with proper point-zone detection

---

### PHASE 6: Simulation Category Mini-Games
**Goal**: Friend-or-foe identification games

Tasks:
1. **Cardboard Cop Training**: Shoot robbers, avoid civilians
2. **Wild West Showdown**: Shoot bandits, spare townspeople
3. Implement life penalty for shooting wrong targets
4. Chest shots = 100 points, head shots = 60 points

**Completion Criteria**: Simulation games with correct/incorrect target logic

---

### PHASE 7: Intelligence Category Mini-Games
**Goal**: Puzzle-based shooting challenges

Tasks:
1. **Number Sequence**: Shoot 1-16 in scrambled order
2. **Math Problems**: Shoot correct answer to equations
3. **Keyboard Spelling**: Shoot letters to spell words
4. Wrong answer = lose life

**Completion Criteria**: Intelligence games with validation logic

---

### PHASE 8: Memory Category Mini-Games
**Goal**: Memory-based challenges

Tasks:
1. **Card Matching**: Classic memory game with shooting
2. **Spot the Difference**: Two images, shoot differences
3. **Sequence Recall**: Remember and repeat target order

**Completion Criteria**: Memory games with state tracking

---

### PHASE 9: Visual Acuity Mini-Games
**Goal**: Quick recognition challenges

Tasks:
1. **Shape Matching**: Shoot target matching displayed shape
2. **Size Comparison**: Shoot largest/smallest object
3. **Color Identification**: Rapidly identify correct colors

**Completion Criteria**: Visual games with comparison logic

---

### PHASE 10: Special/Protection Mini-Games
**Goal**: Unique challenge types

Tasks:
1. **Balloon Rescue**: Protect Dr. Don from vultures
2. **Meteor Strike**: Shoot meteors before Earth destruction
3. **Piranha Defense**: Shoot leaping fish
4. **Tank Assault**: Destroy approaching tanks
5. Create Dr. Don/Dr. Dan character sprites

**Completion Criteria**: Protection missions with fail states

---

### PHASE 11: Bonus Stages & Finale
**Goal**: Reward and celebration stages

Tasks:
1. **Treasure Chest** (after stage 8): Shoot chest for rewards
2. **Fireworks Finale** (after stage 16): Celebratory bonus shooting
3. Implement extra life rewards
4. Add Namco crossover stages (Galaxian/Galaga homage)

**Completion Criteria**: Bonus stages trigger at correct times

---

### PHASE 12: Audio System
**Goal**: Full sound design

Tasks:
1. Add satisfying gunshot sounds
2. Hit confirmation sounds (correct/wrong)
3. Timer warning escalation
4. Victory/failure fanfares
5. Background music per stage type
6. Announcer voice callouts

**Completion Criteria**: All actions have appropriate audio feedback

---

### PHASE 13: Polish & Effects
**Goal**: Arcade-quality visuals

Tasks:
1. Particle effects for hits/explosions
2. Screen shake on big impacts
3. Smooth target animations
4. Score popup animations
5. Player cursor trails
6. Screen flash on shoot
7. Countdown animations (3-2-1-GO!)

**Completion Criteria**: Visually polished arcade feel

---

### PHASE 14: Phone Controller Enhancements
**Goal**: Better mobile experience

Tasks:
1. Add haptic feedback patterns (hit/miss/penalty)
2. Improve gyroscope calibration flow
3. Add reload gesture (shoot off-screen)
4. Visual crosshair improvements
5. Connection status indicator
6. Battery/performance optimizations

**Completion Criteria**: Smooth, responsive phone controls

---

### PHASE 15: Final Integration & Testing
**Goal**: Production-ready game

Tasks:
1. End-to-end playtesting all 16+ mini-games
2. Balance difficulty multipliers
3. Fix edge cases and bugs
4. Performance optimization
5. Add high score system
6. Deploy to production server

**Completion Criteria**: Full game loop works for 1-4 players

---

## File Structure Reference

```
packages/
├── game-client/src/
│   ├── main.ts              # Phaser bootstrap
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── LobbyScene.ts
│   │   ├── ModeSelectScene.ts
│   │   ├── StageSelectScene.ts
│   │   ├── GameScene.ts
│   │   ├── ResultsScene.ts
│   │   └── GameOverScene.ts
│   ├── objects/
│   │   ├── Target.ts
│   │   ├── ColorTarget.ts
│   │   ├── BullseyeTarget.ts
│   │   ├── CardboardTarget.ts
│   │   └── ...
│   ├── minigames/
│   │   ├── ColorTargetBlitz.ts
│   │   ├── CuckooClock.ts
│   │   └── ...
│   └── services/
│       ├── NetworkService.ts
│       └── AudioService.ts
├── server/src/
│   ├── rooms/GameRoom.ts    # Main room logic
│   └── minigames/           # Server-side game logic
└── phone-controller/src/
    └── main.ts              # Phone controller app
```

---

## Important Conventions

1. **Coordinates**: Use normalized 0-1 for positions (server), convert to pixels in client
2. **Player Colors**: Always use PLAYER_COLORS from shared constants
3. **State Sync**: All game state flows through Colyseus schemas
4. **Mini-Game Pattern**: Server handles logic/quotas, client handles rendering
5. **TypeScript**: Strict types, no `any`

---

## How to Work

1. Start with the current phase (check what's implemented)
2. Implement tasks in order within the phase
3. Test each feature before moving on
4. Commit working code frequently
5. When phase complete, move to next phase

## Completion Signal

When ALL phases are complete and the game is fully playable:

<promise>POINT BLANK COMPLETE</promise>

---

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start all services (server + clients)
pnpm dev

# Or run individually:
pnpm dev:server      # Colyseus server on :3001
pnpm dev:game        # Game client on :5173
pnpm dev:controller  # Phone controller on :5174
```

---

*This document guides iterative development of Point Blank. Each phase builds on the previous. Focus on getting things working before polish.*
