# POINT BLANK
## Arcade Game Design Document

---

### GAME OVERVIEW

| **Attribute** | **Details** |
|---------------|-------------|
| **Title** | Point Blank (Gun Bullet / ガンバレット in Japan) |
| **Developer** | Namco |
| **Publisher** | Namco |
| **Release Date** | October 1994 (Japan) / January 1995 (Worldwide) |
| **Platform** | Arcade (Namco NB-1 Hardware) |
| **Genre** | Light Gun Shooter / Mini-Game Collection |
| **Players** | 1-2 Simultaneous |
| **Rating** | All Ages (Non-violent) |

---

## 1. GAME CONCEPT

Point Blank is a revolutionary light gun arcade game that combines the precision shooting mechanics of traditional gun games with the rapid-fire variety of a mini-game collection. Unlike violent shooters of its era, Point Blank presents a colorful, cartoonish world where players compete in skill-based shooting challenges that test accuracy, speed, quick thinking, memory, and reflexes.

The game features over 50 unique mini-games, each lasting between 5-30 seconds, creating an addictive arcade experience that encourages repeated play and competitive two-player showdowns.

### Core Design Philosophy
- **Non-Violent Fun**: Targets consist of inanimate objects, cardboard cutouts, and cartoon creatures rather than realistic enemies
- **Skill Variety**: Challenges test different abilities—speed, accuracy, memory, logic, and visual acuity
- **Accessibility**: Simple "shoot the target" mechanics make the game approachable for all ages and skill levels
- **Competition**: Two-player simultaneous play creates natural head-to-head rivalry
- **Replay Value**: Randomized stage selection and score-chasing encourage multiple playthroughs

---

## 2. CHARACTERS

### Dr. Don & Dr. Dan
The game's mascots and guides throughout the experience. These two mustachioed scientists (bearing a resemblance to Sesame Street's Bert and Ernie) serve multiple roles:

- **Tutorial Guides**: Appear at the start to explain game rules
- **In-Game Targets**: Players must protect them in various "rescue" missions
- **Comic Relief**: Often placed in absurd dangerous situations (hanging from balloons over shark-infested waters, tied to train tracks, etc.)
- **Visual Identity**: Their presence gives the game a consistent, friendly personality

**Visual Design:**
- Tall scientist with glasses and prominent mustache (Dr. Don - associated with Player 1/Red)
- Shorter scientist with similar features (Dr. Dan - associated with Player 2/Blue)
- Lab coats and comical expressions

---

## 3. HARDWARE SPECIFICATIONS

### Cabinet Design
| **Component** | **Specification** |
|---------------|-------------------|
| **Dimensions** | 780mm (W) × 900mm (D) × 2080mm (H) |
| **Weight** | 165 kg |
| **Monitor** | Hantarex 28" Polo Color Monitor with auto degauss |
| **Power Supply** | 220/240V AC |
| **Cabinet Style** | Upright |

