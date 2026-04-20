import { BOSSES, ENEMY_TEMPLATES, WORLD_AREAS, getAreaByLevel, getBoss, getEnemyLevelUnlock, getLevelName } from './data.js';
import { spawnBoss, spawnEnemy, spawnMilestoneBoss } from './combat.js';

export function setupLevel(state, canvas, level) {
  state.currentLevel = level;
  state.currentArea = getAreaByLevel(level);
  state.levelComplete = false;
  state.shopType = null;
  state.insideShop = false;
  state.bowMode = false;
  state.bowTarget = null;
  state.dialogueOpen = false;
  state.effects.length = 0;
  state.projectiles.length = 0;
  state.hazards.length = 0;
  state.drops.length = 0;
  state.enemies.length = 0;
  state.npcs.length = 0;
  state.floatingPlatforms.length = 0;
  state.envHazardTimer = 0;

  const gy = state.groundY(canvas.height);
  state.player.x = 150;
  state.player.y = gy - state.player.h;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.grounded = true;
  state.player.hp = state.player.maxHp;
  if (state.player.hasJetpack) {
    state.player.jetpackFuel = state.player.maxJetpackFuel;
    state.player.jetpackActive = false;
  }

  if (level === 0) {
    state.tutorialStep = 0;
    state.player.totalMoved = 0;
    state.player.totalJumps = 0;
    state.player.totalSwings = 0;
    state.player.totalShots = 0;
    state.player.talkedToMaster = false;
    state.player.dummiesKilled = 0;
    state.npcs.push({
      name: 'MASTER REN',
      x: canvas.width * 0.75,
      y: gy - 48,
      w: 42,
      h: 48,
      color: '#f59e0b',
      old: true,
      dialogue: [
        'WELCOME, WARRIOR.',
        'LEARN THE BLADE, THEN THE BOW, THEN DEFEAT THE SLIMES.',
        'COME BACK WHEN YOU ARE READY.'
      ]
    });
    spawnEnemy(state, 'sword_dummy', canvas.width * 0.5, gy - 34, 1);
    spawnEnemy(state, 'sword_dummy', canvas.width * 0.58, gy - 34, 1);
    return;
  }

  if (level === 4) {
    const showcase = ['tank', 'artillery', 'helicopter', 'mech', 'jet', 'apc', 'warship', 'hovercraft'];
    showcase.forEach((type, i) => {
      spawnEnemy(state, type, canvas.width - 200 - i * 180, gy - (ENEMY_TEMPLATES[type].h || 50), 1.2);
    });
    return;
  }

  // ── THE ABYSS: LEVELS 1201-1250 (BRUTAL) ──
  if (level >= 1201 && level <= 1250) {
    const voidTier = level - 1200; // 1-50
    const voidScale = 10 + voidTier * 2.5; // starts at 12.5x, ends at 135x at level 1250
    const allTypes = Object.keys(ENEMY_TEMPLATES).filter(t => !ENEMY_TEMPLATES[t].vehicle && t !== 'sword_dummy' && t !== 'arrow_dummy');
    const hardTypes = ['dark_knight', 'dragon', 'lich', 'golem', 'cyclops', 'vampire', 'berserker', 'wraith', 'mage', 'death_knight', 'hydra_mob', 'djinn', 'sand_worm'];
    const voidPool = voidTier <= 10 ? hardTypes : allTypes;

    // Enemy count ramps up: 10 at start, 34 at end
    const enemyCount = Math.min(34, 10 + Math.floor(voidTier * 0.5));

    // Helper: spawn a wave of void enemies
    const spawnVoidWave = (count, scale, startX, spacing) => {
      const useVehicles = voidTier >= 20 && Math.random() < 0.4;
      const vehicleTypes = ['tank', 'mech', 'artillery', 'helicopter', 'jet'];
      for (let i = 0; i < count; i++) {
        let type;
        if (useVehicles && i < 3) {
          type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        } else {
          type = voidPool[Math.floor(Math.random() * voidPool.length)];
        }
        const template = ENEMY_TEMPLATES[type] || ENEMY_TEMPLATES.slime;
        spawnEnemy(state, type, startX + i * (spacing + Math.random() * 40), gy - template.h, scale);
      }
    };

    // Every 10th is a MEGA void boss (milestone-tier) plus army
    if (voidTier % 10 === 0) {
      const megaBosses = Object.values(BOSSES).filter(b => b.milestone);
      const mega = megaBosses[Math.floor(Math.random() * megaBosses.length)] || Object.values(BOSSES)[0];
      spawnMilestoneBoss(state, mega, canvas.width - 300, gy - 200, level);
      // Also throw in a regular boss for extra pain
      const bossList = Object.values(BOSSES).filter(b => !b.milestone);
      const extraBoss = bossList[Math.floor(Math.random() * bossList.length)];
      spawnBoss(state, extraBoss, canvas.width - 100, gy - 160, level);
      // Plus a massive army
      spawnVoidWave(enemyCount + 8, voidScale * 0.8, canvas.width + 100, 55);
    }
    // Every 5th void level is a multi-boss gauntlet
    else if (voidTier % 5 === 0) {
      const bossCount = 1 + Math.floor(voidTier / 10); // 1-5 bosses at once
      const bossList = Object.values(BOSSES).filter(b => !b.milestone);
      for (let b = 0; b < bossCount; b++) {
        const boss = bossList[Math.floor(Math.random() * bossList.length)];
        spawnBoss(state, boss, canvas.width - 200 - b * 160, gy - 160, level);
      }
      // Plus a swarm of tough minions
      spawnVoidWave(enemyCount, voidScale, canvas.width + 80, 65);
    }
    // Regular void levels: enemies + a chance for a roaming boss
    else {
      // 40% chance a random boss appears alongside the regular enemies
      if (Math.random() < 0.4) {
        const bossList = Object.values(BOSSES).filter(b => !b.milestone);
        const boss = bossList[Math.floor(Math.random() * bossList.length)];
        spawnBoss(state, boss, canvas.width - 220, gy - 160, level);
      }
      spawnVoidWave(enemyCount, voidScale, canvas.width + 100, 55);
    }

    // Void levels always have hazards — fast and deadly
    state.envHazardEnabled = true;
    state.envHazardInterval = Math.max(0.5, 2 - voidTier * 0.03);
    // Spawn tricky platforms
    spawnPlatforms(state, canvas, level);
    return;
  }

  // Milestone mega-bosses
  if ([300, 600, 900, 1200].includes(level)) {
    const boss = getBoss(level);
    spawnMilestoneBoss(state, boss, canvas.width - 300, gy - 200, level);
    return;
  }

  // Regular bosses every 5-10 levels
  const boss = getBoss(level);
  if (boss) {
    spawnBoss(state, boss, canvas.width - 260, gy - 160, level);
    // Spawn 1-3 minions with the boss (not on mini-bosses at low levels)
    const minionCount = boss.miniBoss
      ? (level >= 20 ? 1 + Math.floor(Math.random() * 2) : 1)
      : 1 + Math.floor(Math.random() * 3);
    const minionScale = 1 + level * 0.015;
    const unlocked = Object.keys(ENEMY_TEMPLATES).filter((type) =>
      getEnemyLevelUnlock(type) <= level && !ENEMY_TEMPLATES[type].vehicle
    );
    if (unlocked.length > 0) {
      for (let i = 0; i < minionCount; i++) {
        const type = unlocked[Math.floor(Math.random() * unlocked.length)];
        const template = ENEMY_TEMPLATES[type] || ENEMY_TEMPLATES.slime;
        const mx = canvas.width + 60 + i * 80 + Math.random() * 50;
        spawnEnemy(state, type, mx, gy - template.h, minionScale);
      }
    }
    return;
  }

  const scale = 1 + level * 0.025;
  const unlocked = Object.keys(ENEMY_TEMPLATES).filter((type) => getEnemyLevelUnlock(type) <= level);
  const count = Math.min(34, 3 + Math.floor(level / 2));
  for (let i = 0; i < count; i += 1) {
    const type = unlocked[Math.floor(Math.random() * unlocked.length)];
    const template = ENEMY_TEMPLATES[type] || ENEMY_TEMPLATES.slime;
    const x = canvas.width + 120 + i * (45 + Math.random() * 60);
    const y = state.groundY(canvas.height) - template.h;
    spawnEnemy(state, type, x, y, scale);
  }

  // Spawn floating platforms on every 2nd, 3rd, 5th level (not tutorial/boss/showcase)
  if (level >= 2 && level % 2 !== 0) {
    spawnPlatforms(state, canvas, level);
  }
  // Enable environmental hazards starting from level 5
  if (level >= 5) {
    state.envHazardEnabled = true;
    state.envHazardInterval = Math.max(1.5, 5 - level * 0.005); // gets faster at higher levels
  } else {
    state.envHazardEnabled = false;
  }
}

