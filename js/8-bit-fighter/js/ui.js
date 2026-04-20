import { ARENA_POOL, ARROW_TYPES, BOW_TYPES, BOSSES, MATERIALS, POTIONS, WORLD_AREAS, LEVEL_NAMES, VOID_LEVEL_NAMES, getBoss } from './data.js';

export function getDom() {
  const potionSlots = document.getElementById('potion-slots');
  for (let i = 0; i < 5; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'potion-slot';
    slot.dataset.slot = String(i);
    slot.innerHTML = `<span class="potion-key">${i + 1}</span>`;
    potionSlots.appendChild(slot);
  }

  return {
    canvas: document.getElementById('game'),
    title: document.getElementById('title-screen'),
    hud: document.getElementById('hud'),
    levelName: document.getElementById('level-name'),
    hpFill: document.getElementById('hp-fill'),
    hpText: document.getElementById('hp-text'),
    forceText: document.getElementById('forcefield-text'),
    arrows: document.getElementById('arrows'),
    money: document.getElementById('money'),
    gear: document.getElementById('gear'),
    party: document.getElementById('party'),
    tutorialHint: document.getElementById('tutorial-hint'),
    dialogue: document.getElementById('dialogue'),
    bow: document.getElementById('bow-indicator'),
    potionSlots,
    levelFinder: document.getElementById('level-finder'),
    levelInput: document.getElementById('level-name-input'),
    arenaUI: document.getElementById('arena-ui'),
    arenaMobs: document.getElementById('arena-mobs'),
    arenaBosses: document.getElementById('arena-bosses'),
    arenaElement: document.getElementById('arena-element'),
    arenaSword: document.getElementById('arena-sword'),
    arenaBow: document.getElementById('arena-bow'),
    arenaArrow: document.getElementById('arena-arrow'),
    arenaShield: document.getElementById('arena-shield'),
    arenaArmor: document.getElementById('arena-armor'),
    arenaHelmet: document.getElementById('arena-helmet'),
    arenaJetpack: document.getElementById('arena-jetpack'),
    arenaForcefield: document.getElementById('arena-forcefield'),
    arenaHp: document.getElementById('arena-hp'),
    arenaHpVal: document.getElementById('arena-hp-val'),
    arenaArrows: document.getElementById('arena-arrows'),
    arenaArrowsVal: document.getElementById('arena-arrows-val'),
    shopPanel: document.getElementById('shop-panel'),
    pauseMenu: document.getElementById('pause-menu'),
    equipmentView: document.getElementById('equipment-view'),
    worldMap: document.getElementById('world-map'),
    worldCards: document.getElementById('world-cards'),
    worldMapCanvas: document.getElementById('world-map-canvas'),
    worldMapLabels: document.getElementById('world-map-labels'),
    elementPicker: document.getElementById('element-picker'),
    elementHud: document.getElementById('element-hud'),
    questHud: document.getElementById('quest-hud')
  };
}

export function updateHUD(dom, state, levelNameText) {
  dom.levelName.textContent = levelNameText;
  const hpPct = Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100));
  dom.hpFill.style.width = `${hpPct}%`;
  dom.hpText.textContent = `${Math.max(0, Math.ceil(state.player.hp))}/${state.player.maxHp}`;
  dom.arrows.textContent = String(state.player.arrows);
  dom.money.textContent = String(Math.floor(state.player.money));
  dom.gear.textContent = state.player.swordMaterial === 'light' ? '✨ SWORD OF LIGHT' : `${state.player.swordMaterial.toUpperCase()} Lv${state.player.swordLevel}`;
  dom.party.textContent = `${1 + state.companions.length}/5`;

  if (!state.player.hasForceField) dom.forceText.textContent = 'OFF';
  else if (state.player.forceFieldActive) dom.forceText.textContent = `${Math.ceil(state.player.forceFieldHP)}/${state.player.forceFieldMaxHP}`;
  else dom.forceText.textContent = `RESPAWN ${Math.ceil(state.player.forceFieldRespawn)}s`;

  // Quest HUD
  if (dom.questHud) {
    if (state.activeQuest) {
      const q = state.activeQuest;
      dom.questHud.textContent = `📜 ${q.desc}: ${state.questProgress}/${q.count}`;
      dom.questHud.style.display = '';
      dom.questHud.style.color = state.questProgress >= q.count ? '#22c55e' : '#facc15';
    } else {
      dom.questHud.style.display = 'none';
    }
  }
}

export function setPlayingUI(dom, visible) {
  dom.hud.classList.toggle('hidden', !visible);
  dom.potionSlots.classList.toggle('hidden', !visible);
}

export function showTutorialHint(dom, text) {
  if (!text) {
    dom.tutorialHint.classList.add('hidden');
    return;
  }
  dom.tutorialHint.textContent = text;
  dom.tutorialHint.classList.remove('hidden');
}

export function setDialogue(dom, lines) {
  if (!lines || !lines.length) {
    dom.dialogue.classList.add('hidden');
    dom.dialogue.innerHTML = '';
    return;
  }
  dom.dialogue.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
  dom.dialogue.classList.remove('hidden');
}

