import { GRAVITY, JUMP_FORCE, WORLD_AREAS, BOSSES, LEVEL_NAMES, VOID_LEVEL_NAMES, GENERATED_BOSS_NAMES, getLevelName, getBoss } from './data.js';
import { addPotionToSlots, drawCombat, performElementAttack, performSwordAttack, shootArrow, updateCombat, usePotionSlot } from './combat.js';
import { createInitialState } from './state.js';
import { getCurrentLevelName, runTutorial, setupLevel, tryAdvanceLevel, tryFinishWave, unlockAreas } from './levels.js';
import { closeShop, handleShopAction, openShop } from './shop.js';
import { loadGame, saveGame } from './save.js';
import {
  buildLevelNameMap,
  findBestMaterialToShow,
  getDom,
  hidePanels,
  initArenaSetup,
  applyArenaSetup,
  renderArenaPool,
  renderEquipment,
  renderWorldMap,
  resolveLevelNameInput,
  setDialogue,
  setPlayingUI,
  showTutorialHint,
  updateHUD,
  updatePotionSlots
} from './ui.js';
import { spawnEnemy, spawnBoss } from './combat.js';

const dom = getDom();
const ctx = dom.canvas.getContext('2d');
const state = createInitialState();
const levelNameMap = buildLevelNameMap(1500);
for (let i = 0; i <= 1200; i += 1) {
  const name = getLevelName(i).toUpperCase();
  if (levelNameMap[name] === undefined) levelNameMap[name] = i;
}
// Also map ALL names from LEVEL_NAMES arrays so overflow entries (like FINAL STORM) are reachable
Object.entries(LEVEL_NAMES).forEach(([area, names]) => {
  const start = WORLD_AREAS[area].start;
  names.forEach((name, idx) => {
    const level = area === 'grassy' ? idx + 1 : start + idx;
    const key = name.toUpperCase();
    if (levelNameMap[key] === undefined) levelNameMap[key] = level;
  });
});
// Map void level names (1201–1250)
VOID_LEVEL_NAMES.forEach((name, idx) => {
  const key = name.toUpperCase();
  if (levelNameMap[key] === undefined) levelNameMap[key] = 1201 + idx;
});
// Map boss names to their level numbers too
Object.entries(BOSSES).forEach(([lvl, boss]) => {
  levelNameMap[boss.name.toUpperCase()] = Number(lvl);
});
// Map generated boss names (every 5 and 10 levels up to 1200)
for (let i = 5; i <= 1200; i += 5) {
  if (!BOSSES[i]) {
    const b = getBoss(i);
    if (b && b.name && levelNameMap[b.name.toUpperCase()] === undefined) {
      levelNameMap[b.name.toUpperCase()] = i;
    }
  }
}
// Ensure ALL generated boss names are findable — brute-force find the first level for any unmapped names
for (const bossName of GENERATED_BOSS_NAMES) {
  const key = bossName.toUpperCase();
  if (levelNameMap[key] !== undefined) continue;
  // Search every boss level to find where this name first appears
  for (let lv = 10; lv <= 1200; lv += 5) {
    if (BOSSES[lv]) continue;
    const b = getBoss(lv);
    if (b && b.name.toUpperCase() === key) {
      levelNameMap[key] = lv;
      break;
    }
  }
}

const titleTrainingBtn = document.getElementById('training-btn');
const titleStartBtn = document.getElementById('start-btn');

function refreshTitleActionButton() {
  if (state.tutorialComplete) {
    titleTrainingBtn?.classList.add('hidden');
    titleStartBtn?.classList.remove('hidden');
  } else {
    titleTrainingBtn?.classList.remove('hidden');
    titleStartBtn?.classList.add('hidden');
  }
}

function resize() {
  dom.canvas.width = window.innerWidth;
  dom.canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function setMode(mode) {
  state.mode = mode;
  state.paused = mode !== 'playing';
  dom.title.classList.toggle('hidden', mode !== 'title');
  setPlayingUI(dom, mode === 'playing');
  if (mode === 'title') refreshTitleActionButton();
}

function startTraining() {
  hidePanels(dom);
  state.arenaMode = false;
  state.arenaActive = false;
  setupLevel(state, dom.canvas, 0);
  setMode('playing');
  updatePotionSlots(dom, state);
}

function startAdventure() {
  hidePanels(dom);
  state.arenaMode = false;
  state.arenaActive = false;
  const loaded = loadGame(state);
  if (!loaded) state.currentLevel = Math.max(1, state.currentLevel);
  unlockAreas(state);
  setupLevel(state, dom.canvas, Math.max(1, state.currentLevel));
  setMode('playing');
  updatePotionSlots(dom, state);
}

function enterArena() {
  hidePanels(dom);
  state.arenaMode = true;
  state.arenaActive = false;
  state.arenaSelectedMob = null;
  state.enemies.length = 0;
  state.projectiles.length = 0;
  state.effects.length = 0;
  state.drops.length = 0;
  state.hazards.length = 0;
  state.currentLevel = -1;
  state.player.x = 160;
  state.player.y = state.groundY(dom.canvas.height) - state.player.h;
  setMode('playing');
  dom.arenaUI.classList.remove('hidden');
  initArenaSetup(dom, state);
  renderArenaPool(dom, state);
}

function openFinder() {
  dom.levelFinder.classList.remove('hidden');
  dom.levelInput.value = '';
  dom.levelInput.focus();
}

function goToLevelFromFinder() {
  const level = resolveLevelNameInput(dom.levelInput.value, levelNameMap);
  if (level === null) {
    dom.levelInput.value = 'NOT FOUND';
    return;
  }
  dom.levelFinder.classList.add('hidden');
  setupLevel(state, dom.canvas, level);
  setMode('playing');
}

function tryOpenPause() {
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  state.paused = true;
  renderEquipment(dom, state);
  dom.pauseMenu.classList.remove('hidden');
}

function closePause() {
  dom.pauseMenu.classList.add('hidden');
  state.mode = 'playing';
  state.paused = false;
}

function openWorldMap(fromTitle = false) {
  state._mapFromTitle = fromTitle;
  if (fromTitle) {
    dom.title.classList.add('hidden');
  }
  renderWorldMap(dom, state);
  dom.worldMap.classList.remove('hidden');
  state.mode = 'worldmap';
  state.paused = true;
}

function closeWorldMap() {
  dom.worldMap.classList.add('hidden');
  if (state._mapFromTitle) {
    state._mapFromTitle = false;
    setMode('title');
  } else {
    state.mode = 'playing';
    state.paused = false;
  }
}

function updatePlayer(dt) {
  const p = state.player;
  const wasX = p.x;
  p.vx = 0;
  // Frost slow countdown
  if (p._frostSlow > 0) p._frostSlow -= dt;
  const frostMult = p._frostSlow > 0 ? 0.45 : 1;
  const speedMult = (p.potionEffects.speed.mult || 1) * frostMult;
  if (state.input.left) {
    p.vx = -p.speed * speedMult;
    p.facing = -1;
  }
  if (state.input.right) {
    p.vx = p.speed * speedMult;
    p.facing = 1;
  }

  if (state.input.jump && p.grounded) {
    p.vy = JUMP_FORCE;
    p.grounded = false;
    p.totalJumps += 1;
  }

  if (p.hasJetpack && state.input.jump && !p.grounded && p.jetpackFuel > 0) {
    p.jetpackActive = true;
  } else if (p.jetpackFuel <= 0 || p.grounded || !state.input.jump) {
    p.jetpackActive = false;
  }

  // Jetpack fuel consumption & refuel
  if (p.hasJetpack) {
    if (p.jetpackActive) {
      p.jetpackFuel = Math.max(0, p.jetpackFuel - dt);
      // Apply upward thrust (counteracts gravity + lifts)
      p.vy = Math.max(p.vy - 2800 * dt, -350);
      if (p.jetpackFuel <= 0) {
        p.jetpackActive = false;
      }
    } else if (p.grounded && p.jetpackFuel < p.maxJetpackFuel) {
      p.jetpackFuel = Math.min(p.maxJetpackFuel, p.jetpackFuel + dt * 2);
    }
  }

  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Update and collide with floating platforms
  for (const plat of state.floatingPlatforms) {
    if (plat.fallen) continue;

    // Moving platforms
    if (plat.moving) {
      plat.moveT += dt;
      if (plat.moveAxis === 'x') {
        plat.x = plat.originX + Math.sin(plat.moveT * plat.moveSpeed * 0.03) * plat.moveRange;
      } else {
        plat.y = plat.originY + Math.sin(plat.moveT * plat.moveSpeed * 0.03) * plat.moveRange;
      }
    }

    // Crumbling platforms
    if (plat.crumbling) {
      plat.crumbleTimer += dt;
      if (plat.crumbleTimer >= plat.crumbleMax) {
        plat.fallen = true;
        continue;
      }
    }

    // Collision: player feet touching platform top, falling downward
    const feet = p.y + p.h;
    const prevFeet = feet - p.vy * dt;
    if (p.vy >= 0 &&
        prevFeet <= plat.y + 4 &&
        feet >= plat.y &&
        p.x + p.w / 2 > plat.x &&
        p.x - p.w / 2 < plat.x + plat.w) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.grounded = true;
      p.jetpackActive = false;
      // Start crumble
      if (plat.crumble && !plat.crumbling) {
        plat.crumbling = true;
        plat.crumbleTimer = 0;
      }
    }
  }

  const gy = state.groundY(dom.canvas.height) - p.h;
  if (p.y >= gy) {
    p.y = gy;
    p.vy = 0;
    p.grounded = true;
    p.jetpackActive = false;
  }
  p.x = Math.max(p.w / 2, Math.min(dom.canvas.width - p.w / 2, p.x));
  p.totalMoved += Math.abs(p.x - wasX);
}

function pickNpc() {
  return state.npcs.find((n) => Math.abs(n.x - state.player.x) < 70) || null;
}

function updateEnvHazards(state, canvas, dt) {
  if (!state.envHazardEnabled || state.levelComplete) return;
  state.envHazardTimer = (state.envHazardTimer || 0) + dt;
  const interval = state.envHazardInterval || 4;
  if (state.envHazardTimer < interval) return;
  state.envHazardTimer = 0;

  const area = state.currentArea;
  const gy = state.groundY(canvas.height);
  const p = state.player;

  if (area === 'lava') {
    // Meteor shower: 1-3 meteors falling from the sky
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const tx = 80 + Math.random() * (canvas.width - 160);
      state.hazards.push({
        type: 'meteor', env: true,
        x: tx + (Math.random() - 0.5) * 80,
        y: -40 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 60,
        vy: 120 + Math.random() * 80,
        targetX: tx,
        t: 4
      });
    }
  } else if (area === 'lightning') {
    // Lightning strikes: 1-2 random positions
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      state.hazards.push({
        type: 'lightning', env: true,
        x: 60 + Math.random() * (canvas.width - 120),
        t: 1.2,
        strikeAt: 0.7
      });
    }
  } else if (area === 'ice') {
    // Falling icicles
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const tx = 60 + Math.random() * (canvas.width - 120);
      state.hazards.push({
        type: 'icicle', env: true,
        x: tx,
        y: -20,
        vy: 160 + Math.random() * 100,
        t: 4
      });
    }
  } else {
    // Grassy: gusts of wind (push player sideways) + falling rocks
    if (Math.random() < 0.5) {
      // Wind gust
      state.hazards.push({
        type: 'wind_gust', env: true,
        x: Math.random() < 0.5 ? -20 : canvas.width + 20,
        dir: Math.random() < 0.5 ? 1 : -1,
        t: 2.0
      });
    } else {
      // Falling boulder
      state.hazards.push({
        type: 'meteor', env: true,
        x: 80 + Math.random() * (canvas.width - 160),
        y: -30,
        vx: (Math.random() - 0.5) * 40,
        vy: 100 + Math.random() * 60,
        targetX: p.x,
        t: 4
      });
    }
  }
}

function updateGame(dt) {
  if (state.mode !== 'playing') return;
  if (state.dialogueOpen || state.insideShop) return;

  // Check if X held long enough to open element wheel
  if (state.player.elementHoldStart > 0 && !state.player.elementWheelOpen && state.player.unlockedElements.length >= 2) {
    const held = (Date.now() - state.player.elementHoldStart) / 1000;
    if (held >= WHEEL_HOLD_TIME) {
      state.player.elementWheelOpen = true;
    }
  }

  updatePlayer(dt);
  updateCombat(state, dom.canvas, dt);
  updateEnvHazards(state, dom.canvas, dt);
  const tutorialText = runTutorial(state, dom.canvas);
  if (state.tutorialComplete) refreshTitleActionButton();

  // Show element picker when slimes defeated
  if (state._showElementPicker && !state.player.element) {
    dom.elementPicker.classList.remove('hidden');
  }

  showTutorialHint(dom, state.currentLevel === 0 ? tutorialText : state.levelComplete ? 'WAVE CLEARED! VISIT SHOPS (Q), THEN MOVE RIGHT' : '');
  tryFinishWave(state);
  tryAdvanceLevel(state, dom.canvas);
  updatePotionSlots(dom, state);

  // Quest completion check
  if (state.activeQuest && state.questProgress >= state.activeQuest.count) {
    const q = state.activeQuest;
    state.player.money += q.reward;
    state.effects.push({ type: 'pickup', x: state.player.x, y: state.player.y - 40, t: 3, text: `QUEST COMPLETE! +${q.reward}💰`, color: '#22c55e' });
    state.activeQuest = null;
    state.questProgress = 0;
  }

  if (state.levelComplete && Math.abs(state.player.x - dom.canvas.width * 0.7) < 120 && !state.insideShop) {
    state.effects.push({ type: 'pickup', x: state.player.x, y: state.player.y - 20, t: 0.5, text: 'PRESS Q FOR SHOP', color: '#facc15' });
  }

  // Update element HUD
  if (state.player.element) {
    const labels = { fire: '🔥 FIRE', lightning: '⚡ LIGHTNING', water: '🌊 WATER' };
    const cd = state.player.elementCooldown;
    const unlockCount = state.player.unlockedElements.length;
    const suffix = unlockCount >= 2 ? ` [${unlockCount}/3]` : '';
    dom.elementHud.textContent = cd > 0 ? `${labels[state.player.element]} (${Math.ceil(cd)}s)${suffix}` : `${labels[state.player.element]} READY${suffix}`;
    dom.elementHud.style.color = cd > 0 ? '#94a3b8' : state.player.element === 'fire' ? '#ef4444' : state.player.element === 'lightning' ? '#facc15' : '#38bdf8';
  } else {
    dom.elementHud.textContent = 'NONE';
    dom.elementHud.style.color = '';
  }
  // Blessing of Light HUD suffix
  if (state.player.hasBlessingOfLight) {
    dom.elementHud.textContent += ' 🌟 BLESSED';
  }

  updateHUD(dom, state, getCurrentLevelName(state));
}

function drawBackground() {
  const levelName = getCurrentLevelName(state);
  const gy = state.groundY(dom.canvas.height);
  let top = '#1e3a5f';
  let bot = '#7c2d12';
  if (state.currentArea === 'ice') {
    top = '#67e8f9';
    bot = '#bfdbfe';
  }
  if (state.currentArea === 'lava') {
    top = '#7f1d1d';
    bot = '#991b1b';
  }
  if (state.currentArea === 'lightning') {
    top = '#1d4ed8';
    bot = '#312e81';
  }
  if (state.currentArea === 'void') {
    top = '#020005';
    bot = '#050008';
  }
  const grad = ctx.createLinearGradient(0, 0, 0, gy);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, dom.canvas.width, gy);

  ctx.fillStyle = '#14532d';
  if (state.currentArea === 'ice') ctx.fillStyle = '#0f766e';
  if (state.currentArea === 'lava') ctx.fillStyle = '#7c2d12';
  if (state.currentArea === 'lightning') ctx.fillStyle = '#1e1b4b';
  if (state.currentArea === 'void') ctx.fillStyle = '#030006';
  ctx.fillRect(0, gy, dom.canvas.width, dom.canvas.height - gy);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let x = 0; x < dom.canvas.width; x += 32) ctx.fillRect(x, gy, 12, 8);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText(levelName, 18, dom.canvas.height - 16);
}

/* ═══════════════════════════════════════════════
   PLAYER SPRITE – 8-BIT DETAILED CHARACTER
   ═══════════════════════════════════════════════ */

function getSwordColor(material) {
  const palette = {
    wooden:   { blade: '#b8860b', edge: '#daa520', tip: '#cd9b1d', guard: '#8B7355' },
    rock:     { blade: '#808890', edge: '#a0a8b0', tip: '#909098', guard: '#6b7280' },
    silver:   { blade: '#c0c8d4', edge: '#e0e6ec', tip: '#d0d8e0', guard: '#94a3b8' },
    gold:     { blade: '#ffd700', edge: '#ffed4a', tip: '#ffe040', guard: '#b8860b' },
    diamond:  { blade: '#67e8f9', edge: '#a5f3fc', tip: '#7deff7', guard: '#06b6d4' },
    titanium: { blade: '#a78bfa', edge: '#c4b5fd', tip: '#b89efc', guard: '#7c3aed' },
    light:    { blade: '#fffef0', edge: '#fff9c4', tip: '#fffde7', guard: '#fbbf24' },
  };
  return palette[material] || palette.silver;
}