function spawnPlatforms(state, canvas, level) {
  const gy = state.groundY(canvas.height);
  const area = state.currentArea;
  const platCount = 2 + Math.floor(Math.random() * 3); // 2-4 platforms
  const cw = canvas.width;
  const maxJumpHeight = 95; // safe reachable height (JUMP_FORCE=-620, GRAVITY=1750 → ~110px theoretical max)
  const playerH = 62; // approximate player height

  // Build a staircase of reachable platforms
  // First platform must be reachable from the ground
  let prevY = gy - playerH; // player feet when standing on ground
  const usedXRanges = [];

  for (let i = 0; i < platCount; i++) {
    const w = 60 + Math.floor(Math.random() * 50); // 60-110 wide

    // Find an x that doesn't overlap too much with existing platforms
    let x;
    let attempts = 0;
    do {
      x = 60 + Math.random() * (cw - w - 120);
      attempts++;
    } while (attempts < 20 && usedXRanges.some(r => x < r[1] - 10 && x + w > r[0] + 10));
    usedXRanges.push([x, x + w]);

    const h = 14;
    const moving = Math.random() < 0.3;
    const crumble = !moving && level >= 15 && Math.random() < 0.25;

    const moveAxis = moving ? (Math.random() < 0.5 ? 'x' : 'y') : null;
    const moveRange = moving ? (20 + Math.random() * 25) : 0; // 20-45px range

    // Account for y-axis movement: platform can be moveRange BELOW its origin,
    // so the player may be standing on it at origin+moveRange.
    // The next step must still be reachable from that lowest point.
    const prevWorstY = prevY + (moveAxis === 'y' ? moveRange : 0);

    // Each platform is 30-maxJumpHeight px above the worst-case previous surface
    const stepUp = 30 + Math.random() * (maxJumpHeight - 30);
    const y = Math.max(40, prevWorstY - stepUp);
    prevY = y; // next platform uses this origin for staircase

    let color, borderColor;
    if (area === 'grassy')    { color = '#3a7d44'; borderColor = '#2d5a31'; }
    else if (area === 'ice')  { color = '#7dd3fc'; borderColor = '#38bdf8'; }
    else if (area === 'lava') { color = '#78350f'; borderColor = '#92400e'; }
    else if (area === 'void') { color = '#581c87'; borderColor = '#7c3aed'; }
    else                      { color = '#6366f1'; borderColor = '#4338ca'; }

    state.floatingPlatforms.push({
      x, y, w, h,
      originX: x,
      originY: y,
      color, borderColor, area,
      moving,
      moveAxis,
      moveSpeed: moving ? (40 + Math.random() * 50) : 0,
      moveRange,
      moveT: Math.random() * Math.PI * 2,
      crumble,
      crumbleTimer: 0,
      crumbleMax: 1.2,
      crumbling: false,
      fallen: false,
      seed: Math.random() * 10000, // for drawing variation
    });
  }
}