export function updatePotionSlots(dom, state) {
  const slots = [...dom.potionSlots.querySelectorAll('.potion-slot')];
  slots.forEach((slot, index) => {
    if (index >= state.player.maxPotionSlots) {
      slot.classList.add('hidden');
      return;
    }
    slot.classList.remove('hidden');
    const type = state.player.potionSlots[index];
    slot.style.borderColor = '#475569';
    slot.innerHTML = `<span class="potion-key">${index + 1}</span>`;
    if (type && POTIONS[type]) {
      slot.style.borderColor = POTIONS[type].color;
      slot.innerHTML = `${POTIONS[type].icon}<span class="potion-key">${index + 1}</span>`;
    }
  });
}

export function renderArenaPool(dom, state) {
  dom.arenaMobs.innerHTML = '';
  ARENA_POOL.forEach((mob) => {
    const btn = document.createElement('button');
    btn.className = `mob-item ${state.arenaSelectedMob === mob ? 'selected' : ''}`;
    btn.textContent = mob.toUpperCase().replaceAll('_', ' ');
    btn.dataset.mob = mob;
    dom.arenaMobs.appendChild(btn);
  });
  dom.arenaBosses.innerHTML = '';
  // Show defined bosses and sample generated ones
  const bossLevels = Object.keys(BOSSES).map(Number);
  // Also show some generated bosses at higher levels
  for (let lv = 110; lv <= 290; lv += 30) bossLevels.push(lv);
  for (let lv = 310; lv <= 590; lv += 40) bossLevels.push(lv);
  bossLevels.sort((a, b) => a - b);
  bossLevels.forEach((lv) => {
    const boss = getBoss(lv);
    if (!boss) return;
    const id = 'boss_' + lv;
    const btn = document.createElement('button');
    btn.className = `mob-item boss-item ${state.arenaSelectedMob === id ? 'selected' : ''}`;
    btn.textContent = `LV${lv} ${boss.name}`;
    btn.dataset.mob = id;
    dom.arenaBosses.appendChild(btn);
  });
}

export function initArenaSetup(dom, state) {
  // Populate sword material dropdown
  dom.arenaSword.innerHTML = MATERIALS.map(m => {
    if (m === 'light') {
      const unlocked = state && state.player.hasSwordOfLight;
      return `<option value="${m}" ${unlocked ? '' : 'disabled'}>${unlocked ? '✨ SWORD OF LIGHT' : '??? (LOCKED)'}</option>`;
    }
    return `<option value="${m}">${m.toUpperCase()}</option>`;
  }).join('');

  // Populate shield / armor / helmet material dropdowns
  [dom.arenaShield, dom.arenaArmor, dom.arenaHelmet].forEach(sel => {
    const existing = sel.querySelector('option[value=""]');
    sel.innerHTML = '<option value="">NONE</option>' + MATERIALS.filter(m => m !== 'light').map(m =>
      `<option value="${m}">${m.toUpperCase()}</option>`
    ).join('');
  });

  // Populate bow dropdown
  dom.arenaBow.innerHTML = Object.entries(BOW_TYPES).map(([k, v]) => {
    if (k === 'light') {
      const unlocked = state && state.player.hasBowOfLight;
      return `<option value="${k}" ${unlocked ? '' : 'disabled'}>${unlocked ? '✨ BOW OF LIGHT' : '??? (LOCKED)'}</option>`;
    }
    return `<option value="${k}">${v.name}</option>`;
  }).join('');

  // Populate arrow type dropdown
  dom.arenaArrow.innerHTML = Object.entries(ARROW_TYPES).map(([k, v]) =>
    `<option value="${k}">${v.name}</option>`
  ).join('');

  // HP slider live display
  dom.arenaHp.addEventListener('input', () => {
    dom.arenaHpVal.textContent = dom.arenaHp.value;
  });

  // Arrows slider live display
  dom.arenaArrows.addEventListener('input', () => {
    dom.arenaArrowsVal.textContent = dom.arenaArrows.value;
  });
}

export function applyArenaSetup(dom, state) {
  // Element — arena gives you all elements
  const elem = dom.arenaElement.value;
  state.player.element = elem || null;
  if (elem && !state.player.unlockedElements.includes(elem)) {
    state.player.unlockedElements.push(elem);
  }
  // In arena, unlock all selected elements for the wheel
  state.player.unlockedElements = ['fire', 'lightning', 'water'];
  state.player.elementCooldown = 0;

  // Sword material
  state.player.swordMaterial = dom.arenaSword.value;
  state.player.swordLevel = 1;

  // Shield
  const shield = dom.arenaShield.value;
  state.player.shieldMaterial = shield || null;
  state.player.shieldLevel = shield ? 1 : 0;

  // Armor
  const armor = dom.arenaArmor.value;
  state.player.armorMaterial = armor || null;
  state.player.armorLevel = armor ? 1 : 0;

  // Helmet
  const helmet = dom.arenaHelmet.value;
  state.player.helmetMaterial = helmet || null;
  state.player.helmetLevel = helmet ? 1 : 0;

  // Bow & Arrow type
  state.player.bowType = dom.arenaBow.value;
  state.player.arrowType = dom.arenaArrow.value;

  // Jetpack
  state.player.hasJetpack = dom.arenaJetpack.checked;
  if (state.player.hasJetpack) {
    state.player.jetpackFuel = state.player.maxJetpackFuel;
  }

  // Force field
  state.player.hasForceField = dom.arenaForcefield.checked;
  if (state.player.hasForceField) {
    state.player.forceFieldActive = true;
    state.player.forceFieldHP = state.player.forceFieldMaxHP;
    state.player.forceFieldRespawn = 0;
  }

  // HP
  const hp = parseInt(dom.arenaHp.value, 10) || 20;
  state.player.maxHp = hp;
  state.player.hp = hp;

  // Arrows
  state.player.arrows = parseInt(dom.arenaArrows.value, 10) || 10;
}