function drawPlayer(ctx, state) {
  const p = state.player;
  const x = Math.round(p.x);
  const y = Math.round(p.y);

  ctx.save();
  ctx.translate(x, y);
  if (p.facing === -1) ctx.scale(-1, 1);

  const moving = Math.abs(p.vx) > 10;
  const walkFrame = moving ? Math.floor(Date.now() / 160) % 4 : 0; // 0-3 walk frames
  const jumpPose = !p.grounded;

  /* ── colour palette ── */
  const SKIN  = '#f5c6a0', SKIN_D = '#d4a070';
  const HAIR  = '#4a2c17', HAIR_L = '#6b3f23';
  const SHIRT = '#2563eb', SHIRT_D = '#1d4ed8';
  const PANTS = '#4b5563', PANTS_D = '#374151';
  const BOOTS = '#6b3410', BOOTS_L = '#8b4513';
  const BELT  = '#7c2d12', BUCKLE = '#facc15';

  /* ─── BACK ARM ─── */
  const bSwing = moving ? (walkFrame < 2 ? 2 : -2) : 0;
  ctx.fillStyle = SHIRT_D;
  ctx.fillRect(-17, 26 + bSwing, 5, 10);
  ctx.fillStyle = SKIN_D;
  ctx.fillRect(-17, 36 + bSwing, 5, 4);

  /* ─── WEAPON ON BACK ─── */
  if (state.bowMode) {
    // Sword sheathed diagonally on back
    ctx.save();
    ctx.translate(-8, 26);
    ctx.rotate(0.45);
    const sc = getSwordColor(p.swordMaterial);
    ctx.fillStyle = sc.blade;
    ctx.fillRect(-1, -14, 3, 18);
    ctx.fillStyle = sc.guard;
    ctx.fillRect(-3, 4, 7, 2);
    ctx.fillStyle = BOOTS;
    ctx.fillRect(-1, 6, 3, 5);
    ctx.restore();
  } else {
    // Bow slung on back
    ctx.save();
    ctx.translate(-10, 31);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.stroke();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    const bx = 10 * Math.cos(Math.PI * 0.55);
    ctx.beginPath();
    ctx.moveTo(bx, -10 * Math.sin(Math.PI * 0.55));
    ctx.lineTo(bx,  10 * Math.sin(Math.PI * 0.55));
    ctx.stroke();
    ctx.restore();
  }

  /* ─── HAIR ─── */
  ctx.fillStyle = HAIR;
  ctx.fillRect(-9,  0, 18, 4);
  ctx.fillRect(-11, 4, 22, 4);
  ctx.fillStyle = HAIR_L;
  ctx.fillRect(-5, 0, 8, 3);        // highlight
  ctx.fillStyle = HAIR;
  ctx.fillRect(-11, 8, 4, 5);       // sideburn

  /* ─── HEAD ─── */
  ctx.fillStyle = SKIN;
  ctx.fillRect(-9, 8, 18, 13);
  // ear
  ctx.fillStyle = SKIN_D;
  ctx.fillRect(-11, 11, 3, 5);
  // eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(-6, 12, 5, 4);
  ctx.fillRect(1, 12, 5, 4);
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(-4, 13, 3, 3);
  ctx.fillRect(3, 13, 3, 3);
  // eyebrows
  ctx.fillStyle = HAIR;
  ctx.fillRect(-7, 11, 5, 1);
  ctx.fillRect(1, 11, 5, 1);
  // mouth
  ctx.fillStyle = SKIN_D;
  ctx.fillRect(-3, 18, 6, 2);

  /* ─── NECK ─── */
  ctx.fillStyle = SKIN;
  ctx.fillRect(-3, 21, 6, 5);

  /* ─── TORSO ─── */
  ctx.fillStyle = SHIRT;
  ctx.fillRect(-13, 26, 26, 14);
  ctx.fillStyle = SHIRT_D;
  ctx.fillRect(-13, 26, 4, 14);    // left shadow
  ctx.fillRect(-2, 28, 4, 5);     // center fold
  // collar
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(-5, 26, 10, 2);

  /* ─── BELT ─── */
  ctx.fillStyle = BELT;
  ctx.fillRect(-13, 40, 26, 3);
  ctx.fillStyle = BUCKLE;
  ctx.fillRect(-2, 40, 4, 3);

  /* ─── LEGS ─── */
  if (jumpPose) {
    // Legs tucked / spread when jumping
    ctx.fillStyle = PANTS;
    ctx.fillRect(-10, 43, 8, 11);
    ctx.fillRect(2,  43, 8, 11);
    ctx.fillStyle = PANTS_D;
    ctx.fillRect(-10, 43, 3, 11);
    ctx.fillRect(2,  43, 3, 11);
    ctx.fillStyle = BOOTS;
    ctx.fillRect(-11, 54, 11, 5);
    ctx.fillRect(1,  54, 11, 5);
    ctx.fillStyle = BOOTS_L;
    ctx.fillRect(-11, 54, 11, 2);
    ctx.fillRect(1,  54, 11, 2);
  } else if (moving) {
    // 4-frame walk cycle: alternate leg offsets
    const l = [0, -2, 0, 2][walkFrame];
    const r = [0, 2, 0, -2][walkFrame];
    ctx.fillStyle = PANTS;
    ctx.fillRect(-10, 43 + l, 8, 13 - l);
    ctx.fillRect(2,  43 + r, 8, 13 - r);
    ctx.fillStyle = PANTS_D;
    ctx.fillRect(-10, 43 + l, 3, 13 - l);
    ctx.fillRect(2,  43 + r, 3, 13 - r);
    ctx.fillStyle = BOOTS;
    ctx.fillRect(-11, 56 + l, 11, 6);
    ctx.fillRect(1,  56 + r, 11, 6);
    ctx.fillStyle = BOOTS_L;
    ctx.fillRect(-11, 56 + l, 11, 2);
    ctx.fillRect(1,  56 + r, 11, 2);
  } else {
    // Standing still
    ctx.fillStyle = PANTS;
    ctx.fillRect(-10, 43, 8, 13);
    ctx.fillRect(2,  43, 8, 13);
    ctx.fillStyle = PANTS_D;
    ctx.fillRect(-10, 43, 3, 13);
    ctx.fillRect(2,  43, 3, 13);
    ctx.fillStyle = BOOTS;
    ctx.fillRect(-11, 56, 11, 6);
    ctx.fillRect(1,  56, 11, 6);
    ctx.fillStyle = BOOTS_L;
    ctx.fillRect(-11, 56, 11, 2);
    ctx.fillRect(1,  56, 11, 2);
  }

  /* ─── FRONT ARM + WEAPON ─── */
  if (state.bowMode) {
    drawBowHeld(ctx, p, state);
  } else {
    drawSwordArm(ctx, p);
  }

  /* ─── SHIELD (if equipped) ─── */
  if (p.shieldMaterial && !state.bowMode) {
    ctx.fillStyle = p.shieldMaterial === 'gold' ? '#fbbf24'
                  : p.shieldMaterial === 'diamond' ? '#67e8f9'
                  : p.shieldMaterial === 'titanium' ? '#a78bfa'
                  : '#94a3b8';
    ctx.fillRect(-19, 30, 5, 12);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(-19, 30, 5, 12);
  }

  /* ─── GUARD STANCE GLOW ─── */
  if (state.input.guard) {
    ctx.strokeStyle = 'rgba(96,165,250,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 31, 24, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* ─── INVULN FLASH ─── */
  if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-14, 0, 28, 62);
    ctx.globalAlpha = 1;
  }

  /* ─── ELEMENT AURA ─── */
  if (p.element && p.elementCooldown <= 0) {
    const now = Date.now();
    const pulse = 0.5 + Math.sin(now * 0.004) * 0.25;
    const fastPulse = 0.5 + Math.sin(now * 0.008) * 0.3;
    const coreR = p.element === 'fire' ? [239,68,68] : p.element === 'lightning' ? [250,204,21] : [56,189,248];
    const outerR = p.element === 'fire' ? [255,160,50] : p.element === 'lightning' ? [255,255,130] : [130,220,255];
    const accentR = p.element === 'fire' ? [255,220,120] : p.element === 'lightning' ? [200,160,255] : [180,230,255];

    ctx.save();

    // Ground light pool (illuminates feet area)
    const groundW = 32 + Math.sin(now * 0.003) * 4;
    const groundH = 6;
    const groundGrad = ctx.createRadialGradient(0, 60, 2, 0, 60, groundW);
    groundGrad.addColorStop(0, `rgba(${coreR[0]},${coreR[1]},${coreR[2]},${0.18 * pulse})`);
    groundGrad.addColorStop(0.5, `rgba(${outerR[0]},${outerR[1]},${outerR[2]},${0.08 * pulse})`);
    groundGrad.addColorStop(1, `rgba(${outerR[0]},${outerR[1]},${outerR[2]},0)`);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(-groundW, 60 - groundH, groundW * 2, groundH * 2);

    // Layered radial glow (soft aura body) — 5 layers now, richer gradient
    for (let i = 4; i >= 0; i--) {
      const radius = 20 + i * 9 + Math.sin(now * 0.003 + i * 1.2) * 4;
      const alpha = (0.07 + pulse * 0.06) * (1 - i * 0.17);
      const grad = ctx.createRadialGradient(0, 31, 3, 0, 31, radius);
      grad.addColorStop(0,   `rgba(255,255,255,${alpha * 0.6})`);
      grad.addColorStop(0.15,`rgba(${coreR[0]},${coreR[1]},${coreR[2]},${alpha * 1.3})`);
      grad.addColorStop(0.45,`rgba(${outerR[0]},${outerR[1]},${outerR[2]},${alpha * 0.6})`);
      grad.addColorStop(0.75,`rgba(${accentR[0]},${accentR[1]},${accentR[2]},${alpha * 0.2})`);
      grad.addColorStop(1,   `rgba(${outerR[0]},${outerR[1]},${outerR[2]},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-radius, 31 - radius, radius * 2, radius * 2);
    }

    // Inner bright core — pulsating white-hot center
    const coreSize = 10 + fastPulse * 4;
    const coreGrad = ctx.createRadialGradient(0, 31, 0, 0, 31, coreSize);
    coreGrad.addColorStop(0,   `rgba(255,255,255,${0.12 * pulse})`);
    coreGrad.addColorStop(0.5, `rgba(${coreR[0]},${coreR[1]},${coreR[2]},${0.08 * pulse})`);
    coreGrad.addColorStop(1,   `rgba(${coreR[0]},${coreR[1]},${coreR[2]},0)`);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(-coreSize, 31 - coreSize, coreSize * 2, coreSize * 2);

    // Rising wisps — 10 particles with varied behavior
    for (let i = 0; i < 10; i++) {
      const seed = i * 1337;
      const speed = 0.0015 + (i % 3) * 0.0005;
      const period = 2.5 + (i % 4) * 0.5;
      const cycle = ((now * speed + seed) % period) / period;
      const drift = Math.sin(seed + now * 0.002 + i) * (12 + i * 2.5);
      const wy = 58 - cycle * 68;
      const wAlpha = Math.sin(cycle * Math.PI) * pulse * 0.55;
      const wSize = 1.5 + Math.sin(now * 0.005 + seed) * 1 + (i % 2);
      // Alternate between core and accent colors
      const col = i % 3 === 0 ? accentR : coreR;
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${wAlpha})`;
      ctx.fillRect(Math.round(drift - wSize / 2), Math.round(wy - wSize / 2), Math.round(wSize), Math.round(wSize));
      // Small trailing pixel behind each wisp
      if (wAlpha > 0.1) {
        ctx.fillStyle = `rgba(${outerR[0]},${outerR[1]},${outerR[2]},${wAlpha * 0.35})`;
        ctx.fillRect(Math.round(drift - 0.5), Math.round(wy + wSize + 1), 1, 2);
      }
    }

    // Element-specific particles
    if (p.element === 'fire') {
      // Ember sparks — tiny hot pixels that float up and out
      for (let i = 0; i < 8; i++) {
        const seed = i * 997;
        const cy = ((now * 0.003 + seed) % 2) / 2;
        const ex = Math.sin(seed * 3 + now * 0.004) * (8 + cy * 18);
        const ey = 55 - cy * 55 + Math.sin(now * 0.01 + seed) * 3;
        const ea = Math.sin(cy * Math.PI) * 0.7 * pulse;
        const hot = cy < 0.3;
        ctx.fillStyle = hot ? `rgba(255,255,200,${ea})` : `rgba(255,120,30,${ea * 0.7})`;
        ctx.fillRect(Math.round(ex), Math.round(ey), hot ? 2 : 1, hot ? 2 : 1);
      }
    } else if (p.element === 'lightning') {
      // Electric crackles — short jagged line segments that flash
      for (let i = 0; i < 4; i++) {
        const seed = i * 2719;
        const flash = Math.sin(now * 0.015 + seed) > 0.6; // intermittent flash
        if (!flash) continue;
        const bx = Math.sin(seed + now * 0.005) * 18;
        const by = 10 + Math.sin(seed * 2 + now * 0.004) * 30;
        const ba = 0.5 + Math.random() * 0.4;
        ctx.strokeStyle = `rgba(${accentR[0]},${accentR[1]},${accentR[2]},${ba * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        const jags = 2 + (i % 2);
        let jx = bx, jy = by;
        for (let j = 0; j < jags; j++) {
          jx += (Math.sin(seed * (j + 1) + now * 0.02) * 6);
          jy += 4 + Math.sin(seed * j + now * 0.01) * 3;
          ctx.lineTo(jx, jy);
        }
        ctx.stroke();
      }
    } else if (p.element === 'water') {
      // Water droplets / bubbles — small circles that float up gently
      for (let i = 0; i < 6; i++) {
        const seed = i * 1889;
        const cy = ((now * 0.0012 + seed) % 3) / 3;
        const bx = Math.sin(seed + now * 0.002) * (10 + i * 3);
        const by = 54 - cy * 52;
        const ba = Math.sin(cy * Math.PI) * 0.5 * pulse;
        const bSize = 1.5 + (i % 2);
        // Outline circle for bubble effect
        ctx.strokeStyle = `rgba(${accentR[0]},${accentR[1]},${accentR[2]},${ba * 0.8})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(bx, by, bSize, 0, Math.PI * 2);
        ctx.stroke();
        // Tiny specular highlight
        ctx.fillStyle = `rgba(255,255,255,${ba * 0.5})`;
        ctx.fillRect(Math.round(bx - 0.5), Math.round(by - bSize + 0.5), 1, 1);
      }
    }

    // Ribbon spiraling around player — thicker with glow
    const ribbonSegs = 36;
    const ribbonSpeed = now * 0.002;
    const ribbonRx = 22;
    const ribbonCenterY = 31;
    const ribbonHeight = 60;
    ctx.lineCap = 'round';
    for (let i = 0; i < ribbonSegs; i++) {
      const t0 = i / ribbonSegs;
      const t1 = (i + 1) / ribbonSegs;
      const angle0 = ribbonSpeed + t0 * Math.PI * 4;
      const angle1 = ribbonSpeed + t1 * Math.PI * 4;
      const x0 = Math.cos(angle0) * ribbonRx;
      const x1 = Math.cos(angle1) * ribbonRx;
      const z0 = Math.sin(angle0);
      const z1 = Math.sin(angle1);
      const y0 = ribbonCenterY - ribbonHeight / 2 + t0 * ribbonHeight;
      const y1 = ribbonCenterY - ribbonHeight / 2 + t1 * ribbonHeight;
      const depthAlpha0 = 0.35 + z0 * 0.45;
      const depthAlpha1 = 0.35 + z1 * 0.45;
      const edgeFade = Math.sin(t0 * Math.PI);
      const segAlpha = Math.max(0, ((depthAlpha0 + depthAlpha1) / 2) * edgeFade * pulse * 1.5);
      const blend = (z0 + z1) / 2;
      const r = Math.round(coreR[0] + (outerR[0] - coreR[0]) * (1 - blend) * 0.5);
      const g = Math.round(coreR[1] + (outerR[1] - coreR[1]) * (1 - blend) * 0.5);
      const b = Math.round(coreR[2] + (outerR[2] - coreR[2]) * (1 - blend) * 0.5);
      // Outer glow pass (wider, dimmer)
      ctx.strokeStyle = `rgba(${r},${g},${b},${segAlpha * 0.3})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      // Main ribbon pass
      ctx.strokeStyle = `rgba(${r},${g},${b},${segAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      // Bright inner line on front-facing segments
      if (blend > 0.2) {
        ctx.strokeStyle = `rgba(255,255,255,${segAlpha * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }

    // Orbiting accent dots — 3 small bright dots circling the player
    for (let i = 0; i < 3; i++) {
      const orbitAngle = now * 0.003 + i * (Math.PI * 2 / 3);
      const orbitR = 24 + Math.sin(now * 0.005 + i) * 3;
      const ox = Math.cos(orbitAngle) * orbitR;
      const oy = 28 + Math.sin(orbitAngle) * 14;
      const oz = Math.sin(orbitAngle); // depth
      const oa = (0.4 + oz * 0.4) * pulse;
      ctx.fillStyle = `rgba(255,255,255,${oa * 0.6})`;
      ctx.fillRect(Math.round(ox) - 1, Math.round(oy) - 1, 3, 3);
      ctx.fillStyle = `rgba(${accentR[0]},${accentR[1]},${accentR[2]},${oa})`;
      ctx.fillRect(Math.round(ox), Math.round(oy), 1, 1);
    }

    ctx.restore();
  }

  /* ─── BLESSING OF LIGHT GOLDEN AURA ─── */
  if (p.hasBlessingOfLight) {
    const now = Date.now();
    const bPulse = 0.4 + Math.sin(now * 0.003) * 0.2;
    ctx.save();
    // Soft golden radiance
    for (let i = 2; i >= 0; i--) {
      const r = 30 + i * 12 + Math.sin(now * 0.002 + i * 2) * 4;
      const a = (0.04 + bPulse * 0.03) * (1 - i * 0.25);
      const grad = ctx.createRadialGradient(0, 31, 6, 0, 31, r);
      grad.addColorStop(0, `rgba(255,251,230,${a * 1.8})`);
      grad.addColorStop(0.5, `rgba(251,191,36,${a})`);
      grad.addColorStop(1, `rgba(251,191,36,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-r, 31 - r, r * 2, r * 2);
    }
    // Tiny golden sparkles around player
    for (let i = 0; i < 4; i++) {
      const seed = i * 2477;
      const cycle = ((now * 0.0015 + seed) % 2.5) / 2.5;
      const angle = (seed + now * 0.001) % (Math.PI * 2);
      const dist = 14 + cycle * 22;
      const sx = Math.cos(angle) * dist;
      const sy = 10 + Math.sin(angle) * 28;
      const sAlpha = Math.sin(cycle * Math.PI) * bPulse * 0.8;
      ctx.fillStyle = `rgba(255,251,230,${sAlpha})`;
      ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 2, 2);
    }
    ctx.restore();
  }

  ctx.restore();
}

/* ─── SWORD ARM + VISIBLE SWORD WITH SWING ─── */
function drawSwordArm(ctx, p) {
  const attacking = p.attackTimer > 0;

  ctx.save();
  ctx.translate(13, 28); // shoulder pivot

  let angle;
  if (attacking) {
    const t = 1 - p.attackTimer / 0.2;
    // Overhead slash arc: wound-up → follow-through
    angle = -2.8 + t * 2.6;
  } else {
    // Idle: gentle sway, sword at ready
    const sway = Math.sin(Date.now() * 0.002) * 0.04;
    angle = -1.3 + sway;
  }
  ctx.rotate(angle);

  // Upper arm (shirt)
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(-3, 0, 6, 8);
  // Hand
  ctx.fillStyle = '#f5c6a0';
  ctx.fillRect(-3, 8, 6, 5);

  // Sword
  const sc = getSwordColor(p.swordMaterial);

  // Handle
  ctx.fillStyle = '#5c3310';
  ctx.fillRect(-2, 13, 4, 6);
  // Handle wrap detail
  ctx.fillStyle = '#7c4a20';
  ctx.fillRect(-2, 14, 4, 1);
  ctx.fillRect(-2, 17, 4, 1);

  // Guard (crosspiece)
  ctx.fillStyle = sc.guard;
  ctx.fillRect(-5, 11, 10, 3);

  // Blade
  ctx.fillStyle = sc.blade;
  ctx.fillRect(-2, 19, 4, 18);
  // Edge highlight
  ctx.fillStyle = sc.edge;
  ctx.fillRect(-1, 19, 2, 18);

  // Blade tip
  ctx.beginPath();
  ctx.moveTo(-2, 37);
  ctx.lineTo(0, 42);
  ctx.lineTo(2, 37);
  ctx.fillStyle = sc.tip;
  ctx.fill();

  // ── Sword of Light shimmer ──
  if (p.swordMaterial === 'light') {
    const t = Date.now();
    const shimmer = 0.25 + Math.sin(t * 0.006) * 0.15;
    ctx.globalAlpha = shimmer;
    ctx.fillStyle = '#fffbe6';
    ctx.fillRect(-3, 19, 6, 20);
    ctx.globalAlpha = shimmer * 0.5;
    ctx.fillStyle = '#fbbf24';
    // Travelling sparkle along the blade
    const sparkY = 19 + ((t * 0.02) % 20);
    ctx.fillRect(-1, sparkY, 2, 2);
    ctx.globalAlpha = 1;
  }

  // ── Attack trail ──
  if (attacking) {
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 40, -0.2, Math.PI * 0.5);
    ctx.stroke();
    // second fainter trail
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 0.4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* ─── BOW HELD IN HAND ─── */
function drawBowHeld(ctx, p, state) {
  // Front arm (static, not rotating)
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(13, 26, 6, 8);
  ctx.fillStyle = '#f5c6a0';
  ctx.fillRect(13, 34, 6, 5);

  ctx.save();
  ctx.translate(20, 32);

  // Bow body (wooden arc)
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(5, 0, 15, -Math.PI * 0.65, Math.PI * 0.65);
  ctx.stroke();
  // Bow detail line
  ctx.strokeStyle = '#a0522d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(5, 0, 13, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();

  // Bowstring
  const topX = 5 + 15 * Math.cos(Math.PI * 0.65);
  const topY = -15 * Math.sin(Math.PI * 0.65);
  const botY =  15 * Math.sin(Math.PI * 0.65);

  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  if (state.bowTarget) {
    // String drawn back — arrow nocked
    ctx.moveTo(topX, topY);
    ctx.lineTo(-8, 0);
    ctx.lineTo(topX, botY);
    ctx.stroke();

    // Arrow shaft
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(22, -3);
    ctx.lineTo(27, 0);
    ctx.lineTo(22, 3);
    ctx.closePath();
    ctx.fill();

    // Fletching
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-10, -4);
    ctx.lineTo(-6, -1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-6, 1);
    ctx.closePath();
    ctx.fill();

    // Glow when target locked
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(5, 0, 18, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    // String at rest
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX, botY);
    ctx.stroke();

    // Arrow resting on bow
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(22, -3);
    ctx.lineTo(27, 0);
    ctx.lineTo(22, 3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawNpcAndActors() {
  const p = state.player;

  // ── Draw NPCs as humans ──
  state.npcs.forEach((n) => {
    const nx = Math.round(n.x);
    const ny = Math.round(n.y);
    ctx.save();
    ctx.translate(nx, ny);

    if (n.old) {
      // ── Old Master sprite ──

      // White/silver hair (longer, tied back)
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(-7, 0, 14, 3);
      ctx.fillRect(-8, 3, 16, 4);
      // Hair flowing down back
      ctx.fillRect(6, 7, 3, 8);

      // Head (aged skin)
      ctx.fillStyle = '#e8c09a';
      ctx.fillRect(-7, 7, 14, 11);
      // Bushy white eyebrows
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(-6, 9, 5, 2);
      ctx.fillRect(1, 9, 5, 2);
      // Eyes (slightly squinted / wise)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-5, 11, 4, 2);
      ctx.fillRect(1, 11, 4, 2);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-3, 11, 2, 2);
      ctx.fillRect(3, 11, 2, 2);
      // Wrinkle lines
      ctx.fillStyle = '#c8a882';
      ctx.fillRect(-6, 14, 2, 1);
      ctx.fillRect(4, 14, 2, 1);
      // Mouth (thin)
      ctx.fillStyle = '#c49a70';
      ctx.fillRect(-2, 16, 4, 1);
      // Long white beard
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(-4, 18, 8, 3);
      ctx.fillRect(-3, 21, 6, 3);
      ctx.fillRect(-2, 24, 4, 3);
      ctx.fillRect(-1, 27, 2, 2);

      // Robe (use NPC color for outer robe)
      ctx.fillStyle = n.color || '#f59e0b';
      ctx.fillRect(-10, 20, 20, 14);
      // Inner robe fold
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-3, 20, 6, 14);
      // Robe sash / belt
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-10, 32, 20, 2);

      // Sleeves (wide robe sleeves)
      ctx.fillStyle = n.color || '#f59e0b';
      ctx.fillRect(-15, 22, 5, 10);
      ctx.fillRect(10, 22, 5, 10);
      // Hands
      ctx.fillStyle = '#e8c09a';
      ctx.fillRect(-15, 30, 4, 3);
      ctx.fillRect(11, 30, 4, 3);

      // Robe skirt (long robe goes over legs)
      ctx.fillStyle = n.color || '#f59e0b';
      ctx.fillRect(-9, 34, 18, 10);
      // Robe bottom edge
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-9, 43, 18, 1);

      // Sandals peeking out
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-7, 44, 6, 4);
      ctx.fillRect(1, 44, 6, 4);

      // Staff (wooden walking staff to the right)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(17, -4, 3, 52);
      // Staff top knob
      ctx.fillStyle = '#78350f';
      ctx.fillRect(16, -6, 5, 4);

      // Beard drawn over robe
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(-3, 21, 6, 3);
      ctx.fillRect(-2, 24, 4, 3);
      ctx.fillRect(-1, 27, 2, 2);

    } else {
      // ── Standard NPC sprite ──

      // Hair
      ctx.fillStyle = '#6b3f23';
      ctx.fillRect(-7, 0, 14, 4);
      ctx.fillRect(-8, 4, 16, 3);

      // Head (skin)
      ctx.fillStyle = '#f5c6a0';
      ctx.fillRect(-7, 7, 14, 11);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(-5, 10, 4, 3);
      ctx.fillRect(1, 10, 4, 3);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-3, 11, 2, 2);
      ctx.fillRect(3, 11, 2, 2);
      // Mouth
      ctx.fillStyle = '#d4a070';
      ctx.fillRect(-2, 16, 4, 1);

      // Torso (shirt - use NPC color)
      ctx.fillStyle = n.color || '#22c55e';
      ctx.fillRect(-9, 20, 18, 12);
      // Collar
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, 20, 8, 2);

      // Arms
      ctx.fillStyle = n.color || '#22c55e';
      ctx.fillRect(-13, 21, 4, 9);
      ctx.fillRect(9, 21, 4, 9);
      ctx.fillStyle = '#f5c6a0';
      ctx.fillRect(-13, 30, 4, 3);
      ctx.fillRect(9, 30, 4, 3);

      // Belt
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-9, 32, 18, 2);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-1, 32, 2, 2);

      // Legs
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-7, 34, 6, 10);
      ctx.fillRect(1, 34, 6, 10);

      // Boots
      ctx.fillStyle = '#6b3410';
      ctx.fillRect(-8, 44, 8, 4);
      ctx.fillRect(0, 44, 8, 4);
    }

    ctx.restore();

    // Name label
    ctx.fillStyle = '#f8fafc';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(n.name, nx, ny - 8);
  });

  // ── Draw enemies with unique sprites ──
  state.enemies.forEach((e) => {
    if (!e.alive) return;
    drawEnemySprite(ctx, e, state);
    // HP bar
    ctx.fillStyle = '#111827';
    ctx.fillRect(e.x - e.w / 2, e.y - 10, e.w, 4);
    ctx.fillStyle = e.isBoss ? '#eab308' : '#ef4444';
    ctx.fillRect(e.x - e.w / 2, e.y - 10, (e.hp / e.maxHp) * e.w, 4);
    // Boss name
    if (e.isBoss) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(e.type, e.x, e.y - 14);
    }
    // Enrage indicator
    if (e._enraged) {
      ctx.fillStyle = 'rgba(239,68,68,0.3)';
      ctx.fillRect(e.x - e.w / 2 - 2, e.y - 2, e.w + 4, e.h + 4);
    }
    // Abandoned vehicle indicator
    if (e._abandonedVehicle) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(107,114,128,0.3)';
      ctx.fillRect(e.x - e.w / 2 - 2, e.y - 2, e.w + 4, e.h + 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f59e0b';
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('UNMANNED VEHICLE', e.x, e.y - 14);
    }
    // Ejected boss dizzy stars
    if (e.isBoss && e._ejected && e._ejectPhase === 'dizzy') {
      const starCount = 5;
      const starRadius = Math.max(e.w * 0.55, 28);
      const starTime = Date.now() / 400;
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      for (let s = 0; s < starCount; s++) {
        const angle = starTime + (s * Math.PI * 2) / starCount;
        const sx = e.x + Math.cos(angle) * starRadius;
        const sy = e.y - 8 + Math.sin(angle) * (starRadius * 0.4);
        ctx.fillStyle = s % 2 === 0 ? '#facc15' : '#fef08a';
        ctx.fillText('⭐', sx - 5, sy + 4);
      }
      // Dizzy timer text
      ctx.fillStyle = '#facc15';
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('💫 DIZZY ' + Math.ceil(e._dizzyTimer) + 's', e.x, e.y - 22);
    }
    // Boss recovering (getting up)
    if (e.isBoss && e._ejected && e._ejectPhase === 'recovering') {
      ctx.fillStyle = '#dc2626';
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('😠 GETTING UP...', e.x, e.y - 22);
    }
    // Boss running to vehicle
    if (e.isBoss && e._ejected && e._ejectPhase === 'reboarding') {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ RETURNING TO VEHICLE!', e.x, e.y - 22);
    }
  });

  state.companions.forEach((c) => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x - c.w / 2, c.y, c.w, c.h);
  });

  drawPlayer(ctx, state);

  if (p.hasForceField && p.forceFieldActive) {
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y + p.h / 2, p.w * 0.75, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (p.hasJetpack && p.jetpackActive) {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(p.x - 6, p.y + p.h, 4, 10 + Math.random() * 8);
    ctx.fillRect(p.x + 2, p.y + p.h, 4, 10 + Math.random() * 8);
  }

  // ── Jetpack Fuel Bar (right side) ──
  if (p.hasJetpack) {
    const barX = dom.canvas.width - 30;
    const barY = 40;
    const barW = 16;
    const barH = 140;
    const fuelPct = Math.max(0, p.jetpackFuel / p.maxJetpackFuel);
    // Background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    // Empty bar
    ctx.fillStyle = '#374151';
    ctx.fillRect(barX, barY, barW, barH);
    // Fuel fill (bottom up)
    const fillH = Math.round(barH * fuelPct);
    const fuelColor = fuelPct > 0.4 ? '#f97316' : fuelPct > 0.15 ? '#eab308' : '#ef4444';
    ctx.fillStyle = fuelColor;
    ctx.fillRect(barX, barY + barH - fillH, barW, fillH);
    // Border
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
    // Label
    ctx.fillStyle = '#f97316';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('FUEL', barX + barW / 2, barY - 5);
    // Seconds remaining
    ctx.fillStyle = fuelColor;
    ctx.fillText(Math.ceil(p.jetpackFuel) + 's', barX + barW / 2, barY + barH + 12);
  }

  const nearby = pickNpc();
  if (nearby && !state.dialogueOpen) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS E TO TALK', nearby.x, nearby.y - 24);
  }
}