export function runTutorial(state, canvas) {
  if (state.currentLevel !== 0 || state.tutorialComplete) return null;
  const current = state.tutorialSteps[state.tutorialStep];
  if (!current) {
    state.tutorialComplete = true;
    return 'TRAINING COMPLETE! PRESS START ADVENTURE';
  }

  if (current.check(state)) {
    if (current.onComplete === 'spawnArrowDummies') {
      const gy = state.groundY(canvas.height);
      spawnEnemy(state, 'arrow_dummy', canvas.width * 0.55, gy - 34, 1);
      spawnEnemy(state, 'arrow_dummy', canvas.width * 0.64, gy - 34, 1);
    }
    if (current.onComplete === 'spawnSlimes') {
      const gy = state.groundY(canvas.height);
      for (let i = 0; i < 3; i += 1) spawnEnemy(state, 'slime', canvas.width * 0.5 + i * 90, gy - 32, 1.2);
    }
    if (current.onComplete === 'chooseElement') {
      state._showElementPicker = true;
    }
    if (current.onComplete === 'spawnElementTargets') {
      const gy = state.groundY(canvas.height);
      for (let i = 0; i < 3; i += 1) spawnEnemy(state, 'slime', canvas.width * 0.5 + i * 90, gy - 32, 1);
    }
    if (current.onComplete === 'graduation') {
      // Update Master Ren's dialogue for the graduation
      const ren = state.npcs.find((n) => n.name === 'MASTER REN');
      if (ren) {
        ren.dialogue = [
          'YOU HAVE PROVEN YOUR WORTH, WARRIOR.',
          'FROM THIS DAY FORWARD, YOU ARE THE NEW GUARDIAN OF THIS TOWN.',
          'GO FORTH AND PROTECT THE LAND. YOUR ADVENTURE BEGINS NOW!'
        ];
      }
      state._graduationPending = true;
    }
    state.tutorialStep += 1;
  }

  const next = state.tutorialSteps[state.tutorialStep];
  return next ? next.text : 'TRAINING COMPLETE! PRESS START ADVENTURE';
}