### Light Gun System
Point Blank was Namco's first light gun game to feature:
- **Holstered Guns**: Two optical guns placed in holsters on the cabinet front (similar to Nintendo's PlayChoice-10 cabinets with Wild Gunman/Duck Hunt)
- **Pickup-and-Play**: Players retrieve guns from holsters rather than using cabinet-mounted weapons
- **Off-Screen Reload**: Players shoot off-screen to reload (a mechanic later reused in Time Crisis)
- **Color-Coded**: Player 1 gun = Red | Player 2 gun = Blue
- **1-Pixel Accuracy**: Engineering refinements achieved exceptional targeting precision

### Audio System
- **Speakers**: 4½" 20W speakers with shield cans
- **Powerful Array**: Designed to amplify shooting impacts for visceral feedback
- **Sound Design**: Emphasis on satisfying "hit" sounds and energetic music

### Hardware Platform
- **System Board**: Namco NB-1 Hardware
- **CPU**: MC68EC020
- **Notable Feature**: Ninth Namco game to allow scores not ending in "0"

---

## 4. GAME MODES

### Mode Structure

| **Mode** | **Stages** | **Difficulty** | **Description** |
|----------|------------|----------------|-----------------|
| **Training** | 4 | Easy | Tutorial mode for beginners |
| **Beginner** | 16 | Medium | Standard difficulty progression |
| **Expert/Advanced** | 16 | Hard | Increased quotas and faster timing |
| **Very Hard** | 16 | Extreme | Maximum difficulty, punishing requirements |

### Mode Selection
- Players have 20 seconds to select difficulty by shooting the desired mode
- Training Mode is recommended for first-time players
- Very Hard mode displays a red splash screen with flaming "VERY HARD" text as a warning

### Stage Progression
1. After selecting difficulty, players choose from 4 available stages
2. Stages are presented in groups of 4
3. Players may attempt stages in any order within each group
4. Upon completing stages 4, 8, and 12, the next group of 4 becomes available
5. 16 total stages in Beginner, Expert, and Very Hard modes

---

## 5. CORE GAMEPLAY MECHANICS

### Lives System
- Players start with **3 lives** (displayed as hearts)
- Lives can be lost by:
  - Failing to meet a stage's quota within the time limit
  - Shooting bombs
  - Shooting cardboard civilians or geisha girls
  - Letting Dr. Don/Dr. Dan die in protection missions
  - Shooting wrong answers in puzzle stages
  - Shooting the opponent's colored targets (2P mode)
  - Letting meteors destroy Earth
  - Running out of bullets in limited-ammo stages
  - Shooting incorrect differences in spot-the-difference stages
  - Various other stage-specific failures

### Ammunition
- **Most stages**: Unlimited bullets
- **Special stages**: Limited ammunition (adds strategic challenge)
- **Single-bullet stages**: One shot to hit a small or moving target

### Scoring System
- Points are awarded based on accuracy and speed
- Different targets have different point values
- Example: Cardboard human targets award 100 points for chest shots, 60 for headshots (realistic "center mass" training)
- Final ranking considers: Total points, lives remaining, continues used

### Two-Player Competition
- **Color Assignment**: Player 1 = Red targets | Player 2 = Blue targets
- **Competitive Scoring**: Players race to shoot their color first
- **Penalty**: Shooting opponent's color loses a life
- **Social Design**: Cabinet's dual guns encourage head-to-head play

---

## 6. STAGE CATEGORIES

Point Blank's 50+ mini-games fall into six primary categories:

### 6.1 SPEED STAGES
**Objective**: Shoot as many targets as possible within the time limit

**Examples:**
- **Color Target Blitz**: Rapidly shoot targets of your assigned color (red or blue)
- **Skeleton Coffins**: Shoot skeletons as they pop out of coffins
- **Cuckoo Clock**: Shoot cuckoo birds emerging from clock doors (Whack-a-Mole style)
- **Pop-up Animals**: Shoot fuzzy animals appearing and disappearing from hiding spots
- **Leaf Shooting**: Shoot falling leaves before they hit the ground

**Key Mechanics:**
- High quotas requiring rapid-fire shooting
- Button-mashing intensity
- Avoiding bombs mixed among targets

---

### 6.2 ACCURACY STAGES
**Objective**: Hit specific zones or targets with precision

**Examples:**
- **Bullseye Targets**: Hit the center rings for maximum points
- **Target Range**: Classic shooting gallery with moving bullseyes
- **Precision Points**: Shoot designated high-value zones
- **Single Bullet Challenge**: Hit a small, often moving target with ONE bullet
- **Sniper Shot**: Hit distant or tiny targets

**Key Mechanics:**
- Quality over quantity
- Steady aim required
- High-risk/high-reward scoring zones

---

### 6.3 SIMULATION STAGES
**Objective**: Shoot the correct targets while avoiding innocents

**Examples:**
- **Cardboard Cop Training**: Shoot cardboard robbers/criminals, avoid civilians
- **Ninja Dojo** (Japanese version): Shoot ninjas, avoid geishas
- **Good vs. Evil**: Identify and shoot "bad guy" cutouts among crowds
- **Wild West Showdown**: Shoot bandits, spare townspeople

**Key Mechanics:**
- Quick identification of friend vs. foe
- Penalty for shooting innocents (lose a life)
- Chest shots worth more than headshots (100 vs. 60 points)
- Realistic police/military training simulation

---

### 6.4 INTELLIGENCE STAGES
**Objective**: Solve puzzles or answer questions by shooting

**Examples:**
- **Number Sequence**: Shoot numbers 1-16 in order from a scrambled keypad
- **Keyboard Spelling**: Shoot keyboard keys to spell displayed words
- **Math Problems**: Shoot the correct answer to arithmetic questions
- **Counting Challenge**: Count objects and shoot the correct number
- **Pattern Recognition**: Identify and shoot the next item in a sequence

**Key Mechanics:**
- Mental processing under time pressure
- Wrong answers cost lives
- Tests cognitive skills alongside shooting accuracy

---

### 6.5 MEMORY STAGES
**Objective**: Remember and match targets

**Examples:**
- **Card Matching**: Classic memory game—shoot two cards to reveal and match pairs
- **Sequence Recall**: Memorize a sequence and shoot targets in the same order
- **Spot the Difference**: Compare two images and shoot the differences
- **Pattern Memory**: Remember which targets appeared and shoot them again

**Key Mechanics:**
- Memorization under pressure
- Limited reveals/attempts
- Penalty for incorrect matches

---

### 6.6 VISUAL ACUITY STAGES
**Objective**: Identify and shoot targets matching specific criteria

**Examples:**
- **Shape Matching**: Shoot the target that matches the displayed shape
- **Color Identification**: Rapidly identify correct colors among decoys
- **Size Comparison**: Shoot the largest/smallest object
- **Chinese Dragon**: Figure out which part of a fast-moving dragon to hit
- **Bouncing Balls**: Determine which balls to shoot to clear them all

**Key Mechanics:**
- Quick visual processing
- Distractor targets
- Pattern recognition

---

## 7. NOTABLE MINI-GAMES (DETAILED)

### 7.1 PROTECTION MISSIONS

#### Balloon Rescue
- **Setup**: Dr. Don/Dr. Dan floats on balloons over shark-infested waters
- **Objective**: Shoot vultures attacking the balloons
- **Fail State**: If balloons pop, doctor falls to sharks = lose life
- **Camera Abuse**: Failed protection sends doctor flying into the camera

#### Piranha Defense
- **Setup**: Dr. Don/Dr. Dan hangs from ropes over water
- **Objective**: Shoot leaping piranhas before they bite
- **Challenge**: Piranhas leap rapidly from multiple directions
- **Quota**: Must shoot set number (e.g., 30-52 depending on difficulty)

#### Tank Assault
- **Setup**: Tanks approach from the horizon toward Dr. Don/Dr. Dan
- **Objective**: Destroy tanks before they reach the doctors
- **Progression**: Tanks get faster and more numerous

#### Meteor Strike
- **Setup**: Meteors/fireballs fall toward Earth
- **Objective**: Shoot all meteors before impact
- **Fail State**: Earth is destroyed = lose life

#### Missile Defense
- **Setup**: Missiles launched at your position
- **Objective**: Shoot incoming missiles to detonate them safely

---

### 7.2 NAMCO CROSSOVER STAGES

#### Galaxian Stage
- **Homage**: Recreation of classic Namco shooter Galaxian
- **Mechanic**: Light gun replaces spaceship—shoot descending aliens
- **Quota**: Destroy set number of alien formations
- **Reference**: Direct tribute to 1979 arcade classic

#### Galaga Stage
- **Homage**: Recreation of Namco's 1981 sequel
- **Objective**: Shoot all 40 aliens
- **Perfect Bonus**: Shooting all 40 triggers "PERFECT!" message and original Galaga jingle
- **Nostalgia**: Faithful recreation for veteran Namco fans

---

### 7.3 DESTRUCTION STAGES

#### Car Demolition
- **Setup**: Stationary car on screen
- **Objective**: Shoot the car with a set number of bullets until it explodes
- **Visual Feedback**: Parts explode and fall off as damage accumulates
- **Limited Ammo**: Must be efficient with shots

#### Beehive Destruction
- **Setup**: Tree with multiple beehives
- **Objective**: Knock hives off tree, then shoot all emerging bees
- **Two-Phase**: Destruction phase → elimination phase

---

### 7.4 UNIQUE CHALLENGES

#### Single Bullet Sniper
- **Setup**: One bullet, one moving/small target
- **Challenge**: Miss = lose a life immediately
- **High Stakes**: Tests precision under extreme pressure

#### Keyboard Typing
- **Setup**: On-screen keyboard with displayed word
- **Objective**: Shoot keys to spell the word correctly
- **Time Pressure**: Must complete before timer expires

#### Number Keypad Scramble
- **Setup**: Randomized number pad (1-16)
- **Objective**: Shoot numbers in sequential order (1, 2, 3... 16)
- **Challenge**: Finding numbers quickly on scrambled layout

---

## 8. BONUS STAGES

### Mid-Game Treasure Chest
- **Trigger**: Appears after completing stage 8 (halfway point)
- **Setup**: Multiple treasure chests displayed
- **Mechanic**: Shoot one chest to reveal contents
- **Rewards**: 
  - Extra points
  - 1-Up (extra life)
  - Nothing (bad luck)
- **Risk/Reward**: Contents unknown until shot

### Fireworks Finale
- **Trigger**: Completing all 16 stages
- **Setup**: Firework launchers on screen
- **Objective**: Shoot as many launchers as possible in 5 seconds
- **Reward**: Each hit launches a firework explosion for bonus points
- **Thematic**: Celebratory "Fireworks of Victory" ending
- **No Penalty**: Cannot lose lives in this stage

---

## 9. VISUAL DESIGN

### Art Style
- **Colorful and Cartoony**: Bright, saturated colors throughout
- **Non-Threatening**: Designed to appeal to all ages
- **Comedic Elements**: Exaggerated expressions, slapstick situations
- **2D Sprites**: Clean, well-animated sprite work
- **Visual Clarity**: Targets are easily distinguishable from backgrounds

### Bomb Design
- **Appearance**: Classic cartoon bomb—black sphere with lit fuse and skull-and-crossbones marking
- **Visibility**: Designed to be visible but still tempting to anxious players
- **Placement**: Strategically mixed among valid targets

### Target Variety
Documented targets include:
- Bullseyes (red/blue colored)
- Cardboard criminals and civilians
- Ninjas and geishas (Japanese version)
- Skeletons in coffins
- Cuckoo clock birds
- Fuzzy animals
- Piranhas, sharks, vultures
- Tanks, missiles, meteors
- Leaves, apples, balls
- Cars, bottles, UFOs
- Treasure chests
- Keyboard keys, number pads
- Playing cards
- Galaxian/Galaga aliens

---

## 10. AUDIO DESIGN

### Sound Effects
- **Gunshot Feedback**: Satisfying "bang" with each trigger pull
- **Hit Confirmation**: Distinct sound for successful target hits
- **Miss/Penalty**: Warning sound for bombs or wrong targets
- **Timer Warnings**: Escalating tension as time runs low

### Music
- **Upbeat Tempo**: Energetic tracks matching frantic gameplay
- **Stage Variety**: Different themes for different stage types
- **Victory Fanfare**: Celebratory music for stage completion
- **Namco Jingles**: Classic sounds in crossover stages

### Voice
- **Announcer**: Enthusiastic voice calls out objectives and results
- **Dr. Don/Dr. Dan**: Comedic vocalizations when in danger or rescued

---

## 11. SCORING & RANKING

### Point Values (Examples)
| **Action** | **Points** |
|------------|------------|
| Cardboard target (chest) | 100 |
| Cardboard target (head) | 60 |
| Bullseye (center) | 100 |
| Bullseye (outer ring) | 20-50 |
| Speed target | 10-50 |
| Bonus stage hits | Variable |

### End-Game Ranking
Upon completion, players are ranked based on:
1. Total points accumulated
2. Lives remaining
3. Continues used

### Rank Messages
- **Excellent Performance**: "Advance to higher difficulty!"
- **Good Performance**: "Try head-to-head with a friend!"
- **Struggling**: "Return to lower difficulty"
- **Poor Performance**: "Practice more!"

### High Score Entry
- **Unique Feature**: Even the name entry is a mini-game
- **Mechanic**: Shoot letters to spell your initials
- **Consistent Design**: Maintains gameplay throughout entire experience

---

## 12. PLAYER PSYCHOLOGY & GAME FLOW

### Session Structure
1. **Attract Mode**: Demo plays showing gameplay variety
2. **Coin Insert**: Credit added
3. **Calibration**: Guns calibrated before play
4. **Mode Selection**: 20 seconds to choose difficulty
5. **Stage Selection**: 10 seconds to pick from 4 stages
6. **Gameplay**: 5-30 second mini-game
7. **Results**: Score display, pass/fail
8. **Loop**: Return to stage selection (or game over)
9. **Bonus Stage**: After stage 8
10. **Finale**: Fireworks after stage 16
11. **Ranking**: Final score evaluation
12. **High Score**: Name entry if qualified

### Addiction Loop
- **Short Sessions**: Each mini-game is bite-sized (20-30 seconds)
- **Variety**: No two consecutive stages feel the same
- **Progression**: Unlocking new stage groups creates momentum
- **Competition**: Two-player mode encourages "one more game"
- **Mastery**: Score-chasing and quota-beating drive replay

### Difficulty Curve
- **Training**: Gentle introduction, low quotas
- **Beginner**: Fair challenge, reasonable timing
- **Expert**: Tighter windows, higher quotas
- **Very Hard**: Near-impossible quotas requiring 100% accuracy

---

## 13. TECHNICAL NOTES

### Cabinet Maintenance
- **Gun Calibration**: Required periodically via test mode
- **Test Mode Access**: Slide test switch to "ON" behind coin door
- **Service Button**: Steps through test screens
- **Volume Adjustment**: Accessible via service panel

### Regional Differences
- **Title**: "Point Blank" (Western) / "Gun Bullet" (Japan)
- **Simulation Stages**: Robbers/civilians (Western) / Ninjas/geishas (Japan)
- **Artwork**: Different cabinet art and marquee designs

---

## 14. LEGACY & IMPACT

### Industry Influence
- Pioneered the "mini-game collection" approach to light gun games
- Influenced family-friendly arcade design philosophy
- Established the off-screen reload mechanic later used in Time Crisis
- Proved non-violent shooters could succeed commercially

### Commercial Success
- 7th highest-grossing dedicated arcade game in Japan (1995)
- Described as a "cult favorite" in U.S. arcades
- Listed as 7th best arcade game of all time by Electronic Gaming Monthly (1997)
- Spawned multiple sequels and ports

### Series Continuation
- **Point Blank 2** (1999): Added more mini-games, "Insane" difficulty
- **Point Blank 3** (2000): Featured Namco character cameos
- **Point Blank DS** (2006): Stylus-based portable adaptation
- **Point Blank X** (2016): HD remaster with ticket dispensing

---

## 15. APPENDIX: QUICK REFERENCE

### Controls
| **Input** | **Action** |
|-----------|------------|
| Trigger | Fire |
| Aim Off-Screen | Reload |
| Start Button | Join game / Confirm selection |

### Lives Lost By
- ❌ Missing quota
- ❌ Shooting bombs
- ❌ Shooting civilians
- ❌ Shooting opponent's targets
- ❌ Wrong puzzle answers
- ❌ Dr. Don/Dr. Dan death
- ❌ Running out of ammo (limited stages)
- ❌ Missing single-bullet challenges

### Stage Category Icons
| **Category** | **Skills Tested** |
|--------------|-------------------|
| Speed | Rapid fire, reflexes |
| Accuracy | Precision, steadiness |
| Simulation | Identification, restraint |
| Intelligence | Logic, problem-solving |
| Memory | Recall, pattern matching |
| Visual Acuity | Quick recognition, comparison |

---

*Document compiled for reference and preservation of arcade gaming history.*

**Point Blank™ © 1994 Namco Ltd. All Rights Reserved.**