/* ── PIXEL-ART ENEMY SPRITES ── */
function drawEnemySprite(ctx, e, state) {
  const x = Math.round(e.x);
  const y = Math.round(e.y);
  const w = e.w, h = e.h;
  const hw = w / 2;
  const type = e.isBoss ? (e.vehicle || 'boss') : e.type;
  const blink = Math.floor(Date.now() / 200) % 6 === 0;
  const time = Date.now() / 1000;

  // Walking animation: leg/arm swing based on velocity
  const moving = Math.abs(e.vx || 0) > 5;
  const walkCycle = moving ? Math.sin(time * 8) : 0;  // oscillates -1..1 when moving
  const walkAbs = Math.abs(walkCycle);
  const legSwing = walkCycle * 6;   // pixel offset for legs
  const armSwing = walkCycle * 5;   // pixel offset for arms
  const breathe = Math.sin(time * 2) * 1.5; // idle breathing
  const facingLeft = (e.vx || 0) < -5;

  ctx.save();
  ctx.translate(x, y);
  // Face direction of movement
  if (facingLeft) { ctx.scale(-1, 1); }

  // Freeze tint
  if (e.status.freeze > 0) { ctx.globalAlpha = 0.7; }

  switch (type) {
    case 'sword_dummy': {
      // Wooden training dummy with target
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-4, h * 0.45, 8, h * 0.55); // post
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(-hw * 0.6, h * 0.1, w * 0.6, h * 0.45); // body
      // Cross-beam (arms)
      ctx.fillRect(-hw * 0.8, h * 0.2, w * 0.8, h * 0.08);
      // Target circle on chest
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, h * 0.32, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, h * 0.32, 3, 0, Math.PI * 2);
      ctx.fill();
      // Head (round)
      ctx.fillStyle = '#d2b48c';
      ctx.beginPath();
      ctx.arc(0, h * 0.06, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'arrow_dummy': {
      // Straw dummy with bullseye
      ctx.fillStyle = '#d2b48c';
      ctx.fillRect(-4, h * 0.5, 8, h * 0.5); // post
      ctx.fillStyle = '#daa520';
      ctx.fillRect(-hw * 0.5, h * 0.1, w * 0.5, h * 0.45); // straw body
      // Straw tufts
      ctx.fillStyle = '#f0e68c';
      ctx.fillRect(-hw * 0.55, h * 0.12, w * 0.08, h * 0.1);
      ctx.fillRect(hw * 0.15, h * 0.15, w * 0.08, h * 0.08);
      // Bullseye
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, h * 0.3, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, h * 0.3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, h * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
      // Straw head
      ctx.fillStyle = '#f0e68c';
      ctx.beginPath();
      ctx.arc(0, h * 0.04, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'slime': {
      // Bouncy blob shape
      const sq = Math.sin(time * 3) * 3;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.ellipse(0, h - 8 + sq, hw - 2, h / 2 - sq, 0, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(-4, h / 2 - 4 + sq, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, h / 2 - 6 + sq, 5, 5);
      ctx.fillRect(3, h / 2 - 6 + sq, 5, 5);
      ctx.fillStyle = '#111';
      ctx.fillRect(-6, h / 2 - 4 + sq, 3, 3);
      ctx.fillRect(5, h / 2 - 4 + sq, 3, 3);
      break;
    }
    case 'red_slime': {
      // Angry red slime with spiky top
      const sqr = Math.sin(time * 4) * 3;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.ellipse(0, h - 8 + sqr, hw - 2, h / 2 - sqr, 0, 0, Math.PI * 2);
      ctx.fill();
      // Spiky bumps on top
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-10, h / 2 - 6 + sqr);
      ctx.lineTo(-6, h / 2 - 16 + sqr);
      ctx.lineTo(-2, h / 2 - 6 + sqr);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, h / 2 - 6 + sqr);
      ctx.lineTo(6, h / 2 - 18 + sqr);
      ctx.lineTo(10, h / 2 - 6 + sqr);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(-5, h / 2 - 2 + sqr, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Angry eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(-9, h / 2 - 4 + sqr, 6, 5);
      ctx.fillRect(3, h / 2 - 4 + sqr, 6, 5);
      ctx.fillStyle = '#111';
      ctx.fillRect(-7, h / 2 - 2 + sqr, 3, 3);
      ctx.fillRect(5, h / 2 - 2 + sqr, 3, 3);
      // Angry eyebrows
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-9, h / 2 - 7 + sqr, 6, 2);
      ctx.fillRect(3, h / 2 - 7 + sqr, 6, 2);
      break;
    }
    case 'blue_slime': {
      // Icy blue slime, bigger and more blobby
      const sqb = Math.sin(time * 2.2) * 4;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.ellipse(0, h - 7 + sqb, hw, h / 2 + 2 - sqb, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow / bubble
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.ellipse(-6, h / 2 - 2 + sqb, 8, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Small bubble detail
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(6, h / 2 - 8 + sqb, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(10, h / 2 - 3 + sqb, 2, 0, Math.PI * 2);
      ctx.fill();
      // Sleepy eyes (half-closed)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-9, h / 2 - 4 + sqb, 6, 4);
      ctx.fillRect(3, h / 2 - 4 + sqb, 6, 4);
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(-7, h / 2 - 2 + sqb, 3, 3);
      ctx.fillRect(5, h / 2 - 2 + sqb, 3, 3);
      // Eyelids (half-closed look)
      ctx.fillStyle = e.color;
      ctx.fillRect(-9, h / 2 - 4 + sqb, 6, 2);
      ctx.fillRect(3, h / 2 - 4 + sqb, 6, 2);
      break;
    }
    case 'goblin': {
      // Small green humanoid with walking animation
      const bob = moving ? Math.abs(walkCycle) * 2 : breathe;
      // Head
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(-8, 0 - bob, 16, 14);
      // Pointy ears
      ctx.fillRect(-12, 2 - bob, 4, 6);
      ctx.fillRect(8, 2 - bob, 4, 6);
      // Inner ear
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(-11, 3 - bob, 2, 4);
      ctx.fillRect(9, 3 - bob, 2, 4);
      // Eyes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-5, 4 - bob, 4, 4);
      ctx.fillRect(1, 4 - bob, 4, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 5 - bob, 2, 2);
      ctx.fillRect(2, 5 - bob, 2, 2);
      // Angry brows
      ctx.fillStyle = '#3f6212';
      ctx.fillRect(-5, 3 - bob, 4, 1);
      ctx.fillRect(1, 3 - bob, 4, 1);
      // Mouth / teeth
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 10 - bob, 8, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-3, 10 - bob, 2, 2);
      ctx.fillRect(1, 10 - bob, 2, 2);
      ctx.fillRect(-1, 11 - bob, 1, 2);
      // Body with vest
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-9, 14, 18, 14);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(-7, 14, 14, 3); // leather vest top
      ctx.fillRect(-8, 14, 2, 12);
      ctx.fillRect(6, 14, 2, 12);
      // Arms with swing
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(-13, 16 + armSwing, 4, 10);
      ctx.fillRect(9, 16 - armSwing, 4, 10);
      // Hands
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-14, 25 + armSwing, 4, 4);
      ctx.fillRect(9, 25 - armSwing, 4, 4);
      // Legs with walk cycle
      ctx.fillStyle = '#3f6212';
      ctx.fillRect(-7, 28, 6, 12 + legSwing);
      ctx.fillRect(1, 28, 6, 12 - legSwing);
      // Feet
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(-8, 40 + legSwing, 8, 4);
      ctx.fillRect(0, 40 - legSwing, 8, 4);
      // Dagger with arm swing
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(12, 18 - armSwing, 2, 10);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(11, 16 - armSwing, 4, 3);
      break;
    }
    case 'ogre': {
      // Big bulky brute with stomping walk
      const stomp = moving ? walkAbs * 3 : breathe;
      ctx.fillStyle = '#86604a';
      ctx.fillRect(-18, 0 - stomp, 36, 22); // head
      // Brow ridge
      ctx.fillStyle = '#6d4c3a';
      ctx.fillRect(-18, 4 - stomp, 36, 4);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(-10, 6 - stomp, 7, 6);
      ctx.fillRect(3, 6 - stomp, 7, 6);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-8, 8 - stomp, 4, 4);
      ctx.fillRect(5, 8 - stomp, 4, 4);
      // Frown mouth
      ctx.fillStyle = '#111';
      ctx.fillRect(-6, 16 - stomp, 12, 4);
      // Tusks
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, 14 - stomp, 3, 5);
      ctx.fillRect(5, 14 - stomp, 3, 5);
      // Body
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(-24, 22, 48, 28);
      // Chest scar
      ctx.fillStyle = '#7c4a2a';
      ctx.fillRect(-6, 26, 12, 2);
      ctx.fillRect(-4, 28, 2, 8);
      // Belt
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-24, 48, 48, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3, 47, 6, 6); // belt buckle
      // Arms with swing
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(-30, 24 + armSwing * 1.3, 6, 22);
      ctx.fillRect(24, 24 - armSwing * 1.3, 6, 22);
      // Fists
      ctx.fillStyle = '#86604a';
      ctx.fillRect(-32, 44 + armSwing * 1.3, 8, 8);
      ctx.fillRect(24, 44 - armSwing * 1.3, 8, 8);
      // Legs
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(-16, 52, 12, 18 + legSwing);
      ctx.fillRect(4, 52, 12, 18 - legSwing);
      // Feet
      ctx.fillStyle = '#3d2512';
      ctx.fillRect(-18, 70 + legSwing, 14, 4);
      ctx.fillRect(4, 70 - legSwing, 14, 4);
      // Club with arm swing
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(30, 10 - armSwing * 1.3, 6, 40);
      ctx.fillStyle = '#6b3410';
      ctx.fillRect(28, 6 - armSwing * 1.3, 10, 8);
      // Club spikes
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(26, 8 - armSwing * 1.3, 3, 3);
      ctx.fillRect(38, 10 - armSwing * 1.3, 3, 3);
      break;
    }
    case 'skeleton': {
      // Bony frame with rattling walk animation
      const rattle = moving ? Math.sin(time * 12) * 1.5 : 0;
      ctx.fillStyle = '#e2e8f0';
      // Skull
      ctx.fillRect(-8, 0 + rattle, 16, 14);
      // Skull crack detail
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-2, 0 + rattle, 1, 6);
      ctx.fillRect(-4, 2 + rattle, 3, 1);
      ctx.fillStyle = '#111';
      ctx.fillRect(-6, 3 + rattle, 5, 5); // eye sockets
      ctx.fillRect(1, 3 + rattle, 5, 5);
      // Glowing eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-5, 4 + rattle, 3, 3);
      ctx.fillRect(2, 4 + rattle, 3, 3);
      // Jaw (opens when moving)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-5, 10 + rattle + (moving ? walkAbs * 2 : 0), 10, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(-3, 10 + rattle, 6, 1);
      // Teeth
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-3, 10 + rattle, 1, 2);
      ctx.fillRect(-1, 10 + rattle, 1, 2);
      ctx.fillRect(1, 10 + rattle, 1, 2);
      ctx.fillRect(3, 10 + rattle, 1, 2);
      // Ribcage
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, 14, 4, 18);
      ctx.fillRect(-8, 16, 16, 2);
      ctx.fillRect(-7, 20, 14, 2);
      ctx.fillRect(-6, 24, 12, 2);
      ctx.fillRect(-5, 28, 10, 2);
      // Arms swing
      ctx.fillRect(-12, 16, 4, 2);
      ctx.fillRect(-14, 18 + armSwing, 2, 12);
      ctx.fillRect(-15, 29 + armSwing, 3, 3); // hand
      ctx.fillRect(8, 16, 4, 2);
      ctx.fillRect(12, 18 - armSwing, 2, 12);
      ctx.fillRect(12, 29 - armSwing, 3, 3); // hand
      // Pelvis + legs with walk
      ctx.fillRect(-6, 32, 12, 3);
      ctx.fillRect(-5, 35, 3, 12 + legSwing);
      ctx.fillRect(2, 35, 3, 12 - legSwing);
      // Feet
      ctx.fillRect(-6, 47 + legSwing, 5, 2);
      ctx.fillRect(1, 47 - legSwing, 5, 2);
      // Sword with arm swing
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-16, 16 + armSwing, 2, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-17, 14 + armSwing, 4, 3); // crossguard
      break;
    }
    case 'bat': {
      // Wings
      const wingFlap = Math.sin(time * 10) * 8;
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-hw, 4 + wingFlap, hw - 4, 12);
      ctx.fillRect(4, 4 - wingFlap, hw - 4, 12);
      // Body
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-6, 2, 12, 14);
      // Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, 5, 3, 3);
      ctx.fillRect(1, 5, 3, 3);
      // Fangs
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, 14, 2, 3);
      ctx.fillRect(1, 14, 2, 3);
      break;
    }
    case 'spider': {
      // Body segments
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(0, h / 2, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(-10, h / 2 - 4, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Multiple eyes
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-14 + i * 3, h / 2 - 8, 2, 2);
      }
      // 8 Legs
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;
      for (let side = -1; side <= 1; side += 2) {
        for (let leg = 0; leg < 4; leg++) {
          const lx = -4 + leg * 5;
          const ly = h / 2 + 4;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + side * 14, ly + 8 + Math.sin(time * 6 + leg) * 3);
          ctx.stroke();
        }
      }
      break;
    }
    case 'wraith': {
      // Ghostly floating form
      const bob = Math.sin(time * 2.5) * 4;
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(-12, 0 + bob, 24, 30);
      // Tattered bottom
      for (let i = -12; i < 12; i += 4) {
        ctx.fillRect(i, 30 + bob + Math.sin(time * 3 + i) * 4, 4, 8);
      }
      // Hood
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(-14, -2 + bob, 28, 12);
      // Glowing eyes
      ctx.fillStyle = '#c4b5fd';
      ctx.fillRect(-6, 4 + bob, 4, 4);
      ctx.fillRect(2, 4 + bob, 4, 4);
      ctx.globalAlpha = 1;
      break;
    }
    case 'archer': {
      // Green hooded humanoid with bow and walking animation
      const bob = moving ? walkAbs * 1.5 : breathe;
      // Hood
      ctx.fillStyle = '#365314';
      ctx.fillRect(-8, 0 - bob, 16, 8);
      ctx.fillRect(-10, 4 - bob, 20, 4);
      // Hood point
      ctx.fillRect(-2, -3 - bob, 4, 4);
      // Face
      ctx.fillStyle = '#d4a070';
      ctx.fillRect(-6, 8 - bob, 12, 10);
      // Eyes
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 10 - bob, 3, 3);
      ctx.fillRect(1, 10 - bob, 3, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, 10 - bob, 2, 2);
      ctx.fillRect(1, 10 - bob, 2, 2);
      // Body (tunic)
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-10, 18, 20, 14);
      // Tunic detail
      ctx.fillStyle = '#365314';
      ctx.fillRect(-10, 18, 20, 2);
      ctx.fillRect(-1, 18, 2, 14);
      // Belt+quiver
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-10, 30, 20, 2);
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(8, 8 - bob, 4, 24);
      // Arrows in quiver
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(9, 6 - bob, 1, 4);
      ctx.fillRect(11, 5 - bob, 1, 5);
      // Arms with swing
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-14, 20 + armSwing, 4, 10);
      ctx.fillRect(10, 20 - armSwing, 4, 10);
      // Legs with walk cycle
      ctx.fillStyle = '#365314';
      ctx.fillRect(-7, 32, 6, 12 + legSwing);
      ctx.fillRect(1, 32, 6, 12 - legSwing);
      // Boots
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(-8, 44 + legSwing, 8, 4);
      ctx.fillRect(0, 44 - legSwing, 8, 4);
      // Bow in hand
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-14, 24, 10, -Math.PI * 0.55, Math.PI * 0.55);
      ctx.stroke();
      break;
    }
    case 'mage': {
      // Robed figure with staff and magical hover
      const hover = Math.sin(time * 2) * 3;
      const magicPulse = Math.sin(time * 4);
      // Hat (tall wizard hat)
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-3, -8 + hover, 6, 4);
      ctx.fillRect(-4, -4 + hover, 8, 4);
      ctx.fillRect(-8, 0 + hover, 16, 4);
      ctx.fillRect(-12, 4 + hover, 24, 3);
      // Hat star
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-1, -3 + hover, 2, 2);
      // Face
      ctx.fillStyle = '#d4a070';
      ctx.fillRect(-6, 7 + hover, 12, 10);
      // Glowing eyes
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-4, 9 + hover, 3, 3);
      ctx.fillRect(1, 9 + hover, 3, 3);
      // Eye glow
      ctx.fillStyle = 'rgba(168,85,247,0.3)';
      ctx.fillRect(-5, 8 + hover, 5, 5);
      ctx.fillRect(0, 8 + hover, 5, 5);
      // Beard
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(-3, 17 + hover, 6, 6);
      ctx.fillRect(-2, 23 + hover, 4, 3);
      ctx.fillRect(-1, 26 + hover, 2, 2);
      // Robe
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-12, 20 + hover, 24, 22);
      // Robe sash
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-1, 20 + hover, 2, 18);
      // Robe bottom (flowing)
      ctx.fillStyle = '#6d28d9';
      for (let i = -3; i < 3; i++) {
        ctx.fillRect(i * 5, 42 + hover + Math.sin(time * 3 + i) * 2, 5, 10);
      }
      // Arms (casting pose)
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-16, 22 + hover, 4, 14);
      ctx.fillRect(12, 22 + hover + Math.sin(time * 3) * 3, 4, 14);
      // Staff
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-18, 8 + hover, 3, 44);
      // Staff orb (pulsing)
      const orbSize = 3 + magicPulse;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(-16, 6 + hover, orbSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(-16, 5 + hover, orbSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
      // Magic particles
      ctx.fillStyle = '#c084fc';
      ctx.globalAlpha = 0.5 + magicPulse * 0.3;
      ctx.fillRect(-19 + Math.sin(time * 5) * 4, 2 + hover, 2, 2);
      ctx.fillRect(-13 + Math.cos(time * 4) * 3, 4 + hover, 2, 2);
      ctx.globalAlpha = 1;
      break;
    }
    case 'necromancer': {
      // Dark robed with skull staff - floating necromancer
      const hover = Math.sin(time * 2) * 3;
      const darkPulse = Math.sin(time * 3);
      // Hood (pointed)
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-4, -6 + hover, 8, 6);
      ctx.fillRect(-10, 0 + hover, 20, 6);
      ctx.fillRect(-6, -10 + hover, 12, 6);
      // Shadowed face
      ctx.fillStyle = '#334155';
      ctx.fillRect(-6, 6 + hover, 12, 10);
      // Glowing eyes (pulsing green necro energy)
      ctx.fillStyle = `rgba(74,222,128,${0.6 + darkPulse * 0.3})`;
      ctx.fillRect(-4, 8 + hover, 3, 3);
      ctx.fillRect(1, 8 + hover, 3, 3);
      // Eye glow
      ctx.fillStyle = `rgba(74,222,128,${0.15 + darkPulse * 0.1})`;
      ctx.fillRect(-6, 6 + hover, 12, 7);
      // Stitched mouth
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-3, 13 + hover, 1, 2);
      ctx.fillRect(-1, 13 + hover, 1, 2);
      ctx.fillRect(1, 13 + hover, 1, 2);
      // Robe with dark energy details
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-12, 16 + hover, 24, 26);
      // Robe trim skulls
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, 20 + hover, 3, 3);
      ctx.fillRect(5, 20 + hover, 3, 3);
      // Robe runes
      ctx.fillStyle = `rgba(74,222,128,${0.3 + darkPulse * 0.2})`;
      ctx.fillRect(-2, 24 + hover, 4, 2);
      ctx.fillRect(-4, 30 + hover, 2, 4);
      ctx.fillRect(2, 30 + hover, 2, 4);
      // Ghostly lower robe
      ctx.fillStyle = '#1e1b4b';
      for (let i = -14; i < 14; i += 4) {
        ctx.fillRect(i, 42 + hover + Math.sin(time * 3 + i) * 3, 4, 10);
      }
      // Skeletal arm (reaching out)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(12, 20 + hover + Math.sin(time * 1.5) * 3, 4, 10);
      ctx.fillRect(14, 29 + hover + Math.sin(time * 1.5) * 3, 3, 3);
      // Skull staff
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-18, 2 + hover, 3, 52);
      // Skull on staff
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-20, -2 + hover, 7, 7);
      ctx.fillStyle = '#111';
      ctx.fillRect(-19, -1 + hover, 2, 2);
      ctx.fillRect(-16, -1 + hover, 2, 2);
      ctx.fillRect(-18, 3 + hover, 4, 2);
      // Green soul above skull
      ctx.fillStyle = `rgba(74,222,128,${0.4 + darkPulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(-17, -6 + hover, 3 + darkPulse, 0, Math.PI * 2);
      ctx.fill();
      // Summoning particles
      ctx.fillStyle = 'rgba(74,222,128,0.4)';
      const sAngle = time * 2;
      ctx.fillRect(14 + Math.cos(sAngle) * 6, 24 + hover + Math.sin(sAngle) * 6, 2, 2);
      ctx.fillRect(14 + Math.cos(sAngle + 2) * 5, 24 + hover + Math.sin(sAngle + 2) * 5, 2, 2);
      break;
    }
    case 'shade': {
      // Dark flickering silhouette with ghostly wisps
      const flicker = Math.sin(time * 8) * 2;
      const driftY = Math.sin(time * 2) * 4;
      ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.2;
      // Main shadow body (tall and menacing)
      ctx.fillStyle = '#111827';
      ctx.fillRect(-10 + flicker, 4 + driftY, 20, h - 8);
      // Tattered cloak edges
      ctx.fillStyle = '#1f2937';
      for (let i = -12; i < 12; i += 5) {
        ctx.fillRect(i + flicker + Math.sin(time * 4 + i) * 2, h - 6 + driftY + Math.sin(time * 3 + i) * 4, 4, 8);
      }
      // Hood shape
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-12 + flicker, 0 + driftY, 24, 14);
      ctx.fillRect(-8 + flicker, -4 + driftY, 16, 6);
      // void inside hood  
      ctx.fillStyle = '#030712';
      ctx.fillRect(-8 + flicker, 2 + driftY, 16, 10);
      // Glowing red eyes (pulsing)
      ctx.globalAlpha = 0.8 + Math.sin(time * 6) * 0.2;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-5 + flicker, 5 + driftY, 3, 3);
      ctx.fillRect(2 + flicker, 5 + driftY, 3, 3);
      // Eye trails (ghostly)
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-5 + flicker + Math.sin(time * 6) * 3, 5 + driftY, 2, 2);
      ctx.fillRect(2 + flicker - Math.sin(time * 6) * 3, 5 + driftY, 2, 2);
      // Dark particles swirling around
      ctx.fillStyle = '#374151';
      ctx.globalAlpha = 0.4;
      const shadeAngle = time * 3;
      ctx.fillRect(flicker + Math.cos(shadeAngle) * 14, h / 2 + driftY + Math.sin(shadeAngle) * 10, 3, 3);
      ctx.fillRect(flicker + Math.cos(shadeAngle + 2) * 12, h / 2 + driftY + Math.sin(shadeAngle + 2) * 8, 2, 2);
      ctx.fillRect(flicker + Math.cos(shadeAngle + 4) * 10, h / 2 + driftY + Math.sin(shadeAngle + 4) * 12, 2, 2);
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 1;
      break;
    }
    case 'ninja': {
      // Black-clad figure with agile running animation
      const ninjaSpeed = moving ? walkAbs * 2 : 0;
      const leanForward = moving ? 2 : 0;
      // Head wrap
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-7, 0 - ninjaSpeed, 14, 14);
      // Head band
      ctx.fillStyle = '#374151';
      ctx.fillRect(-7, 4 - ninjaSpeed, 14, 2);
      // Eyes only visible (narrowed when running)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5, 5 - ninjaSpeed, 10, moving ? 2 : 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 5 - ninjaSpeed, 3, 2);
      ctx.fillRect(1, 5 - ninjaSpeed, 3, 2);
      // Body (leaning forward when running)
      ctx.fillStyle = '#111827';
      ctx.fillRect(-9 + leanForward, 14, 18, 14);
      // Chest belt / straps
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-8 + leanForward, 16, 2, 12);
      ctx.fillRect(6 + leanForward, 16, 2, 12);
      ctx.fillRect(-6 + leanForward, 20, 12, 2);
      // Scarf trailing (longer when running)
      ctx.fillStyle = '#dc2626';
      const scarfLen = 10 + Math.sin(time * 5) * 4 + (moving ? 8 : 0);
      ctx.fillRect(7, 4 - ninjaSpeed, scarfLen, 3);
      ctx.fillRect(7 + scarfLen - 4, 5 - ninjaSpeed, 6 + Math.sin(time * 7) * 3, 2);
      // Arms with swing  
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-13, 16 + armSwing * 1.2, 4, 8);
      ctx.fillRect(9, 16 - armSwing * 1.2, 4, 8);
      // Legs (fast stride)
      ctx.fillRect(-7, 28, 6, 14 + legSwing * 1.2);
      ctx.fillRect(1, 28, 6, 14 - legSwing * 1.2);
      // Feet
      ctx.fillStyle = '#374151';
      ctx.fillRect(-8, 42 + legSwing * 1.2, 7, 3);
      ctx.fillRect(1, 42 - legSwing * 1.2, 7, 3);
      // Kunai in hand
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-15, 18 + armSwing * 1.2, 2, 8);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-16, 17 + armSwing * 1.2, 4, 2);
      // Shuriken on belt
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-2 + leanForward, 21, 3, 3);
      break;
    }
    case 'dragon': {
      // Winged reptile - majestic with animated wings and fire
      const wingF = Math.sin(time * 4) * 12;
      const wingF2 = Math.sin(time * 4 + 0.5) * 8;
      const headBob = Math.sin(time * 2) * 2;
      const tailWag = Math.sin(time * 3) * 4;
      // Wings (layered membrane)
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-hw, 6 + wingF, hw - 10, 16);
      ctx.fillRect(10, 6 - wingF, hw - 10, 16);
      // Wing membrane detail
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-hw + 4, 8 + wingF, hw - 16, 10);
      ctx.fillRect(14, 8 - wingF, hw - 16, 10);
      // Wing bones
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-hw, 10 + wingF, 2, 10);
      ctx.fillRect(-hw + 8, 8 + wingF2, 2, 12);
      ctx.fillRect(hw - 2, 10 - wingF, 2, 10);
      ctx.fillRect(hw - 10, 8 - wingF2, 2, 12);
      // Body (muscular)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-14, 4, 28, 30);
      // Body scales highlight
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-10, 6, 4, 3);
      ctx.fillRect(6, 10, 4, 3);
      ctx.fillRect(-6, 20, 4, 3);
      // Belly (segmented)
      ctx.fillStyle = '#fbbf24';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-8, 14 + i * 5, 16, 3);
      }
      // Head
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-18, -6 + headBob, 14, 14);
      // Horns (curved)
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-20, -12 + headBob, 3, 8);
      ctx.fillRect(-18, -14 + headBob, 3, 4);
      ctx.fillRect(-8, -12 + headBob, 3, 8);
      ctx.fillRect(-10, -14 + headBob, 3, 4);
      // Eye
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-15, -1 + headBob, 4, 4);
      ctx.fillRect(-10, -1 + headBob, 4, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(-14, 0 + headBob, 2, 2);
      ctx.fillRect(-9, 0 + headBob, 2, 2);
      // Nostrils with smoke
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-20, 2 + headBob, 2, 2);
      ctx.fillStyle = 'rgba(156,163,175,0.4)';
      ctx.fillRect(-23 + Math.sin(time * 6) * 2, 0 + headBob, 3, 2);
      // Snout
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-22, 0 + headBob, 4, 8);
      // Jaw
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-22, 6 + headBob, 12, 3);
      // Teeth
      ctx.fillStyle = '#fff';
      ctx.fillRect(-21, 5 + headBob, 2, 2);
      ctx.fillRect(-18, 5 + headBob, 2, 2);
      ctx.fillRect(-15, 5 + headBob, 2, 2);
      // Tail (wagging with segments)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(14, 28, 10, 5);
      ctx.fillRect(22, 26 + tailWag * 0.5, 8, 4);
      ctx.fillRect(28, 24 + tailWag, 6, 3);
      // Tail spike
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(33, 22 + tailWag, 4, 2);
      ctx.fillRect(35, 23 + tailWag, 3, 4);
      // Legs with walk
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-10, 34, 6, 10 + legSwing * 0.5);
      ctx.fillRect(4, 34, 6, 10 - legSwing * 0.5);
      // Claws
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-12, 44 + legSwing * 0.5, 3, 3);
      ctx.fillRect(-8, 44 + legSwing * 0.5, 3, 3);
      ctx.fillRect(2, 44 - legSwing * 0.5, 3, 3);
      ctx.fillRect(6, 44 - legSwing * 0.5, 3, 3);
      // Fire breath particles when attacking
      if (e._breathCd && e._breathCd < 1) {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-26, 2 + headBob, 6, 4);
        ctx.fillRect(-32, 3 + headBob, 5, 3);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-36, 4 + headBob, 4, 2);
        ctx.fillRect(-28, 1 + headBob, 3, 2);
      }
      break;
    }
    case 'vampire': {
      // Pale figure with flowing cape
      const capeWave = Math.sin(time * 2);
      const bob = moving ? walkAbs * 1.5 : breathe;
      // Cape (billowing)
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(-14, 6, 28, 38);
      for (let i = -14; i < 14; i += 4) {
        ctx.fillRect(i, 44 + Math.sin(time * 2 + i) * 3, 4, 6 + capeWave);
      }
      // Cape inner (red lining)
      ctx.fillStyle = '#881337';
      ctx.fillRect(-12, 8, 4, 32);
      ctx.fillRect(8, 8, 4, 32);
      // Face
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-7, 0 - bob, 14, 14);
      // Hair (slicked back)
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(-8, -2 - bob, 16, 6);
      ctx.fillRect(-9, 0 - bob, 2, 8);
      ctx.fillRect(7, 0 - bob, 2, 6);
      // Widow's peak
      ctx.fillRect(-2, -4 - bob, 4, 3);
      // Red eyes (menacing)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-4, 6 - bob, 3, 3);
      ctx.fillRect(1, 6 - bob, 3, 3);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-3, 7 - bob, 1, 1);
      ctx.fillRect(2, 7 - bob, 1, 1);
      // Fangs
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, 12 - bob, 2, 3);
      ctx.fillRect(1, 12 - bob, 2, 3);
      // Blood drop
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-1, 14 - bob, 1, 2);
      // Suit
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-9, 14, 18, 18);
      // Red vest
      ctx.fillStyle = '#881337';
      ctx.fillRect(-5, 14, 10, 14);
      // Legs with walk
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-6, 32, 5, 14 + legSwing * 0.5);
      ctx.fillRect(1, 32, 5, 14 - legSwing * 0.5);
      // Shoes
      ctx.fillStyle = '#111827';
      ctx.fillRect(-7, 46 + legSwing * 0.5, 7, 3);
      ctx.fillRect(0, 46 - legSwing * 0.5, 7, 3);
      break;
    }
    case 'phoenix': {
      const flame = Math.sin(time * 6) * 3;
      const wingFlap = Math.sin(time * 5) * 12;
      // Fire aura (larger, pulsing)
      ctx.fillStyle = `rgba(249,115,22,${0.2 + Math.sin(time * 4) * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(0, h / 2, hw + 8, h / 2 + 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings (animated flapping with feather structure)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-hw - 2, 6 + wingFlap, hw - 4, 16);
      ctx.fillRect(6, 6 - wingFlap, hw - 4, 16);
      // Wing feather tips
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-hw - 6, 10 + wingFlap, 6, 10);
      ctx.fillRect(hw, 10 - wingFlap, 6, 10);
      // Inner wing detail
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-hw + 2, 10 + wingFlap, 6, 8);
      ctx.fillRect(hw - 8, 10 - wingFlap, 6, 8);
      // Body (glowing)
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-10, 6, 20, 22);
      // Belly gradient
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-6, 10, 12, 12);
      // Head (bright)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-8, -2, 16, 12);
      // Crown feathers (fire plume)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -8 + flame, 3, 8);
      ctx.fillRect(0, -10 + flame, 3, 10);
      ctx.fillRect(4, -6 + flame, 3, 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -6 + flame, 2, 5);
      ctx.fillRect(2, -8 + flame, 2, 7);
      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-12, 2, 5, 3);
      ctx.fillRect(-14, 3, 3, 2);
      // Eyes (bright white/gold)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-5, 1, 4, 4);
      ctx.fillRect(1, 1, 4, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 2, 2, 2);
      ctx.fillRect(2, 2, 2, 2);
      // Tail feathers (multi-layered, flowing)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(10, 24 + flame, 12, 3);
      ctx.fillRect(14, 28 + flame * 0.5, 10, 3);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(12, 20 - flame * 0.5, 14, 3);
      ctx.fillRect(16, 16, 10, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14, 12, 12, 3);
      // Talons
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-6, 28, 4, 6);
      ctx.fillRect(2, 28, 4, 6);
      // Ember particles
      ctx.fillStyle = '#fbbf24';
      const pAngle = time * 4;
      ctx.fillRect(Math.cos(pAngle) * 16, h / 2 + Math.sin(pAngle) * 14, 2, 2);
      ctx.fillRect(Math.cos(pAngle + 2) * 12, h / 2 + Math.sin(pAngle + 2) * 10, 2, 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(Math.cos(pAngle + 4) * 14, h / 2 + Math.sin(pAngle + 4) * 12, 2, 2);
      break;
    }
    case 'golem': {
      // Stone giant with heavy walk
      const stomp = moving ? walkAbs * 3 : breathe;
      const rumble = moving ? Math.sin(time * 10) * 1 : 0;
      ctx.fillStyle = '#78716c';
      // Head
      ctx.fillRect(-16 + rumble, 0 - stomp, 32, 22);
      // Face cracks
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-12 + rumble, 4 - stomp, 8, 6); // eye sockets
      ctx.fillRect(4 + rumble, 4 - stomp, 8, 6);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-10 + rumble, 5 - stomp, 4, 4); // glowing eyes
      ctx.fillRect(6 + rumble, 5 - stomp, 4, 4);
      // Eye glow
      ctx.fillStyle = 'rgba(34,211,238,0.3)';
      ctx.fillRect(-12 + rumble, 3 - stomp, 8, 8);
      ctx.fillRect(4 + rumble, 3 - stomp, 8, 8);
      // Mouth crack
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-8 + rumble, 14 - stomp, 16, 4);
      // Rune marking
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-3 + rumble, 15 - stomp, 6, 2);
      // Body
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-22, 22, 44, 26);
      // Body cracks & details
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-10, 28, 2, 12);
      ctx.fillRect(4, 24, 2, 16);
      ctx.fillRect(-16, 30, 3, 8);
      // Glowing rune on chest
      ctx.fillStyle = '#22d3ee';
      ctx.globalAlpha = 0.5 + Math.sin(time * 2) * 0.3;
      ctx.fillRect(-4, 30, 8, 8);
      ctx.globalAlpha = 1;
      // Moss patches
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(12, 24, 6, 3);
      ctx.fillRect(-16, 34, 8, 2);
      ctx.fillRect(-20, 28, 4, 3);
      // Arms with swing
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(-30, 24 + armSwing * 1.5, 8, 22);
      ctx.fillRect(22, 24 - armSwing * 1.5, 8, 22);
      // Fists (massive)
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-32, 44 + armSwing * 1.5, 12, 10);
      ctx.fillRect(20, 44 - armSwing * 1.5, 12, 10);
      // Knuckle details
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-30, 46 + armSwing * 1.5, 3, 3);
      ctx.fillRect(-26, 46 + armSwing * 1.5, 3, 3);
      ctx.fillRect(22, 46 - armSwing * 1.5, 3, 3);
      ctx.fillRect(26, 46 - armSwing * 1.5, 3, 3);
      // Legs with walk
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-16, 48, 12, 18 + legSwing);
      ctx.fillRect(4, 48, 12, 18 - legSwing);
      // Feet (stone blocks)
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-18, 66 + legSwing, 14, 5);
      ctx.fillRect(4, 66 - legSwing, 14, 5);
      break;
    }
    case 'shaman': {
      // Tribal caster with mask and walk
      const bob = moving ? walkAbs * 1.5 : breathe;
      const ritualGlow = Math.sin(time * 3);
      // Mask (more detailed)
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-9, 0 - bob, 18, 16);
      // Mask markings
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-7, 2 - bob, 2, 8);
      ctx.fillRect(5, 2 - bob, 2, 8);
      // Eye holes
      ctx.fillStyle = '#fff';
      ctx.fillRect(-6, 4 - bob, 5, 5);
      ctx.fillRect(1, 4 - bob, 5, 5);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-4, 5 - bob, 3, 3);
      ctx.fillRect(3, 5 - bob, 3, 3);
      // Feathers on head (taller)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-3, -8 - bob, 2, 8);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(1, -10 - bob, 2, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-1, -6 - bob, 2, 6);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(3, -7 - bob, 2, 7);
      // Mouth marking
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-4, 12 - bob, 8, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(-2, 13 - bob, 4, 1);
      // Robe
      ctx.fillStyle = '#059669';
      ctx.fillRect(-10, 16, 20, 22);
      // Robe pattern
      ctx.fillStyle = '#047857';
      ctx.fillRect(-10, 22, 20, 2);
      ctx.fillRect(-10, 28, 20, 2);
      // Bone necklace
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, 16, 3, 2);
      ctx.fillRect(-3, 16, 3, 2);
      ctx.fillRect(2, 16, 3, 2);
      ctx.fillRect(7, 16, 3, 2);
      // Arms with swing
      ctx.fillStyle = '#059669';
      ctx.fillRect(-14, 18 + armSwing, 4, 12);
      ctx.fillRect(10, 18 - armSwing, 4, 12);
      // Legs with walk
      ctx.fillStyle = '#047857';
      ctx.fillRect(-7, 38, 6, 12 + legSwing);
      ctx.fillRect(1, 38, 6, 12 - legSwing);
      // Feet
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(-8, 50 + legSwing, 8, 3);
      ctx.fillRect(0, 50 - legSwing, 8, 3);
      // Staff with shrunken head
      ctx.fillStyle = '#78716c';
      ctx.fillRect(14, 2 - bob, 3, 48);
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(12, -2 - bob, 7, 6);
      // Shrunken head eyes
      ctx.fillStyle = '#111';
      ctx.fillRect(13, -1 - bob, 2, 2);
      ctx.fillRect(16, -1 - bob, 2, 2);
      // Spirit glow around staff
      ctx.fillStyle = `rgba(74,222,128,${0.3 + ritualGlow * 0.2})`;
      ctx.fillRect(11, -5 - bob + Math.sin(time * 5) * 2, 3, 3);
      ctx.fillRect(17, -3 - bob + Math.cos(time * 4) * 2, 2, 2);
      break;
    }
    case 'berserker': {
      const enr = e._enraged;
      const rage = enr ? Math.sin(time * 12) * 2 : 0;
      const bob = moving ? walkAbs * 2 : breathe;
      // Muscular warrior with running animation
      // Head
      ctx.fillStyle = '#d4a070';
      ctx.fillRect(-8 + rage, 0 - bob, 16, 14);
      // War paint (3 stripes)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-8 + rage, 4 - bob, 3, 2);
      ctx.fillRect(5 + rage, 4 - bob, 3, 2);
      ctx.fillRect(-2 + rage, 8 - bob, 4, 2);
      // Eyes (glow when enraged)
      ctx.fillStyle = enr ? '#ef4444' : '#fff';
      ctx.fillRect(-5 + rage, 4 - bob, 4, 4);
      ctx.fillRect(1 + rage, 4 - bob, 4, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(-4 + rage, 5 - bob, 2, 2);
      ctx.fillRect(2 + rage, 5 - bob, 2, 2);
      // Enrage glow
      if (enr) {
        ctx.fillStyle = 'rgba(239,68,68,0.25)';
        ctx.fillRect(-6 + rage, 3 - bob, 5, 6);
        ctx.fillRect(0 + rage, 3 - bob, 5, 6);
      }
      // Hair mohawk
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-3 + rage, -6 - bob, 6, 6);
      ctx.fillRect(-2 + rage, -10 - bob, 4, 4);
      ctx.fillRect(-1 + rage, -13 - bob, 2, 3);
      // Open mouth (rage scream)
      if (enr) {
        ctx.fillStyle = '#111';
        ctx.fillRect(-3 + rage, 11 - bob, 6, 3);
      }
      // Body (muscular)
      ctx.fillStyle = '#d4a070';
      ctx.fillRect(-14, 14, 28, 18);
      // Muscle definition
      ctx.fillStyle = '#c4956a';
      ctx.fillRect(-4, 16, 2, 8);
      ctx.fillRect(2, 16, 2, 8);
      ctx.fillRect(-10, 18, 6, 2);
      ctx.fillRect(4, 18, 6, 2);
      // Chest scars
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-6, 18, 8, 2);
      ctx.fillRect(-4, 22, 10, 2);
      // Spiked belt
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-14, 32, 28, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-10, 31, 3, 3);
      ctx.fillRect(0, 31, 3, 3);
      ctx.fillRect(8, 31, 3, 3);
      // Arms with swing
      ctx.fillStyle = '#d4a070';
      ctx.fillRect(-18, 16 + armSwing * 1.2, 4, 16);
      ctx.fillRect(14, 16 - armSwing * 1.2, 4, 16);
      // Fists
      ctx.fillStyle = '#c4956a';
      ctx.fillRect(-19, 31 + armSwing * 1.2, 6, 6);
      ctx.fillRect(13, 31 - armSwing * 1.2, 6, 6);
      // Legs with walk
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(-9, 35, 7, 16 + legSwing);
      ctx.fillRect(2, 35, 7, 16 - legSwing);
      // Boots
      ctx.fillStyle = '#3d2512';
      ctx.fillRect(-10, 51 + legSwing, 9, 4);
      ctx.fillRect(1, 51 - legSwing, 9, 4);
      // Big axe with arm swing
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-22, 6 + armSwing * 1.2, 4, 40);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-30, 4 + armSwing * 1.2, 12, 14);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-28, 2 + armSwing * 1.2, 8, 2);
      break;
    }
    case 'dark_knight': {
      // Armored dark warrior with menacing walk
      const bob = moving ? walkAbs * 1.5 : breathe;
      // Helmet
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-10, 0 - bob, 20, 16);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-10, -2 - bob, 20, 4);
      // Visor slit (glowing)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, 6 - bob, 12, 3);
      // Eye glow
      ctx.fillStyle = 'rgba(220,38,38,0.3)';
      ctx.fillRect(-7, 5 - bob, 14, 5);
      // Plume
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-2, -8 - bob, 4, 6);
      ctx.fillRect(-1, -11 - bob, 2, 3);
      // Horned helmet edges
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-12, 2 - bob, 2, 8);
      ctx.fillRect(10, 2 - bob, 2, 8);
      // Armor body
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-12, 16, 24, 20);
      // Dark chest insignia
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-6, 18, 12, 8);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-3, 20, 6, 4); // glowing rune
      // Pauldrons (spiked)
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(-16, 14, 6, 8);
      ctx.fillRect(10, 14, 6, 8);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-17, 12, 3, 4); // spike
      ctx.fillRect(14, 12, 3, 4);
      // Arms with swing
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-16, 22 + armSwing, 4, 14);
      ctx.fillRect(12, 22 - armSwing, 4, 14);
      // Gauntlets
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-18, 34 + armSwing, 6, 6);
      ctx.fillRect(12, 34 - armSwing, 6, 6);
      // Legs with walk
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-8, 36, 6, 18 + legSwing);
      ctx.fillRect(2, 36, 6, 18 - legSwing);
      // Boots
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-10, 54 + legSwing, 9, 5);
      ctx.fillRect(1, 54 - legSwing, 9, 5);
      // Dark sword with arm animation
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-22, 12 + armSwing, 3, 26);
      // Sword glow
      ctx.fillStyle = 'rgba(124,58,237,0.3)';
      ctx.fillRect(-23, 10 + armSwing, 5, 28);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-23, 10 + armSwing, 5, 3); // crossguard
      break;
    }
    case 'ice_elemental': {
      const bob = Math.sin(time * 2) * 5;
      const icePulse = Math.sin(time * 3);
      const crystalGrow = Math.sin(time * 1.5);
      ctx.globalAlpha = 0.85;
      // Frost aura
      ctx.fillStyle = `rgba(103,232,249,${0.15 + icePulse * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(0, h / 2 + bob, hw + 10, h / 2 + 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crystalline floating body (angular, faceted)
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-12, 4 + bob, 24, 28);
      // Faceted body highlights
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-10, 6 + bob, 8, 12);
      ctx.fillRect(4, 10 + bob, 6, 8);
      // Crystal body cracks / facet lines
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-4, 4 + bob, 1, 28);
      ctx.fillRect(6, 8 + bob, 1, 18);
      ctx.fillRect(-10, 16 + bob, 20, 1);
      // Crystal spikes (animated growth)
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(-18, -2 + bob, 7, 12 + crystalGrow * 2);
      ctx.fillRect(11, -4 + bob, 7, 14 + crystalGrow * 2);
      ctx.fillRect(-7, -8 + bob, 5, 12 + crystalGrow);
      ctx.fillRect(3, -10 + bob, 5, 14 + crystalGrow);
      // Spike tips (brighter)
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(-17, -3 + bob, 4, 3);
      ctx.fillRect(12, -5 + bob, 4, 3);
      ctx.fillRect(-6, -9 + bob, 3, 3);
      ctx.fillRect(4, -11 + bob, 3, 3);
      // Inner core glow
      ctx.fillStyle = `rgba(165,243,252,${0.3 + icePulse * 0.2})`;
      ctx.fillRect(-4, 14 + bob, 8, 8);
      // Face (angular, icy eyes)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-6, 10 + bob, 5, 5);
      ctx.fillRect(2, 10 + bob, 5, 5);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-5, 11 + bob, 3, 3);
      ctx.fillRect(3, 11 + bob, 3, 3);
      // Mouth (jagged ice crystals)
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(-3, 18 + bob, 2, 3);
      ctx.fillRect(0, 17 + bob, 2, 4);
      ctx.fillRect(3, 18 + bob, 2, 3);
      // Ice arms (crystalline, jagged)
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-16, 12 + bob + Math.sin(time * 2) * 3, 5, 14);
      ctx.fillRect(11, 12 + bob - Math.sin(time * 2) * 3, 5, 14);
      // Lower body fading into mist
      ctx.fillStyle = 'rgba(103,232,249,0.5)';
      ctx.fillRect(-10, 32 + bob, 20, 12);
      for (let i = -12; i < 12; i += 4) {
        ctx.fillRect(i, 44 + bob + Math.sin(time * 3 + i) * 4, 4, 8);
      }
      // Snowflake/frost particles
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      const iceAngle = time * 2;
      ctx.fillRect(Math.cos(iceAngle) * 16, h / 2 + bob + Math.sin(iceAngle) * 12, 2, 2);
      ctx.fillRect(Math.cos(iceAngle + 2) * 14, h / 2 + bob + Math.sin(iceAngle + 2) * 10, 2, 2);
      ctx.fillRect(Math.cos(iceAngle + 4) * 12, h / 2 + bob + Math.sin(iceAngle + 4) * 14, 1, 1);
      ctx.globalAlpha = 1;
      break;
    }
    case 'fire_imp': {
      // Small fiery creature with hop animation
      const impBounce = moving ? Math.abs(Math.sin(time * 10)) * 4 : 0;
      const flameFlicker = Math.sin(time * 8);
      ctx.fillStyle = '#ef4444';
      // Head with pointy horns
      ctx.fillRect(-8, 0 - impBounce, 16, 12);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-11, -4 - impBounce, 4, 7);
      ctx.fillRect(7, -4 - impBounce, 4, 7);
      // Horn tips
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-11, -5 - impBounce, 2, 2);
      ctx.fillRect(9, -5 - impBounce, 2, 2);
      // Ears
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-10, 2 - impBounce, 3, 4);
      ctx.fillRect(7, 2 - impBounce, 3, 4);
      // Eyes (glowing)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-5, 3 - impBounce, 4, 3);
      ctx.fillRect(1, 3 - impBounce, 4, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 4 - impBounce, 2, 2);
      ctx.fillRect(2, 4 - impBounce, 2, 2);
      // Grin with teeth
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-4, 8 - impBounce, 8, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-3, 8 - impBounce, 2, 2);
      ctx.fillRect(1, 8 - impBounce, 2, 2);
      // Body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-7, 12 - impBounce, 14, 12);
      // Belly
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-4, 14 - impBounce, 8, 6);
      // Tail (curling, animated)
      ctx.fillStyle = '#f97316';
      ctx.fillRect(7, 16 - impBounce, 6, 3);
      ctx.fillRect(11, 13 - impBounce + flameFlicker * 2, 4, 3);
      ctx.fillRect(13, 10 - impBounce + flameFlicker * 2, 3, 3);
      // Tail flame tip
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14, 8 - impBounce + flameFlicker * 3, 3, 3);
      // Legs (running)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-6, 24 - impBounce + legSwing, 5, 8);
      ctx.fillRect(1, 24 - impBounce - legSwing, 5, 8);
      // Clawed feet
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-7, 31 - impBounce + legSwing, 2, 2);
      ctx.fillRect(5, 31 - impBounce - legSwing, 2, 2);
      // Fire particles on head (more elaborate)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-4 + flameFlicker * 3, -6 - impBounce, 3, 4);
      ctx.fillRect(2 + Math.cos(time * 7) * 2, -8 - impBounce, 2, 5);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0 + flameFlicker * 2, -10 - impBounce, 2, 4);
      break;
    }
    case 'mimic': {
      // Treasure chest that attacks - bouncing when awake
      const open = e._mimicWoke;
      const chomp = open ? Math.sin(time * 6) * 3 : 0;
      const hop = open && moving ? Math.abs(Math.sin(time * 8)) * 4 : 0;
      // Chest body (wood grain)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-16, 10 - hop, 32, 22);
      // Wood grain lines
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-14, 16 - hop, 28, 1);
      ctx.fillRect(-14, 22 - hop, 28, 1);
      // Gold trim (ornate)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-16, 10 - hop, 32, 3);
      ctx.fillRect(-16, 28 - hop, 32, 3);
      ctx.fillRect(-2, 10 - hop, 4, 22);
      // Corner brackets
      ctx.fillRect(-16, 10 - hop, 3, 6);
      ctx.fillRect(13, 10 - hop, 3, 6);
      ctx.fillRect(-16, 25 - hop, 3, 6);
      ctx.fillRect(13, 25 - hop, 3, 6);
      // Lock/buckle (gem lock)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-3, 18 - hop, 6, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-1, 20 - hop, 2, 2);
      if (open) {
        // Open lid with teeth (chomp animation)
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-18, -4 - hop - chomp, 36, 14);
        // Lid wood grain
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-16, 0 - hop - chomp, 32, 1);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-18, -4 - hop - chomp, 36, 3);
        ctx.fillRect(-18, 8 - hop - chomp, 36, 2);
        // Upper teeth (sharp, varied)
        ctx.fillStyle = '#fff';
        for (let i = -14; i < 14; i += 5) {
          ctx.fillRect(i, 10 - hop, 3, 4 + (i % 3));
        }
        // Lower teeth (from lid)
        for (let i = -12; i < 12; i += 5) {
          ctx.fillRect(i + 2, -4 - hop - chomp + 12, 3, 3 + (i % 2));
        }
        // Tongue (slimy, animated)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-6, 12 - hop, 12, 4);
        ctx.fillRect(-4, 16 - hop, 8, 3);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-2, 18 - hop + Math.sin(time * 4) * 2, 4, 3);
        // Drool
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(-8, 14 - hop, 1, 3 + Math.sin(time * 3) * 2);
        ctx.fillRect(7, 14 - hop, 1, 2 + Math.cos(time * 4) * 2);
        // Crazy eyes on lid (rolling)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-10, 0 - hop - chomp, 6, 6);
        ctx.fillRect(4, 0 - hop - chomp, 6, 6);
        ctx.fillStyle = '#dc2626';
        const eyeRoll = Math.sin(time * 5);
        ctx.fillRect(-9 + eyeRoll, 1 - hop - chomp, 3, 3);
        ctx.fillRect(5 + eyeRoll, 1 - hop - chomp, 3, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(-8 + eyeRoll, 2 - hop - chomp, 2, 2);
        ctx.fillRect(6 + eyeRoll, 2 - hop - chomp, 2, 2);
      }
      // Legs (if awake, stubby and running)
      if (open) {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-12, 31 - hop + legSwing, 6, 7);
        ctx.fillRect(6, 31 - hop - legSwing, 6, 7);
        // Clawed feet
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-14, 37 - hop + legSwing, 3, 3);
        ctx.fillRect(11, 37 - hop - legSwing, 3, 3);
      }
      break;
    }
    case 'tank': {
      // Military tank
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-hw, h * 0.4, w, h * 0.5);
      // Treads
      ctx.fillStyle = '#374151';
      ctx.fillRect(-hw - 2, h * 0.85, w + 4, h * 0.15);
      ctx.fillStyle = '#1f2937';
      for (let tx = -hw; tx < hw; tx += 8) {
        ctx.fillRect(tx, h * 0.85, 4, h * 0.15);
      }
      // Turret
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-10, h * 0.2, 20, h * 0.25);
      // Cannon barrel
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-hw - 16, h * 0.26, hw, 6);
      // Star emblem
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-3, h * 0.5, 6, 6);
      break;
    }
    case 'artillery': {
      // Stationary artillery
      ctx.fillStyle = '#374151';
      ctx.fillRect(-hw, h * 0.5, w, h * 0.4);
      // Wheels
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(-hw + 10, h * 0.9, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hw - 10, h * 0.9, 8, 0, Math.PI * 2);
      ctx.fill();
      // Barrel
      ctx.save();
      ctx.translate(0, h * 0.4);
      ctx.rotate(-0.4);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-4, -30, 8, 30);
      ctx.restore();
      break;
    }
    case 'helicopter': {
      // Helicopter with spinning blade
      const blade = time * 15;
      // Tail
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(hw - 8, 4, 16, 6);
      ctx.fillRect(hw + 6, 0, 2, 14);
      // Body
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(-12, 4, 28, 18);
      // Cockpit
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-14, 8, 6, 10);
      // Skids
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-14, 24, 28, 2);
      ctx.fillRect(-16, 22, 2, 6);
      ctx.fillRect(12, 22, 2, 6);
      // Rotor
      ctx.fillStyle = '#64748b';
      const bladeLen = 26;
      ctx.fillRect(-bladeLen * Math.cos(blade), 0, bladeLen * 2 * Math.cos(blade), 2);
      ctx.fillRect(-bladeLen * Math.sin(blade), 0, bladeLen * 2 * Math.sin(blade), 2);
      break;
    }
    case 'mech': {
      // Giant combat robot
      // Head
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-12, 0, 24, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-8, 4, 6, 5);
      ctx.fillRect(2, 4, 6, 5);
      // Shoulder armor
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-hw + 2, 16, 14, 12);
      ctx.fillRect(hw - 16, 16, 14, 12);
      // Torso
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-18, 16, 36, 30);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-8, 22, 16, 12);
      // Reactor core
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-4, 26, 8, 6);
      // Arms
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-hw, 28, 8, 30);
      ctx.fillRect(hw - 8, 28, 8, 30);
      // Hands/guns
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-hw - 4, 56, 12, 8);
      ctx.fillRect(hw - 8, 56, 12, 8);
      // Legs
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-14, 46, 10, 30);
      ctx.fillRect(4, 46, 10, 30);
      // Feet
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-18, 76, 16, 8);
      ctx.fillRect(2, 76, 16, 8);
      break;
    }
    case 'troll': {
      // Big green regenerating brute with heavy walk
      const stomp = moving ? walkAbs * 3 : breathe;
      // Head
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(-14, 0 - stomp, 28, 20);
      // Brow ridge
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(-14, 6 - stomp, 28, 4);
      // Eyes (beady, glowing)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-8, 8 - stomp, 5, 5);
      ctx.fillRect(3, 8 - stomp, 5, 5);
      ctx.fillStyle = '#111';
      ctx.fillRect(-6, 9 - stomp, 3, 3);
      ctx.fillRect(5, 9 - stomp, 3, 3);
      // Underbite tusks
      ctx.fillStyle = '#fff';
      ctx.fillRect(-6, 18 - stomp, 3, 5);
      ctx.fillRect(3, 18 - stomp, 3, 5);
      // Nose
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(-2, 13 - stomp, 4, 4);
      // Warts
      ctx.fillStyle = '#40916c';
      ctx.fillRect(-10, 4 - stomp, 3, 3);
      ctx.fillRect(8, 12 - stomp, 3, 3);
      // Body (massive)
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(-18, 20, 36, 24);
      // Belly
      ctx.fillStyle = '#40916c';
      ctx.fillRect(-10, 24, 20, 14);
      // Belly button
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(-1, 30, 2, 2);
      // Arms with swing
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(-24, 22 + armSwing * 1.5, 6, 22);
      ctx.fillRect(18, 22 - armSwing * 1.5, 6, 22);
      // Fists
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(-26, 42 + armSwing * 1.5, 10, 8);
      ctx.fillRect(16, 42 - armSwing * 1.5, 10, 8);
      // Loincloth
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(-14, 44, 28, 4);
      // Legs with walk
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(-12, 48, 9, 14 + legSwing);
      ctx.fillRect(3, 48, 9, 14 - legSwing);
      // Feet
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(-14, 62 + legSwing, 12, 5);
      ctx.fillRect(2, 62 - legSwing, 12, 5);
      // Regen sparkles
      if (e.hp < e.maxHp) {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(-8 + Math.sin(time * 5) * 6, 22, 3, 3);
        ctx.fillRect(4 + Math.cos(time * 4) * 5, 28, 2, 2);
        ctx.fillRect(-2 + Math.sin(time * 3) * 4, 36, 2, 2);
      }
      break;
    }
    case 'harpy': {
      // Flying winged woman-bird with dynamic flight animation
      const wingF = Math.sin(time * 8) * 12;
      const bodyBob = Math.sin(time * 4) * 3;
      // Wings (multi-layer feathered)
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-hw - 2, 6 + wingF + bodyBob, hw - 4, 16);
      ctx.fillRect(6, 6 - wingF + bodyBob, hw - 4, 16);
      // Wing feather tips (darker)
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-hw - 6, 10 + wingF + bodyBob, 6, 10);
      ctx.fillRect(hw, 10 - wingF + bodyBob, 6, 10);
      // Inner wing feathers (lighter)
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-hw + 4, 10 + wingF + bodyBob, 6, 8);
      ctx.fillRect(hw - 10, 10 - wingF + bodyBob, 6, 8);
      // Wing bone structure
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(-hw + 1, 8 + wingF + bodyBob, 2, 14);
      ctx.fillRect(hw - 3, 8 - wingF + bodyBob, 2, 14);
      // Body
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-8, 6 + bodyBob, 16, 20);
      // Torso detail
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-6, 10 + bodyBob, 12, 8);
      // Head
      ctx.fillStyle = '#e8c09a';
      ctx.fillRect(-7, -2 + bodyBob, 14, 12);
      // Hair (flowing behind)
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-8, -4 + bodyBob, 16, 5);
      ctx.fillRect(-9, -6 + bodyBob, 8, 4);
      ctx.fillRect(6, 0 + bodyBob, 8, 10);
      ctx.fillRect(10, 6 + bodyBob + Math.sin(time * 3) * 2, 4, 6);
      // Hair strands flowing in wind
      ctx.fillRect(8, 10 + bodyBob + Math.sin(time * 4) * 3, 3, 5);
      // Eyes (purple, intense)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-5, 1 + bodyBob, 4, 4);
      ctx.fillRect(1, 1 + bodyBob, 4, 4);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-4, 2 + bodyBob, 2, 2);
      ctx.fillRect(2, 2 + bodyBob, 2, 2);
      // Eyebrows (angry)
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-5, 0 + bodyBob, 4, 1);
      ctx.fillRect(1, 0 + bodyBob, 4, 1);
      // Beak/mouth (small, sharp)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, 7 + bodyBob, 4, 3);
      ctx.fillRect(-3, 8 + bodyBob, 2, 2);
      // Necklace
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-5, 6 + bodyBob, 10, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-1, 6 + bodyBob, 2, 2);
      // Talons (animated)
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-6, 26 + bodyBob + legSwing, 3, 8);
      ctx.fillRect(3, 26 + bodyBob - legSwing, 3, 8);
      // Claw toes
      ctx.fillStyle = '#713f12';
      ctx.fillRect(-8, 33 + bodyBob + legSwing, 2, 3);
      ctx.fillRect(-5, 34 + bodyBob + legSwing, 2, 3);
      ctx.fillRect(3, 33 + bodyBob - legSwing, 2, 3);
      ctx.fillRect(6, 34 + bodyBob - legSwing, 2, 3);
      break;
    }
    case 'scorpion': {
      // Arachnid with pincers and tail - scuttling animation
      const scuttle = moving ? Math.sin(time * 10) * 2 : 0;
      const tailSway = Math.sin(time * 3);
      const pincerSnap = Math.sin(time * 4) * 3;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(0, h - 2, 18, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Body (segmented)
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.ellipse(0, h / 2 + 2 + scuttle, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Body segment lines
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-2, h / 2 - 4 + scuttle, 4, 14);
      ctx.fillRect(-8, h / 2 - 2 + scuttle, 3, 10);
      ctx.fillRect(5, h / 2 - 2 + scuttle, 3, 10);
      // Back armor plate ridges
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-10, h / 2 - 2 + scuttle, 20, 2);
      ctx.fillRect(-8, h / 2 + 4 + scuttle, 16, 2);
      // Head segment (larger, detailed)
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.ellipse(-14, h / 2 + scuttle, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mandibles
      ctx.fillStyle = '#713f12';
      ctx.fillRect(-22, h / 2 - 1 + scuttle, 3, 2);
      ctx.fillRect(-22, h / 2 + 1 + scuttle, 3, 2);
      // Eyes (4 eyes like real scorpion)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-19, h / 2 - 5 + scuttle, 3, 3);
      ctx.fillRect(-14, h / 2 - 5 + scuttle, 3, 3);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-17, h / 2 - 3 + scuttle, 2, 2);
      ctx.fillRect(-12, h / 2 - 3 + scuttle, 2, 2);
      ctx.fillStyle = '#111';
      ctx.fillRect(-18, h / 2 - 4 + scuttle, 2, 2);
      ctx.fillRect(-13, h / 2 - 4 + scuttle, 2, 2);
      // Left pincer (animated snapping)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-23, h / 2 - 10 + scuttle, 4, 8);
      // Upper claw
      ctx.fillRect(-26, h / 2 - 12 + scuttle - pincerSnap, 7, 3);
      // Lower claw
      ctx.fillRect(-26, h / 2 - 4 + scuttle + pincerSnap, 7, 3);
      // Right pincer (offset timing)
      ctx.fillRect(-23, h / 2 + 4 + scuttle, 4, 8);
      const pincerSnap2 = Math.sin(time * 4 + 1) * 3;
      ctx.fillRect(-26, h / 2 + 2 + scuttle - pincerSnap2, 7, 3);
      ctx.fillRect(-26, h / 2 + 10 + scuttle + pincerSnap2, 7, 3);
      // Pincer tips (red/dark)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-26, h / 2 - 12 + scuttle - pincerSnap, 2, 2);
      ctx.fillRect(-26, h / 2 + 2 + scuttle - pincerSnap2, 2, 2);
      // Tail (segmented, curving up with sway)
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(12, h / 2 + scuttle);
      ctx.quadraticCurveTo(22 + tailSway * 3, h / 2 - 18, 16 + tailSway * 2, h / 2 - 28);
      ctx.stroke();
      // Tail segments
      ctx.fillStyle = '#b45309';
      ctx.fillRect(14, h / 2 - 6 + scuttle, 4, 3);
      ctx.fillRect(17 + tailSway, h / 2 - 14, 4, 3);
      ctx.fillRect(18 + tailSway * 1.5, h / 2 - 22, 4, 3);
      // Stinger (dripping poison)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(14 + tailSway * 2, h / 2 - 32);
      ctx.lineTo(19 + tailSway * 2, h / 2 - 26);
      ctx.lineTo(14 + tailSway * 2, h / 2 - 26);
      ctx.fill();
      // Poison drip
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(15 + tailSway * 2, h / 2 - 32 + Math.abs(Math.sin(time * 3)) * 4, 2, 3);
      // Legs (animated scuttling, 4 pairs)
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      for (let side = -1; side <= 1; side += 2) {
        for (let leg = 0; leg < 4; leg++) {
          const legOffset = moving ? Math.sin(time * 8 + leg * 1.5) * 3 : 0;
          ctx.beginPath();
          ctx.moveTo(-8 + leg * 5, h / 2 + 6 + scuttle);
          ctx.lineTo(-8 + leg * 5 + side * 10, h - 2 + legOffset);
          ctx.stroke();
        }
      }
      break;
    }
    case 'werewolf': {
      const transformed = e._transformed;
      const furColor = transformed ? '#374151' : '#6b7280';
      const darkFur = transformed ? '#1f2937' : '#4b5563';
      const bob = moving ? walkAbs * 2.5 : breathe;
      const howl = transformed ? Math.sin(time * 12) * 1 : 0;
      // Head
      ctx.fillStyle = furColor;
      ctx.fillRect(-10 + howl, 0 - bob, 20, 16);
      // Snout (longer)
      ctx.fillStyle = darkFur;
      ctx.fillRect(-14 + howl, 8 - bob, 8, 8);
      // Snout highlight
      ctx.fillStyle = '#111';
      ctx.fillRect(-14 + howl, 8 - bob, 3, 3); // nose
      // Ears (pointed, twitching)
      ctx.fillStyle = furColor;
      ctx.fillRect(-10 + howl, -5 - bob, 5, 6);
      ctx.fillRect(5 + howl, -5 - bob, 5, 6);
      // Inner ear
      ctx.fillStyle = '#e8a0a0';
      ctx.fillRect(-9 + howl, -3 - bob, 3, 3);
      ctx.fillRect(6 + howl, -3 - bob, 3, 3);
      // Eyes (glowing when transformed)
      ctx.fillStyle = transformed ? '#ef4444' : '#fbbf24';
      ctx.fillRect(-6 + howl, 4 - bob, 4, 4);
      ctx.fillRect(2 + howl, 4 - bob, 4, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(-5 + howl, 5 - bob, 2, 2);
      ctx.fillRect(3 + howl, 5 - bob, 2, 2);
      // Eye glow when transformed
      if (transformed) {
        ctx.fillStyle = 'rgba(239,68,68,0.3)';
        ctx.fillRect(-7 + howl, 3 - bob, 6, 6);
        ctx.fillRect(1 + howl, 3 - bob, 6, 6);
      }
      // Fangs (open jaw)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-12 + howl, 14 - bob, 2, 3);
      ctx.fillRect(-9 + howl, 14 - bob, 2, 2);
      ctx.fillRect(-6 + howl, 15 - bob, 2, 2);
      // Body (hunched)
      ctx.fillStyle = furColor;
      ctx.fillRect(-12, 16, 24, 18);
      // Chest lighter
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(-6, 18, 12, 10);
      // Fur tufts
      ctx.fillStyle = darkFur;
      ctx.fillRect(-12, 16, 2, 4);
      ctx.fillRect(10, 16, 2, 4);
      // Arms (muscular) with swing
      ctx.fillStyle = furColor;
      ctx.fillRect(-16, 18 + armSwing * 1.3, 4, 14);
      ctx.fillRect(12, 18 - armSwing * 1.3, 4, 14);
      // Claws
      ctx.fillStyle = '#fff';
      ctx.fillRect(-18, 30 + armSwing * 1.3, 2, 4);
      ctx.fillRect(-16, 31 + armSwing * 1.3, 2, 4);
      ctx.fillRect(14, 30 - armSwing * 1.3, 2, 4);
      ctx.fillRect(16, 31 - armSwing * 1.3, 2, 4);
      // Legs with run
      ctx.fillStyle = darkFur;
      ctx.fillRect(-9, 34, 7, 16 + legSwing * 1.2);
      ctx.fillRect(2, 34, 7, 16 - legSwing * 1.2);
      // Paws
      ctx.fillStyle = furColor;
      ctx.fillRect(-11, 48 + legSwing * 1.2, 10, 5);
      ctx.fillRect(1, 48 - legSwing * 1.2, 10, 5);
      // Tail
      ctx.fillStyle = darkFur;
      ctx.fillRect(10, 26 + Math.sin(time * 4) * 3, 6, 4);
      ctx.fillRect(14, 24 + Math.sin(time * 4 + 1) * 4, 5, 3);
      break;
    }
    case 'mushroom': {
      // Toxic mushroom creature with waddle walk
      const waddle = moving ? Math.sin(time * 8) * 3 : 0;
      const bounce = moving ? Math.abs(Math.sin(time * 8)) * 2 : 0;
      const sporeBurst = Math.sin(time * 2);
      // Cap (larger, more detailed with animated wobble)
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(waddle, 6 - bounce, 16, 12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Cap rim (darker edge)
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.ellipse(waddle, 8 - bounce, 16, 4, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Cap spots (varied sizes)
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(-9 + waddle, 0 - bounce, 5, 4);
      ctx.fillRect(3 + waddle, -2 - bounce, 4, 3);
      ctx.fillRect(-3 + waddle, 2 - bounce, 3, 3);
      ctx.fillRect(7 + waddle, 2 - bounce, 3, 2);
      // Cap underside (gills)
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-10 + waddle, 6 - bounce, 2, 3);
      ctx.fillRect(-6 + waddle, 6 - bounce, 2, 4);
      ctx.fillRect(-2 + waddle, 6 - bounce, 2, 4);
      ctx.fillRect(2 + waddle, 6 - bounce, 2, 4);
      ctx.fillRect(6 + waddle, 6 - bounce, 2, 4);
      ctx.fillRect(10 + waddle, 6 - bounce, 2, 3);
      // Stem/body (thicker)
      ctx.fillStyle = '#d4c4a8';
      ctx.fillRect(-7, 8 - bounce, 14, 16);
      // Stem ring
      ctx.fillStyle = '#c4a882';
      ctx.fillRect(-8, 10 - bounce, 16, 2);
      // Eyes (rounder, more expressive)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-5, 12 - bounce, 5, 5);
      ctx.fillRect(1, 12 - bounce, 5, 5);
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 13 - bounce, 3, 3);
      ctx.fillRect(2, 13 - bounce, 3, 3);
      // Angry eyebrows when moving
      if (moving) {
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(-5, 11 - bounce, 4, 1);
        ctx.fillRect(1, 11 - bounce, 4, 1);
      }
      // Mouth (animated - open wider when moving)
      ctx.fillStyle = '#6b4226';
      if (moving) {
        ctx.fillRect(-3, 19 - bounce, 6, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(-2, 19 - bounce, 4, 2);
      } else {
        ctx.fillRect(-3, 19 - bounce, 6, 2);
      }
      // Feet (waddling)
      ctx.fillStyle = '#c4a882';
      ctx.fillRect(-9 + legSwing, 24 - bounce, 7, 4);
      ctx.fillRect(2 - legSwing, 24 - bounce, 7, 4);
      // Toe bumps
      ctx.fillStyle = '#b8a67a';
      ctx.fillRect(-10 + legSwing, 27 - bounce, 3, 2);
      ctx.fillRect(6 - legSwing, 27 - bounce, 3, 2);
      // Spore cloud (more particles, bigger effect)
      ctx.fillStyle = `rgba(168,85,247,${0.3 + sporeBurst * 0.15})`;
      ctx.fillRect(-12 + Math.sin(time * 3) * 5, -4 + Math.cos(time * 2) * 4, 3, 3);
      ctx.fillRect(8 + Math.cos(time * 4) * 4, -6 + Math.sin(time * 3) * 3, 3, 3);
      ctx.fillRect(-4 + Math.sin(time * 5) * 6, -8 + Math.cos(time * 4) * 3, 2, 2);
      ctx.fillRect(2 + Math.cos(time * 3.5) * 5, -3 + Math.sin(time * 2.5) * 4, 2, 2);
      ctx.fillRect(Math.sin(time * 2.5) * 8, -10 + Math.cos(time * 3) * 4, 2, 2);
      break;
    }
    case 'gargoyle': {
      const bob = Math.sin(time * 2) * 4;
      const wingFlap = Math.sin(time * 5) * 8;
      const stoneGlow = Math.sin(time * 3);
      // Wings (stone-colored, animated flapping)
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-hw - 2, 10 + wingFlap + bob, hw - 6, 20);
      ctx.fillRect(8, 10 - wingFlap + bob, hw - 6, 20);
      // Wing bone structure
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-hw + 2, 12 + wingFlap + bob, 2, 16);
      ctx.fillRect(hw - 4, 12 - wingFlap + bob, 2, 16);
      // Wing membrane darker tips
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-hw - 6, 16 + wingFlap + bob, 6, 12);
      ctx.fillRect(hw, 16 - wingFlap + bob, 6, 12);
      // Wing claw tips
      ctx.fillStyle = '#292524';
      ctx.fillRect(-hw - 6, 14 + wingFlap + bob, 2, 4);
      ctx.fillRect(hw + 4, 14 - wingFlap + bob, 2, 4);
      // Body (stone textured)
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-14, 4 + bob, 28, 32);
      // Stone cracks
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-6, 8 + bob, 1, 8);
      ctx.fillRect(4, 12 + bob, 1, 10);
      ctx.fillRect(-10, 20 + bob, 1, 6);
      // Chest muscle definition
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-10, 6 + bob, 8, 10);
      ctx.fillRect(2, 6 + bob, 8, 10);
      // Head (more detailed)
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-10, -6 + bob, 20, 16);
      // Brow ridge (heavy)
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-12, -2 + bob, 24, 4);
      // Horns (curved, larger)
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-14, -10 + bob, 4, 8);
      ctx.fillRect(10, -10 + bob, 4, 8);
      ctx.fillRect(-16, -12 + bob, 4, 4);
      ctx.fillRect(12, -12 + bob, 4, 4);
      // Horn tips
      ctx.fillStyle = '#292524';
      ctx.fillRect(-16, -13 + bob, 2, 2);
      ctx.fillRect(14, -13 + bob, 2, 2);
      // Eyes (glowing red, pulsing)
      ctx.fillStyle = `rgba(239,68,68,${0.7 + stoneGlow * 0.3})`;
      ctx.fillRect(-7, 0 + bob, 5, 5);
      ctx.fillRect(2, 0 + bob, 5, 5);
      // Eye glow aura
      ctx.fillStyle = `rgba(239,68,68,${0.15 + stoneGlow * 0.1})`;
      ctx.fillRect(-9, -2 + bob, 9, 9);
      ctx.fillRect(0, -2 + bob, 9, 9);
      // Inner eye bright
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-5, 1 + bob, 2, 2);
      ctx.fillRect(4, 1 + bob, 2, 2);
      // Snarling mouth with fangs
      ctx.fillStyle = '#111';
      ctx.fillRect(-5, 7 + bob, 10, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, 7 + bob, 2, 3);
      ctx.fillRect(0, 7 + bob, 2, 3);
      ctx.fillRect(2, 7 + bob, 2, 3);
      // Arms (muscular, clawed)
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-18, 10 + bob + armSwing, 5, 16);
      ctx.fillRect(13, 10 + bob - armSwing, 5, 16);
      // Clawed hands
      ctx.fillStyle = '#292524';
      ctx.fillRect(-19, 25 + bob + armSwing, 2, 3);
      ctx.fillRect(-16, 25 + bob + armSwing, 2, 3);
      ctx.fillRect(14, 25 + bob - armSwing, 2, 3);
      ctx.fillRect(17, 25 + bob - armSwing, 2, 3);
      // Clawed feet (larger)
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-11, 36 + bob + legSwing, 9, 7);
      ctx.fillRect(2, 36 + bob - legSwing, 9, 7);
      // Toe claws
      ctx.fillStyle = '#292524';
      ctx.fillRect(-13, 41 + bob + legSwing, 2, 4);
      ctx.fillRect(-9, 42 + bob + legSwing, 2, 3);
      ctx.fillRect(7, 41 + bob - legSwing, 2, 4);
      ctx.fillRect(11, 42 + bob - legSwing, 2, 3);
      // Stone dust particles when moving
      if (moving) {
        ctx.fillStyle = 'rgba(120,113,108,0.4)';
        ctx.fillRect(-8 + Math.sin(time * 6) * 6, 40 + bob, 2, 2);
        ctx.fillRect(4 + Math.cos(time * 5) * 5, 42 + bob, 2, 2);
      }
      break;
    }
    case 'lich': {
      // Undead mage king with floating animation
      const hover = Math.sin(time * 2) * 4;
      const soulPulse = Math.sin(time * 3);
      // Crown (elaborate ice crown)
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-8, -6 + hover, 16, 4);
      ctx.fillRect(-10, -10 + hover, 4, 6);
      ctx.fillRect(-2, -14 + hover, 4, 10);
      ctx.fillRect(6, -10 + hover, 4, 6);
      // Crown gems
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(-9, -8 + hover, 2, 2);
      ctx.fillRect(-1, -12 + hover, 2, 2);
      ctx.fillRect(7, -8 + hover, 2, 2);
      // Skull head
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, -2 + hover, 16, 14);
      // Skull cracks
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-2, -2 + hover, 1, 5);
      ctx.fillRect(3, 0 + hover, 1, 4);
      // Eye sockets
      ctx.fillStyle = '#111';
      ctx.fillRect(-6, 2 + hover, 5, 5);
      ctx.fillRect(1, 2 + hover, 5, 5);
      // Glowing eyes (pulsing soul fire)
      ctx.fillStyle = `rgba(34,211,238,${0.6 + soulPulse * 0.3})`;
      ctx.fillRect(-5, 3 + hover, 3, 3);
      ctx.fillRect(2, 3 + hover, 3, 3);
      // Eye glow aura
      ctx.fillStyle = `rgba(34,211,238,${0.2 + soulPulse * 0.1})`;
      ctx.fillRect(-7, 1 + hover, 7, 7);
      ctx.fillRect(0, 1 + hover, 7, 7);
      // Jaw
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-6, 8 + hover, 12, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, 10 + hover, 2, 2);
      ctx.fillRect(0, 10 + hover, 2, 2);
      ctx.fillRect(3, 10 + hover, 2, 2);
      // Robe (ornate)
      ctx.fillStyle = '#164e63';
      ctx.fillRect(-12, 12 + hover, 24, 26);
      // Robe runes
      ctx.fillStyle = '#22d3ee';
      ctx.globalAlpha = 0.4 + soulPulse * 0.2;
      ctx.fillRect(-8, 16 + hover, 2, 6);
      ctx.fillRect(6, 18 + hover, 2, 6);
      ctx.fillRect(-2, 22 + hover, 4, 2);
      ctx.globalAlpha = 1;
      // Inner robe
      ctx.fillStyle = '#083344';
      ctx.fillRect(-4, 14 + hover, 8, 22);
      // Ghostly lower body (flowing)
      ctx.fillStyle = 'rgba(22,78,99,0.6)';
      ctx.fillRect(-14, 38 + hover, 28, 12);
      for (let i = -14; i < 14; i += 4) {
        ctx.fillRect(i, 50 + hover + Math.sin(time * 3 + i) * 4, 4, 8);
      }
      // Arms (skeletal, outstretched)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-16, 16 + hover + Math.sin(time * 2) * 2, 4, 12);
      ctx.fillRect(12, 16 + hover - Math.sin(time * 2) * 2, 4, 12);
      // Bony fingers
      ctx.fillRect(-17, 27 + hover + Math.sin(time * 2) * 2, 2, 4);
      ctx.fillRect(-15, 28 + hover + Math.sin(time * 2) * 2, 2, 3);
      // Staff with soul orb
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-20, 0 + hover, 3, 54);
      // Soul orb (larger, pulsing)
      ctx.fillStyle = '#22d3ee';
      const orbPulse = 5 + soulPulse * 2;
      ctx.beginPath();
      ctx.arc(-19, -6 + hover, orbPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(-19, -7 + hover, orbPulse * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Soul particles orbiting staff
      ctx.fillStyle = 'rgba(34,211,238,0.5)';
      const orbAngle = time * 3;
      ctx.fillRect(-19 + Math.cos(orbAngle) * 8, -6 + hover + Math.sin(orbAngle) * 6, 2, 2);
      ctx.fillRect(-19 + Math.cos(orbAngle + Math.PI) * 6, -6 + hover + Math.sin(orbAngle + Math.PI) * 4, 2, 2);
      break;
    }
    case 'cyclops': {
      // One-eyed giant with heavy stomp walk
      const stomp = moving ? walkAbs * 4 : breathe;
      const eyeTrack = Math.sin(time * 1.5) * 3;
      // Head (big)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-16, 0 - stomp, 32, 24);
      // Horns
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-14, -4 - stomp, 4, 5);
      ctx.fillRect(10, -4 - stomp, 4, 5);
      // SINGLE BIG EYE (tracking)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, 6 - stomp, 16, 12);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-4 + eyeTrack, 8 - stomp, 8, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2 + eyeTrack, 10 - stomp, 3, 3); // eye shine
      // Angry brow
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-10, 4 - stomp, 20, 3);
      // Furrowed brow detail
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-10, 3 - stomp, 8, 2);
      ctx.fillRect(2, 4 - stomp, 8, 2);
      // Mouth (snarling)
      ctx.fillStyle = '#111';
      ctx.fillRect(-6, 20 - stomp, 12, 4);
      // Teeth
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, 20 - stomp, 3, 3);
      ctx.fillRect(2, 20 - stomp, 3, 3);
      ctx.fillRect(-1, 22 - stomp, 2, 3);
      // Body (massive)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-22, 24, 44, 26);
      // Belly
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-12, 28, 24, 16);
      // Belly button
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-1, 36, 2, 2);
      // Loincloth
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(-18, 48, 36, 4);
      ctx.fillStyle = '#4a2c0e';
      ctx.fillRect(-4, 48, 8, 6);
      // Arms (huge) with swing
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-30, 26 + armSwing * 1.5, 8, 22);
      ctx.fillRect(22, 26 - armSwing * 1.5, 8, 22);
      // Fists
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-32, 46 + armSwing * 1.5, 12, 10);
      ctx.fillRect(20, 46 - armSwing * 1.5, 12, 10);
      // Legs with walk
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-16, 52, 12, 20 + legSwing * 1.3);
      ctx.fillRect(4, 52, 12, 20 - legSwing * 1.3);
      // Feet
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-18, 72 + legSwing * 1.3, 16, 6);
      ctx.fillRect(2, 72 - legSwing * 1.3, 16, 6);
      break;
    }
    case 'jet': {
      // Fighter jet
      // Fuselage
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(-hw + 4, h * 0.3, w - 8, h * 0.4);
      // Nose cone
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-hw, h * 0.5);
      ctx.lineTo(-hw - 12, h * 0.5);
      ctx.lineTo(-hw, h * 0.35);
      ctx.fill();
      // Cockpit
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-hw + 6, h * 0.3, 8, 6);
      // Wings
      ctx.fillStyle = '#075985';
      ctx.fillRect(-8, h * 0.1, 16, h * 0.2);
      ctx.fillRect(-8, h * 0.7, 16, h * 0.2);
      // Tail fin
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(hw - 8, h * 0.15, 6, h * 0.2);
      // Engine glow
      ctx.fillStyle = '#f97316';
      ctx.fillRect(hw - 2, h * 0.4, 8 + Math.sin(time * 20) * 3, h * 0.2);
      break;
    }
    case 'apc': {
      // Armored personnel carrier
      ctx.fillStyle = '#365314';
      ctx.fillRect(-hw, h * 0.3, w, h * 0.5);
      // Treads
      ctx.fillStyle = '#1a2e05';
      ctx.fillRect(-hw - 2, h * 0.75, w + 4, h * 0.25);
      ctx.fillStyle = '#111';
      for (let tx = -hw; tx < hw; tx += 7) {
        ctx.fillRect(tx, h * 0.75, 3, h * 0.25);
      }
      // Turret
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-8, h * 0.15, 16, h * 0.2);
      // Gun
      ctx.fillStyle = '#365314';
      ctx.fillRect(-hw - 10, h * 0.2, hw - 4, 4);
      // Viewing slits (eyes)
      ctx.fillStyle = '#bef264';
      ctx.fillRect(-hw + 8, h * 0.38, 6, 3);
      ctx.fillRect(hw - 14, h * 0.38, 6, 3);
      break;
    }
    case 'warship': {
      // Heavy ground warship
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(-hw, h * 0.35, w, h * 0.45);
      // Hull bottom
      ctx.fillStyle = '#172554';
      ctx.fillRect(-hw + 4, h * 0.75, w - 8, h * 0.2);
      // Bridge
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(-10, h * 0.15, 20, h * 0.25);
      // Main cannons
      ctx.fillStyle = '#374151';
      ctx.fillRect(-hw - 14, h * 0.3, 18, 6);
      ctx.fillRect(hw - 4, h * 0.3, 18, 6);
      // Bridge windows (eyes)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-6, h * 0.2, 4, 4);
      ctx.fillRect(2, h * 0.2, 4, 4);
      // Radar dish
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-2, h * 0.05, 4, h * 0.12);
      ctx.fillRect(-6, h * 0.05, 12, 2);
      // Wheels/treads
      ctx.fillStyle = '#111827';
      for (let tx = -hw + 4; tx < hw - 4; tx += 10) {
        ctx.beginPath();
        ctx.arc(tx + 5, h * 0.92, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'hovercraft': {
      // Fast hover vehicle
      const hover = Math.sin(time * 6) * 3;
      // Body
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-hw, h * 0.3 + hover, w, h * 0.35);
      // Cockpit
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-hw + 4, h * 0.2 + hover, 12, h * 0.15);
      // Hover skirt
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-hw - 2, h * 0.65 + hover, w + 4, h * 0.15);
      ctx.fillStyle = 'rgba(186,230,253,0.4)';
      ctx.fillRect(-hw, h * 0.8 + hover, w, h * 0.2);
      // Fan (rear)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(hw - 4, h * 0.48 + hover, 8, 0, Math.PI * 2);
      ctx.fill();
      // Fan blade
      ctx.fillStyle = '#94a3b8';
      const fanAngle = time * 20;
      ctx.fillRect(hw - 10, h * 0.48 + hover - 1, 12 * Math.cos(fanAngle), 2);
      // Lights (eyes)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-hw + 6, h * 0.35 + hover, 3, 3);
      ctx.fillRect(-hw + 12, h * 0.35 + hover, 3, 3);
      break;
    }

    case 'rat': {
      // Tiny scurrying rat
      const scurry = Math.sin(time * 12) * 2;
      // Body
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(-hw + 2, h * 0.3 + scurry, w * 0.7, h * 0.45);
      // Head (pointy)
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(-hw, h * 0.35 + scurry, 8, h * 0.3);
      ctx.fillRect(-hw - 4, h * 0.4 + scurry, 6, h * 0.2);
      // Ears
      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(-hw + 1, h * 0.22 + scurry, 4, 5);
      ctx.fillRect(-hw + 6, h * 0.24 + scurry, 4, 4);
      // Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-hw + 1, h * 0.4 + scurry, 2, 2);
      // Tail
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hw - 4, h * 0.5 + scurry);
      ctx.quadraticCurveTo(hw + 6, h * 0.3, hw + 10, h * 0.55 + Math.sin(time * 8) * 3);
      ctx.stroke();
      // Legs (fast scurrying)
      ctx.fillStyle = '#78716c';
      const legOff = Math.sin(time * 16) * 2;
      ctx.fillRect(-hw + 5, h * 0.7 + legOff, 3, h * 0.3);
      ctx.fillRect(-hw + 12, h * 0.7 - legOff, 3, h * 0.3);
      ctx.fillRect(hw - 12, h * 0.7 + legOff, 3, h * 0.3);
      break;
    }

    case 'beetle': {
      // Armored beetle
      const bob = Math.sin(time * 2) * 1.5;
      // Shell (main body, domed)
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.ellipse(0, h * 0.5 + bob, hw - 2, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // Shell line (center)
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.18 + bob);
      ctx.lineTo(0, h * 0.82 + bob);
      ctx.stroke();
      // Shell highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.ellipse(-4, h * 0.38 + bob, 6, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-hw * 0.5, h * 0.15 + bob, w * 0.3, h * 0.2);
      // Mandibles
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-hw * 0.6, h * 0.25 + bob, 4, 6);
      ctx.fillRect(-hw * 0.15, h * 0.25 + bob, 4, 6);
      // Antennae
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.3, h * 0.15 + bob);
      ctx.lineTo(-hw * 0.5, h * 0.02 + bob);
      ctx.moveTo(-hw * 0.1, h * 0.15 + bob);
      ctx.lineTo(hw * 0.1, h * 0.02 + bob);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-hw * 0.4, h * 0.18 + bob, 3, 3);
      ctx.fillRect(-hw * 0.1, h * 0.18 + bob, 3, 3);
      // Legs
      ctx.fillStyle = '#713f12';
      for (let i = 0; i < 3; i++) {
        const lx = -hw + 6 + i * (w * 0.3);
        ctx.fillRect(lx - 2, h * 0.78 + bob, 2, h * 0.22 - bob);
        ctx.fillRect(lx + w * 0.08, h * 0.78 + bob, 2, h * 0.22 - bob);
      }
      break;
    }

    case 'ghost': {
      // Spooky phasing ghost
      const phase = Math.sin(time * 2);
      const ghostAlpha = 0.5 + phase * 0.25;
      ctx.globalAlpha = ghostAlpha;
      // Body (wavy bottom)
      ctx.fillStyle = '#c7d2fe';
      ctx.beginPath();
      ctx.moveTo(-hw, h * 0.15);
      ctx.lineTo(-hw, h * 0.75);
      // Wavy bottom edge
      for (let i = 0; i <= 6; i++) {
        const px = -hw + i * (w / 6);
        const py = h * 0.85 + Math.sin(time * 4 + i * 1.2) * 4 + (i % 2 === 0 ? 6 : 0);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(hw, h * 0.75);
      ctx.lineTo(hw, h * 0.15);
      ctx.closePath();
      ctx.fill();
      // Head dome
      ctx.beginPath();
      ctx.ellipse(0, h * 0.2, hw - 2, h * 0.22, 0, Math.PI, 0);
      ctx.fill();
      // Eyes (hollow)
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-8, h * 0.22, 6, 8);
      ctx.fillRect(3, h * 0.22, 6, 8);
      // Eye glow
      ctx.fillStyle = `rgba(99,102,241,${0.4 + phase * 0.3})`;
      ctx.fillRect(-7, h * 0.24, 4, 4);
      ctx.fillRect(4, h * 0.24, 4, 4);
      // Mouth (O shape)
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-3, h * 0.38, 6, 6);
      ctx.globalAlpha = 1;
      break;
    }

    case 'witch': {
      // Witch on a broomstick
      const wobble = Math.sin(time * 3) * 2;
      // Broomstick
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-hw - 6, h * 0.65 + wobble, w + 12, 3);
      // Broom bristles
      ctx.fillStyle = '#d97706';
      ctx.fillRect(hw + 2, h * 0.58 + wobble, 8, 16);
      ctx.fillStyle = '#b45309';
      for (let i = 0; i < 4; i++) ctx.fillRect(hw + 4 + i * 2, h * 0.56 + wobble + i, 2, 18 - i * 2);
      // Body / robe
      ctx.fillStyle = '#86198f';
      ctx.fillRect(-8, h * 0.32 + wobble, 16, h * 0.34);
      // Robe bottom (flared)
      ctx.fillRect(-10, h * 0.55 + wobble, 20, h * 0.12);
      // Arms
      ctx.fillStyle = '#701a75';
      ctx.fillRect(-12, h * 0.42 + wobble, 6, 4);
      ctx.fillRect(6, h * 0.42 + wobble, 6, 4);
      // Head
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-5, h * 0.18 + wobble, 10, 12);
      // Hat (pointy witch hat)
      ctx.fillStyle = '#4a044e';
      ctx.fillRect(-8, h * 0.14 + wobble, 16, 6);
      ctx.fillRect(-5, h * 0.07 + wobble, 10, 8);
      ctx.fillRect(-3, h * 0.0 + wobble, 6, 8);
      ctx.fillRect(-1, -4 + wobble, 2, 6);
      // Hat brim
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-10, h * 0.18 + wobble, 20, 3);
      // Eyes
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-3, h * 0.22 + wobble, 2, 2);
      ctx.fillRect(2, h * 0.22 + wobble, 2, 2);
      // Magic sparkle in hand
      const sparkle = Math.sin(time * 6) > 0.3;
      if (sparkle) {
        ctx.fillStyle = '#e879f9';
        ctx.fillRect(-14, h * 0.4 + wobble, 3, 3);
        ctx.fillStyle = '#f0abfc';
        ctx.fillRect(-15, h * 0.39 + wobble, 1, 1);
        ctx.fillRect(-12, h * 0.42 + wobble, 1, 1);
      }
      break;
    }

    case 'sand_worm': {
      // Burrowing sand worm — segmented body emerging from ground
      const emerge = Math.sin(time * 1.5) * 0.3 + 0.7; // 0.4–1.0 emergence
      const sway = Math.sin(time * 2.5) * 4;
      // Segments (curved body rising from ground)
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const segX = sway * t;
        const segY = h * (1 - t * emerge * 0.8) - 2;
        const segW = (hw - 2) * (1 - t * 0.3);
        const segH = h * 0.14;
        const shade = Math.round(180 + t * 30);
        ctx.fillStyle = i % 2 === 0 ? '#d4a017' : `rgb(${shade},${shade - 40},20)`;
        ctx.fillRect(segX - segW, segY, segW * 2, segH);
      }
      // Head
      const headY = h * (1 - emerge * 0.8) - 6;
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(sway - 12, headY, 24, 16);
      // Mouth (open)
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(sway - 8, headY + 10, 16, 8);
      // Teeth
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(sway - 6, headY + 9, 3, 4);
      ctx.fillRect(sway + 3, headY + 9, 3, 4);
      ctx.fillRect(sway - 1, headY + 9, 2, 3);
      // Eyes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(sway - 7, headY + 3, 4, 4);
      ctx.fillRect(sway + 3, headY + 3, 4, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(sway - 6, headY + 4, 2, 2);
      ctx.fillRect(sway + 4, headY + 4, 2, 2);
      // Sand particles around base
      ctx.fillStyle = 'rgba(212,160,23,0.5)';
      for (let j = 0; j < 5; j++) {
        const px = Math.sin(time * 3 + j * 2) * (hw + 4);
        const py = h - 4 + Math.sin(time * 4 + j) * 3;
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      break;
    }

    case 'frost_wolf': {
      // Icy wolf — fast and aggressive
      const run = Math.sin(time * 8) * 2;
      // Body
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(-hw + 4, h * 0.35 + run, w * 0.7, h * 0.35);
      // Chest (lighter)
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(-hw + 6, h * 0.4 + run, w * 0.25, h * 0.25);
      // Head
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(-hw, h * 0.2 + run, 16, 18);
      // Snout
      ctx.fillStyle = '#bfdbfe';
      ctx.fillRect(-hw - 5, h * 0.3 + run, 8, 8);
      // Nose
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(-hw - 4, h * 0.32 + run, 3, 3);
      // Ears (pointy)
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(-hw + 2, h * 0.1 + run, 4, 10);
      ctx.fillRect(-hw + 9, h * 0.12 + run, 4, 8);
      // Inner ear
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(-hw + 3, h * 0.12 + run, 2, 6);
      // Eyes (icy blue glow)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-hw + 3, h * 0.25 + run, 3, 3);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-hw + 4, h * 0.26 + run, 1, 1);
      // Ice crystals on fur
      ctx.fillStyle = 'rgba(186,230,253,0.6)';
      ctx.fillRect(-hw + 14, h * 0.3 + run, 2, 2);
      ctx.fillRect(-hw + 8, h * 0.36 + run, 1, 2);
      ctx.fillRect(hw - 14, h * 0.32 + run, 2, 1);
      // Legs
      ctx.fillStyle = '#93c5fd';
      const legR = Math.sin(time * 10) * 3;
      ctx.fillRect(-hw + 5, h * 0.65 + legR, 4, h * 0.35);
      ctx.fillRect(-hw + 12, h * 0.65 - legR, 4, h * 0.35);
      ctx.fillRect(hw - 14, h * 0.65 + legR, 4, h * 0.35);
      ctx.fillRect(hw - 8, h * 0.65 - legR, 4, h * 0.35);
      // Paws
      ctx.fillStyle = '#bfdbfe';
      ctx.fillRect(-hw + 4, h * 0.94, 6, 3);
      ctx.fillRect(hw - 15, h * 0.94, 6, 3);
      // Tail (bushy, icy)
      ctx.fillStyle = '#bfdbfe';
      const tailWag = Math.sin(time * 5) * 5;
      ctx.fillRect(hw - 6, h * 0.3 + run + tailWag, 8, 6);
      ctx.fillRect(hw - 2, h * 0.26 + run + tailWag, 6, 5);
      break;
    }

    case 'plague_rat': {
      // Larger poisonous rat with green tint
      const scurry = Math.sin(time * 10) * 2;
      // Body
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(-hw + 2, h * 0.25 + scurry, w * 0.75, h * 0.5);
      // Boils / bumps
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(-hw + 8, h * 0.28 + scurry, 4, 4);
      ctx.fillRect(4, h * 0.32 + scurry, 3, 3);
      ctx.fillRect(-2, h * 0.26 + scurry, 3, 3);
      // Head
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-hw, h * 0.3 + scurry, 10, h * 0.35);
      ctx.fillRect(-hw - 5, h * 0.38 + scurry, 7, h * 0.2);
      // Ears
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(-hw + 1, h * 0.18 + scurry, 5, 6);
      ctx.fillRect(-hw + 7, h * 0.2 + scurry, 4, 5);
      // Eyes (sickly yellow)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-hw + 1, h * 0.35 + scurry, 3, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(-hw + 2, h * 0.36 + scurry, 1, 1);
      // Teeth
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(-hw - 3, h * 0.48 + scurry, 2, 3);
      ctx.fillRect(-hw - 1, h * 0.48 + scurry, 2, 3);
      // Tail (wavy)
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hw - 4, h * 0.45 + scurry);
      ctx.quadraticCurveTo(hw + 4, h * 0.25, hw + 10, h * 0.5 + Math.sin(time * 6) * 4);
      ctx.stroke();
      // Poison drip
      const drip = (time * 2) % 1;
      ctx.fillStyle = `rgba(132,204,22,${1 - drip})`;
      ctx.fillRect(-hw - 2, h * 0.52 + scurry + drip * 8, 2, 3);
      // Legs
      ctx.fillStyle = '#4d7c0f';
      const plegOff = Math.sin(time * 14) * 2;
      ctx.fillRect(-hw + 4, h * 0.7 + plegOff, 3, h * 0.3);
      ctx.fillRect(-hw + 12, h * 0.7 - plegOff, 3, h * 0.3);
      ctx.fillRect(hw - 10, h * 0.7 + plegOff, 3, h * 0.3);
      break;
    }

    case 'djinn': {
      // Floating magical djinn — translucent lower body
      const floatY = Math.sin(time * 2) * 4;
      const glow = 0.4 + Math.sin(time * 3) * 0.2;
      // Smoke trail (lower body fades)
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#c084fc';
      for (let i = 0; i < 4; i++) {
        const sw = 10 - i * 2 + Math.sin(time * 3 + i) * 2;
        const sy = h * 0.65 + i * 8 + floatY;
        ctx.fillRect(-sw, sy, sw * 2, 6);
      }
      ctx.globalAlpha = 1;
      // Body (muscular torso)
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-10, h * 0.28 + floatY, 20, h * 0.38);
      // Chest highlight
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-6, h * 0.32 + floatY, 12, h * 0.12);
      // Arms (crossed / outstretched)
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-hw + 2, h * 0.35 + floatY, 8, 6);
      ctx.fillRect(hw - 10, h * 0.35 + floatY, 8, 6);
      // Bracers (golden)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-hw + 2, h * 0.35 + floatY, 3, 6);
      ctx.fillRect(hw - 5, h * 0.35 + floatY, 3, 6);
      // Head
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-7, h * 0.12 + floatY, 14, 16);
      // Turban
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(-8, h * 0.06 + floatY, 16, 10);
      ctx.fillRect(-5, h * 0.01 + floatY, 10, 7);
      // Turban gem
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-1, h * 0.08 + floatY, 3, 3);
      // Eyes (glowing)
      ctx.fillStyle = `rgba(250,204,21,${glow + 0.4})`;
      ctx.fillRect(-4, h * 0.16 + floatY, 3, 3);
      ctx.fillRect(2, h * 0.16 + floatY, 3, 3);
      // Beard
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-3, h * 0.26 + floatY, 6, 6);
      ctx.fillRect(-2, h * 0.32 + floatY, 4, 4);
      // Magic orbs orbiting
      for (let i = 0; i < 2; i++) {
        const oAngle = time * 3 + i * Math.PI;
        const ox = Math.cos(oAngle) * 18;
        const oy = h * 0.4 + Math.sin(oAngle) * 10 + floatY;
        ctx.fillStyle = `rgba(192,132,252,${glow})`;
        ctx.fillRect(Math.round(ox) - 2, Math.round(oy) - 2, 4, 4);
        ctx.fillStyle = `rgba(255,255,255,${glow * 0.5})`;
        ctx.fillRect(Math.round(ox) - 1, Math.round(oy) - 1, 2, 2);
      }
      break;
    }

    case 'death_knight': {
      // Dark armored knight with skull helmet
      const stance = Math.sin(time * 1.5) * 1;
      // Boots
      ctx.fillStyle = '#292524';
      ctx.fillRect(-10, h * 0.88 + stance, 8, h * 0.12);
      ctx.fillRect(2, h * 0.88 + stance, 8, h * 0.12);
      // Legs (dark plate)
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-9, h * 0.65 + stance, 7, h * 0.25);
      ctx.fillRect(2, h * 0.65 + stance, 7, h * 0.25);
      // Body (heavy plate armor)
      ctx.fillStyle = '#292524';
      ctx.fillRect(-14, h * 0.28 + stance, 28, h * 0.4);
      // Chest plate details
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-10, h * 0.32 + stance, 20, 3);
      ctx.fillRect(-10, h * 0.42 + stance, 20, 3);
      // Dark emblem on chest
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-3, h * 0.36 + stance, 6, 6);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-1, h * 0.37 + stance, 2, 4);
      // Shoulders (big pauldrons)
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-hw + 1, h * 0.26 + stance, 10, 10);
      ctx.fillRect(hw - 11, h * 0.26 + stance, 10, 10);
      // Spikes on pauldrons
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-hw + 4, h * 0.2 + stance, 3, 7);
      ctx.fillRect(hw - 7, h * 0.2 + stance, 3, 7);
      // Arms
      ctx.fillStyle = '#292524';
      ctx.fillRect(-hw + 2, h * 0.36 + stance, 6, h * 0.22);
      ctx.fillRect(hw - 8, h * 0.36 + stance, 6, h * 0.22);
      // Helmet (skull-shaped)
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-9, h * 0.08 + stance, 18, h * 0.22);
      // Visor slit
      ctx.fillStyle = '#111';
      ctx.fillRect(-6, h * 0.16 + stance, 12, 4);
      // Glowing red eyes in visor
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, h * 0.17 + stance, 3, 2);
      ctx.fillRect(2, h * 0.17 + stance, 3, 2);
      // Horns on helmet
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-10, h * 0.06 + stance, 3, 10);
      ctx.fillRect(7, h * 0.06 + stance, 3, 10);
      // Cape
      ctx.fillStyle = 'rgba(127,29,29,0.6)';
      const capeW = 12 + Math.sin(time * 2) * 2;
      ctx.fillRect(-capeW / 2 + 12, h * 0.3 + stance, capeW, h * 0.55);
      // Dark sword
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-hw - 2, h * 0.2 + stance, 3, h * 0.5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-hw - 3, h * 0.18 + stance, 5, 5);
      // Dark aura
      ctx.fillStyle = `rgba(28,25,23,${0.15 + Math.sin(time * 2) * 0.08})`;
      ctx.fillRect(-hw - 4, h * 0.05, w + 8, h + 4);
      break;
    }

    case 'hydra_mob': {
      // Multi-headed serpent with animated heads
      const sway1 = Math.sin(time * 2.5) * 6;
      const sway2 = Math.sin(time * 2.5 + 2) * 6;
      const sway3 = Math.sin(time * 2.5 + 4) * 6;
      // Main body (thick serpentine)
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-14, h * 0.4, 28, h * 0.45);
      ctx.fillStyle = '#166534';
      ctx.fillRect(-10, h * 0.5, 20, h * 0.3);
      // Belly scales (segmented)
      ctx.fillStyle = '#bbf7d0';
      for (let s = 0; s < 4; s++) {
        ctx.fillRect(-6, h * 0.52 + s * h * 0.06, 12, h * 0.04);
      }
      // Back spines
      ctx.fillStyle = '#0f5132';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(-2 + i * 3, h * 0.37 - i * 0.5, 3, 5);
      }
      // Tail (animated)
      const tailW = Math.sin(time * 3) * 4;
      ctx.fillStyle = '#15803d';
      ctx.fillRect(8, h * 0.7, 18, 8);
      ctx.fillRect(22, h * 0.7 + tailW, 10, 6);
      ctx.fillRect(28, h * 0.68 + tailW * 1.5, 6, 4);
      // Tail spike
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(32, h * 0.67 + tailW * 1.5, 4, 2);
      ctx.fillRect(32, h * 0.71 + tailW * 1.5, 4, 2);
      // Three necks and heads
      const necks = [
        { x: -10, sway: sway1, col: '#16a34a', eye: '#fbbf24' },
        { x: 0, sway: sway2, col: '#15803d', eye: '#ef4444' },
        { x: 10, sway: sway3, col: '#14532d', eye: '#a855f7' }
      ];
      for (const neck of necks) {
        // Neck (segmented)
        ctx.fillStyle = '#15803d';
        ctx.fillRect(neck.x - 4 + neck.sway * 0.2, h * 0.25, 8, h * 0.08);
        ctx.fillRect(neck.x - 3 + neck.sway * 0.4, h * 0.15, 7, h * 0.1);
        ctx.fillRect(neck.x - 3 + neck.sway * 0.7, h * 0.08, 6, h * 0.08);
        // Neck scales
        ctx.fillStyle = '#bbf7d0';
        ctx.fillRect(neck.x - 2 + neck.sway * 0.3, h * 0.28, 4, 2);
        ctx.fillRect(neck.x - 2 + neck.sway * 0.5, h * 0.18, 4, 2);
        // Head
        const headX = neck.x + neck.sway;
        const headY = h * 0.0;
        ctx.fillStyle = neck.col;
        ctx.fillRect(headX - 7, headY, 14, 10);
        // Snout
        ctx.fillRect(headX - 9, headY + 3, 3, 6);
        // Jaw (slightly open)
        ctx.fillStyle = '#0f5132';
        ctx.fillRect(headX - 8, headY + 8, 12, 3);
        // Teeth
        ctx.fillStyle = '#fff';
        ctx.fillRect(headX - 7, headY + 7, 2, 3);
        ctx.fillRect(headX - 3, headY + 7, 2, 3);
        ctx.fillRect(headX + 1, headY + 7, 2, 3);
        // Eyes (each head different color)
        ctx.fillStyle = neck.eye;
        ctx.fillRect(headX - 5, headY + 2, 3, 3);
        ctx.fillRect(headX + 2, headY + 2, 3, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(headX - 4, headY + 3, 1, 1);
        ctx.fillRect(headX + 3, headY + 3, 1, 1);
        // Horns
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(headX - 5, headY - 3, 2, 4);
        ctx.fillRect(headX + 3, headY - 3, 2, 4);
        // Nostril smoke
        ctx.fillStyle = 'rgba(156,163,175,0.3)';
        ctx.fillRect(headX - 10 + Math.sin(time * 6 + neck.x) * 2, headY + 2, 2, 2);
      }
      break;
    }

    default: {
      // Boss or unknown - draw as large colored humanoid
      if (e.isBoss && e.milestone === 'BONE GIANT') {
        // === BONE GIANT: massive skeletal colossus ===
        const boneBreath = Math.sin(time * 1.5) * 2;
        const jawClack = Math.sin(time * 3) * 2;
        const boneGlow = Math.sin(time * 2);
        // Skull (larger, more menacing)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-hw * 0.45, 0 + boneBreath, w * 0.45, h * 0.2);
        // Skull cracks
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-hw * 0.1, 0 + boneBreath, w * 0.01, h * 0.1);
        ctx.fillRect(hw * 0.15, h * 0.04 + boneBreath, w * 0.01, h * 0.08);
        // Eye sockets (deeper)
        ctx.fillStyle = '#111';
        ctx.fillRect(-hw * 0.28, h * 0.04 + boneBreath, w * 0.14, h * 0.07);
        ctx.fillRect(hw * 0.04, h * 0.04 + boneBreath, w * 0.14, h * 0.07);
        // Glowing bone-fire eyes (pulsing)
        ctx.fillStyle = `rgba(34,211,238,${0.6 + boneGlow * 0.3})`;
        ctx.fillRect(-hw * 0.24, h * 0.05 + boneBreath, w * 0.1, h * 0.05);
        ctx.fillRect(hw * 0.07, h * 0.05 + boneBreath, w * 0.1, h * 0.05);
        // Eye glow aura
        ctx.fillStyle = `rgba(34,211,238,${0.15 + boneGlow * 0.1})`;
        ctx.fillRect(-hw * 0.32, h * 0.02 + boneBreath, w * 0.18, h * 0.11);
        ctx.fillRect(hw * 0, h * 0.02 + boneBreath, w * 0.18, h * 0.11);
        // Nose hole
        ctx.fillStyle = '#111';
        ctx.fillRect(-hw * 0.06, h * 0.1 + boneBreath, w * 0.06, h * 0.03);
        // Jaw (animated clacking)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-hw * 0.35, h * 0.15 + boneBreath + jawClack, w * 0.35, h * 0.06);
        // Teeth (upper)
        ctx.fillStyle = '#e2e8f0';
        for (let t = 0; t < 6; t++) ctx.fillRect(-hw * 0.32 + t * w * 0.05, h * 0.14 + boneBreath, w * 0.03, h * 0.04);
        // Teeth (lower, on jaw)
        for (let t = 0; t < 5; t++) ctx.fillRect(-hw * 0.28 + t * w * 0.05, h * 0.15 + boneBreath + jawClack, w * 0.03, h * 0.03);
        // Crown of bone spikes
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-hw * 0.35, -h * 0.04 + boneBreath, w * 0.06, h * 0.05);
        ctx.fillRect(-hw * 0.15, -h * 0.06 + boneBreath, w * 0.06, h * 0.07);
        ctx.fillRect(hw * 0.05, -h * 0.05 + boneBreath, w * 0.06, h * 0.06);
        ctx.fillRect(hw * 0.2, -h * 0.03 + boneBreath, w * 0.06, h * 0.04);
        // Spine (segmented)
        ctx.fillStyle = '#e2e8f0';
        for (let s = 0; s < 6; s++) {
          ctx.fillRect(-w * 0.04, h * 0.2 + s * h * 0.055, w * 0.08, h * 0.04);
        }
        // Ribcage (larger, more defined)
        ctx.fillStyle = '#cbd5e1';
        for (let r = 0; r < 5; r++) {
          const ry = h * 0.22 + r * h * 0.055;
          ctx.fillRect(-hw * 0.45, ry, w * 0.42, h * 0.02);
          ctx.fillRect(hw * 0.02, ry, w * 0.42, h * 0.02);
        }
        // Pelvis
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-hw * 0.35, h * 0.52, w * 0.35, h * 0.07);
        // Soul fire in ribcage
        ctx.fillStyle = `rgba(34,211,238,${0.2 + boneGlow * 0.15})`;
        ctx.fillRect(-hw * 0.2, h * 0.25, w * 0.2, h * 0.2);
        // Arms (bone, swinging)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-hw * 0.65, h * 0.2 + armSwing * 0.5, w * 0.09, h * 0.32);
        ctx.fillRect(hw * 0.48, h * 0.2 - armSwing * 0.5, w * 0.09, h * 0.32);
        // Elbow joints
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-hw * 0.67, h * 0.35 + armSwing * 0.5, w * 0.12, h * 0.04);
        ctx.fillRect(hw * 0.46, h * 0.35 - armSwing * 0.5, w * 0.12, h * 0.04);
        // Bone claw hands (larger, sharper)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-hw * 0.7, h * 0.5 + armSwing * 0.5, w * 0.05, h * 0.09);
        ctx.fillRect(-hw * 0.63, h * 0.5 + armSwing * 0.5, w * 0.05, h * 0.09);
        ctx.fillRect(-hw * 0.56, h * 0.5 + armSwing * 0.5, w * 0.05, h * 0.07);
        ctx.fillRect(hw * 0.48, h * 0.5 - armSwing * 0.5, w * 0.05, h * 0.09);
        ctx.fillRect(hw * 0.55, h * 0.5 - armSwing * 0.5, w * 0.05, h * 0.09);
        ctx.fillRect(hw * 0.62, h * 0.5 - armSwing * 0.5, w * 0.05, h * 0.07);
        // Legs (bone, walking)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-hw * 0.22, h * 0.58 + legSwing * 0.3, w * 0.1, h * 0.32);
        ctx.fillRect(hw * 0.06, h * 0.58 - legSwing * 0.3, w * 0.1, h * 0.32);
        // Knee joints
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-hw * 0.24, h * 0.72 + legSwing * 0.3, w * 0.14, h * 0.04);
        ctx.fillRect(hw * 0.04, h * 0.72 - legSwing * 0.3, w * 0.14, h * 0.04);
        // Feet (larger)
        ctx.fillRect(-hw * 0.3, h * 0.9 + legSwing * 0.3, w * 0.18, h * 0.06);
        ctx.fillRect(hw * 0.01, h * 0.9 - legSwing * 0.3, w * 0.18, h * 0.06);
        // Bone storm aura (animated particles)
        ctx.globalAlpha = 0.3 + boneGlow * 0.15;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, h * 0.4, hw * 0.85 + boneGlow * 5, 0, Math.PI * 2);
        ctx.stroke();
        // Floating bone fragments
        ctx.fillStyle = '#cbd5e1';
        const bAngle = time * 1.5;
        ctx.fillRect(Math.cos(bAngle) * hw * 0.9, h * 0.3 + Math.sin(bAngle) * h * 0.2, w * 0.03, h * 0.02);
        ctx.fillRect(Math.cos(bAngle + 2) * hw * 0.8, h * 0.5 + Math.sin(bAngle + 2) * h * 0.15, w * 0.02, h * 0.03);
        ctx.fillRect(Math.cos(bAngle + 4) * hw * 0.7, h * 0.2 + Math.sin(bAngle + 4) * h * 0.25, w * 0.02, h * 0.02);
        ctx.globalAlpha = 1;
      } else if (e.isBoss && e.milestone === 'THE PHANTOM') {
        // === THE PHANTOM: ghostly ethereal boss ===
        const phaseAlpha = e.phased ? 0.2 + Math.sin(time * 8) * 0.1 : 0.7 + Math.sin(time * 2) * 0.15;
        const drift = Math.sin(time * 1.5) * 5;
        const ghostPulse = Math.sin(time * 3);
        ctx.globalAlpha = phaseAlpha;
        // Ethereal body (flowing)
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(-hw * 0.4, h * 0.1 + drift, w * 0.4, h * 0.5);
        // Tattered cloak (wider, more detail)
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(-hw * 0.55, h * 0.05 + drift, w * 0.55, h * 0.65);
        // Cloak inner folds
        ctx.fillStyle = '#312e81';
        ctx.fillRect(-hw * 0.2, h * 0.15 + drift, w * 0.08, h * 0.4);
        ctx.fillRect(hw * 0.05, h * 0.2 + drift, w * 0.06, h * 0.3);
        // Ragged bottom (more tatters, flowing)
        for (let i = -6; i < 6; i++) {
          const tatterLen = h * 0.08 + Math.sin(i * 1.7) * h * 0.04;
          ctx.fillRect(i * w * 0.045, h * 0.6 + Math.sin(time * 3 + i * 0.8) * h * 0.05 + drift, w * 0.045, tatterLen);
        }
        // Hood (deep, menacing)
        ctx.fillStyle = '#312e81';
        ctx.fillRect(-hw * 0.4, 0 + drift, w * 0.4, h * 0.18);
        ctx.fillRect(-hw * 0.35, -h * 0.03 + drift, w * 0.35, h * 0.05);
        // Hood shadow (deeper void inside)
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-hw * 0.3, h * 0.04 + drift, w * 0.3, h * 0.1);
        // Glowing eyes (piercing violet, pulsing)
        ctx.globalAlpha = 0.9 + ghostPulse * 0.1;
        ctx.fillStyle = '#c4b5fd';
        ctx.fillRect(-hw * 0.18, h * 0.06 + drift, w * 0.09, h * 0.05);
        ctx.fillRect(hw * 0.01, h * 0.06 + drift, w * 0.09, h * 0.05);
        // Eye glow aura (larger)
        ctx.fillStyle = `rgba(196,181,253,${0.3 + ghostPulse * 0.2})`;
        ctx.fillRect(-hw * 0.25, h * 0.03 + drift, w * 0.15, h * 0.1);
        ctx.fillRect(hw * -0.05, h * 0.03 + drift, w * 0.15, h * 0.1);
        // Ghostly hands reaching out
        ctx.globalAlpha = phaseAlpha * 0.8;
        ctx.fillStyle = '#818cf8';
        ctx.fillRect(-hw * 0.6, h * 0.3 + drift + Math.sin(time * 2) * 5, w * 0.08, h * 0.15);
        ctx.fillRect(hw * 0.45, h * 0.25 + drift - Math.sin(time * 2) * 5, w * 0.08, h * 0.15);
        // Spectral fingers
        ctx.fillStyle = '#a5b4fc';
        ctx.fillRect(-hw * 0.63, h * 0.44 + drift + Math.sin(time * 2) * 5, w * 0.03, h * 0.06);
        ctx.fillRect(-hw * 0.58, h * 0.44 + drift + Math.sin(time * 2) * 5, w * 0.03, h * 0.06);
        ctx.fillRect(hw * 0.48, h * 0.39 + drift - Math.sin(time * 2) * 5, w * 0.03, h * 0.06);
        ctx.fillRect(hw * 0.53, h * 0.39 + drift - Math.sin(time * 2) * 5, w * 0.03, h * 0.06);
        // Ghostly tendrils (more, longer)
        ctx.globalAlpha = phaseAlpha * 0.5;
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 3;
        for (let t = 0; t < 5; t++) {
          ctx.beginPath();
          ctx.moveTo(-hw * 0.35 + t * w * 0.1, h * 0.6 + drift);
          ctx.quadraticCurveTo(
            -hw * 0.25 + t * w * 0.1 + Math.sin(time * 2 + t * 0.7) * 20,
            h * 0.75 + drift,
            -hw * 0.15 + t * w * 0.1, h * 0.9 + drift
          );
          ctx.stroke();
        }
        // Soul orb in center (pulsing)
        ctx.globalAlpha = 0.4 + ghostPulse * 0.2;
        ctx.fillStyle = '#c4b5fd';
        ctx.beginPath();
        ctx.arc(0, h * 0.35 + drift, w * 0.06 + ghostPulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Phase indicator
        if (e.phased) {
          ctx.strokeStyle = 'rgba(196,181,253,0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, h * 0.35 + drift, hw * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (e.isBoss && e.milestone === 'hydra') {
        // === HYDRA HEAD: massive serpentine dragon head on long neck ===
        const headIdx = e.headIndex || 0;
        const bob = Math.sin(time * 2 + headIdx * 2) * 8;
        const sway = Math.sin(time * 1.5 + headIdx * 1.5) * 6;
        const jawOpen = Math.abs(Math.sin(time * 3 + headIdx)) * h * 0.04;
        const breathGlow = Math.sin(time * 4 + headIdx * 2);
        const headColors = ['#15803d', '#166534', '#14532d'];
        const scaleColors = ['#bbf7d0', '#a7f3d0', '#86efac'];
        const baseColor = headColors[headIdx] || e.color;
        const scaleColor = scaleColors[headIdx] || '#bbf7d0';
        
        // Neck (thick, segmented with scales)
        const neckSegments = 6;
        for (let s = 0; s < neckSegments; s++) {
          const segY = h * 0.45 + s * h * 0.09 + bob * (1 - s / neckSegments);
          const segX = sway * (1 - s / neckSegments);
          const segW = 14 + s * 1;
          ctx.fillStyle = baseColor;
          ctx.fillRect(segX - segW / 2, segY, segW, h * 0.1 + 2);
          // Scale pattern on neck
          ctx.fillStyle = scaleColor;
          ctx.fillRect(segX - segW / 2 + 2, segY + 2, segW - 4, 2);
        }
        // Back spines along neck
        ctx.fillStyle = '#0f5132';
        for (let sp = 0; sp < 5; sp++) {
          const spY = h * 0.43 + sp * h * 0.09 + bob * (1 - sp / 5);
          const spX = sway * (1 - sp / 5);
          ctx.fillRect(spX - 2, spY - 3, 4, 6);
        }
        
        // Head (large, dragon-like)
        const headX = sway;
        const headY = bob;
        // Skull shape
        ctx.fillStyle = baseColor;
        ctx.fillRect(headX - hw * 0.55, h * 0.05 + headY, w * 0.55, h * 0.35);
        // Upper jaw
        ctx.fillStyle = '#166534';
        ctx.fillRect(headX - hw * 0.65, h * 0.15 + headY, w * 0.2, h * 0.18);
        // Lower jaw (animated)
        ctx.fillStyle = '#14532d';
        ctx.fillRect(headX - hw * 0.6, h * 0.3 + headY + jawOpen, w * 0.55, h * 0.08);
        // Mouth interior
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(headX - hw * 0.55, h * 0.28 + headY, w * 0.45, h * 0.05 + jawOpen);
        // Teeth (upper)
        ctx.fillStyle = '#fff';
        for (let t = 0; t < 6; t++) {
          ctx.fillRect(headX - hw * 0.5 + t * w * 0.07, h * 0.27 + headY, w * 0.035, h * 0.06);
        }
        // Teeth (lower)
        for (let t = 0; t < 5; t++) {
          ctx.fillRect(headX - hw * 0.48 + t * w * 0.08, h * 0.3 + headY + jawOpen - h * 0.04, w * 0.035, h * 0.05);
        }
        // Forked tongue (flickering in and out)
        if (breathGlow > 0.3) {
          ctx.fillStyle = '#dc2626';
          const tongueLen = w * 0.12 * breathGlow;
          ctx.fillRect(headX - hw * 0.68, h * 0.28 + headY + jawOpen * 0.5, tongueLen, 2);
          ctx.fillRect(headX - hw * 0.68 - tongueLen * 0.3, h * 0.27 + headY + jawOpen * 0.5, tongueLen * 0.4, 1);
          ctx.fillRect(headX - hw * 0.68 - tongueLen * 0.3, h * 0.3 + headY + jawOpen * 0.5, tongueLen * 0.4, 1);
        }
        // Brow ridge
        ctx.fillStyle = '#0f5132';
        ctx.fillRect(headX - hw * 0.5, h * 0.04 + headY, w * 0.5, h * 0.04);
        // Eyes (reptilian, slitted, each head slightly different)
        const eyeColors = ['#fbbf24', '#ef4444', '#a855f7'];
        ctx.fillStyle = eyeColors[headIdx] || '#fbbf24';
        ctx.fillRect(headX - hw * 0.35, h * 0.08 + headY, w * 0.12, h * 0.1);
        ctx.fillRect(headX + hw * 0.02, h * 0.08 + headY, w * 0.12, h * 0.1);
        // Slit pupils
        ctx.fillStyle = '#111';
        ctx.fillRect(headX - hw * 0.3, h * 0.09 + headY, w * 0.03, h * 0.08);
        ctx.fillRect(headX + hw * 0.07, h * 0.09 + headY, w * 0.03, h * 0.08);
        // Eye glow
        ctx.fillStyle = `rgba(${headIdx === 0 ? '251,191,36' : headIdx === 1 ? '239,68,68' : '168,85,247'},0.25)`;
        ctx.fillRect(headX - hw * 0.38, h * 0.06 + headY, w * 0.16, h * 0.14);
        ctx.fillRect(headX - hw * 0.02, h * 0.06 + headY, w * 0.16, h * 0.14);
        // Nostrils (with smoke)
        ctx.fillStyle = '#111';
        ctx.fillRect(headX - hw * 0.6, h * 0.2 + headY, w * 0.04, h * 0.03);
        ctx.fillRect(headX - hw * 0.52, h * 0.2 + headY, w * 0.04, h * 0.03);
        // Smoke wisps
        ctx.fillStyle = 'rgba(156,163,175,0.3)';
        ctx.fillRect(headX - hw * 0.65 + Math.sin(time * 5) * 3, h * 0.17 + headY, 4, 3);
        ctx.fillRect(headX - hw * 0.55 + Math.cos(time * 4) * 2, h * 0.16 + headY, 3, 3);
        // Horns (large, curved, each head different)
        const hornColor = ['#854d0e', '#78350f', '#92400e'][headIdx];
        ctx.fillStyle = hornColor;
        ctx.fillRect(headX - hw * 0.45, -h * 0.08 + headY, w * 0.07, h * 0.14);
        ctx.fillRect(headX - hw * 0.48, -h * 0.12 + headY, w * 0.05, h * 0.06);
        ctx.fillRect(headX + hw * 0.12, -h * 0.08 + headY, w * 0.07, h * 0.14);
        ctx.fillRect(headX + hw * 0.15, -h * 0.12 + headY, w * 0.05, h * 0.06);
        // Crown crest (center head only)
        if (headIdx === 1) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(headX - hw * 0.15, -h * 0.1 + headY, w * 0.02, h * 0.08);
          ctx.fillRect(headX - hw * 0.08, -h * 0.12 + headY, w * 0.02, h * 0.1);
          ctx.fillRect(headX - hw * 0.01, -h * 0.1 + headY, w * 0.02, h * 0.08);
        }
        // Scale detail on head
        ctx.fillStyle = scaleColor;
        ctx.fillRect(headX - hw * 0.3, h * 0.22 + headY, w * 0.3, h * 0.03);
        ctx.fillRect(headX - hw * 0.25, h * 0.25 + headY, w * 0.25, h * 0.02);
        // Poison/fire drip from mouth (each head different element)
        if (breathGlow > 0) {
          const dripColors = ['#4ade80', '#ef4444', '#a855f7'];
          ctx.fillStyle = dripColors[headIdx];
          ctx.globalAlpha = 0.6;
          ctx.fillRect(headX - hw * 0.45, h * 0.36 + headY + jawOpen, 3, 4 + breathGlow * 4);
          ctx.fillRect(headX - hw * 0.2, h * 0.36 + headY + jawOpen, 2, 3 + breathGlow * 3);
          ctx.globalAlpha = 1;
        }
        // Head label
        const headLabel = ['LEFT', 'CENTER', 'RIGHT'][headIdx];
        ctx.fillStyle = eyeColors[headIdx];
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(headLabel, headX, -14 + headY);
      } else if (e.isBoss && e.milestone === 'DREAD AMALGAM') {
        // === DREAD AMALGAM: combination of Bone Giant + Ghost + Hydra ===
        const phaseAlpha = e.phased ? 0.2 + Math.sin(time * 8) * 0.1 : 0.85;
        const dreadPulse = Math.sin(time * 2);
        const driftY = Math.sin(time * 1.5) * 3;
        ctx.globalAlpha = phaseAlpha;
        // Ghostly body (swirling)
        ctx.fillStyle = 'rgba(99,102,241,0.5)';
        ctx.fillRect(-hw * 0.55, h * 0.05 + driftY, w * 0.55, h * 0.7);
        // Dark energy veins
        ctx.fillStyle = 'rgba(124,58,237,0.4)';
        ctx.fillRect(-hw * 0.3, h * 0.1 + driftY, w * 0.02, h * 0.5);
        ctx.fillRect(hw * 0.1, h * 0.15 + driftY, w * 0.02, h * 0.4);
        ctx.fillRect(-hw * 0.1, h * 0.2 + driftY, w * 0.02, h * 0.35);
        // Ghostly tattered edges (flowing, chaotic)
        for (let i = -6; i < 6; i++) {
          const tLen = h * 0.08 + Math.sin(i * 2.1) * h * 0.04;
          ctx.fillRect(i * w * 0.045, h * 0.7 + Math.sin(time * 3 + i * 0.7) * h * 0.04 + driftY, w * 0.045, tLen);
        }
        // Bone skeleton visible inside
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-w * 0.035, h * 0.15 + driftY, w * 0.07, h * 0.4);
        // Ribs (more, glowing)
        for (let r = 0; r < 4; r++) {
          ctx.fillRect(-hw * 0.3, h * 0.2 + r * h * 0.055 + driftY, w * 0.3, h * 0.015);
        }
        // Skull head (larger, cracked)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-hw * 0.3, 0 + driftY, w * 0.3, h * 0.14);
        // Skull cracks
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-hw * 0.1, 0 + driftY, w * 0.01, h * 0.08);
        ctx.fillRect(hw * 0.08, h * 0.03 + driftY, w * 0.01, h * 0.06);
        // Hydra-like multiple eyes (3 pairs, animated glow)
        ctx.globalAlpha = 0.8 + dreadPulse * 0.2;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-hw * 0.35, h * 0.03 + driftY, w * 0.07, h * 0.05);
        ctx.fillRect(-hw * 0.15, h * 0.01 + driftY, w * 0.07, h * 0.05);
        ctx.fillRect(hw * 0.03, h * 0.03 + driftY, w * 0.07, h * 0.05);
        // Eye glow trails
        ctx.fillStyle = `rgba(239,68,68,${0.2 + dreadPulse * 0.15})`;
        ctx.fillRect(-hw * 0.38, h * 0.01 + driftY, w * 0.1, h * 0.09);
        ctx.fillRect(-hw * 0.18, -h * 0.01 + driftY, w * 0.1, h * 0.09);
        ctx.fillRect(hw * 0, h * 0.01 + driftY, w * 0.1, h * 0.09);
        ctx.globalAlpha = phaseAlpha;
        // Crown of horns (3 pairs like hydra, sharper)
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-hw * 0.4, -h * 0.06 + driftY, w * 0.05, h * 0.09);
        ctx.fillRect(-hw * 0.12, -h * 0.08 + driftY, w * 0.05, h * 0.11);
        ctx.fillRect(hw * 0.15, -h * 0.06 + driftY, w * 0.05, h * 0.09);
        // Horn tips (glowing)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-hw * 0.39, -h * 0.06 + driftY, w * 0.03, h * 0.03);
        ctx.fillRect(-hw * 0.11, -h * 0.08 + driftY, w * 0.03, h * 0.03);
        ctx.fillRect(hw * 0.16, -h * 0.06 + driftY, w * 0.03, h * 0.03);
        // Jaw (animated)
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-hw * 0.25, h * 0.12 + driftY + Math.sin(time * 4) * 2, w * 0.25, h * 0.04);
        // Arms (bone+ghost, swinging)
        ctx.fillStyle = '#818cf8';
        ctx.fillRect(-hw * 0.65, h * 0.2 + driftY + armSwing * 0.4, w * 0.09, h * 0.35);
        ctx.fillRect(hw * 0.48, h * 0.2 + driftY - armSwing * 0.4, w * 0.09, h * 0.35);
        // Bone claws (sharper)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-hw * 0.7, h * 0.53 + driftY + armSwing * 0.4, w * 0.04, h * 0.07);
        ctx.fillRect(-hw * 0.64, h * 0.53 + driftY + armSwing * 0.4, w * 0.04, h * 0.07);
        ctx.fillRect(-hw * 0.58, h * 0.53 + driftY + armSwing * 0.4, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.48, h * 0.53 + driftY - armSwing * 0.4, w * 0.04, h * 0.07);
        ctx.fillRect(hw * 0.54, h * 0.53 + driftY - armSwing * 0.4, w * 0.04, h * 0.07);
        ctx.fillRect(hw * 0.6, h * 0.53 + driftY - armSwing * 0.4, w * 0.04, h * 0.06);
        ctx.globalAlpha = 1;
        // Aura (larger, dual ring)
        const auraPulse = 0.3 + dreadPulse * 0.15;
        ctx.strokeStyle = `rgba(124,58,237,${auraPulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, h * 0.4 + driftY, hw * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(239,68,68,${auraPulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, h * 0.4 + driftY, hw * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        // Dark energy particles
        ctx.fillStyle = 'rgba(124,58,237,0.5)';
        const dAngle = time * 2;
        ctx.fillRect(Math.cos(dAngle) * hw * 0.8, h * 0.35 + driftY + Math.sin(dAngle) * h * 0.2, w * 0.02, h * 0.02);
        ctx.fillRect(Math.cos(dAngle + 2) * hw * 0.7, h * 0.4 + driftY + Math.sin(dAngle + 2) * h * 0.15, w * 0.02, h * 0.02);
        if (e.phased) {
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = 'rgba(196,181,253,0.5)';
          ctx.beginPath();
          ctx.arc(0, h * 0.35 + driftY, hw * 0.85, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (e.isBoss && e.type === 'ANCIENT GOLEM') {
        // === ANCIENT GOLEM: massive stone construct with glowing runes ===
        // Head (boulder)
        ctx.fillStyle = '#78716c';
        ctx.fillRect(-hw * 0.45, 0, w * 0.45, h * 0.22);
        // Rune cracks on head
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.2, h * 0.02); ctx.lineTo(-hw * 0.1, h * 0.1);
        ctx.moveTo(hw * 0.05, h * 0.03); ctx.lineTo(hw * 0.15, h * 0.12);
        ctx.stroke();
        // Glowing rune eyes
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(-hw * 0.3, h * 0.06, w * 0.1, h * 0.06);
        ctx.fillRect(hw * 0.05, h * 0.06, w * 0.1, h * 0.06);
        // Eye glow
        ctx.fillStyle = 'rgba(34,211,238,0.3)';
        ctx.fillRect(-hw * 0.35, h * 0.04, w * 0.14, h * 0.1);
        ctx.fillRect(hw * 0.01, h * 0.04, w * 0.14, h * 0.1);
        // Massive stone body
        ctx.fillStyle = '#57534e';
        ctx.fillRect(-hw * 0.55, h * 0.22, w * 0.55, h * 0.38);
        // Rock texture / cracks
        ctx.fillStyle = '#44403c';
        ctx.fillRect(-hw * 0.4, h * 0.3, w * 0.08, h * 0.15);
        ctx.fillRect(hw * 0.1, h * 0.26, w * 0.06, h * 0.2);
        ctx.fillRect(-hw * 0.15, h * 0.4, w * 0.15, h * 0.05);
        // Rune symbols on body
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(-hw * 0.2, h * 0.28, w * 0.18, h * 0.12);
        ctx.beginPath();
        ctx.moveTo(-hw * 0.11, h * 0.28); ctx.lineTo(-hw * 0.11, h * 0.4);
        ctx.moveTo(-hw * 0.2, h * 0.34); ctx.lineTo(-hw * 0.02, h * 0.34);
        ctx.stroke();
        // Moss patches
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(hw * 0.15, h * 0.24, w * 0.08, h * 0.03);
        ctx.fillRect(-hw * 0.45, h * 0.48, w * 0.1, h * 0.02);
        ctx.fillRect(hw * 0.25, h * 0.42, w * 0.06, h * 0.03);
        // Massive arms
        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(-hw * 0.7, h * 0.24, w * 0.12, h * 0.32);
        ctx.fillRect(hw * 0.45, h * 0.24, w * 0.12, h * 0.32);
        // Fists (huge boulders)
        ctx.fillStyle = '#78716c';
        ctx.fillRect(-hw * 0.75, h * 0.54, w * 0.16, h * 0.12);
        ctx.fillRect(hw * 0.42, h * 0.54, w * 0.16, h * 0.12);
        // Legs (stone pillars)
        ctx.fillStyle = '#57534e';
        ctx.fillRect(-hw * 0.35, h * 0.6, w * 0.18, h * 0.3);
        ctx.fillRect(hw * 0.05, h * 0.6, w * 0.18, h * 0.3);
        // Feet
        ctx.fillStyle = '#44403c';
        ctx.fillRect(-hw * 0.4, h * 0.88, w * 0.22, h * 0.08);
        ctx.fillRect(hw * 0.02, h * 0.88, w * 0.22, h * 0.08);
        // Rune aura pulse
        const runePulse = 0.2 + Math.sin(time * 1.5) * 0.15;
        ctx.strokeStyle = `rgba(34,211,238,${runePulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, h * 0.4, hw * 0.65, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.isBoss && e.type === 'FLAME TITAN') {
        // === FLAME TITAN: towering fire elemental ===
        // Flaming head
        const flicker = Math.sin(time * 8) * 3;
        // Fire crown (animated flames on top)
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-hw * 0.2, -h * 0.08 + flicker, w * 0.06, h * 0.1);
        ctx.fillRect(hw * 0.05, -h * 0.06 - flicker, w * 0.05, h * 0.08);
        ctx.fillRect(-hw * 0.08, -h * 0.1 + flicker * 0.5, w * 0.08, h * 0.12);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-hw * 0.3, -h * 0.05 - flicker, w * 0.07, h * 0.08);
        ctx.fillRect(hw * 0.12, -h * 0.07 + flicker, w * 0.06, h * 0.09);
        // Head (molten rock)
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-hw * 0.4, 0, w * 0.4, h * 0.18);
        // Lava cracks in face
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-hw * 0.3, h * 0.04, w * 0.04, h * 0.08);
        ctx.fillRect(hw * 0.08, h * 0.06, w * 0.03, h * 0.06);
        ctx.fillRect(-hw * 0.1, h * 0.12, w * 0.12, h * 0.03);
        // Blazing eyes
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-hw * 0.3, h * 0.05, w * 0.12, h * 0.06);
        ctx.fillRect(hw * 0.04, h * 0.05, w * 0.12, h * 0.06);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-hw * 0.26, h * 0.06, w * 0.06, h * 0.04);
        ctx.fillRect(hw * 0.08, h * 0.06, w * 0.06, h * 0.04);
        // Molten body
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-hw * 0.5, h * 0.18, w * 0.5, h * 0.38);
        // Lava veins on body
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-hw * 0.35, h * 0.22, w * 0.03, h * 0.15);
        ctx.fillRect(hw * 0.15, h * 0.28, w * 0.03, h * 0.18);
        ctx.fillRect(-hw * 0.1, h * 0.35, w * 0.2, h * 0.03);
        // Molten core (visible through body)
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-hw * 0.15, h * 0.3, w * 0.15, h * 0.1);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-hw * 0.08, h * 0.33, w * 0.06, h * 0.04);
        // Flame arms
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-hw * 0.7, h * 0.22, w * 0.14, h * 0.28);
        ctx.fillRect(hw * 0.4, h * 0.22, w * 0.14, h * 0.28);
        // Flame fists
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-hw * 0.75, h * 0.48, w * 0.16, h * 0.1);
        ctx.fillRect(hw * 0.38, h * 0.48, w * 0.16, h * 0.1);
        // Fire dripping from fists
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-hw * 0.7, h * 0.56 + Math.sin(time * 4) * 3, w * 0.04, h * 0.05);
        ctx.fillRect(hw * 0.45, h * 0.56 - Math.sin(time * 5) * 2, w * 0.04, h * 0.05);
        // Legs (lava pillars)
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-hw * 0.3, h * 0.56, w * 0.16, h * 0.32);
        ctx.fillRect(hw * 0.05, h * 0.56, w * 0.16, h * 0.32);
        // Lava puddle at feet
        ctx.fillStyle = 'rgba(249,115,22,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.92, hw * 0.6, h * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        // Heat shimmer aura
        const heatPulse = 0.15 + Math.sin(time * 3) * 0.1;
        ctx.strokeStyle = `rgba(251,191,36,${heatPulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, h * 0.4, hw * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.isBoss && e.type === 'THUNDER LORD') {
        // === THUNDER LORD: storm-wielding warrior king ===
        const spark = Math.sin(time * 12) * 2;
        // Lightning crown
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-hw * 0.25, -h * 0.08, w * 0.06, h * 0.1);
        ctx.fillRect(-hw * 0.05, -h * 0.12, w * 0.08, h * 0.14);
        ctx.fillRect(hw * 0.1, -h * 0.08, w * 0.06, h * 0.1);
        // Crown base
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-hw * 0.3, -h * 0.02, w * 0.3, h * 0.04);
        // Helmet
        ctx.fillStyle = '#374151';
        ctx.fillRect(-hw * 0.35, h * 0.02, w * 0.35, h * 0.16);
        // Face guard / visor
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-hw * 0.3, h * 0.08, w * 0.3, h * 0.04);
        // Electric eyes
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-hw * 0.25, h * 0.05, w * 0.08, h * 0.05);
        ctx.fillRect(hw * 0.02, h * 0.05, w * 0.08, h * 0.05);
        // Eye sparks
        ctx.fillStyle = '#fff';
        ctx.fillRect(-hw * 0.22 + spark, h * 0.06, w * 0.04, h * 0.03);
        ctx.fillRect(hw * 0.05 - spark, h * 0.06, w * 0.04, h * 0.03);
        // Armored body
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-hw * 0.45, h * 0.18, w * 0.45, h * 0.32);
        // Chest lightning emblem
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.05, h * 0.22);
        ctx.lineTo(hw * 0.05, h * 0.28);
        ctx.lineTo(-hw * 0.02, h * 0.32);
        ctx.lineTo(hw * 0.08, h * 0.38);
        ctx.lineTo(hw * 0.02, h * 0.34);
        ctx.lineTo(hw * 0.12, h * 0.28);
        ctx.closePath();
        ctx.fill();
        // Pauldrons (spiked)
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(-hw * 0.6, h * 0.16, w * 0.12, h * 0.1);
        ctx.fillRect(hw * 0.32, h * 0.16, w * 0.12, h * 0.1);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-hw * 0.62, h * 0.14, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.42, h * 0.14, w * 0.04, h * 0.06);
        // Arms
        ctx.fillStyle = '#374151';
        ctx.fillRect(-hw * 0.6, h * 0.26, w * 0.1, h * 0.24);
        ctx.fillRect(hw * 0.35, h * 0.26, w * 0.1, h * 0.24);
        // Gauntlets
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-hw * 0.65, h * 0.48, w * 0.14, h * 0.08);
        ctx.fillRect(hw * 0.32, h * 0.48, w * 0.14, h * 0.08);
        // Storm hammer in right hand
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(hw * 0.5, h * 0.2, w * 0.04, h * 0.35);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(hw * 0.42, h * 0.12, w * 0.14, h * 0.1);
        // Legs (armored)
        ctx.fillStyle = '#374151';
        ctx.fillRect(-hw * 0.3, h * 0.5, w * 0.16, h * 0.35);
        ctx.fillRect(hw * 0.02, h * 0.5, w * 0.16, h * 0.35);
        // Boots
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-hw * 0.35, h * 0.85, w * 0.2, h * 0.1);
        ctx.fillRect(hw * -0.02, h * 0.85, w * 0.2, h * 0.1);
        // Lightning bolts arcing around body
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6 + Math.sin(time * 6) * 0.3;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.5, h * 0.15 + spark);
        ctx.lineTo(-hw * 0.3, h * 0.25 - spark);
        ctx.lineTo(-hw * 0.45, h * 0.35 + spark);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hw * 0.35, h * 0.2 - spark);
        ctx.lineTo(hw * 0.2, h * 0.3 + spark);
        ctx.lineTo(hw * 0.4, h * 0.4 - spark);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.isBoss && e.type === 'CHAOS DEMON') {
        // === CHAOS DEMON: multi-armed fiend with wings ===
        const wingBeat = Math.sin(time * 3) * 8;
        const pulse = Math.sin(time * 4);
        // Demon wings
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-hw * 0.85, h * 0.1 + wingBeat, w * 0.2, h * 0.3);
        ctx.fillRect(hw * 0.45, h * 0.1 - wingBeat, w * 0.2, h * 0.3);
        // Wing membrane
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-hw * 0.75, h * 0.15 + wingBeat, w * 0.12, h * 0.22);
        ctx.fillRect(hw * 0.5, h * 0.15 - wingBeat, w * 0.12, h * 0.22);
        // Wing claws
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-hw * 0.88, h * 0.08 + wingBeat, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.62, h * 0.08 - wingBeat, w * 0.04, h * 0.06);
        // Horned head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-hw * 0.35, h * 0.02, w * 0.35, h * 0.16);
        // Massive horns (curving)
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-hw * 0.5, -h * 0.06, w * 0.06, h * 0.12);
        ctx.fillRect(-hw * 0.55, -h * 0.08, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.25, -h * 0.06, w * 0.06, h * 0.12);
        ctx.fillRect(hw * 0.32, -h * 0.08, w * 0.04, h * 0.06);
        // Face
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-hw * 0.25, h * 0.04, w * 0.25, h * 0.1);
        // Burning eyes (3 eyes!)
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-hw * 0.22, h * 0.05, w * 0.06, h * 0.04);
        ctx.fillRect(-hw * 0.04, h * 0.04, w * 0.05, h * 0.03);
        ctx.fillRect(hw * 0.06, h * 0.05, w * 0.06, h * 0.04);
        // Snarl / fangs
        ctx.fillStyle = '#111';
        ctx.fillRect(-hw * 0.2, h * 0.12, w * 0.2, h * 0.03);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-hw * 0.16, h * 0.12, w * 0.03, h * 0.04);
        ctx.fillRect(-hw * 0.06, h * 0.12, w * 0.03, h * 0.04);
        ctx.fillRect(hw * 0.04, h * 0.12, w * 0.03, h * 0.04);
        // Muscular body
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-hw * 0.4, h * 0.18, w * 0.4, h * 0.35);
        // Chaos rune on chest
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, h * 0.32, w * 0.08, 0, Math.PI * 2);
        ctx.moveTo(-w * 0.08, h * 0.32);
        ctx.lineTo(w * 0.08, h * 0.32);
        ctx.moveTo(0, h * 0.24);
        ctx.lineTo(0, h * 0.4);
        ctx.stroke();
        // Four arms (2 upper, 2 lower)
        ctx.fillStyle = '#b91c1c';
        // Upper arms
        ctx.fillRect(-hw * 0.6, h * 0.18, w * 0.1, h * 0.2);
        ctx.fillRect(hw * 0.35, h * 0.18, w * 0.1, h * 0.2);
        // Lower arms
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-hw * 0.55, h * 0.34, w * 0.08, h * 0.18);
        ctx.fillRect(hw * 0.32, h * 0.34, w * 0.08, h * 0.18);
        // Clawed hands
        ctx.fillStyle = '#111';
        ctx.fillRect(-hw * 0.65, h * 0.36, w * 0.04, h * 0.06);
        ctx.fillRect(-hw * 0.6, h * 0.36, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.42, h * 0.36, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.47, h * 0.36, w * 0.04, h * 0.06);
        ctx.fillRect(-hw * 0.58, h * 0.5, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.38, h * 0.5, w * 0.04, h * 0.06);
        // Tail
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(hw * 0.1, h * 0.5, w * 0.04, h * 0.12);
        ctx.fillRect(hw * 0.18, h * 0.48, w * 0.04, h * 0.1);
        ctx.fillRect(hw * 0.25, h * 0.44, w * 0.04, h * 0.08);
        // Tail spike
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hw * 0.3, h * 0.42, w * 0.06, h * 0.06);
        // Legs
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-hw * 0.25, h * 0.53, w * 0.14, h * 0.32);
        ctx.fillRect(hw * 0.02, h * 0.53, w * 0.14, h * 0.32);
        // Hooved feet
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-hw * 0.3, h * 0.85, w * 0.18, h * 0.08);
        ctx.fillRect(hw * -0.02, h * 0.85, w * 0.18, h * 0.08);
        // Chaos energy aura
        ctx.globalAlpha = 0.3 + pulse * 0.15;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, h * 0.35, hw * 0.7 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.isBoss && e.type === 'ETERNAL DESTROYER') {
        // === ETERNAL DESTROYER: cosmic void entity ===
        const voidPulse = Math.sin(time * 2);
        const starTwinkle = Math.sin(time * 8);
        // Void body (dark with stars inside)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-hw * 0.5, h * 0.05, w * 0.5, h * 0.65);
        // Star particles inside body
        ctx.fillStyle = '#fff';
        ctx.fillRect(-hw * 0.3 + Math.sin(time) * 5, h * 0.2, 2, 2);
        ctx.fillRect(hw * 0.1 + Math.cos(time * 1.3) * 4, h * 0.35, 2, 2);
        ctx.fillRect(-hw * 0.1 + Math.sin(time * 0.7) * 3, h * 0.5, 2, 2);
        ctx.fillRect(hw * 0.02 + Math.cos(time * 1.5) * 4, h * 0.15, 1, 1);
        ctx.fillRect(-hw * 0.2 + Math.sin(time * 2) * 3, h * 0.45, 1, 1);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(hw * 0.15 + Math.sin(time * 0.9) * 3, h * 0.28, 2, 2);
        ctx.fillRect(-hw * 0.35 + Math.cos(time * 1.1) * 4, h * 0.55, 2, 2);
        // Skull / face (cosmic helm)
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-hw * 0.4, 0, w * 0.4, h * 0.18);
        // Crown of cosmic thorns
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(-hw * 0.35, -h * 0.06, w * 0.04, h * 0.08);
        ctx.fillRect(-hw * 0.15, -h * 0.08, w * 0.05, h * 0.1);
        ctx.fillRect(hw * 0.05, -h * 0.06, w * 0.04, h * 0.08);
        ctx.fillRect(hw * 0.18, -h * 0.05, w * 0.04, h * 0.07);
        // Void eyes - burning purple
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-hw * 0.3, h * 0.04, w * 0.12, h * 0.06);
        ctx.fillRect(hw * 0.02, h * 0.04, w * 0.12, h * 0.06);
        ctx.fillStyle = '#e9d5ff';
        ctx.fillRect(-hw * 0.26, h * 0.05, w * 0.06, h * 0.04);
        ctx.fillRect(hw * 0.06, h * 0.05, w * 0.06, h * 0.04);
        // Mouth - void rift
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(-hw * 0.15, h * 0.12, w * 0.15, h * 0.04);
        // Cosmic energy arms
        ctx.fillStyle = '#312e81';
        ctx.fillRect(-hw * 0.65, h * 0.15, w * 0.1, h * 0.35);
        ctx.fillRect(hw * 0.4, h * 0.15, w * 0.1, h * 0.35);
        // Void energy hands
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(-hw * 0.7, h * 0.48, w * 0.14, h * 0.1);
        ctx.fillRect(hw * 0.38, h * 0.48, w * 0.14, h * 0.1);
        // Flowing void robe bottom
        ctx.fillStyle = '#1e1b4b';
        for (let i = -5; i < 5; i++) {
          ctx.fillRect(i * w * 0.05, h * 0.65 + Math.sin(time * 2 + i * 0.8) * h * 0.03, w * 0.05, h * 0.15);
        }
        // Meteor orbiting
        const mAngle = time * 2;
        const mx = Math.cos(mAngle) * hw * 0.7;
        const my = h * 0.35 + Math.sin(mAngle) * h * 0.25;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
        // Cosmic aura
        ctx.globalAlpha = 0.25 + voidPulse * 0.15;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, h * 0.35, hw * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.isBoss && e.type === 'COSMIC OVERLORD') {
        // === COSMIC OVERLORD: ultimate galactic being ===
        const cosmicPulse = Math.sin(time * 1.5);
        const vortexAngle = time * 1.2;
        const cosmicHover = Math.sin(time * 1) * 6;
        // Outer cosmic aura (dark space distortion)
        ctx.fillStyle = `rgba(30,27,75,${0.15 + cosmicPulse * 0.08})`;
        ctx.beginPath();
        ctx.arc(0, h * 0.4 + cosmicHover, hw * 0.95, 0, Math.PI * 2);
        ctx.fill();
        // Massive cosmic body
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-hw * 0.55, h * 0.08 + cosmicHover, w * 0.55, h * 0.6);
        // Nebula swirl inside body (multiple layers)
        ctx.fillStyle = 'rgba(139,92,246,0.3)';
        ctx.beginPath();
        ctx.arc(Math.cos(vortexAngle) * 10, h * 0.35 + cosmicHover, w * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(236,72,153,0.25)';
        ctx.beginPath();
        ctx.arc(Math.sin(vortexAngle) * 8, h * 0.28 + cosmicHover, w * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(59,130,246,0.2)';
        ctx.beginPath();
        ctx.arc(Math.cos(vortexAngle + 1) * 6, h * 0.42 + cosmicHover, w * 0.06, 0, Math.PI * 2);
        ctx.fill();
        // Stars scattered in body (twinkling)
        ctx.fillStyle = '#fff';
        for (let s = 0; s < 12; s++) {
          const sx = Math.sin(time * 0.5 + s * 1.2) * hw * 0.4;
          const sy = h * 0.12 + s * h * 0.05 + Math.cos(time + s) * 3 + cosmicHover;
          const starSize = 1 + (Math.sin(time * 3 + s * 0.8) > 0.7 ? 1 : 0);
          ctx.fillRect(sx, sy, starSize, starSize);
        }
        // Grand cosmic helm (hovering)
        ctx.fillStyle = '#312e81';
        ctx.fillRect(-hw * 0.48, 0 + cosmicHover, w * 0.48, h * 0.15);
        // Cosmic crown (5 points with gems, grander)
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-hw * 0.45, -h * 0.04 + cosmicHover, w * 0.45, h * 0.055);
        ctx.fillRect(-hw * 0.42, -h * 0.12 + cosmicHover, w * 0.06, h * 0.1);
        ctx.fillRect(-hw * 0.2, -h * 0.14 + cosmicHover, w * 0.06, h * 0.12);
        ctx.fillRect(hw * 0.02, -h * 0.12 + cosmicHover, w * 0.06, h * 0.1);
        ctx.fillRect(hw * 0.2, -h * 0.1 + cosmicHover, w * 0.06, h * 0.08);
        ctx.fillRect(-hw * 0.06, -h * 0.16 + cosmicHover, w * 0.08, h * 0.14);
        // Crown gems (pulsing glow)
        ctx.fillStyle = `rgba(168,85,247,${0.6 + cosmicPulse * 0.3})`;
        ctx.fillRect(-hw * 0.4, -h * 0.1 + cosmicHover, w * 0.04, h * 0.05);
        ctx.fillRect(-hw * 0.17, -h * 0.12 + cosmicHover, w * 0.04, h * 0.05);
        ctx.fillRect(hw * 0.04, -h * 0.1 + cosmicHover, w * 0.04, h * 0.05);
        ctx.fillStyle = `rgba(236,72,153,${0.6 + cosmicPulse * 0.3})`;
        ctx.fillRect(-hw * 0.04, -h * 0.14 + cosmicHover, w * 0.05, h * 0.05);
        // Piercing galaxy eyes (swirling, larger)
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(-hw * 0.32, h * 0.04 + cosmicHover, w * 0.15, h * 0.07);
        ctx.fillRect(hw * 0.01, h * 0.04 + cosmicHover, w * 0.15, h * 0.07);
        // Eye centers (swirling galaxy pupils)
        ctx.fillStyle = '#e9d5ff';
        ctx.fillRect(-hw * 0.26 + Math.sin(time * 3) * 2, h * 0.055 + cosmicHover, w * 0.07, h * 0.04);
        ctx.fillRect(hw * 0.05 + Math.cos(time * 3) * 2, h * 0.055 + cosmicHover, w * 0.07, h * 0.04);
        // Eye glow beams
        ctx.fillStyle = `rgba(139,92,246,${0.2 + cosmicPulse * 0.15})`;
        ctx.fillRect(-hw * 0.36, h * 0.02 + cosmicHover, w * 0.2, h * 0.11);
        ctx.fillRect(hw * -0.02, h * 0.02 + cosmicHover, w * 0.2, h * 0.11);
        // Mouth (cosmic void)
        ctx.fillStyle = '#0f0a2a';
        ctx.fillRect(-hw * 0.15, h * 0.11 + cosmicHover, w * 0.15, h * 0.03);
        // Cosmic robes with galactic pattern
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(-hw * 0.6, h * 0.14 + cosmicHover, w * 0.6, h * 0.16);
        // Shoulder orbs
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(-hw * 0.6, h * 0.18 + cosmicHover, w * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hw * 0.5, h * 0.18 + cosmicHover, w * 0.04, 0, Math.PI * 2);
        ctx.fill();
        // Massive cosmic arms (animated)
        ctx.fillStyle = '#312e81';
        ctx.fillRect(-hw * 0.78, h * 0.2 + cosmicHover + armSwing * 0.3, w * 0.13, h * 0.35);
        ctx.fillRect(hw * 0.5, h * 0.2 + cosmicHover - armSwing * 0.3, w * 0.13, h * 0.35);
        // Galactic energy hands (glowing)
        ctx.fillStyle = `rgba(139,92,246,${0.7 + cosmicPulse * 0.2})`;
        ctx.fillRect(-hw * 0.84, h * 0.53 + cosmicHover + armSwing * 0.3, w * 0.18, h * 0.1);
        ctx.fillRect(hw * 0.47, h * 0.53 + cosmicHover - armSwing * 0.3, w * 0.18, h * 0.1);
        // Energy between fingers
        ctx.fillStyle = '#e9d5ff';
        ctx.fillRect(-hw * 0.82, h * 0.55 + cosmicHover + armSwing * 0.3, w * 0.04, h * 0.06);
        ctx.fillRect(-hw * 0.72, h * 0.55 + cosmicHover + armSwing * 0.3, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.5, h * 0.55 + cosmicHover - armSwing * 0.3, w * 0.04, h * 0.06);
        ctx.fillRect(hw * 0.6, h * 0.55 + cosmicHover - armSwing * 0.3, w * 0.04, h * 0.06);
        // Floating lower body / robe (more dynamic)
        for (let i = -7; i < 7; i++) {
          const robeH = h * 0.14 + Math.sin(time * 1.5 + i * 0.5) * h * 0.04;
          ctx.fillStyle = i % 2 === 0 ? '#1e1b4b' : '#312e81';
          ctx.fillRect(i * w * 0.04, h * 0.65 + cosmicHover, w * 0.04, robeH);
        }
        // Vortex rings orbiting (multiple)
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + cosmicPulse * 0.2;
        ctx.beginPath();
        ctx.ellipse(0, h * 0.35 + cosmicHover, hw * 0.85, h * 0.09, vortexAngle, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.35 + cosmicHover, hw * 0.7, h * 0.07, -vortexAngle * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.35 + cosmicHover, hw * 0.55, h * 0.05, vortexAngle * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        // Orbiting star particles
        ctx.fillStyle = '#fff';
        for (let p = 0; p < 4; p++) {
          const pA = vortexAngle + p * Math.PI / 2;
          ctx.fillRect(Math.cos(pA) * hw * 0.8, h * 0.35 + cosmicHover + Math.sin(pA) * h * 0.08, 3, 3);
        }
        ctx.globalAlpha = 1;
      } else if (e.isBoss) {
        // === GENERATED BOSSES: ability-based visual variants ===
        const ability = e.ability || 'slam';
        const bossTime = time;
        if (ability === 'firewall' || ability === 'chaos') {
          // FIRE/CHAOS variant: fiery demonic figure
          const flicker = Math.sin(bossTime * 7) * 2;
          // Flame horns
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-hw * 0.3, -h * 0.06, w * 0.05, h * 0.08 + flicker);
          ctx.fillRect(hw * 0.12, -h * 0.06, w * 0.05, h * 0.08 - flicker);
          // Head
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(-hw * 0.4, 0, w * 0.4, h * 0.18);
          // Burning eyes
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-hw * 0.28, h * 0.06, w * 0.1, h * 0.05);
          ctx.fillRect(hw * 0.03, h * 0.06, w * 0.1, h * 0.05);
          // Fanged mouth
          ctx.fillStyle = '#111';
          ctx.fillRect(-hw * 0.18, h * 0.13, w * 0.18, h * 0.03);
          ctx.fillStyle = '#fff';
          ctx.fillRect(-hw * 0.14, h * 0.13, w * 0.03, h * 0.04);
          ctx.fillRect(hw * 0.02, h * 0.13, w * 0.03, h * 0.04);
          // Molten body
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-hw * 0.5, h * 0.18, w * 0.5, h * 0.38);
          // Lava cracks
          ctx.fillStyle = '#f97316';
          ctx.fillRect(-hw * 0.3, h * 0.25, w * 0.03, h * 0.12);
          ctx.fillRect(hw * 0.1, h * 0.3, w * 0.03, h * 0.15);
          // Arms
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(-hw * 0.65, h * 0.2, w * 0.1, h * 0.28);
          ctx.fillRect(hw * 0.4, h * 0.2, w * 0.1, h * 0.28);
          // Legs
          ctx.fillRect(-hw * 0.3, h * 0.56, w * 0.15, h * 0.3);
          ctx.fillRect(hw * 0.02, h * 0.56, w * 0.15, h * 0.3);
          // Fire aura
          ctx.globalAlpha = 0.2 + Math.sin(bossTime * 3) * 0.1;
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, h * 0.4, hw * 0.65, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (ability === 'lightning' || ability === 'freeze_wave' || ability === 'shockwave') {
          // ELEMENTAL variant: crackling energy being
          const spark = Math.sin(bossTime * 10) * 3;
          // Energy crown
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.2, -h * 0.08, w * 0.05, h * 0.1);
          ctx.fillRect(hw * 0.06, -h * 0.06, w * 0.04, h * 0.08);
          // Crystal head
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.35, 0, w * 0.35, h * 0.18);
          // Glowing eyes
          ctx.fillStyle = '#fff';
          ctx.fillRect(-hw * 0.25, h * 0.06, w * 0.08, h * 0.05);
          ctx.fillRect(hw * 0.02, h * 0.06, w * 0.08, h * 0.05);
          // Body (semi-transparent energy)
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.45, h * 0.18, w * 0.45, h * 0.4);
          ctx.globalAlpha = 1;
          // Energy core
          ctx.fillStyle = '#fff';
          ctx.fillRect(-hw * 0.08, h * 0.3, w * 0.08, h * 0.08);
          // Arms (energy bolts)
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.6, h * 0.22, w * 0.1, h * 0.25);
          ctx.fillRect(hw * 0.35, h * 0.22, w * 0.1, h * 0.25);
          // Floating lower body
          for (let i = -4; i < 4; i++) {
            ctx.fillRect(i * w * 0.06, h * 0.58 + Math.sin(bossTime * 2 + i) * h * 0.02, w * 0.06, h * 0.14);
          }
          // Crackling electricity
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-hw * 0.4, h * 0.2 + spark);
          ctx.lineTo(-hw * 0.2, h * 0.3 - spark);
          ctx.lineTo(-hw * 0.35, h * 0.4 + spark);
          ctx.stroke();
        } else if (ability === 'meteor' || ability === 'vortex') {
          // COSMIC variant: dark cosmic entity
          const cosmicBob = Math.sin(bossTime * 1.5) * 4;
          // Dark cosmic body
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(-hw * 0.45, h * 0.05 + cosmicBob, w * 0.45, h * 0.6);
          // Stars inside
          ctx.fillStyle = '#fff';
          ctx.fillRect(-hw * 0.2, h * 0.15 + cosmicBob, 2, 2);
          ctx.fillRect(hw * 0.08, h * 0.35 + cosmicBob, 2, 2);
          ctx.fillRect(-hw * 0.1, h * 0.45 + cosmicBob, 1, 1);
          // Hood
          ctx.fillStyle = '#312e81';
          ctx.fillRect(-hw * 0.4, 0 + cosmicBob, w * 0.4, h * 0.14);
          // Purple eyes
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(-hw * 0.28, h * 0.04 + cosmicBob, w * 0.1, h * 0.05);
          ctx.fillRect(hw * 0.02, h * 0.04 + cosmicBob, w * 0.1, h * 0.05);
          // Arms
          ctx.fillStyle = '#312e81';
          ctx.fillRect(-hw * 0.6, h * 0.2 + cosmicBob, w * 0.1, h * 0.3);
          ctx.fillRect(hw * 0.38, h * 0.2 + cosmicBob, w * 0.1, h * 0.3);
          // Tattered bottom
          for (let i = -4; i < 4; i++) {
            ctx.fillRect(i * w * 0.06, h * 0.6 + cosmicBob + Math.sin(bossTime * 2 + i) * h * 0.03, w * 0.06, h * 0.14);
          }
          // Energy orb orbiting
          const oAngle = bossTime * 2;
          ctx.fillStyle = '#8b5cf6';
          ctx.beginPath();
          ctx.arc(Math.cos(oAngle) * hw * 0.6, h * 0.35 + Math.sin(oAngle) * h * 0.2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (ability === 'tankcharge' || ability === 'airassault' || ability === 'artillery' || ability === 'mechstomp') {
          // MECH variant: mechanical war construct
          // Armored head
          ctx.fillStyle = '#374151';
          ctx.fillRect(-hw * 0.35, 0, w * 0.35, h * 0.18);
          // Visor
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-hw * 0.25, h * 0.06, w * 0.25, h * 0.04);
          // Antenna
          ctx.fillStyle = '#6b7280';
          ctx.fillRect(hw * 0.1, -h * 0.06, w * 0.02, h * 0.1);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(hw * 0.09, -h * 0.07, w * 0.03, h * 0.03);
          // Armored body
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(-hw * 0.5, h * 0.18, w * 0.5, h * 0.35);
          // Chest plate insignia
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-hw * 0.08, h * 0.25, w * 0.08, h * 0.08);
          // Cannon arm (left)
          ctx.fillStyle = '#374151';
          ctx.fillRect(-hw * 0.7, h * 0.2, w * 0.14, h * 0.12);
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(-hw * 0.85, h * 0.22, w * 0.16, h * 0.06);
          // Shield arm (right)
          ctx.fillStyle = '#374151';
          ctx.fillRect(hw * 0.38, h * 0.18, w * 0.14, h * 0.2);
          ctx.fillStyle = '#6b7280';
          ctx.fillRect(hw * 0.35, h * 0.16, w * 0.18, h * 0.04);
          // Legs (mechanical)
          ctx.fillStyle = '#374151';
          ctx.fillRect(-hw * 0.3, h * 0.53, w * 0.14, h * 0.32);
          ctx.fillRect(hw * 0.04, h * 0.53, w * 0.14, h * 0.32);
          // Feet (heavy)
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(-hw * 0.35, h * 0.85, w * 0.2, h * 0.1);
          ctx.fillRect(hw * 0.0, h * 0.85, w * 0.2, h * 0.1);
        } else if (ability === 'bone_rain') {
          // UNDEAD variant: skeletal reaper
          // Skull
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-hw * 0.35, 0, w * 0.35, h * 0.16);
          // Eye sockets with fire
          ctx.fillStyle = '#111';
          ctx.fillRect(-hw * 0.25, h * 0.04, w * 0.08, h * 0.06);
          ctx.fillRect(hw * 0.01, h * 0.04, w * 0.08, h * 0.06);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(-hw * 0.22, h * 0.05, w * 0.05, h * 0.04);
          ctx.fillRect(hw * 0.03, h * 0.05, w * 0.05, h * 0.04);
          // Dark hood
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-hw * 0.4, -h * 0.04, w * 0.4, h * 0.1);
          ctx.fillRect(-hw * 0.45, h * 0.04, w * 0.45, h * 0.08);
          // Body (tattered robe)
          ctx.fillStyle = '#292524';
          ctx.fillRect(-hw * 0.45, h * 0.12, w * 0.45, h * 0.45);
          // Ribcage showing
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-hw * 0.02, h * 0.15, w * 0.04, h * 0.2);
          ctx.fillRect(-hw * 0.2, h * 0.18, w * 0.2, h * 0.02);
          ctx.fillRect(-hw * 0.18, h * 0.24, w * 0.18, h * 0.02);
          // Scythe
          ctx.fillStyle = '#78716c';
          ctx.fillRect(hw * 0.3, h * 0.05, w * 0.03, h * 0.55);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(hw * 0.15, h * 0.02, w * 0.18, h * 0.06);
          ctx.fillRect(hw * 0.12, h * 0.06, w * 0.08, h * 0.06);
          // Tattered bottom
          for (let i = -4; i < 4; i++) {
            ctx.fillRect(i * w * 0.06, h * 0.55 + Math.sin(bossTime * 2 + i) * h * 0.03, w * 0.05, h * 0.16);
          }
        } else if (ability === 'poison_cloud') {
          // TOXIC variant: plagued monstrosity
          const toxicBob = Math.sin(bossTime * 2) * 3;
          // Bulbous head
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.ellipse(0, h * 0.1 + toxicBob, hw * 0.35, h * 0.1, 0, 0, Math.PI * 2);
          ctx.fill();
          // Multiple eyes
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(-hw * 0.2, h * 0.06 + toxicBob, w * 0.06, h * 0.04);
          ctx.fillRect(-hw * 0.05, h * 0.04 + toxicBob, w * 0.05, h * 0.04);
          ctx.fillRect(hw * 0.06, h * 0.06 + toxicBob, w * 0.06, h * 0.04);
          // Dripping maw
          ctx.fillStyle = '#111';
          ctx.fillRect(-hw * 0.15, h * 0.14 + toxicBob, w * 0.15, h * 0.04);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(-hw * 0.08, h * 0.17 + toxicBob, w * 0.03, h * 0.04);
          ctx.fillRect(hw * 0.02, h * 0.17 + toxicBob, w * 0.03, h * 0.04);
          // Bloated body
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.ellipse(0, h * 0.4 + toxicBob, hw * 0.5, h * 0.22, 0, 0, Math.PI * 2);
          ctx.fill();
          // Toxic boils
          ctx.fillStyle = '#a3e635';
          ctx.beginPath(); ctx.arc(-hw * 0.2, h * 0.32 + toxicBob, 4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(hw * 0.15, h * 0.38 + toxicBob, 5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-hw * 0.05, h * 0.46 + toxicBob, 3, 0, Math.PI * 2); ctx.fill();
          // Tentacle arms
          ctx.strokeStyle = '#166534';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-hw * 0.45, h * 0.3 + toxicBob);
          ctx.quadraticCurveTo(-hw * 0.6, h * 0.45, -hw * 0.5, h * 0.55 + Math.sin(bossTime * 3) * 5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(hw * 0.35, h * 0.3 + toxicBob);
          ctx.quadraticCurveTo(hw * 0.55, h * 0.45, hw * 0.45, h * 0.55 + Math.cos(bossTime * 3) * 5);
          ctx.stroke();
          // Stubby legs
          ctx.fillStyle = '#15803d';
          ctx.fillRect(-hw * 0.25, h * 0.58 + toxicBob, w * 0.14, h * 0.22);
          ctx.fillRect(hw * 0.02, h * 0.58 + toxicBob, w * 0.14, h * 0.22);
          // Toxic cloud
          ctx.globalAlpha = 0.2 + Math.sin(bossTime * 2) * 0.1;
          ctx.fillStyle = '#4ade80';
          ctx.beginPath(); ctx.arc(-hw * 0.3, h * 0.15+toxicBob, 8, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(hw * 0.2, h * 0.1+toxicBob, 6, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          // SLAM / DEFAULT variant: armored warrior titan
          // Helmet with plume
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(-hw * 0.38, 0, w * 0.38, h * 0.18);
          // Helmet crest
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.05, -h * 0.08, w * 0.06, h * 0.1);
          // Visor eyes
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-hw * 0.28, h * 0.06, w * 0.1, h * 0.04);
          ctx.fillRect(hw * 0.02, h * 0.06, w * 0.1, h * 0.04);
          ctx.fillStyle = '#111';
          ctx.fillRect(-hw * 0.24, h * 0.07, w * 0.05, h * 0.02);
          ctx.fillRect(hw * 0.05, h * 0.07, w * 0.05, h * 0.02);
          // Heavy pauldrons
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.6, h * 0.14, w * 0.12, h * 0.1);
          ctx.fillRect(hw * 0.32, h * 0.14, w * 0.12, h * 0.1);
          // Spikes on pauldrons
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-hw * 0.62, h * 0.12, w * 0.03, h * 0.05);
          ctx.fillRect(hw * 0.42, h * 0.12, w * 0.03, h * 0.05);
          // Armored body
          ctx.fillStyle = '#6b7280';
          ctx.fillRect(-hw * 0.45, h * 0.18, w * 0.45, h * 0.35);
          // Belt with emblem
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(-hw * 0.45, h * 0.5, w * 0.45, h * 0.04);
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.06, h * 0.49, w * 0.06, h * 0.06);
          // Arms (armored)
          ctx.fillStyle = '#6b7280';
          ctx.fillRect(-hw * 0.6, h * 0.24, w * 0.1, h * 0.26);
          ctx.fillRect(hw * 0.35, h * 0.24, w * 0.1, h * 0.26);
          // Fists
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(-hw * 0.65, h * 0.48, w * 0.12, h * 0.08);
          ctx.fillRect(hw * 0.33, h * 0.48, w * 0.12, h * 0.08);
          // Weapon (big sword)
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-hw * 0.72, h * 0.1, w * 0.04, h * 0.4);
          ctx.fillStyle = e.color;
          ctx.fillRect(-hw * 0.74, h * 0.06, w * 0.06, h * 0.06);
          // Legs
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(-hw * 0.3, h * 0.54, w * 0.16, h * 0.32);
          ctx.fillRect(hw * 0.02, h * 0.54, w * 0.16, h * 0.32);
          // Boots
          ctx.fillStyle = '#374151';
          ctx.fillRect(-hw * 0.35, h * 0.86, w * 0.2, h * 0.08);
          ctx.fillRect(hw * -0.01, h * 0.86, w * 0.2, h * 0.08);
        }
      } else {
        // Fallback colored rectangle with eyes
        ctx.fillStyle = e.color;
        ctx.fillRect(-hw, 0, w, h);
        // Add eyes to unknown types
        ctx.fillStyle = '#fff';
        ctx.fillRect(-hw + w * 0.2, h * 0.2, w * 0.15, h * 0.12);
        ctx.fillRect(hw - w * 0.35, h * 0.2, w * 0.15, h * 0.12);
        ctx.fillStyle = '#111';
        ctx.fillRect(-hw + w * 0.24, h * 0.23, w * 0.08, h * 0.06);
        ctx.fillRect(hw - w * 0.32, h * 0.23, w * 0.08, h * 0.06);
      }
      break;
    }
  }

  // Burn visual
  if (e.status.burn > 0) {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-4 + Math.sin(time * 10) * 3, -4, 3, 5);
    ctx.fillRect(2 + Math.cos(time * 8) * 2, -2, 2, 4);
  }

  // Freeze visual
  if (e.status.freeze > 0) {
    ctx.strokeStyle = 'rgba(147,197,253,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-hw - 2, -2, w + 4, h + 4);
  }

  ctx.restore();
}

