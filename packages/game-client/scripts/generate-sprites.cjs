#!/usr/bin/env node
/**
 * Sprite Generation Script using OpenAI DALL-E 3
 *
 * Usage: OPENAI_API_KEY=your_key node generate-sprites.js
 * Or set OPENAI_API_KEY in your environment variables
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.error('Usage: OPENAI_API_KEY=your_key node generate-sprites.js');
  process.exit(1);
}

// Sprite definitions with DALL-E optimized prompts
const SPRITES = {
  // ===== TARGETS =====
  'sprites/targets/target-red': {
    prompt: 'A cute circular shooting target with a glossy finish, arcade game style, 2D sprite, isolated on solid white background. The target has concentric rings with a shiny surface, cartoon style, clean edges, vibrant red color scheme, gamedev asset, no text, no labels. Front-facing, flat 2D orthographic view.',
    size: '1024x1024'
  },
  'sprites/targets/target-blue': {
    prompt: 'A cute circular shooting target with a glossy finish, arcade game style, 2D sprite, isolated on solid white background. The target has concentric rings with a shiny surface, cartoon style, clean edges, vibrant blue color scheme, gamedev asset, no text, no labels. Front-facing, flat 2D orthographic view.',
    size: '1024x1024'
  },
  'sprites/targets/target-green': {
    prompt: 'A cute circular shooting target with a glossy finish, arcade game style, 2D sprite, isolated on solid white background. The target has concentric rings with a shiny surface, cartoon style, clean edges, vibrant green color scheme, gamedev asset, no text, no labels. Front-facing, flat 2D orthographic view.',
    size: '1024x1024'
  },
  'sprites/targets/target-yellow': {
    prompt: 'A cute circular shooting target with a glossy finish, arcade game style, 2D sprite, isolated on solid white background. The target has concentric rings with a shiny surface, cartoon style, clean edges, vibrant yellow color scheme, gamedev asset, no text, no labels. Front-facing, flat 2D orthographic view.',
    size: '1024x1024'
  },
  'sprites/targets/bomb': {
    prompt: 'A cute cartoon bomb sprite for an arcade game, round black bomb with a lit sparking fuse, worried/mischievous face expression, 2D game sprite, isolated on solid white background, clean edges, vibrant colors, arcade style, gamedev asset, no text. Front-facing orthographic view.',
    size: '1024x1024'
  },
  'sprites/targets/bullseye': {
    prompt: 'A classic shooting range bullseye target, concentric red and white rings, arcade game style, 2D sprite, isolated on solid white background, clean vector-like edges, gamedev asset, front-facing flat view, no text, no labels.',
    size: '1024x1024'
  },

  // ===== ANIMALS =====
  'sprites/animals/bunny': {
    prompt: 'A cute pink bunny character for arcade game, kawaii style, big round eyes, floppy ears, happy expression, 2D game sprite, isolated on solid white background, front-facing, cartoon style, clean edges, pastel pink color, gamedev asset, no text, no background elements.',
    size: '1024x1024'
  },
  'sprites/animals/squirrel': {
    prompt: 'An adorable cartoon squirrel character with fluffy tail, holding an acorn, cute chubby cheeks, arcade game style, 2D sprite, isolated on solid white background, brown/orange fur, kawaii style, gamedev asset, front-facing orthographic view, no text, clean edges.',
    size: '1024x1024'
  },
  'sprites/animals/hedgehog': {
    prompt: 'A cute cartoon hedgehog character, small with friendly spikes, adorable face, arcade game style, 2D sprite, isolated on solid white background, brown and tan colors, kawaii aesthetic, gamedev asset, front-facing, no text, clean edges.',
    size: '1024x1024'
  },
  'sprites/animals/mole': {
    prompt: 'A cute cartoon mole character with big pink nose, tiny eyes, dirt on fur, arcade game style, 2D sprite, isolated on solid white background, gray/brown colors, kawaii style, gamedev asset, front-facing view, no text, clean edges.',
    size: '1024x1024'
  },
  'sprites/animals/hole': {
    prompt: 'A cartoon grass hole/burrow viewed from above at slight angle, dark interior, grass rim around edges, arcade game style, 2D sprite, isolated on solid white background, green grass texture, gamedev asset, no text, clean edges.',
    size: '1024x1024'
  },

  // ===== SPOOKY =====
  'sprites/spooky/skeleton': {
    prompt: 'A friendly cartoon skeleton character popping up, arms raised, silly expression, arcade game style, 2D sprite, isolated on solid white background, white bones with slight blue tint, cute non-scary aesthetic, gamedev asset, front-facing, no text, clean edges.',
    size: '1024x1024'
  },
  'sprites/spooky/coffin-closed': {
    prompt: 'A cartoon wooden coffin viewed from front, closed with ornate design, spooky but cute arcade game style, 2D sprite, isolated on solid white background, dark brown wood texture, purple/gray accents, gamedev asset, no text, clean edges.',
    size: '1024x1024'
  },
  'sprites/spooky/cuckoo-bird': {
    prompt: 'A cute cartoon cuckoo bird, colorful feathers, happy expression, wings slightly spread, arcade game style, 2D sprite, isolated on solid white background, bright colorful plumage, kawaii style, gamedev asset, front-facing, no text.',
    size: '1024x1024'
  },

  // ===== WESTERN =====
  'sprites/western/bandit': {
    prompt: 'A cartoon Wild West bandit character as a flat cardboard shooting target, black cowboy hat, bandana mask, menacing but cartoonish pose, arcade game 2D sprite, isolated on solid white background, sepia/western colors, gamedev asset, front-facing, no text, visible cardboard edges and stand.',
    size: '1024x1024'
  },
  'sprites/western/townsperson': {
    prompt: 'A friendly cartoon Wild West townsperson (shopkeeper/farmer) as flat cardboard target, cowboy hat, friendly expression, hands up in surprise, arcade game 2D sprite, isolated on solid white background, earthy western colors, gamedev asset, front-facing, no text, visible cardboard edges and stand.',
    size: '1024x1024'
  },
  'sprites/western/robber': {
    prompt: 'A cartoon criminal/robber as cardboard shooting target, ski mask, striped shirt, holding money bag, menacing pose, arcade game 2D sprite, isolated on solid white background, black/white stripes, gamedev asset, front-facing, no text, visible cardboard stand.',
    size: '1024x1024'
  },
  'sprites/western/civilian': {
    prompt: 'An innocent cartoon civilian as cardboard target, casual clothes, surprised expression, hands raised, arcade game 2D sprite, isolated on solid white background, friendly colorful appearance, gamedev asset, front-facing, no text, visible cardboard stand.',
    size: '1024x1024'
  },

  // ===== NATURE =====
  'sprites/nature/leaf-maple': {
    prompt: 'A single beautiful autumn maple leaf, vibrant red-orange fall color, arcade game style, 2D sprite, isolated on solid white background, clean edges, slightly curled natural shape, gamedev asset, no text, flat orthographic view.',
    size: '1024x1024'
  },
  'sprites/nature/leaf-oak': {
    prompt: 'A single autumn oak leaf, golden yellow-brown fall color, arcade game style, 2D sprite, isolated on solid white background, clean edges, natural lobed shape, gamedev asset, no text, flat orthographic view.',
    size: '1024x1024'
  },
  'sprites/nature/meteor-small': {
    prompt: 'A small flaming meteor/asteroid, rocky texture with fire trail, arcade game style, 2D sprite, isolated on solid white background, orange/red flames, brown/gray rock, small size version, gamedev asset, no text, clean edges, dynamic angle suggesting falling motion.',
    size: '1024x1024'
  },
  'sprites/nature/meteor-medium': {
    prompt: 'A medium flaming meteor/asteroid, rocky texture with fire trail, arcade game style, 2D sprite, isolated on solid white background, orange/red flames, brown/gray rock, medium size version, gamedev asset, no text, clean edges, dynamic angle suggesting falling motion.',
    size: '1024x1024'
  },
  'sprites/nature/meteor-large': {
    prompt: 'A large flaming meteor/asteroid, rocky texture with intense fire trail, arcade game style, 2D sprite, isolated on solid white background, orange/red flames, brown/gray rock, large menacing version, gamedev asset, no text, clean edges, dynamic angle suggesting falling motion.',
    size: '1024x1024'
  },

  // ===== REWARDS =====
  'sprites/rewards/chest-closed': {
    prompt: 'A cartoon wooden treasure chest, closed and locked, golden metal bands, ornate keyhole, arcade game style, 2D sprite, isolated on solid white background, brown wood with gold accents, gamedev asset, front-facing at slight angle, no text, clean edges.',
    size: '1024x1024'
  },
  'sprites/rewards/chest-open': {
    prompt: 'A cartoon wooden treasure chest wide open, overflowing with gold coins and gems, sparkling, arcade game style, 2D sprite, isolated on solid white background, vibrant gold and jewel colors, gamedev asset, front-facing at slight angle, no text.',
    size: '1024x1024'
  },
  'sprites/rewards/coin': {
    prompt: 'A shiny cartoon gold coin with star emblem, gleaming highlight, arcade game style, 2D sprite, isolated on solid white background, bright gold color, gamedev asset, front-facing, no text, clean edges.',
    size: '1024x1024'
  },

  // ===== UI =====
  'ui/crosshair': {
    prompt: 'A modern arcade shooting game crosshair reticle, circular with cross lines, slight sci-fi styling, arcade game 2D sprite, isolated on solid green background (for transparency), white/cyan color with subtle glow effect, gamedev UI asset, no text.',
    size: '1024x1024'
  },
  'ui/button-red': {
    prompt: 'A large glossy arcade-style button, circular with 3D dome effect and highlight, bright red color, arcade game 2D sprite, isolated on solid white background, gamedev UI asset, no text, clean edges.',
    size: '1024x1024'
  },
  'ui/button-blue': {
    prompt: 'A large glossy arcade-style button, circular with 3D dome effect and highlight, bright blue color, arcade game 2D sprite, isolated on solid white background, gamedev UI asset, no text, clean edges.',
    size: '1024x1024'
  },
  'ui/button-green': {
    prompt: 'A large glossy arcade-style button, circular with 3D dome effect and highlight, bright green color, arcade game 2D sprite, isolated on solid white background, gamedev UI asset, no text, clean edges.',
    size: '1024x1024'
  },
  'ui/button-yellow': {
    prompt: 'A large glossy arcade-style button, circular with 3D dome effect and highlight, bright yellow color, arcade game 2D sprite, isolated on solid white background, gamedev UI asset, no text, clean edges.',
    size: '1024x1024'
  },
  'ui/card-back': {
    prompt: 'An ornate playing card back design, decorative geometric pattern, arcade game style, 2D sprite, isolated on solid white background, deep blue/purple with gold accents, clean edges, gamedev asset, no text, rectangular format.',
    size: '1024x1024'
  },

  // ===== PARTICLES =====
  'particles/spark': {
    prompt: 'A simple bright white spark/star particle effect, glowing center fading outward, arcade game style, 2D sprite, isolated on solid black background, pure white with yellow tint, small size, gamedev particle asset, no text.',
    size: '1024x1024'
  },
  'particles/star': {
    prompt: 'A simple 4-pointed star shape particle, bright yellow/gold glowing effect, arcade game style, 2D sprite, isolated on solid black background, clean geometric star shape, small size, gamedev particle asset, no text.',
    size: '1024x1024'
  },

  // ===== FIREWORKS =====
  'sprites/fireworks/rocket': {
    prompt: 'A cartoon firework rocket, red/yellow striped body, pointed tip, small fins at base, unlit fuse, arcade game style, 2D sprite, isolated on solid white background, vibrant colors, gamedev asset, vertical orientation, no text, clean edges.',
    size: '1024x1024'
  }
};

// Create directory if it doesn't exist
function ensureDir(dirPath) {
  const fullPath = path.join(__dirname, '..', 'public', 'assets', dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
  return fullPath;
}

// Generate image using DALL-E 3
async function generateImage(prompt, size = '1024x1024') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size,
      quality: 'standard',
      response_format: 'url'
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else if (response.data && response.data[0]) {
            resolve(response.data[0].url);
          } else {
            reject(new Error('No image URL in response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// Main generation function
async function generateSprites(selectedSprites = null) {
  const sprites = selectedSprites || Object.keys(SPRITES);
  const total = sprites.length;
  let completed = 0;
  let failed = 0;

  console.log(`\n🎮 Point Blank Sprite Generator`);
  console.log(`================================`);
  console.log(`Generating ${total} sprites using DALL-E 3...\n`);

  for (const spritePath of sprites) {
    const spriteConfig = SPRITES[spritePath];
    if (!spriteConfig) {
      console.log(`⚠️  Unknown sprite: ${spritePath}`);
      continue;
    }

    const dirPath = path.dirname(spritePath);
    const fileName = path.basename(spritePath) + '.png';
    const fullDir = ensureDir(dirPath);
    const fullPath = path.join(fullDir, fileName);

    // Skip if file already exists
    if (fs.existsSync(fullPath)) {
      console.log(`⏭️  Skipping (exists): ${spritePath}`);
      completed++;
      continue;
    }

    console.log(`🎨 Generating: ${spritePath}...`);

    try {
      const imageUrl = await generateImage(spriteConfig.prompt, spriteConfig.size);
      await downloadImage(imageUrl, fullPath);
      console.log(`✅ Saved: ${fullPath}`);
      completed++;

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed: ${spritePath} - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n================================`);
  console.log(`✅ Completed: ${completed}/${total}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }
  console.log(`\nSprites saved to: packages/game-client/public/assets/`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node generate-sprites.js [options] [sprite-names...]

Options:
  --help, -h     Show this help message
  --list, -l     List all available sprites

Examples:
  node generate-sprites.js                          # Generate all sprites
  node generate-sprites.js sprites/animals/bunny    # Generate specific sprite
  node generate-sprites.js sprites/targets/*        # Generate all targets

Available sprite categories:
  sprites/targets/    - Target sprites (red, blue, green, yellow, bomb, bullseye)
  sprites/animals/    - Animal sprites (bunny, squirrel, hedgehog, mole, hole)
  sprites/spooky/     - Spooky sprites (skeleton, coffin, cuckoo-bird)
  sprites/western/    - Western sprites (bandit, townsperson, robber, civilian)
  sprites/nature/     - Nature sprites (leaves, meteors)
  sprites/rewards/    - Reward sprites (chests, coin)
  sprites/fireworks/  - Firework sprites
  ui/                 - UI elements (crosshair, buttons, card-back)
  particles/          - Particle effects (spark, star)
  `);
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  console.log('\nAvailable sprites:');
  Object.keys(SPRITES).forEach(name => console.log(`  ${name}`));
  process.exit(0);
}

// Filter sprites if specific ones requested
let selectedSprites = null;
if (args.length > 0 && !args[0].startsWith('-')) {
  selectedSprites = args.filter(arg => {
    if (arg.includes('*')) {
      // Handle wildcards
      const pattern = arg.replace('*', '');
      return Object.keys(SPRITES).filter(s => s.startsWith(pattern));
    }
    return SPRITES[arg] ? arg : null;
  }).flat().filter(Boolean);

  if (selectedSprites.length === 0) {
    console.error('No matching sprites found. Use --list to see available sprites.');
    process.exit(1);
  }
}

// Run generation
generateSprites(selectedSprites).catch(console.error);