export function renderWorldMap(dom, state) {
  /* ── Parchment-style world map ── */
  const cvs = dom.worldMapCanvas;
  const wrap = cvs.parentElement;
  const W = Math.max(wrap.clientWidth, 800) || 1200;
  const H = Math.max(wrap.clientHeight, 600) || 800;
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let seed = 42;
  const srand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  const halfW = Math.floor(W / 2);
  const halfH = Math.floor(H / 2);

  const regions = [
    { key: 'grassy',    x: 0,     y: 0,     w: halfW, h: halfH },
    { key: 'lava',      x: halfW, y: 0,     w: W - halfW, h: halfH },
    { key: 'ice',       x: 0,     y: halfH, w: halfW, h: H - halfH },
    { key: 'lightning',  x: halfW, y: halfH, w: W - halfW, h: H - halfH }
  ];

  // Region tint colors (for subtle shading on the parchment)
  const regionTints = {
    grassy:    [34, 80, 34],
    lava:      [100, 40, 20],
    ice:       [30, 60, 100],
    lightning: [50, 30, 80]
  };

  // ── 1. Parchment background ──
  // Base parchment color
  const baseR = 215, baseG = 195, baseB = 160;
  seed = 1;
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const noise = (srand() - 0.5) * 25;
      // Darken edges for old paper look
      const edgeDist = Math.min(x, W - x, y, H - y);
      const edgeDarken = Math.max(0, 1 - edgeDist / 80) * 40;
      // Subtle region tinting
      const tx = x / W, ty = y / H;
      const tL = tx < 0.5 ? 1 - tx * 2 : (tx - 0.5) * 2;
      const tT = ty < 0.5 ? 1 - ty * 2 : (ty - 0.5) * 2;
      // Find dominant region
      const ri = (tx < 0.5 ? 0 : 1) + (ty < 0.5 ? 0 : 2);
      const tint = regionTints[regions[ri].key];
      const tintStr = 0.12;
      const r = Math.max(0, Math.min(255, baseR + noise - edgeDarken + tint[0] * tintStr));
      const g = Math.max(0, Math.min(255, baseG + noise - edgeDarken + tint[1] * tintStr));
      const b = Math.max(0, Math.min(255, baseB + noise - edgeDarken - 10 + tint[2] * tintStr));
      px(x, y, 4, 4, `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`);
    }
  }

  // ── 2. Parchment stains / age spots ──
  seed = 77;
  for (let i = 0; i < 15; i++) {
    const sx = srand() * W, sy = srand() * H, sr = 20 + srand() * 60;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    grad.addColorStop(0, `rgba(${160 + srand()*30},${140 + srand()*20},${100 + srand()*20},0.15)`);
    grad.addColorStop(1, 'rgba(200,180,150,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }

  // ── 3. Region boundary lines (hand-drawn dashed) ──
  const INK = 'rgba(80,55,30,0.5)';
  const INK_STRONG = 'rgba(80,55,30,0.8)';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  // Vertical divider
  seed = 200;
  ctx.beginPath();
  ctx.moveTo(halfW, 0);
  for (let y = 0; y < H; y += 8) {
    ctx.lineTo(halfW + (srand() - 0.5) * 3, y);
  }
  ctx.stroke();
  // Horizontal divider
  ctx.beginPath();
  ctx.moveTo(0, halfH);
  for (let x = 0; x < W; x += 8) {
    ctx.lineTo(x, halfH + (srand() - 0.5) * 3);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // ── 4. Compass rose (top-right corner) ──
  const compX = W - 60, compY = 50;
  ctx.save();
  ctx.translate(compX, compY);
  ctx.strokeStyle = INK_STRONG;
  ctx.fillStyle = INK_STRONG;
  ctx.lineWidth = 1.5;
  // N-S line
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, 22); ctx.stroke();
  // E-W line
  ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, 0); ctx.stroke();
  // Arrow tips
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-4, -14); ctx.lineTo(4, -14); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(14, -4); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
  // Labels
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -26);
  ctx.fillText('S', 0, 30);
  ctx.fillText('E', 28, 3);
  ctx.fillText('W', -28, 3);
  // Circle
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(80,55,30,0.3)'; ctx.stroke();
  ctx.restore();

  // ── 5. Mountain ranges (hand-drawn triangles) ──
  const drawMountain = (mx, my, mw, mh, filled) => {
    ctx.strokeStyle = INK_STRONG;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx, my + mh);
    ctx.lineTo(mx + mw / 2, my);
    ctx.lineTo(mx + mw, my + mh);
    if (filled) {
      ctx.closePath();
      ctx.fillStyle = 'rgba(80,55,30,0.15)';
      ctx.fill();
    }
    ctx.stroke();
    // Snow cap on tall mountains
    if (mh > 20) {
      ctx.strokeStyle = 'rgba(80,55,30,0.4)';
      ctx.lineWidth = 1;
      const capH = mh * 0.3;
      ctx.beginPath();
      ctx.moveTo(mx + mw * 0.35, my + capH);
      ctx.lineTo(mx + mw * 0.5, my);
      ctx.lineTo(mx + mw * 0.65, my + capH);
      ctx.stroke();
    }
    // Shadow hatching on right side
    ctx.strokeStyle = 'rgba(80,55,30,0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const hy = my + mh * (0.4 + i * 0.15);
      const hx = mx + mw * 0.55 + i * 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + mw * 0.1, hy + mh * 0.08);
      ctx.stroke();
    }
  };

  // Mountain ranges per region
  seed = 300;
  // Grassy: rolling hills with a few peaks
  for (let i = 0; i < 7; i++) {
    const mx = 30 + srand() * (halfW - 80), my = 60 + srand() * (halfH * 0.4);
    drawMountain(mx, my, 18 + srand() * 20, 14 + srand() * 18, srand() > 0.3);
    if (srand() > 0.5) drawMountain(mx + 14, my + 4, 14 + srand() * 12, 10 + srand() * 12, true);
  }
  // Lava: jagged volcanic peaks
  for (let i = 0; i < 9; i++) {
    const mx = halfW + 30 + srand() * (halfW - 80), my = 40 + srand() * (halfH * 0.35);
    const mh = 20 + srand() * 28;
    drawMountain(mx, my, 14 + srand() * 16, mh, true);
    // Smoke/steam wisp from volcano
    if (srand() > 0.5) {
      ctx.strokeStyle = 'rgba(80,55,30,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const tipX = mx + 8 + srand() * 6, tipY = my - 2;
      ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo(tipX + (srand()-0.5)*10, tipY - 10, tipX + (srand()-0.5)*8, tipY - 18);
      ctx.stroke();
    }
  }
  // Ice: big frozen peaks
  for (let i = 0; i < 6; i++) {
    const mx = 20 + srand() * (halfW - 70), my = halfH + 40 + srand() * ((H - halfH) * 0.3);
    drawMountain(mx, my, 22 + srand() * 24, 22 + srand() * 24, srand() > 0.4);
  }
  // Lightning: spiky crags
  for (let i = 0; i < 8; i++) {
    const mx = halfW + 20 + srand() * (halfW - 70), my = halfH + 30 + srand() * ((H - halfH) * 0.35);
    drawMountain(mx, my, 12 + srand() * 14, 16 + srand() * 22, true);
  }

  // ── 6. Rivers (hand-drawn curves) ──
  const drawRiver = (pts, width) => {
    ctx.strokeStyle = 'rgba(50,90,140,0.5)';
    ctx.lineWidth = width || 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i][0] + pts[i + 1][0]) / 2;
      const yc = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
    }
    ctx.lineTo(pts[pts.length-1][0], pts[pts.length-1][1]);
    ctx.stroke();
    // Ink outline
    ctx.strokeStyle = 'rgba(50,70,100,0.25)';
    ctx.lineWidth = (width || 2.5) + 1.5;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i][0] + pts[i + 1][0]) / 2;
      const yc = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
    }
    ctx.lineTo(pts[pts.length-1][0], pts[pts.length-1][1]);
    ctx.stroke();
    // Flow lines
    ctx.strokeStyle = 'rgba(50,90,140,0.2)';
    ctx.lineWidth = 1;
    for (let i = 1; i < pts.length - 1; i += 2) {
      ctx.beginPath();
      ctx.arc(pts[i][0] + 1, pts[i][1], 3, 0, Math.PI, false);
      ctx.stroke();
    }
  };

  // Grassy region river (flows top to bottom-right)
  seed = 500;
  {
    const rPts = [];
    const startX = halfW * 0.3;
    for (let i = 0; i < 10; i++) {
      rPts.push([startX + (srand()-0.3) * halfW * 0.4, 20 + i * (halfH - 30) / 9]);
    }
    drawRiver(rPts, 3);
    // Small tributary
    const tPts = [];
    const branchI = 4;
    const bx = rPts[branchI][0], by = rPts[branchI][1];
    for (let i = 0; i < 5; i++) {
      tPts.push([bx - 20 - i * 15 + srand() * 8, by - 10 + srand() * 20 - i * 5]);
    }
    drawRiver(tPts, 1.5);
  }

  // Lava region: lava flow river (red/orange tint)
  seed = 550;
  {
    ctx.save();
    const lPts = [];
    const startX = halfW + halfW * 0.5;
    for (let i = 0; i < 8; i++) {
      lPts.push([startX + (srand()-0.5) * halfW * 0.35, 30 + i * (halfH - 50) / 7]);
    }
    ctx.strokeStyle = 'rgba(160,60,20,0.45)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lPts[0][0], lPts[0][1]);
    for (let i = 1; i < lPts.length - 1; i++) {
      const xc = (lPts[i][0] + lPts[i + 1][0]) / 2;
      const yc = (lPts[i][1] + lPts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(lPts[i][0], lPts[i][1], xc, yc);
    }
    ctx.lineTo(lPts[lPts.length-1][0], lPts[lPts.length-1][1]);
    ctx.stroke();
    // Lava glow
    ctx.strokeStyle = 'rgba(200,80,20,0.2)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(lPts[0][0], lPts[0][1]);
    for (let i = 1; i < lPts.length - 1; i++) {
      const xc = (lPts[i][0] + lPts[i + 1][0]) / 2;
      const yc = (lPts[i][1] + lPts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(lPts[i][0], lPts[i][1], xc, yc);
    }
    ctx.lineTo(lPts[lPts.length-1][0], lPts[lPts.length-1][1]);
    ctx.stroke();
    ctx.restore();
  }

  // Ice region: frozen river
  seed = 600;
  {
    const iPts = [];
    const startX = halfW * 0.6;
    for (let i = 0; i < 8; i++) {
      iPts.push([startX + (srand()-0.5) * halfW * 0.3, halfH + 40 + i * ((H - halfH) - 60) / 7]);
    }
    ctx.strokeStyle = 'rgba(80,130,180,0.35)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.setLineDash([6,4]);
    ctx.beginPath();
    ctx.moveTo(iPts[0][0], iPts[0][1]);
    for (let i = 1; i < iPts.length - 1; i++) {
      const xc = (iPts[i][0] + iPts[i + 1][0]) / 2;
      const yc = (iPts[i][1] + iPts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(iPts[i][0], iPts[i][1], xc, yc);
    }
    ctx.lineTo(iPts[iPts.length-1][0], iPts[iPts.length-1][1]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── 7. Ponds & Lakes ──
  const drawPond = (cx, cy, rx, ry, isLava) => {
    // Outline
    ctx.strokeStyle = isLava ? 'rgba(160,60,20,0.5)' : 'rgba(50,80,120,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Fill
    ctx.fillStyle = isLava ? 'rgba(180,70,20,0.12)' : 'rgba(60,100,160,0.12)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wave lines
    ctx.strokeStyle = isLava ? 'rgba(160,60,20,0.25)' : 'rgba(50,80,120,0.25)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.5, cy + i * ry * 0.3);
      ctx.quadraticCurveTo(cx, cy + i * ry * 0.3 - 3, cx + rx * 0.5, cy + i * ry * 0.3);
      ctx.stroke();
    }
  };

  seed = 700;
  // Grassy pond
  drawPond(halfW * 0.7, halfH * 0.65, 22 + srand() * 12, 12 + srand() * 8, false);
  drawPond(halfW * 0.35, halfH * 0.8, 14 + srand() * 8, 8 + srand() * 5, false);
  // Lava pool
  drawPond(halfW + halfW * 0.65, halfH * 0.7, 18 + srand() * 10, 10 + srand() * 6, true);
  // Frozen lake
  drawPond(halfW * 0.45, halfH + (H - halfH) * 0.6, 30 + srand() * 15, 16 + srand() * 10, false);

  // ── 8. Trees (hand-drawn icons) ──
  const drawTree = (tx, ty, size) => {
    ctx.strokeStyle = INK_STRONG;
    ctx.lineWidth = 1;
    // Trunk
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - size * 0.4); ctx.stroke();
    // Canopy (circle)
    ctx.beginPath(); ctx.arc(tx, ty - size * 0.55, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,100,40,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,80,30,0.6)';
    ctx.stroke();
  };

  const drawPineTree = (tx, ty, size) => {
    ctx.strokeStyle = INK_STRONG;
    ctx.lineWidth = 1;
    // Trunk
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - size * 0.3); ctx.stroke();
    // Triangle canopy
    ctx.beginPath();
    ctx.moveTo(tx, ty - size);
    ctx.lineTo(tx - size * 0.3, ty - size * 0.2);
    ctx.lineTo(tx + size * 0.3, ty - size * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(40,80,50,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,70,40,0.6)';
    ctx.stroke();
  };

  seed = 800;
  // Grassy forests
  for (let i = 0; i < 20; i++) {
    const tx = 15 + srand() * (halfW - 30), ty = 70 + srand() * (halfH - 90);
    if (srand() > 0.4) drawTree(tx, ty, 10 + srand() * 8);
    else drawPineTree(tx, ty, 10 + srand() * 6);
  }
  // Ice region pines
  for (let i = 0; i < 12; i++) {
    const tx = 15 + srand() * (halfW - 30), ty = halfH + 60 + srand() * ((H-halfH) - 90);
    drawPineTree(tx, ty, 8 + srand() * 6);
  }
  // Lightning sparse dead trees
  for (let i = 0; i < 6; i++) {
    const tx = halfW + 20 + srand() * (halfW - 40), ty = halfH + 70 + srand() * ((H-halfH) - 100);
    ctx.strokeStyle = 'rgba(80,55,30,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - 10); 
    ctx.lineTo(tx - 4, ty - 14); ctx.moveTo(tx, ty - 10);
    ctx.lineTo(tx + 3, ty - 13); ctx.stroke();
  }

  // ── 9. Region icons/symbols ──
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillStyle = INK_STRONG;
  ctx.textAlign = 'center';

  // Small decorative dots for grass
  seed = 900;
  for (let i = 0; i < 30; i++) {
    const dx = 10 + srand() * (halfW - 20), dy = 50 + srand() * (halfH - 60);
    ctx.fillStyle = 'rgba(60,100,40,0.25)';
    ctx.fillRect(dx, dy, 2, 2);
  }
  // Lava region: small flame symbols
  for (let i = 0; i < 12; i++) {
    const fx = halfW + 20 + srand() * (halfW - 40), fy = 80 + srand() * (halfH - 100);
    ctx.strokeStyle = 'rgba(160,60,20,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx - 3, fy - 8, fx, fy - 12);
    ctx.quadraticCurveTo(fx + 3, fy - 8, fx, fy); ctx.stroke();
  }
  // Ice: snowflake dots
  for (let i = 0; i < 20; i++) {
    const sx = 10 + srand() * (halfW - 20), sy = halfH + 30 + srand() * ((H-halfH) - 40);
    ctx.strokeStyle = 'rgba(80,130,180,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy - 3); ctx.lineTo(sx, sy + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 3, sy); ctx.lineTo(sx + 3, sy); ctx.stroke();
  }
  // Lightning: bolt symbols
  for (let i = 0; i < 8; i++) {
    const bx = halfW + 25 + srand() * (halfW - 50), by = halfH + 50 + srand() * ((H-halfH) - 70);
    ctx.strokeStyle = 'rgba(120,80,180,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 3, by + 5);
    ctx.lineTo(bx + 1, by + 5); ctx.lineTo(bx - 2, by + 10); ctx.stroke();
  }

  // ── 10. Dotted travel paths ──
  regions.forEach((r, ri) => {
    seed = 1000 + ri * 100;
    const area = WORLD_AREAS[r.key];
    const unlocked = area.unlocked;
    ctx.strokeStyle = unlocked ? 'rgba(80,55,30,0.5)' : 'rgba(80,55,30,0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(r.x + 10, r.y + r.h * 0.6);
    ctx.bezierCurveTo(
      r.x + r.w * 0.3, r.y + r.h * 0.5,
      r.x + r.w * 0.7, r.y + r.h * 0.7,
      r.x + r.w - 10, r.y + r.h * 0.6
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Locked overlay (parchment style)
    if (!unlocked) {
      ctx.fillStyle = 'rgba(215,195,160,0.6)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // Lock icon drawn with ink
      const lx = r.x + r.w/2, ly = r.y + r.h/2;
      ctx.strokeStyle = INK_STRONG;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(lx, ly - 6, 7, Math.PI, 0); ctx.stroke();
      ctx.strokeRect(lx - 8, ly - 2, 16, 12);
      ctx.fillStyle = INK_STRONG;
      ctx.fillRect(lx - 2, ly + 2, 4, 4);
    }
  });

  // ── 11. Border frame (torn/burnt edges) ──
  ctx.strokeStyle = 'rgba(80,55,30,0.6)';
  ctx.lineWidth = 3;
  seed = 1200;
  // Top edge
  ctx.beginPath(); ctx.moveTo(0, 3);
  for (let x = 0; x < W; x += 6) ctx.lineTo(x, 3 + (srand()-0.5)*4);
  ctx.stroke();
  // Bottom edge
  ctx.beginPath(); ctx.moveTo(0, H - 3);
  for (let x = 0; x < W; x += 6) ctx.lineTo(x, H - 3 + (srand()-0.5)*4);
  ctx.stroke();
  // Left edge
  ctx.beginPath(); ctx.moveTo(3, 0);
  for (let y = 0; y < H; y += 6) ctx.lineTo(3 + (srand()-0.5)*4, y);
  ctx.stroke();
  // Right edge
  ctx.beginPath(); ctx.moveTo(W - 3, 0);
  for (let y = 0; y < H; y += 6) ctx.lineTo(W - 3 + (srand()-0.5)*4, y);
  ctx.stroke();

  // Corner decorations
  const cornerSize = 20;
  ctx.strokeStyle = 'rgba(80,55,30,0.5)';
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath(); ctx.moveTo(5, cornerSize); ctx.lineTo(5, 5); ctx.lineTo(cornerSize, 5); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(W-cornerSize, 5); ctx.lineTo(W-5, 5); ctx.lineTo(W-5, cornerSize); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(5, H-cornerSize); ctx.lineTo(5, H-5); ctx.lineTo(cornerSize, H-5); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(W-cornerSize, H-5); ctx.lineTo(W-5, H-5); ctx.lineTo(W-5, H-cornerSize); ctx.stroke();

  /* ── HTML labels overlay ── */
  const labels = dom.worldMapLabels;
  labels.innerHTML = '';

  regions.forEach((r) => {
    const area = WORLD_AREAS[r.key];
    const unlocked = area.unlocked;
    const pctX = ((r.x + r.w / 2) / W * 100).toFixed(1);
    const pctYName = ((r.y + r.h * 0.12) / H * 100).toFixed(1);
    const pctYRange = ((r.y + r.h * 0.22) / H * 100).toFixed(1);

    // Region name
    const nameEl = document.createElement('div');
    nameEl.className = `map-label region-name ${unlocked ? '' : 'locked-label'}`;
    nameEl.style.left = pctX + '%';
    nameEl.style.top = pctYName + '%';
    nameEl.textContent = `${area.icon} ${area.name}`;
    labels.appendChild(nameEl);

    // Level range
    const rangeEl = document.createElement('div');
    rangeEl.className = `map-label ${unlocked ? '' : 'locked-label'}`;
    rangeEl.style.left = pctX + '%';
    rangeEl.style.top = pctYRange + '%';
    rangeEl.textContent = `LV ${area.start}\u2013${area.end}`;
    labels.appendChild(rangeEl);

    // Progress or lock
    if (unlocked) {
      const progEl = document.createElement('div');
      progEl.className = 'map-label';
      progEl.style.left = pctX + '%';
      progEl.style.top = ((r.y + r.h * 0.88) / H * 100).toFixed(1) + '%';
      progEl.textContent = `${state.worldProgress[r.key] || 0}/300`;
      labels.appendChild(progEl);
    } else {
      const lockEl = document.createElement('div');
      lockEl.className = 'map-label locked-label';
      lockEl.style.left = pctX + '%';
      lockEl.style.top = ((r.y + r.h * 0.5) / H * 100).toFixed(1) + '%';
      lockEl.textContent = `\uD83D\uDD12 UNLOCK AT LV ${area.unlockAt}`;
      labels.appendChild(lockEl);
    }
  });

  // ── VOID / ??? region (overlaid on lightning quadrant corner) ──
  const voidArea = WORLD_AREAS.void;
  const voidCx = halfW + (W - halfW) * 0.82;
  const voidCy = halfH + (H - halfH) * 0.82;
  const voidR = Math.min(W, H) * 0.08;

  // Draw swirling void portal on canvas
  ctx.save();
  // Dark circle
  const voidGrad = ctx.createRadialGradient(voidCx, voidCy, 0, voidCx, voidCy, voidR);
  if (voidArea.unlocked) {
    voidGrad.addColorStop(0, 'rgba(20,0,40,0.9)');
    voidGrad.addColorStop(0.5, 'rgba(60,0,100,0.6)');
    voidGrad.addColorStop(1, 'rgba(100,40,160,0)');
  } else {
    voidGrad.addColorStop(0, 'rgba(40,30,20,0.7)');
    voidGrad.addColorStop(0.5, 'rgba(80,55,30,0.4)');
    voidGrad.addColorStop(1, 'rgba(80,55,30,0)');
  }
  ctx.fillStyle = voidGrad;
  ctx.beginPath();
  ctx.arc(voidCx, voidCy, voidR, 0, Math.PI * 2);
  ctx.fill();

  // Spiral lines
  ctx.strokeStyle = voidArea.unlocked ? 'rgba(140,60,220,0.5)' : 'rgba(80,55,30,0.3)';
  ctx.lineWidth = 1.5;
  for (let s = 0; s < 3; s++) {
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.15) {
      const sr = (a / (Math.PI * 4)) * voidR * 0.85;
      const angle = a + s * (Math.PI * 2 / 3);
      const sx = voidCx + Math.cos(angle) * sr;
      const sy = voidCy + Math.sin(angle) * sr;
      if (a === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Void label
  const voidPctX = (voidCx / W * 100).toFixed(1);
  const voidPctY = ((voidCy - voidR - 12) / H * 100).toFixed(1);
  const voidLabel = document.createElement('div');
  voidLabel.className = 'map-label';
  voidLabel.style.left = voidPctX + '%';
  voidLabel.style.top = voidPctY + '%';
  voidLabel.style.color = voidArea.unlocked ? '#a855f7' : 'rgba(80,55,30,0.6)';
  voidLabel.style.fontSize = '10px';
  voidLabel.style.textShadow = voidArea.unlocked ? '0 0 6px #7c3aed' : 'none';
  voidLabel.textContent = voidArea.unlocked ? '💀 THE ABYSS' : '???';
  labels.appendChild(voidLabel);

  if (voidArea.unlocked) {
    const voidProgLabel = document.createElement('div');
    voidProgLabel.className = 'map-label';
    voidProgLabel.style.left = voidPctX + '%';
    voidProgLabel.style.top = ((voidCy + voidR + 4) / H * 100).toFixed(1) + '%';
    voidProgLabel.style.color = '#a855f7';
    voidProgLabel.style.fontSize = '8px';
    voidProgLabel.textContent = `LV 1201-1250 (${state.worldProgress.void || 0}/50)`;
    labels.appendChild(voidProgLabel);
  }

  // Player marker
  let playerPctX, playerPctY;
  if (state.currentArea === 'void') {
    const voidProg = (state.worldProgress.void || 0) / 50;
    playerPctX = (voidCx / W * 100).toFixed(1);
    playerPctY = ((voidCy - voidR * (0.3 + voidProg * 0.4)) / H * 100).toFixed(1);
  } else {
    const curRegion = regions.find(r2 => r2.key === state.currentArea) || regions[0];
    const progress = (state.worldProgress[curRegion.key] || 0) / 300;
    playerPctX = ((curRegion.x + curRegion.w * (0.1 + progress * 0.8)) / W * 100).toFixed(1);
    playerPctY = ((curRegion.y + curRegion.h * 0.6) / H * 100).toFixed(1);
  }
  const marker = document.createElement('div');
  marker.className = 'map-player-marker';
  marker.style.left = playerPctX + '%';
  marker.style.top = playerPctY + '%';
  marker.title = 'YOU ARE HERE';
  labels.appendChild(marker);

  dom.worldCards.innerHTML = '';
}

export function renderEquipment(dom, state) {
  dom.equipmentView.innerHTML = `
    <div class="shop-items">
      <div class="shop-item">SWORD: ${state.player.swordMaterial.toUpperCase()} Lv${state.player.swordLevel}</div>
      <div class="shop-item">SHIELD: ${state.player.shieldMaterial ? `${state.player.shieldMaterial.toUpperCase()} Lv${state.player.shieldLevel}` : 'NONE'}</div>
      <div class="shop-item">ARMOR: ${state.player.armorMaterial ? `${state.player.armorMaterial.toUpperCase()} Lv${state.player.armorLevel}` : 'NONE'}</div>
      <div class="shop-item">HELMET: ${state.player.helmetMaterial ? `${state.player.helmetMaterial.toUpperCase()} Lv${state.player.helmetLevel}` : 'NONE'}</div>
      <div class="shop-item">BOW: ${state.player.bowType.toUpperCase()}</div>
      <div class="shop-item">ARROWS: ${state.player.arrowType.toUpperCase()}</div>
      <div class="shop-item">JETPACK: ${state.player.hasJetpack ? `YES (${Math.ceil(state.player.jetpackFuel)}/${state.player.maxJetpackFuel}s${state.player.jetpackUpgraded ? ' UPGRADED' : ''})` : 'NO'}</div>
      <div class="shop-item">FORCE FIELD: ${state.player.hasForceField ? `Lv${state.player.forceFieldLevel}` : 'NO'}</div>
      <div class="shop-item">MAX HP: ${state.player.maxHp} (${state.player.healthUpgrades || 0} upgrades)</div>
    </div>
  `;
}

export function renderShopMenu(dom, title, html) {
  dom.shopPanel.innerHTML = `<h2>${title}</h2>${html}`;
  dom.shopPanel.classList.remove('hidden');
}

export function hidePanels(dom) {
  dom.dialogue.classList.add('hidden');
  dom.shopPanel.classList.add('hidden');
  dom.levelFinder.classList.add('hidden');
  dom.arenaUI.classList.add('hidden');
  dom.pauseMenu.classList.add('hidden');
  dom.worldMap.classList.add('hidden');
  dom.elementPicker.classList.add('hidden');
}

export function resolveLevelNameInput(value, byNameMap) {
  const key = value.trim().toUpperCase();
  if (!key) return null;
  if (/^\d+$/.test(key)) return Number(key);
  if (byNameMap[key] !== undefined) return byNameMap[key];
  // Partial match fallback: find first key that contains the search string
  const partial = Object.keys(byNameMap).find(k => k.includes(key));
  if (partial) return byNameMap[partial];
  // Also try: search string words all appear in key (order-independent)
  const words = key.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    const wordMatch = Object.keys(byNameMap).find(k => words.every(w => k.includes(w)));
    if (wordMatch) return byNameMap[wordMatch];
  }
  // Direct search through source arrays as final fallback
  for (const [area, names] of Object.entries(LEVEL_NAMES)) {
    const start = WORLD_AREAS[area].start;
    for (let i = 0; i < names.length; i++) {
      const n = names[i].toUpperCase();
      if (n === key || n.includes(key)) {
        return area === 'grassy' ? i + 1 : start + i;
      }
    }
  }
  for (let i = 0; i < VOID_LEVEL_NAMES.length; i++) {
    const n = VOID_LEVEL_NAMES[i].toUpperCase();
    if (n === key || n.includes(key)) return 1201 + i;
  }
  return null;
}

export function buildLevelNameMap(max = 1250) {
  const map = {};
  for (let i = 0; i <= max; i += 1) {
    map[`LEVEL ${i}`] = i;
  }
  return map;
}

export function findBestMaterialToShow(state) {
  const index = Math.max(0, MATERIALS.indexOf(state.player.swordMaterial));
  return MATERIALS[index];
}