function drawArenaSetupHint() {
  if (!state.arenaMode || state.arenaActive) return;
  ctx.fillStyle = '#22c55e';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('ARENA SETUP: SELECT MOB, CLICK FIELD TO SPAWN', dom.canvas.width / 2, 96);
}

/* ─── Element Wheel ─── */
const WHEEL_ELEMENTS = [
  { id: 'fire',      icon: '🔥', label: 'FIRE',      color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
  { id: 'lightning',  icon: '⚡', label: 'LIGHTNING',  color: '#facc15', glow: 'rgba(250,204,21,0.35)' },
  { id: 'water',     icon: '🌊', label: 'WATER',     color: '#38bdf8', glow: 'rgba(56,189,248,0.35)' }
];
const WHEEL_RADIUS = 90;
const WHEEL_HOLD_TIME = 3; // seconds

function drawElementWheel() {
  const p = state.player;
  const cx = dom.canvas.width / 2;
  const cy = dom.canvas.height / 2;

  // Draw hold-progress ring while X is held (before wheel opens)
  if (p.elementHoldStart > 0 && !p.elementWheelOpen && p.unlockedElements.length >= 2) {
    const elapsed = (Date.now() - p.elementHoldStart) / 1000;
    const progress = Math.min(elapsed / WHEEL_HOLD_TIME, 1);
    if (progress > 0.05) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      // Background ring
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y + p.h / 2, 30, 0, Math.PI * 2);
      ctx.stroke();
      // Progress arc
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y + p.h / 2, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
      // Text
      ctx.fillStyle = '#22d3ee';
      ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('HOLD X', p.x, p.y + p.h / 2 + 3);
      ctx.restore();
    }
  }

  // Draw wheel overlay
  if (!p.elementWheelOpen) return;
  const unlocked = p.unlockedElements;
  const available = WHEEL_ELEMENTS.filter(e => unlocked.includes(e.id));
  if (available.length < 2) return;

  const n = available.length;
  const sliceAngle = (Math.PI * 2) / n;

  // Determine which slice the mouse hovers over
  const mx = state.mouse.x - cx;
  const my = state.mouse.y - cy;
  let mouseAngle = Math.atan2(my, mx);
  if (mouseAngle < 0) mouseAngle += Math.PI * 2;
  // Offset so first slice is at top
  let adjusted = (mouseAngle + Math.PI / 2) % (Math.PI * 2);
  const hoveredIndex = Math.floor(adjusted / sliceAngle) % n;

  ctx.save();

  // Darken background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);

  // Draw slices
  for (let i = 0; i < n; i++) {
    const startAngle = -Math.PI / 2 + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const isHovered = i === hoveredIndex;
    const isCurrent = available[i].id === p.element;

    // Slice background
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, WHEEL_RADIUS, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = isHovered ? available[i].glow : 'rgba(30,41,59,0.9)';
    ctx.fill();
    ctx.strokeStyle = isHovered ? available[i].color : (isCurrent ? '#22c55e' : '#475569');
    ctx.lineWidth = isHovered ? 3 : (isCurrent ? 2.5 : 1.5);
    ctx.stroke();

    // Icon + label
    const midAngle = startAngle + sliceAngle / 2;
    const iconR = WHEEL_RADIUS * 0.55;
    const ix = cx + Math.cos(midAngle) * iconR;
    const iy = cy + Math.sin(midAngle) * iconR;

    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(available[i].icon, ix, iy - 8);

    ctx.font = `${isHovered ? 9 : 8}px "Press Start 2P"`;
    ctx.fillStyle = isHovered ? available[i].color : '#cbd5e1';
    ctx.fillText(available[i].label, ix, iy + 14);

    if (isCurrent) {
      ctx.font = '6px "Press Start 2P"';
      ctx.fillStyle = '#22c55e';
      ctx.fillText('ACTIVE', ix, iy + 26);
    }
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '7px "Press Start 2P"';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ELEM', cx, cy);

  // Instruction at top
  ctx.font = '8px "Press Start 2P"';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.fillText('CLICK TO SELECT • RELEASE X TO CANCEL', cx, cy - WHEEL_RADIUS - 20);

  ctx.restore();

  // Store hovered index for click handler
  state._wheelHoveredElement = available[hoveredIndex]?.id || null;
}