export function tryFinishWave(state) {
  if (state.currentLevel <= 0) return false;
  const alive = state.enemies.some((e) => e.alive);
  if (!alive && !state.levelComplete) {
    state.levelComplete = true;
    state.effects.push({ type: 'pickup', x: 420, y: 70, t: 2, text: 'WAVE CLEAR! SHOP THEN MOVE RIGHT →', color: '#22c55e' });
    // Quest tracking: levels completed
    if (state.activeQuest && state.activeQuest.goal === 'levels') state.questProgress += 1;
    // Quest tracking: noDamage (complete a level with no damage)
    if (state.activeQuest && state.activeQuest.goal === 'noDamage' && !state.questDamageTaken) state.questProgress += 1;
    // Reset noDamage tracker for next level
    state.questDamageTaken = false;
    return true;
  }
  return false;
}

export function tryAdvanceLevel(state, canvas) {
  if (state.levelComplete && state.player.x > canvas.width - 40) {
    const prev = state.currentLevel;
    const next = prev + 1;
    const area = getAreaByLevel(prev);
    state.worldProgress[area] = Math.max(state.worldProgress[area], (state.worldProgress[area] || 0) + 1);
    unlockAreas(state);

    // Unlock new elements when crossing area boundaries
    const AREA_ELEMENT_REWARDS = { 299: 'fire', 599: 'lightning', 899: 'water' };
    const reward = AREA_ELEMENT_REWARDS[prev];
    if (reward && !state.player.unlockedElements.includes(reward)) {
      state.player.unlockedElements.push(reward);
      const labels = { fire: '🔥 FIRE', lightning: '⚡ LIGHTNING', water: '🌊 WATER' };
      const colors = { fire: '#ef4444', lightning: '#facc15', water: '#38bdf8' };
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 80, t: 3.5, text: labels[reward] + ' ELEMENT UNLOCKED!', color: colors[reward] });
    }

    // ─── ABYSS REWARDS: LIGHT WEAPONS & BLESSING ───
    // Abyss starts at 1201, so 20 levels = completing level 1220, 40 = 1240, 50 = 1250
    if (prev === 1220 && !state.player.hasSwordOfLight) {
      state.player.hasSwordOfLight = true;
      state.player.swordMaterial = 'light';
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 40, t: 5, text: '✨ SWORD OF LIGHT OBTAINED! ✨', color: '#fffbe6' });
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 70, t: 4, text: 'THE POWER OF ALL ELEMENTS IN ONE BLADE', color: '#fde68a' });
    }
    if (prev === 1240 && !state.player.hasBowOfLight) {
      state.player.hasBowOfLight = true;
      state.player.bowType = 'light';
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 40, t: 5, text: '✨ BOW OF LIGHT OBTAINED! ✨', color: '#fffbe6' });
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 70, t: 4, text: 'ALL ELEMENTS FLOW THROUGH YOUR ARROWS', color: '#fde68a' });
    }
    if (prev === 1250 && !state.player.hasBlessingOfLight) {
      state.player.hasBlessingOfLight = true;
      state.player.baseMaxHp += 50;
      state.player.maxHp += 50;
      state.player.hp = state.player.maxHp;
      // Unlock all elements
      ['fire', 'lightning', 'water'].forEach(el => {
        if (!state.player.unlockedElements.includes(el)) state.player.unlockedElements.push(el);
      });
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 20, t: 6, text: '🌟 BLESSING OF LIGHT BESTOWED! 🌟', color: '#fffbe6' });
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 50, t: 5, text: '+50 MAX HP • HP REGEN • HALF COOLDOWNS', color: '#fde68a' });
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 75, t: 5, text: 'HOLY AURA BURNS ENEMIES • SMITE ON HIT', color: '#fbbf24' });
    }

    // Victory at level 1250 — you conquered THE ABYSS
    if (prev === 1250) {
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 60, t: 6, text: '🏆 YOU CONQUERED THE ABYSS! TRUE CHAMPION! 🏆', color: '#a855f7' });
      state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 100, t: 5, text: 'ALL 1250 LEVELS COMPLETE!', color: '#22c55e' });
      // Don't advance past 1250 — stay on the victory screen
      return false;
    }

    setupLevel(state, canvas, next);
    return true;
  }
  return false;
}

export function unlockAreas(state) {
  const global = state.currentLevel;
  if (global >= WORLD_AREAS.ice.unlockAt) WORLD_AREAS.ice.unlocked = true;
  if (global >= WORLD_AREAS.lava.unlockAt) WORLD_AREAS.lava.unlocked = true;
  if (global >= WORLD_AREAS.lightning.unlockAt) WORLD_AREAS.lightning.unlocked = true;
  if (global >= WORLD_AREAS.void.unlockAt) WORLD_AREAS.void.unlocked = true;
}

export function getCurrentLevelName(state) {
  if (state.arenaMode) return 'ARENA MODE';
  if (state.currentLevel === 0) return 'TRAINING';
  return getLevelName(state.currentLevel);
}