function drawPlatforms() {
  const platforms = state.floatingPlatforms;
  const now = Date.now();
  for (const plat of platforms) {
    if (plat.fallen) continue;
    ctx.save();

    // Shake effect when crumbling
    let offX = 0, offY = 0;
    let alpha = 1;
    if (plat.crumbling) {
      const ratio = plat.crumbleTimer / plat.crumbleMax;
      offX = (Math.random() - 0.5) * 8 * ratio;
      offY = (Math.random() - 0.5) * 5 * ratio;
      alpha = 1 - ratio * 0.7;
    }
    ctx.globalAlpha = alpha;

    const x = Math.round(plat.x + offX);
    const y = Math.round(plat.y + offY);
    const w = plat.w;
    const h = plat.h;
    const seed = plat.seed || 0;
    const pulse = Math.sin(now * 0.003 + seed) * 0.5 + 0.5;
    const cx = x + w / 2;
    const cy = y + h / 2;

    // ═══ UNDERGLOW — soft light beneath platform ═══
    const glowR = w * 0.6;
    const glowGrad = ctx.createRadialGradient(cx, y + h + 4, 2, cx, y + h + 4, glowR);
    if (plat.area === 'grassy') {
      glowGrad.addColorStop(0, `rgba(74,222,128,${0.12 + pulse * 0.06})`);
      glowGrad.addColorStop(1, 'rgba(74,222,128,0)');
    } else if (plat.area === 'ice') {
      glowGrad.addColorStop(0, `rgba(125,211,252,${0.15 + pulse * 0.08})`);
      glowGrad.addColorStop(1, 'rgba(125,211,252,0)');
    } else if (plat.area === 'lava') {
      glowGrad.addColorStop(0, `rgba(239,68,68,${0.18 + pulse * 0.1})`);
      glowGrad.addColorStop(1, 'rgba(239,68,68,0)');
    } else if (plat.area === 'void') {
      glowGrad.addColorStop(0, `rgba(124,58,237,${0.2 + pulse * 0.1})`);
      glowGrad.addColorStop(1, 'rgba(124,58,237,0)');
    } else {
      glowGrad.addColorStop(0, `rgba(250,204,21,${0.14 + pulse * 0.08})`);
      glowGrad.addColorStop(1, 'rgba(250,204,21,0)');
    }
    ctx.fillStyle = glowGrad;
    ctx.fillRect(cx - glowR, y + h - 2, glowR * 2, glowR + 6);

    // ═══ 3D DEPTH SIDE — gives thickness ═══
    const depth = 8;
    ctx.fillStyle = plat.borderColor;
    ctx.fillRect(x + 2, y + h, w - 4, depth);
    // Side shadow gradient
    const sideGrad = ctx.createLinearGradient(x, y + h, x, y + h + depth);
    sideGrad.addColorStop(0, 'rgba(0,0,0,0.1)');
    sideGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = sideGrad;
    ctx.fillRect(x + 2, y + h, w - 4, depth);
    // Side pixel details
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + 4, y + h + 1, w - 8, 1);

    // ═══ MAIN BODY — gradient fill instead of flat ═══
    const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
    bodyGrad.addColorStop(0, plat.color);
    bodyGrad.addColorStop(1, plat.borderColor);
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x, y, w, h);

    // ═══ TOP SURFACE HIGHLIGHT ═══
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 1, y, w - 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 2, y + 2, w - 4, 2);

    // ═══ EDGE CAPS — rounded-look corners ═══
    ctx.fillStyle = plat.borderColor;
    ctx.fillRect(x, y, 3, h);
    ctx.fillRect(x + w - 3, y, 3, h);
    // Bright corner pixels
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 1, y + 1, 2, 2);
    ctx.fillRect(x + w - 3, y + 1, 2, 2);

    // ═══ AREA-SPECIFIC DECORATIONS ═══
    if (plat.area === 'grassy') {
      // Rich layered grass on top
      ctx.fillStyle = '#22c55e';
      for (let gx = x + 3; gx < x + w - 3; gx += 7) {
        const gh = 4 + Math.sin(gx * 0.5 + seed) * 2 + Math.sin(now * 0.004 + gx * 0.1) * 1;
        ctx.fillRect(gx, y - gh, 2, gh + 1);
      }
      ctx.fillStyle = '#4ade80';
      for (let gx = x + 5; gx < x + w - 5; gx += 9) {
        const gh = 3 + Math.sin(gx * 0.7 + seed + 1) * 2;
        ctx.fillRect(gx, y - gh, 3, gh + 1);
      }
      // Tiny flowers
      ctx.fillStyle = '#fbbf24';
      for (let fx = x + 8; fx < x + w - 8; fx += 22) {
        const fy = y - 3 - Math.sin(fx + seed) * 2;
        ctx.fillRect(fx, fy, 2, 2);
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(fx + 1, fy - 1, 1, 1);
        ctx.fillStyle = '#fbbf24';
      }
      // Mossy vines hanging below
      ctx.fillStyle = '#16a34a';
      for (let vx = x + 10; vx < x + w - 10; vx += 18) {
        const vLen = 6 + Math.sin(vx + seed * 2) * 4 + Math.sin(now * 0.002 + vx * 0.1) * 2;
        ctx.fillRect(vx, y + h + depth, 2, vLen);
        ctx.fillRect(vx + 1, y + h + depth + vLen, 1, 2);
        // Vine leaves
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(vx - 1, y + h + depth + 3, 1, 2);
        ctx.fillRect(vx + 2, y + h + depth + 5, 1, 2);
        ctx.fillStyle = '#16a34a';
      }
      // Surface moss patches
      ctx.fillStyle = 'rgba(34,197,94,0.3)';
      ctx.fillRect(x + 8, y + 4, 12, 3);
      ctx.fillRect(x + w - 22, y + 5, 10, 2);

    } else if (plat.area === 'ice') {
      // Crystal-like ice surface with animated gleam
      const gleamX = ((now * 0.05 + seed * 100) % (w + 40)) - 20;
      ctx.fillStyle = `rgba(255,255,255,${0.5 + pulse * 0.3})`;
      ctx.fillRect(x + gleamX, y + 1, 8, 2);
      ctx.fillRect(x + gleamX + 3, y + 3, 4, 1);
      // Frozen sparkles on surface
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let sx = x + 6; sx < x + w - 6; sx += 14) {
        const flicker = Math.sin(now * 0.006 + sx * 0.3) > 0.3;
        if (flicker) ctx.fillRect(sx, y + 3 + Math.sin(sx) * 2, 2, 2);
      }
      // Elaborate icicles hanging below
      ctx.fillStyle = '#bae6fd';
      for (let ix = x + 6; ix < x + w - 6; ix += 10) {
        const iLen = 8 + Math.sin(ix * 0.4 + seed) * 5;
        ctx.beginPath();
        ctx.moveTo(ix, y + h + depth);
        ctx.lineTo(ix + 3, y + h + depth);
        ctx.lineTo(ix + 1.5, y + h + depth + iLen);
        ctx.closePath();
        ctx.fill();
        // Icicle highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(ix + 1, y + h + depth + 1, 1, iLen * 0.5);
        ctx.fillStyle = '#bae6fd';
      }
      // Frost crystals on edges
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x - 2, y + 2, 3, 4);
      ctx.fillRect(x + w - 1, y + 2, 3, 4);
      ctx.fillRect(x - 1, y - 1, 2, 3);
      ctx.fillRect(x + w, y - 1, 2, 3);
      // Snow drift on top
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 4, y - 1, w * 0.3, 2);
      ctx.fillRect(x + w * 0.5, y - 1, w * 0.25, 2);

    } else if (plat.area === 'lava') {
      // Flowing lava veins with animation
      const lavaFlow = (now * 0.002 + seed) % 6.28;
      // Cracks with lava glow
      ctx.fillStyle = '#ef4444';
      for (let lx = x + 6; lx < x + w - 6; lx += 16) {
        ctx.fillRect(lx, y + 2, 2, h - 3);
        // Lava glow around crack
        ctx.fillStyle = `rgba(249,115,22,${0.3 + Math.sin(lavaFlow + lx * 0.1) * 0.2})`;
        ctx.fillRect(lx - 1, y + 1, 4, h - 1);
        ctx.fillStyle = '#ef4444';
      }
      // Surface heat shimmer
      ctx.fillStyle = `rgba(251,146,60,${0.2 + pulse * 0.15})`;
      ctx.fillRect(x + 3, y + 1, w - 6, 2);
      // Embers floating up
      for (let ei = 0; ei < 4; ei++) {
        const eSeed = seed * 100 + ei * 777;
        const eLifeT = ((now * 0.002 + eSeed) % 2) / 2;
        const ex = x + 10 + Math.sin(eSeed) * (w * 0.35);
        const ey = y - eLifeT * 25;
        const ea = Math.sin(eLifeT * Math.PI) * 0.7;
        ctx.fillStyle = `rgba(251,146,60,${ea})`;
        ctx.fillRect(Math.round(ex), Math.round(ey), 2, 2);
      }
      // Dripping lava below
      for (let dx = x + 14; dx < x + w - 14; dx += 24) {
        const dripT = ((now * 0.001 + dx * 0.1) % 1.5);
        const dripY = y + h + depth + dripT * 12;
        const dripA = Math.max(0, 1 - dripT / 1.5);
        ctx.fillStyle = `rgba(239,68,68,${dripA * 0.6})`;
        ctx.fillRect(dx, dripY, 2, 3);
      }
      // Hot edge glow
      ctx.fillStyle = `rgba(249,115,22,${0.1 + pulse * 0.08})`;
      ctx.fillRect(x - 2, y - 1, w + 4, 3);

    } else if (plat.area === 'void') {
      // Eldritch void platform — pulsing runes, swirling particles
      // Rune markings on surface
      ctx.fillStyle = `rgba(168,85,247,${0.4 + pulse * 0.3})`;
      for (let rx = x + 8; rx < x + w - 8; rx += 16) {
        // Small rune symbols (pixel crosses / diamonds)
        ctx.fillRect(rx, y + 3, 5, 1);
        ctx.fillRect(rx + 2, y + 2, 1, 3);
        // Diamond
        ctx.fillRect(rx + 8, y + 3, 1, 1);
        ctx.fillRect(rx + 7, y + 4, 3, 1);
        ctx.fillRect(rx + 8, y + 5, 1, 1);
      }
      // Edge portal swirl
      ctx.fillStyle = `rgba(124,58,237,${0.3 + pulse * 0.2})`;
      ctx.fillRect(x - 3, y + 1, 4, h - 2);
      ctx.fillRect(x + w - 1, y + 1, 4, h - 2);
      // Void particles orbiting
      for (let vi = 0; vi < 5; vi++) {
        const vAngle = now * 0.003 + vi * 1.26 + seed;
        const vDist = 8 + Math.sin(now * 0.005 + vi) * 4;
        const vx2 = cx + Math.cos(vAngle) * (w * 0.35);
        const vy2 = cy + Math.sin(vAngle) * vDist;
        const va = 0.3 + Math.sin(vAngle * 2) * 0.3;
        ctx.fillStyle = `rgba(192,132,252,${va})`;
        ctx.fillRect(Math.round(vx2), Math.round(vy2), 2, 2);
      }
      // Ethereal chains hanging below
      ctx.strokeStyle = `rgba(124,58,237,${0.25 + pulse * 0.15})`;
      ctx.lineWidth = 1;
      for (let cix = x + 12; cix < x + w - 12; cix += 20) {
        ctx.beginPath();
        ctx.moveTo(cix, y + h + depth);
        for (let ci = 1; ci <= 4; ci++) {
          ctx.lineTo(cix + Math.sin(now * 0.004 + ci + cix) * 4, y + h + depth + ci * 5);
        }
        ctx.stroke();
      }

    } else {
      // Lightning / storm cloud — electric arcs, cloud wisps
      // Cloud puff effects on top
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let px = x + 4; px < x + w - 4; px += 12) {
        const pr = 5 + Math.sin(px * 0.3 + seed) * 3;
        ctx.beginPath();
        ctx.arc(px, y - 1, pr, Math.PI, 0);
        ctx.fill();
      }
      // Animated lightning sparks underneath
      for (let si = 0; si < 3; si++) {
        const flash = Math.sin(now * 0.012 + si * 2 + seed) > 0.5;
        if (!flash) continue;
        const sx = x + 10 + si * (w / 3);
        const sy = y + h + depth;
        ctx.strokeStyle = `rgba(250,204,21,${0.5 + Math.random() * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        let lx = sx, ly = sy;
        for (let j = 0; j < 3; j++) {
          lx += (Math.random() - 0.5) * 8;
          ly += 4 + Math.random() * 4;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
      // Surface static
      ctx.fillStyle = `rgba(250,204,21,${0.3 + pulse * 0.2})`;
      const staticX = x + ((now * 0.1 + seed * 50) % w);
      ctx.fillRect(staticX, y + 2, 3, 2);
      ctx.fillRect(staticX + 6, y + 4, 2, 2);
      // Cloud body enhancement
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 4, y + 3, w - 8, h - 4);
    }

    // ═══ AMBIENT FLOATING PARTICLES ═══
    for (let pi = 0; pi < 3; pi++) {
      const pSeed = seed * 100 + pi * 3333;
      const pT = ((now * 0.001 + pSeed) % 3) / 3;
      const px = x + 10 + Math.sin(pSeed + now * 0.002) * (w * 0.35);
      const py = y - 4 - pT * 18;
      const pAlpha = Math.sin(pT * Math.PI) * 0.4;
      if (plat.area === 'grassy') ctx.fillStyle = `rgba(74,222,128,${pAlpha})`;
      else if (plat.area === 'ice') ctx.fillStyle = `rgba(186,230,253,${pAlpha})`;
      else if (plat.area === 'lava') ctx.fillStyle = `rgba(251,146,60,${pAlpha})`;
      else if (plat.area === 'void') ctx.fillStyle = `rgba(192,132,252,${pAlpha})`;
      else ctx.fillStyle = `rgba(250,204,21,${pAlpha})`;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }

    // ═══ MOVING PLATFORM INDICATOR ═══
    if (plat.moving) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + pulse * 0.2})`;
      if (plat.moveAxis === 'x') {
        // Animated arrows
        const aOff = Math.sin(now * 0.005) * 2;
        ctx.fillRect(x - 5 + aOff, y + h / 2 - 1, 4, 3);
        ctx.fillRect(x + w + 1 - aOff, y + h / 2 - 1, 4, 3);
        // Arrow points
        ctx.fillRect(x - 7 + aOff, y + h / 2, 2, 1);
        ctx.fillRect(x + w + 5 - aOff, y + h / 2, 2, 1);
      } else {
        const aOff = Math.sin(now * 0.005) * 2;
        ctx.fillRect(cx - 2, y - 6 + aOff, 3, 4);
        ctx.fillRect(cx - 2, y + h + depth + 2 - aOff, 3, 4);
        ctx.fillRect(cx - 1, y - 8 + aOff, 1, 2);
        ctx.fillRect(cx - 1, y + h + depth + 6 - aOff, 1, 2);
      }
    }

    // ═══ CRUMBLE WARNING — cracks appear ═══
    if (plat.crumble && !plat.crumbling) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + w * 0.3, y + 3, 1, h - 4);
      ctx.fillRect(x + w * 0.65, y + 2, 1, h - 3);
    }
    if (plat.crumbling) {
      const ratio = plat.crumbleTimer / plat.crumbleMax;
      // Cracks spreading
      ctx.fillStyle = `rgba(0,0,0,${0.2 + ratio * 0.4})`;
      ctx.fillRect(x + w * 0.2, y + 2, 2, h - 2);
      ctx.fillRect(x + w * 0.5, y + 1, 2, h);
      ctx.fillRect(x + w * 0.75, y + 3, 2, h - 3);
      // Falling debris particles
      for (let di = 0; di < 3; di++) {
        const dSeed = seed * 10 + di * 500;
        const dT = ((now * 0.003 + dSeed) % 1);
        const dx = x + 10 + Math.sin(dSeed) * (w * 0.3);
        const dy = y + h + depth + dT * 20;
        const da = (1 - dT) * ratio * 0.6;
        ctx.fillStyle = `rgba(120,113,108,${da})`;
        ctx.fillRect(Math.round(dx), Math.round(dy), 2 + (di % 2), 2);
      }
    }

    ctx.restore();
  }
}

function drawEnvHazardWarnings() {
  // Draw warning indicators for incoming environmental hazards
  for (const hz of state.hazards) {
    if (hz.env && hz.type === 'env_meteor' && hz.y < -10) {
      // Warning marker on ground
      ctx.fillStyle = 'rgba(234,88,12,0.5)';
      ctx.fillRect(hz.targetX - 12, state.groundY(dom.canvas.height) - 4, 24, 4);
    }
    if (hz.env && hz.type === 'env_lightning' && hz.t > hz.strikeAt) {
      // Warning glow
      ctx.fillStyle = 'rgba(250,204,21,0.15)';
      ctx.fillRect(hz.x - 15, 0, 30, dom.canvas.height);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
  drawBackground();
  drawPlatforms();
  drawEnvHazardWarnings();
  drawNpcAndActors();
  drawArenaSetupHint();
  drawCombat(ctx, state, dom.canvas);
  drawElementWheel();
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - state.lastTick) / 1000 || 0);
  state.lastTick = ts;
  const scaled = state.bowMode && !state.bowTarget ? dt * 0.25 : dt;
  updateGame(scaled);
  draw();
  requestAnimationFrame(loop);
}

function openDialogueWith(npc) {
  state.dialogueOpen = true;
  setDialogue(dom, npc.dialogue);
}

function closeDialogue() {
  state.dialogueOpen = false;
  setDialogue(dom, null);
}

function toggleBowMode() {
  if (state.bowMode && state.bowTarget) {
    shootArrow(state);
    dom.bow.classList.add('hidden');
    return;
  }
  state.bowMode = !state.bowMode;
  state.bowTarget = null;
  dom.bow.classList.toggle('hidden', !state.bowMode);
  dom.bow.textContent = 'BOW MODE - CLICK ENEMY TO TARGET';
}

function bindInputs() {
  window.addEventListener('keydown', (e) => {
    const typing = document.activeElement === dom.levelInput;
    if (e.key.toLowerCase() === 'a') state.input.left = true;
    if (e.key.toLowerCase() === 'd') state.input.right = true;
    if ((e.key === ' ' || e.key.toLowerCase() === 'w') && !typing) {
      e.preventDefault();
      state.input.jump = true;
    }

    if (e.key.toLowerCase() === 'r' && state.mode === 'playing' && !state.insideShop && !state.dialogueOpen) toggleBowMode();

    if (e.key.toLowerCase() === 'e' && state.mode === 'playing' && !state.insideShop) {
      if (state.dialogueOpen) {
        const wasGraduation = state._graduationDialogueActive;
        closeDialogue();
        if (wasGraduation) {
          state._graduationDialogueActive = false;
          state.tutorialComplete = true;
          saveGame(state);
          hidePanels(dom);
          setMode('title');
        }
      } else {
        const npc = pickNpc();
        if (npc) {
          if (npc.name === 'MASTER REN') {
            state.player.talkedToMaster = true;
            if (state._graduationPending) {
              state.player.graduationTalkDone = true;
              state._graduationPending = false;
              state._graduationDialogueActive = true;
            }
          }
          openDialogueWith(npc);
        }
      }
    }

    if (e.key.toLowerCase() === 'q' && state.mode === 'playing') {
      if (state.insideShop) closeShop(state, dom);
      else if (state.levelComplete) openShop(state, dom, 'hub');
    }

    if (e.key === 'Escape') {
      if (state.mode === 'playing' && !state.insideShop && !state.dialogueOpen && !state.arenaMode) tryOpenPause();
      else if (state.mode === 'paused') closePause();
      else if (state.mode === 'worldmap') closeWorldMap();
      else if (state.insideShop) closeShop(state, dom);
      else closeDialogue();
    }

    if (e.key.toLowerCase() === 'm' && state.mode === 'playing' && !state.insideShop && !state.dialogueOpen) openWorldMap();
    if (e.key.toLowerCase() === 'c') state.input.guard = true;

    if (e.key.toLowerCase() === 'x' && state.mode === 'playing' && !state.insideShop && !state.dialogueOpen) {
      if (state.player.element && !state.player.elementWheelOpen) {
        // Start tracking the hold for element wheel (only if 2+ elements unlocked)
        if (state.player.unlockedElements.length >= 2 && state.player.elementHoldStart === 0) {
          state.player.elementHoldStart = Date.now();
        }
        // If only 1 element or wheel not relevant, fire immediately
        if (state.player.unlockedElements.length < 2) {
          if (state.player.elementCooldown > 0) {
            const cd = Math.ceil(state.player.elementCooldown);
            state.effects.push({ type: 'pickup', x: state.player.x, y: state.player.y - 30, t: 1, text: `COOLDOWN ${cd}s`, color: '#94a3b8' });
          } else {
            performElementAttack(state);
          }
        }
      }
    }

    const slotKeys = ['1', '2', '3', '4', '5'];
    if (slotKeys.includes(e.key) && !typing) {
      usePotionSlot(state, Number(e.key) - 1);
      updatePotionSlots(dom, state);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'a') state.input.left = false;
    if (e.key.toLowerCase() === 'd') state.input.right = false;
    if (e.key === ' ' || e.key.toLowerCase() === 'w') {
      state.input.jump = false;
      state.player.jetpackActive = false;
    }
    if (e.key.toLowerCase() === 'c') state.input.guard = false;

    // X key released — fire element attack if it was a quick tap, close wheel if open
    if (e.key.toLowerCase() === 'x') {
      const p = state.player;
      if (p.elementWheelOpen) {
        // Close wheel without selecting (release = cancel)
        p.elementWheelOpen = false;
        p.elementHoldStart = 0;
      } else if (p.elementHoldStart > 0 && p.unlockedElements.length >= 2) {
        // Quick tap (held less than 3s) — do normal element attack
        const held = (Date.now() - p.elementHoldStart) / 1000;
        p.elementHoldStart = 0;
        if (held < WHEEL_HOLD_TIME) {
          if (p.element) {
            if (p.elementCooldown > 0) {
              const cd = Math.ceil(p.elementCooldown);
              state.effects.push({ type: 'pickup', x: p.x, y: p.y - 30, t: 1, text: `COOLDOWN ${cd}s`, color: '#94a3b8' });
            } else {
              performElementAttack(state);
            }
          }
        }
      }
    }
  });

  dom.canvas.addEventListener('mousemove', (e) => {
    const rect = dom.canvas.getBoundingClientRect();
    state.mouse.x = (e.clientX - rect.left) * (dom.canvas.width / rect.width);
    state.mouse.y = (e.clientY - rect.top) * (dom.canvas.height / rect.height);
  });

  dom.canvas.addEventListener('click', () => {
    if (state.mode !== 'playing' || state.dialogueOpen || state.insideShop) return;

    // Element wheel click — select hovered element
    if (state.player.elementWheelOpen && state._wheelHoveredElement) {
      const chosen = state._wheelHoveredElement;
      state.player.element = chosen;
      state.player.elementCooldown = 0;
      state.player.elementWheelOpen = false;
      state.player.elementHoldStart = 0;
      const labels = { fire: '🔥 FIRE', lightning: '⚡ LIGHTNING', water: '🌊 WATER' };
      const colors = { fire: '#ef4444', lightning: '#facc15', water: '#38bdf8' };
      state.effects.push({ type: 'pickup', x: state.player.x, y: state.player.y - 40, t: 2, text: labels[chosen] + ' SELECTED!', color: colors[chosen] });
      return;
    }

    if (state.arenaMode && !state.arenaActive && state.arenaSelectedMob) {
      const sel = state.arenaSelectedMob;
      if (sel.startsWith('boss_')) {
        const lv = parseInt(sel.split('_')[1], 10);
        const boss = getBoss(lv);
        if (boss) spawnBoss(state, boss, state.mouse.x, state.mouse.y - 20, lv);
      } else {
        spawnEnemy(state, sel, state.mouse.x, state.mouse.y - 20, 1.1);
      }
      return;
    }

    if (state.bowMode) {
      const target = state.enemies.find((enemy) => enemy.alive && state.mouse.x >= enemy.x - enemy.w / 2 && state.mouse.x <= enemy.x + enemy.w / 2 && state.mouse.y >= enemy.y && state.mouse.y <= enemy.y + enemy.h);
      if (target) {
        state.bowTarget = target;
        dom.bow.textContent = 'TARGET LOCKED - PRESS R TO FIRE';
      }
      return;
    }

    performSwordAttack(state);
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === 'training-btn') startTraining();
    if (target.id === 'start-btn') startAdventure();
    if (target.id === 'arena-btn') enterArena();
    if (target.id === 'find-level-btn') openFinder();
    if (target.id === 'go-level-btn') goToLevelFromFinder();
    if (target.id === 'cancel-level-btn') dom.levelFinder.classList.add('hidden');
    if (target.id === 'title-map-btn') openWorldMap(true);
    if (target.id === 'resume-btn') closePause();
    if (target.id === 'map-btn') {
      closePause();
      openWorldMap();
    }
    if (target.id === 'quit-btn') {
      hidePanels(dom);
      setMode('title');
    }
    if (target.id === 'close-map-btn') closeWorldMap();

    // Element picker
    if (target.dataset.element) {
      const elem = target.dataset.element;
      if (['fire', 'lightning', 'water'].includes(elem)) {
        state.player.element = elem;
        if (!state.player.unlockedElements.includes(elem)) {
          state.player.unlockedElements.push(elem);
        }
        state.player.elementCooldown = 0;
        dom.elementPicker.classList.add('hidden');
        state._showElementPicker = false;
        const labels = { fire: '🔥 FIRE', lightning: '⚡ LIGHTNING', water: '🌊 WATER' };
        state.effects.push({ type: 'pickup', x: state.player.x, y: state.player.y - 40, t: 2, text: labels[elem] + ' CHOSEN!', color: elem === 'fire' ? '#ef4444' : elem === 'lightning' ? '#facc15' : '#38bdf8' });
      }
    }

    if (target.id === 'arena-start-btn') {
      applyArenaSetup(dom, state);
      state.arenaActive = true;
      dom.arenaUI.classList.add('hidden');
    }
    if (target.id === 'arena-clear-btn') state.enemies.length = 0;
    if (target.id === 'arena-exit-btn') {
      state.arenaMode = false;
      state.arenaActive = false;
      state.enemies.length = 0;
      hidePanels(dom);
      setMode('title');
    }

    if (target.dataset.mob) {
      state.arenaSelectedMob = target.dataset.mob;
      renderArenaPool(dom, state);
    }

    if (target.dataset.area) {
      const areaId = target.dataset.area;
      if (!WORLD_AREAS[areaId].unlocked) return;
      state.currentArea = areaId;
      state._mapFromTitle = false;
      setupLevel(state, dom.canvas, WORLD_AREAS[areaId].start + Math.max(1, state.worldProgress[areaId] || 1));
      closeWorldMap();
      setMode('playing');
      updatePotionSlots(dom, state);
    }

    if (target.dataset.shop) {
      if (target.dataset.shop === 'close') closeShop(state, dom);
      else openShop(state, dom, target.dataset.shop);
    }

    if (target.dataset.buy) {
      handleShopAction(state, target.dataset.buy);
      if (state.shopType) openShop(state, dom, state.shopType);
      updatePotionSlots(dom, state);
      saveGame(state);
    }

    if (target.classList.contains('potion-slot')) {
      const slot = Number(target.dataset.slot);
      usePotionSlot(state, slot);
      updatePotionSlots(dom, state);
    }
  });

  dom.levelInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goToLevelFromFinder();
  });
}

function init() {
  bindInputs();
  setMode('title');
  refreshTitleActionButton();
  updatePotionSlots(dom, state);
  updateHUD(dom, state, 'TRAINING');
  addPotionToSlots(state, 'healing');
  updatePotionSlots(dom, state);
  requestAnimationFrame(loop);
  setInterval(() => {
    if (state.mode === 'playing') saveGame(state);
  }, 15000);
}

init();
