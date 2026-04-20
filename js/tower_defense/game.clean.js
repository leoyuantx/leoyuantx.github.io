// Carrot Defense – clean rebuild
// Non-crossing serpentine road, visible dashed centerline
// Bomb power-up with 2s countdown that wipes all enemies

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const rosterCanvas = document.getElementById('enemyRoster');
  const rosterCtx = rosterCanvas.getContext('2d');
  const legendEl = document.getElementById('legend');
  // HUD elements outside the canvas
  const hudCoinsEl = document.getElementById('hudCoins');
  const hudWaveEl = document.getElementById('hudWave');
  const hudEnemiesEl = document.getElementById('hudEnemies');
  const hudAirEl = document.getElementById('hudAir');
  const hudMapLevelEl = document.getElementById('hudMapLevel');
  const hudLeaksEl = document.getElementById('hudLeaks');

  const COLS = 16;
  const ROWS = 10;
  const CW = canvas.width / COLS;
  const CH = canvas.height / ROWS;

  let carrotCell = { c: COLS - 1, r: ROWS - 1 };
  let mapLevel = 0;
  let speedBoost = 1.0;
  const routes = [];

  // Road: randomized orthogonal non-crossing path builder
  const roadCells = [];
  function keyCR(c, r) { return `${c},${r}`; }
  function neighbors(c, r) {
    const list = [
      { c: c + 1, r }, { c: c - 1, r }, { c, r: r + 1 }, { c, r: r - 1 }
    ];
    return list.filter(p => p.c >= 0 && p.c < COLS && p.r >= 0 && p.r < ROWS);
  }
  function manhattan(a, b) { return Math.abs(a.c - b.c) + Math.abs(a.r - b.r); }
  function buildPath(start, end, forbiddenSet, maxSteps, opts = {}) {
    const visited = new Set(forbiddenSet || []);
    const path = [{ c: start.c, r: start.r }];
    visited.add(keyCR(start.c, start.r));
    const limit = Math.max(8, maxSteps || Math.floor(COLS * ROWS * 0.5));
    let guard = limit * 6;

    // detour milestone: occasionally visit bottom-left area
    const wantBottomLeft = opts.forceBottomLeft ?? (Math.random() < 0.55);
    const bottomLeft = { c: 0, r: ROWS - 2 };
    let reachedBottomLeft = false;
    let goal = wantBottomLeft ? bottomLeft : end;

    // turn behavior tuning
    let lastDir = null; // {dc,dr}
    let straightCount = 0;
    const maxStraight = opts.maxStraight ?? 4; // limit long straight runs
    const turnBias = opts.turnBias ?? 0.35; // tendency to turn when options allow

    while (guard-- > 0 && path.length < limit) {
      const cur = path[path.length - 1];
      if (cur.c === goal.c && cur.r === goal.r) {
        if (goal === bottomLeft && wantBottomLeft && !reachedBottomLeft) {
          reachedBottomLeft = true; goal = end;
        } else { break; }
      }
      let optsN = neighbors(cur.c, cur.r).filter(p => !visited.has(keyCR(p.c, p.r)));
      if (optsN.length === 0) {
        if (path.length <= 1) break; // failed
        // backtrack a bit and relax straight streak
        path.pop();
        straightCount = Math.max(0, straightCount - 1);
        lastDir = null;
        continue;
      }
      // score options: base on distance to goal, with small randomness
      const scored = optsN.map(p => ({ p, d: manhattan(p, goal) + Math.random() * 0.6 }));
      scored.sort((a, b) => a.d - b.d);
      let candidates = scored.map(s => s.p);
      // if getting too long relative to direct path, favor shorter moves strongly
      const directLen = manhattan(path[0], goal) || 1;
      if (path.length > directLen * 2) {
        candidates = candidates.slice(0, Math.max(1, Math.min(2, candidates.length)));
      }
      // encourage turn if too straight
      if (lastDir && straightCount >= maxStraight) {
        const turned = candidates.filter(np => (Math.sign(np.c - cur.c) !== lastDir.dc) || (Math.sign(np.r - cur.r) !== lastDir.dr));
        if (turned.length) candidates = turned;
      } else if (lastDir && Math.random() < turnBias) {
        const turned = candidates.filter(np => (Math.sign(np.c - cur.c) !== lastDir.dc) || (Math.sign(np.r - cur.r) !== lastDir.dr));
        if (turned.length) candidates = turned;
      }
      const next = candidates[Math.floor(Math.random() < 0.85 ? 0 : Math.random() * candidates.length)];
      // update straight counters
      const dc = Math.sign(next.c - cur.c), dr = Math.sign(next.r - cur.r);
      if (lastDir && lastDir.dc === dc && lastDir.dr === dr) straightCount++; else straightCount = 1;
      lastDir = { dc, dr };

      path.push(next);
      visited.add(keyCR(next.c, next.r));
    }
    if (path[path.length - 1].c !== end.c || path[path.length - 1].r !== end.r) return null;
    return path;
  }
  function rebuildRoad() {
    routes.length = 0;
    roadCells.length = 0;
    const start = { c: 0, r: 0 };
    const end = { c: carrotCell.c, r: carrotCell.r };
    const path = buildPath(start, end, null, Math.floor(COLS * ROWS * 0.7), { maxStraight: 4, turnBias: 0.35 });
    if (path && path.length) {
      for (const p of path) roadCells.push({ c: p.c, r: p.r });
    } else {
      // fallback: simple L-shaped path along top row then right column
      for (let c = 0; c < COLS; c++) roadCells.push({ c, r: 0 });
      for (let r = 1; r < ROWS; r++) roadCells.push({ c: COLS - 1, r });
    }
    routes.push(roadCells);
  }

  // Precompute grass tufts away from road
  const grassTufts = [];
  function rebuildGrass() {
    grassTufts.length = 0;
    const roadSet = new Set(roadCells.map(rc => keyCR(rc.c, rc.r)));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (roadSet.has(keyCR(c, r))) continue;
        if (Math.random() < 0.12) {
          const x = c * CW + CW / 2 + (Math.random() - 0.5) * 10;
          const y = r * CH + CH / 2 + (Math.random() - 0.5) * 10;
          grassTufts.push({ x, y });
        }
      }
    }
  }

  // Compute total path length in pixels for orthogonal adjacent steps
  function pathLengthPx() {
    let len = 0;
    for (let i = 0; i < roadCells.length - 1; i++) {
      const a = roadCells[i];
      const b = roadCells[i + 1];
      len += (a.c !== b.c) ? CW : CH;
    }
    return len;
  }
  let roadLenPx = 0;
  function refreshRoadMetrics() {
    roadLenPx = pathLengthPx();
  }
  // initial build
  rebuildRoad();
  rebuildGrass();
  refreshRoadMetrics();

  // Game state
  let coins = Infinity; // starter coins (testing)
  let wave = 0;
  const towers = [];
  const enemies = [];
  const foods = [];
  const bullets = [];
  const coinDrops = []; // {x,y,type,value,spawn}
  let leaks = 0; // normal enemies that reached carrot
  let gameOver = null; // 'boss' or 'leaks'
  // Theme: 'normal' | 'wind' (underground removed)
  let themeMode = 'normal';
  let windSwirls = [];
  let mouseX = 0, mouseY = 0;
  let selection = 'archer';
  let bomb = null; // {x,y,start,delay}

  function updateHud() {
    const airCount = enemies.reduce((n, e) => n + (e.isAir ? 1 : 0), 0);
    if (hudCoinsEl) hudCoinsEl.textContent = `Coins: ${coins === Infinity ? '∞' : coins}`;
    if (hudWaveEl) hudWaveEl.textContent = `Wave: ${wave}`;
    if (hudEnemiesEl) hudEnemiesEl.textContent = `Enemies: ${enemies.length}`;
    if (hudAirEl) hudAirEl.textContent = `Air: ${airCount}`;
    if (hudMapLevelEl) hudMapLevelEl.textContent = `Map lvl: ${mapLevel}`;
    if (hudLeaksEl) hudLeaksEl.textContent = `Leaks: ${leaks}`;
  }

  const TOWER_TYPES = {
    archer: { label: '🎯 Archer', cost: 20, range: 3.5, rate: 0.8, damage: 12 },
    cannon: { label: '💥 Cannon', cost: 50, range: 3.2, rate: 1.0, damage: 18, splash: 60 },
    beam: { label: '🔦 Laser', cost: 60, range: 3.8, rate: 0.6, damage: 10 },
    coil: { label: '⚡️ Coil', cost: 70, range: 2.4, rate: 0.0, damage: 4 },
    slow: { label: '❄️ Slow', cost: 40, range: 3.0, rate: 0.0, damage: 0, slow: 0.55 },
    poison: { label: '☠️ Poison', cost: 50, range: 3.2, rate: 0.9, damage: 8, dot: 2, dotTime: 3 },
    spikeHay: { label: 'Hay Spike', cost: 30, trapRadius: 48, rate: 0.0, damage: 8, roadOnly: true },
    spikeWood: { label: 'Wood Spike', cost: 45, trapRadius: 50, rate: 0.0, damage: 11, roadOnly: true },
    spikeSilver: { label: 'Silver Spike', cost: 70, trapRadius: 52, rate: 0.0, damage: 14, roadOnly: true },
    tank: { label: '🧨 Tank', cost: 80, range: 999, rate: 3.5, damage: 45, splash: 50 },
    tree: { label: '🌳 Tree', cost: 60, range: 0, rate: 0, damage: 0, rootRadius: 80, blockHp: 20, roadOnly: true },
  };

  function isRoad(c, r) {
    for (const route of routes) {
      if (route && route.some(p => p.c === c && p.r === r)) return true;
    }
    return false;
  }
  function hasTower(c, r) {
    return towers.some(t => t.c === c && t.r === r);
  }
  function cellCenter(c, r) {
    return { x: c * CW + CW / 2, y: r * CH + CH / 2 };
  }

  function setSelection(sel) {
    selection = sel;
    const cfg = TOWER_TYPES[sel];
    const placeHint = cfg && cfg.roadOnly ? 'Click a road tile to place' : 'Click a non-road tile to place';
    const cost = cfg && cfg.cost ? `${cfg.cost} coins` : '—';
    legendEl.textContent = `Current: ${cfg ? cfg.label : '—'} · Cost: ${cost} · ${placeHint} · Coins: ${coins}`;
  }
  setSelection('archer');

  // Update button labels to include exact costs
  (function updateButtons() {
    const map = [
      ['selSingle', 'archer'], ['selAoe', 'cannon'], ['selBeam', 'beam'], ['selCoil', 'coil'],
      ['selSlow', 'slow'], ['selPoison', 'poison'], ['selSpike', 'spikeHay'], ['selSpikeWood', 'spikeWood'], ['selSpikeSilver', 'spikeSilver'], ['selTank', 'tank'], ['selTree', 'tree']
    ];
    for (const [id, key] of map) {
      const el = document.getElementById(id);
      if (!el) continue;
      const cfg = TOWER_TYPES[key];
      const label = cfg.label || key;
      el.textContent = `${label} (${cfg.cost})`;
    }
  })();

  // Hook up toolbar
  document.getElementById('selSingle').onclick = () => setSelection('archer');
  document.getElementById('selAoe').onclick = () => setSelection('cannon');
  document.getElementById('selBeam').onclick = () => setSelection('beam');
  document.getElementById('selCoil').onclick = () => setSelection('coil');
  document.getElementById('selSlow').onclick = () => setSelection('slow');
  document.getElementById('selPoison').onclick = () => setSelection('poison');
  document.getElementById('selSpike').onclick = () => setSelection('spikeHay');
  const btnSpikeWood = document.getElementById('selSpikeWood'); if (btnSpikeWood) btnSpikeWood.onclick = () => setSelection('spikeWood');
  const btnSpikeSilver = document.getElementById('selSpikeSilver'); if (btnSpikeSilver) btnSpikeSilver.onclick = () => setSelection('spikeSilver');
  document.getElementById('selTank').onclick = () => setSelection('tank');
  document.getElementById('selTree').onclick = () => setSelection('tree');
  // deletion handled via double-click on towers
  document.getElementById('bombPower').onclick = () => {
    if (bomb || coins < 100) return;
    coins -= 100;
    bomb = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      start: performance.now(),
      delay: 2000,
    };
  };

  // Map controls (right-side buttons)
  const btnGround = document.getElementById('btnGround');
  const btnSky = document.getElementById('btnSky');
  function updateMapControlsSelection() {
    if (!btnGround || !btnSky) return;
    btnGround.classList.toggle('selected', themeMode === 'normal');
    btnSky.classList.toggle('selected', themeMode === 'wind');
  }
  if (btnGround) {
    btnGround.onclick = () => { themeMode = 'normal'; updateMapControlsSelection(); setSelection(selection); };
  }
  if (btnSky) {
    btnSky.onclick = () => {
      themeMode = 'wind';
      windSwirls = [];
      for (let i = 0; i < 40; i++) {
        const x0 = Math.random() * canvas.width; const y0 = Math.random() * canvas.height;
        windSwirls.push({ x1: x0 - 20, y1: y0, cx: x0 + 10, cy: y0 - 10, x2: x0 + 40, y2: y0 });
      }
      updateMapControlsSelection();
      setSelection(selection);
    };
  }
  updateMapControlsSelection();

  // Unlock map expansions
  const unlockCosts = [1000, 2000, 8000];
  let cave = null; // {x,y,lastClick}
  let minigameCenter = null; // {x,y}
  let gameMode = null; // 'menu' | 'survive' | 'garden' | null
  document.getElementById('unlockMap').onclick = () => {
    if (mapLevel >= 3) return;
    const cost = unlockCosts[mapLevel];
    if (coins < cost) { setSelection(selection); return; }
    coins -= cost;
    mapLevel++;
    speedBoost = 1.0 + mapLevel * 0.12;
    // extend path/features
    if (mapLevel === 1) {
      // First unlock: keep carrot position; no path move
      routes[0] = roadCells;
      cave = placePointAwayFromRoad(40); cave.lastClick = 0;
    } else if (mapLevel === 2) {
      // Second unlock: move carrot to end of base route, avoiding towers
      let endIdx = roadCells.length - 1;
      while (endIdx > 0 && hasTower(roadCells[endIdx].c, roadCells[endIdx].r)) endIdx--;
      carrotCell = { c: roadCells[endIdx].c, r: roadCells[endIdx].r };
      // trim base route to carrot
      roadCells.length = endIdx + 1;
      routes[0] = roadCells;
      // Build a longer alternate route to the carrot
      const routeB = buildBranchRoute(roadCells, carrotCell);
      if (routeB) {
        routes[1] = routeB;
      } else {
        // Fallback: choose a mid split on base and build path to carrot avoiding base except split/end
        const baseSet = new Set(roadCells.map(p => keyCR(p.c, p.r)));
        const len = roadCells.length; const minSplit = Math.floor(len * 0.35); const maxSplit = Math.floor(len * 0.65);
        let alt = null;
        for (let tries = 0; tries < 60 && !alt; tries++) {
          const splitIdx = Math.floor(minSplit + Math.random() * Math.max(1, (maxSplit - minSplit)));
          const start2 = roadCells[splitIdx];
          const forbid = new Set(baseSet);
          forbid.delete(keyCR(start2.c, start2.r));
          forbid.delete(keyCR(carrotCell.c, carrotCell.r));
          const candidate = buildPath(start2, carrotCell, forbid, Math.floor(COLS * ROWS * 0.8), { maxStraight: 4, turnBias: 0.35 });
          if (candidate && candidate.length >= 2) {
            const keys = new Set(candidate.map(p => keyCR(p.c, p.r)));
            keys.delete(keyCR(start2.c, start2.r));
            keys.delete(keyCR(carrotCell.c, carrotCell.r));
            let overlap = 0; for (const k of baseSet) if (keys.has(k)) overlap++;
            if (overlap === 0) alt = candidate;
          }
        }
        if (alt) routes[1] = alt;
      }
    } else if (mapLevel === 3) {
      minigameCenter = placePointAwayFromRoad(50);
    }
    refreshRoadMetrics();
    setSelection(selection);
  };

  function placePointAwayFromRoad(radius) {
    for (let tries = 0; tries < 200; tries++) {
      const c = Math.floor(Math.random() * COLS);
      const r = Math.floor(Math.random() * ROWS);
      const ctr = cellCenter(c, r);
      let near = false;
      const routeCells = routes.length ? routes.flat() : roadCells;
      for (const p of routeCells) {
        const pc = cellCenter(p.c, p.r);
        const dx = pc.x - ctr.x, dy = pc.y - ctr.y;
        if (Math.hypot(dx, dy) < radius) { near = true; break; }
      }
      if (!near) return { x: ctr.x, y: ctr.y };
    }
    return { x: canvas.width * 0.5, y: canvas.height * 0.3 };
  }

  // Helper: compute route length in pixels
  function routeLengthPx(route) {
    if (!route || route.length < 2) return 0;
    let len = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i], b = route[i + 1];
      len += (a.c !== b.c) ? CW : CH;
    }
    return len;
  }

  // Build a branch that starts mid-way on the base road and reaches the carrot, avoiding base tiles except the split and carrot
  function buildBranchRoute(baseRoute, endCell) {
    const baseSet = new Set(baseRoute.map(p => keyCR(p.c, p.r)));
    const occupied = occupiedCellKeys();
    const len = baseRoute.length;
    const minSplit = Math.floor(len * 0.35);
    const maxSplit = Math.floor(len * 0.65);
    for (let attempt = 0; attempt < 80; attempt++) {
      const splitIdx = Math.floor(minSplit + Math.random() * Math.max(1, (maxSplit - minSplit)));
      const start2 = baseRoute[splitIdx];
      // Direct path from split to end avoiding base (allow split and end)
      const forbid = new Set([...baseSet, ...occupied]);
      forbid.delete(keyCR(start2.c, start2.r));
      forbid.delete(keyCR(endCell.c, endCell.r));
      let alt = buildPath(start2, endCell, forbid, Math.floor(COLS * ROWS * 0.7), { maxStraight: 4, turnBias: 0.35 });
      if (!alt || alt.length < 2) {
        // Detour approach: choose a far cell away from base then go to end
        let detour = null; let bestScore = -1;
        for (let tries = 0; tries < 100; tries++) {
          const c = Math.floor(Math.random() * COLS);
          const r = Math.floor(Math.random() * ROWS);
          const k = keyCR(c, r);
          if (baseSet.has(k) || occupied.has(k)) continue;
          let minDistToBase = Infinity;
          for (const p of baseRoute) {
            const d = Math.abs(p.c - c) + Math.abs(p.r - r);
            if (d < minDistToBase) minDistToBase = d;
          }
          const score = minDistToBase + Math.abs(c - start2.c) + Math.abs(r - start2.r) + Math.abs(c - endCell.c) + Math.abs(r - endCell.r);
          if (score > bestScore) { bestScore = score; detour = { c, r }; }
        }
        if (!detour) continue;
        const forbid1 = new Set([...baseSet, ...occupied]);
        forbid1.delete(keyCR(start2.c, start2.r));
        const p1 = buildPath(start2, detour, forbid1, Math.floor(COLS * ROWS * 0.5), { maxStraight: 4, turnBias: 0.35 });
        if (!p1 || p1.length < 2) continue;
        const forbid2 = new Set([...forbid1, ...p1.map(p => keyCR(p.c, p.r))]);
        forbid2.delete(keyCR(endCell.c, endCell.r));
        const p2 = buildPath(detour, endCell, forbid2, Math.floor(COLS * ROWS * 0.6), { maxStraight: 4, turnBias: 0.35 });
        if (!p2 || p2.length < 2) continue;
        alt = p1.concat(p2.slice(1));
      }
      // Ensure no overlap with base except split and end
      const altKeys = new Set(alt.map(p => keyCR(p.c, p.r)));
      altKeys.delete(keyCR(start2.c, start2.r));
      altKeys.delete(keyCR(endCell.c, endCell.r));
      let overlap = 0; for (const k of baseSet) if (altKeys.has(k)) overlap++;
      if (overlap === 0) return alt;
    }
    return null;
  }

  // Cells occupied by towers, cave, and arcade (minigame center)
  function occupiedCellKeys() {
    const set = new Set();
    for (const t of towers) set.add(keyCR(t.c, t.r));
    if (cave) {
      const cc = { c: Math.floor(cave.x / CW), r: Math.floor(cave.y / CH) };
      set.add(keyCR(cc.c, cc.r));
    }
    if (minigameCenter) {
      const mc = { c: Math.floor(minigameCenter.x / CW), r: Math.floor(minigameCenter.y / CH) };
      set.add(keyCR(mc.c, mc.r));
    }
    return set;
  }

  document.getElementById('startWave').onclick = () => startWave();
  document.getElementById('restartGame').onclick = () => restartGame();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // cave click reward
    if (cave && themeMode === 'normal') {
      const dx = x - cave.x, dy = y - cave.y;
      if (Math.hypot(dx, dy) <= 22) {
        const now = performance.now();
        if (!cave.lastClick || now - cave.lastClick >= 5 * 60 * 1000) {
          cave.lastClick = now; coins += 300; setSelection(selection);
        }
        return;
      }
    }
    // minigame center open/close
    if (minigameCenter && themeMode === 'normal') {
      const dxm = x - minigameCenter.x, dym = y - minigameCenter.y;
      if (Math.hypot(dxm, dym) <= 22) { gameMode = gameMode ? null : 'menu'; return; }
    }
    // theme toggles handled by right-side buttons only
    const c = Math.floor(x / CW);
    const r = Math.floor(y / CH);
    const cfg = TOWER_TYPES[selection];

    const existing = towers.find(t => t.c === c && t.r === r);
    if (existing) {
      // upgrade
      const upCost = Math.round(((cfg && cfg.cost) || 20) * (1 + existing.level * 0.6));
      if (coins >= upCost) {
        coins -= upCost;
        existing.level++;
        existing.range *= 1.15;
        existing.damage *= 1.2;
      }
      setSelection(selection);
      return;
    }

    // Do not allow placing any tower on the carrot cell
    if (c === carrotCell.c && r === carrotCell.r) return;
    if (cfg.roadOnly && !isRoad(c, r)) return;
    if (!cfg.roadOnly && isRoad(c, r)) return;
    if (hasTower(c, r)) return;
    // enforce tower count limits: road tiles max 10, non-road tiles max 15
    const isOnRoad = isRoad(c, r);
    const roadCount = towers.reduce((n, t) => n + (isRoad(t.c, t.r) ? 1 : 0), 0);
    const nonRoadCount = towers.length - roadCount;
    if (isOnRoad && roadCount >= 10) { setSelection(selection); return; }
    if (!isOnRoad && nonRoadCount >= 15) { setSelection(selection); return; }
    // spacing rule: ground (non-road) towers must be at least 2 blocks apart
    if (!isOnRoad) {
      for (const t of towers) {
        if (isRoad(t.c, t.r)) continue; // only enforce among ground towers
        const dc = Math.abs(t.c - c);
        const dr = Math.abs(t.r - r);
        const cheby = Math.max(dc, dr);
        if (cheby < 2) { setSelection(selection); return; }
      }
    }
    if (coins < cfg.cost) return;
    coins -= cfg.cost;

    const ctr = cellCenter(c, r);
    towers.push({
      type: selection,
      c, r,
      x: ctr.x,
      y: ctr.y,
      level: 1,
      range: (cfg.range || 3) * CW,
      rate: cfg.rate || 0.8,
      damage: cfg.damage || 10,
      cooldown: 0,
      trapRadius: (cfg.trapRadius || 0),
      splash: cfg.splash || 0,
      slow: cfg.slow || 0,
      dot: cfg.dot || 0,
      dotTime: cfg.dotTime || 0,
    });
    setSelection(selection);
  });

  // double-click to delete a placed tower (must be quick)
  canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / CW);
    const r = Math.floor(y / CH);
    const existing = towers.find(t => t.c === c && t.r === r);
    if (existing) {
      const idx = towers.indexOf(existing);
      if (idx >= 0) towers.splice(idx, 1);
      setSelection(selection);
    }
  });

  // track mouse for coin hover collection
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  function startWave() {
    wave++;
    const count = 10 + wave * 2;
    for (let i = 0; i < count; i++) {
      enemies.push(makeEnemy(i * 500));
    }
    // Boss every 10 waves: slow and tanky, reaching carrot causes immediate loss
    if (wave % 10 === 0) {
    leaks = 0;
    gameOver = null;
      const route = routes[0] || roadCells;
      const startCell = route[0];
      const p = cellCenter(startCell.c, startCell.r);
      enemies.push({ x: p.x, y: p.y, kind: 'boss', isBoss: true, speed: (roadLenPx / 60) * speedBoost, hp: 1800 + wave * 120, maxHp: 1800 + wave * 120, pathIndex: 0, offset: 0, spawnDelay: 0, dead: false, poisonUntil: 0, slowUntil: 0, underground: false, stopUntil: 0, route });
    }
    // In sky theme, spawn a few birds that fly straight to carrot
    if (themeMode === 'wind') {
      const cPos = cellCenter(carrotCell.c, carrotCell.r);
      const addAir = (delay) => enemies.push({ x: 20, y: 20, speed: (120 + wave * 4) * speedBoost, hp: 80 + wave * 25, maxHp: 80 + wave * 25, isAir: true, tx: cPos.x, ty: cPos.y, spawnDelay: delay, dead: false, poisonUntil: 0, slowUntil: 0 });
      addAir(0);
      addAir(300);
    }
    // add a food near carrot each wave
    const cPos = cellCenter(carrotCell.c, carrotCell.r);
    const jitter = (n) => (Math.random() - 0.5) * n;
    foods.push({ x: cPos.x - 40 + jitter(30), y: cPos.y + 40 + jitter(30), kind: wave % 3 });
    setSelection(selection);
  }

  function makeEnemy(delay) {
    // Always spawn ground enemies here; air/moles are spawned separately
    const route = routes[Math.min(routes.length - 1, Math.random() < 0.5 ? 0 : 1)] || roadCells;
    const startCell = route[0];
    const p = cellCenter(startCell.c, startCell.r);
    // pool of ground kinds, add heavy types on later waves
    const pool = ['runner', 'bug', 'slime', 'tank'];
    if (wave >= 6) pool.push('brute');
    if (wave >= 12) pool.push('golem');
    const kind = pool[Math.floor(Math.random() * pool.length)];
    const e = {
      x: p.x, y: p.y,
      kind,
      speed: (roadLenPx / 40) * speedBoost,
      hp: 60 + wave * 20,
      maxHp: 60 + wave * 20,
      pathIndex: 0,
      offset: 0,
      spawnDelay: delay,
      dead: false,
      poisonUntil: 0,
      slowUntil: 0,
      underground: false,
      stopUntil: 0,
      route,
    };
    // adjust speed/hp per kind: slow-but-tanky for heavies
    switch (kind) {
      case 'runner':
        e.speed *= 1.4; e.hp *= 0.8; break;
      case 'bug':
        e.speed *= 1.0; e.hp *= 1.0; break;
      case 'slime':
        e.speed *= 0.9; e.hp *= 1.15; break;
      case 'tank':
        e.speed *= 0.85; e.hp *= 1.8; break;
      case 'brute':
        e.speed *= 0.65; e.hp *= 2.6; break;
      case 'golem':
        e.speed *= 0.55; e.hp *= 3.2; break;
    }
    e.maxHp = e.hp;
    return e;
  }

  function restartGame() {
    // clear dynamic state
    towers.length = 0;
    enemies.length = 0;
    foods.length = 0;
    bullets.length = 0;
    coinDrops.length = 0;
    // reset meta
    coins = Infinity;
    wave = 0;
    // rebuild road and grass
    roadCells.length = 0;
    routes.length = 0;
    carrotCell = { c: COLS - 1, r: ROWS - 1 };
    mapLevel = 0; speedBoost = 1.0;
    cave = null; minigameCenter = null; gameMode = null;
    rebuildRoad();
    grassTufts.length = 0;
    rebuildGrass();
    refreshRoadMetrics();
    // update legend/selection
    setSelection('archer');
  }

  function nearestEnemy(x, y, rangePx, towerType) {
    let best = null, bd2 = rangePx * rangePx;
    for (const e of enemies) {
      if (e.dead || e.spawnDelay > 0) continue;
      const dx = e.x - x, dy = e.y - y, d2 = dx * dx + dy * dy;
      if (d2 <= bd2) { bd2 = d2; best = e; }
    }
    return best;
  }

  function addBullet(from, to, type) {
    bullets.push({
      x: from.x, y: from.y,
      vx: 0, vy: 0,
      speed: 320,
      target: to,
      type,
      damage: from.damage,
      dot: from.dot,
      dotTime: from.dotTime,
      splash: from.splash || 0,
    });
  }

  function spawnCoinDrop(e) {
    // Always drop coins; bronze common, silver medium, gold rare
    const roll = Math.random();
    let type = 'bronze', value = 10;
    if (roll < 0.05) { type = 'gold'; value = 50; }
    else if (roll < 0.30) { type = 'silver'; value = 30; }
    // spawn slightly offset to avoid overlapping with other visuals
    const jitter = () => (Math.random() - 0.5) * 6;
    coinDrops.push({ x: e.x + jitter(), y: e.y + jitter(), type, value, spawn: performance.now() });
  }

  function update(dt) {
    if (gameOver) return;
    // enemies
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.spawnDelay > 0) { e.spawnDelay -= dt * 1000; continue; }

      // Ensure underground never used
      if (e.underground) e.underground = false;

      // poison tick
      if (performance.now() < e.poisonUntil) {
        e.hp -= 1.5 * dt * 60; // mild DoT scaled by FPS
      }
      // slow
      const slowed = performance.now() < e.slowUntil ? 0.6 : 1.0;

      // boss proximity rule: normals must keep at least 1 tile away
      let nearBoss = false;
      if (!e.isBoss) {
        for (const b of enemies) {
          if (!b.isBoss || b.dead || b.spawnDelay > 0) continue;
          const c1 = Math.floor(e.x / CW), r1 = Math.floor(e.y / CH);
          const c2 = Math.floor(b.x / CW), r2 = Math.floor(b.y / CH);
          const cheby = Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2));
          if (cheby <= 1) { nearBoss = true; break; }
        }
      }
      // pause movement if stopped by tree effect or too close to boss
      if (!(e.stopUntil && performance.now() < e.stopUntil) && !nearBoss) {
        const route = e.route || roadCells;
        const nextIdx = Math.min(route.length - 1, e.pathIndex + 1);
        const a = cellCenter(route[e.pathIndex].c, route[e.pathIndex].r);
        const b = cellCenter(route[nextIdx].c, route[nextIdx].r);
        const dx = b.x - a.x, dy = b.y - a.y;
        const segLen = Math.max(1, Math.hypot(dx, dy));
        const step = e.speed * slowed * dt;
        e.offset += step;
        if (e.offset >= segLen) { e.pathIndex = nextIdx; e.offset = 0; }
        const t = e.offset / segLen;
        e.x = a.x + dx * t; e.y = a.y + dy * t;
      }

      // reach carrot
      const route = e.route || roadCells;
      if (e.pathIndex >= route.length - 1) {
        if (e.isBoss) { gameOver = 'boss'; e.dead = true; }
        else { leaks++; e.dead = true; if (leaks >= 30) gameOver = 'leaks'; }
      }
    }

    // towers
    for (const t of towers) {
      t.cooldown = Math.max(0, t.cooldown - dt);
      const isSpike = (t.type === 'spikeHay' || t.type === 'spikeWood' || t.type === 'spikeSilver');
      if (isSpike) {
        for (const e of enemies) {
          if (e.dead || e.spawnDelay > 0) continue;
          const dx = e.x - t.x, dy = e.y - t.y;
          if (dx * dx + dy * dy <= t.trapRadius * t.trapRadius) {
            e.hp -= t.damage * dt * 2.2; // slightly faster DPS
          }
        }
        continue;
      }

      if (t.type === 'tree') {
        // Tree blocks enemies for 20s then breaks (no aiming)
        let anyBlocking = false;
        for (const e of enemies) {
          if (e.dead || e.spawnDelay > 0) continue;
          const dx = e.x - t.x, dy = e.y - t.y;
          const d2 = dx * dx + dy * dy;
          if (d2 <= (t.rootRadius * t.rootRadius)) {
            // underground removed
            if (!t.blockEnd) t.blockEnd = performance.now() + 20000;
            if (performance.now() < t.blockEnd) { anyBlocking = true; e.stoppedByTree = true; e.stopUntil = t.blockEnd; }
            else { e.stoppedByTree = false; }
          } else if (e.stoppedByTree) {
            e.stoppedByTree = false;
          }
        }
        if (t.blockEnd && performance.now() >= t.blockEnd) { t.blockHp = 0; }
        continue;
      }

      if (t.type === 'coil') {
        for (const e of enemies) {
          if (e.dead || e.spawnDelay > 0) continue;
          const dx = e.x - t.x, dy = e.y - t.y;
          if (dx * dx + dy * dy <= t.range * t.range) e.hp -= t.damage * dt * 3.0;
        }
        continue;
      }

      if (t.type === 'slow') {
        for (const e of enemies) {
          const dx = e.x - t.x, dy = e.y - t.y;
          if (dx * dx + dy * dy <= t.range * t.range) e.slowUntil = performance.now() + 150; // brief refresh
        }
        continue;
      }

      // tank no longer global-blasts; it fires bullets via targeted weapons below

      // targeted weapons
      if (t.cooldown <= 0) {
        const target = nearestEnemy(t.x, t.y, t.range, t.type);
        if (target) {
          addBullet(t, target, t.type);
          t.cooldown = t.rate;
        }
      }
    }

    // bullets
    for (const b of bullets) {
      if (!b.target || b.target.dead) {
        b.dead = true;
        continue;
      }
      const dx = b.target.x - b.x, dy = b.target.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        // hit
        b.target.hp -= b.damage;
        if (b.splash > 0) {
          const r2 = b.splash * b.splash;
          for (const e of enemies) {
            if (e.dead || e.spawnDelay > 0 || e === b.target) continue;
            const ex = e.x - b.x, ey = e.y - b.y;
            if (ex * ex + ey * ey <= r2) e.hp -= Math.round(b.damage * 0.9);
          }
        }
        b.dead = true;
      } else {
        b.vx = (dx / d) * b.speed * dt;
        b.vy = (dy / d) * b.speed * dt;
        b.x += b.vx; b.y += b.vy;
      }
    }

    // bomb
    if (bomb) {
      const elapsed = performance.now() - bomb.start;
      if (elapsed >= bomb.delay) {
        // wipe all enemies
        for (const e of enemies) e.hp = 0;
        bomb = null;
      }
    }

    // coin drops: mark dead and spawn drop once
    for (const e of enemies) {
      if (!e.dead && e.hp <= 0) { e.dead = true; spawnCoinDrop(e); }
    }
    // process coin drops: hover collect or auto-collect after 10s
    const now = performance.now();
    for (let i = coinDrops.length - 1; i >= 0; i--) {
      const d = coinDrops[i];
      const dx = mouseX - d.x, dy = mouseY - d.y;
      const hovered = (dx * dx + dy * dy) <= (12 * 12);
      const expired = now - d.spawn >= 10000;
      if (hovered || expired) {
        coins += d.value;
        coinDrops.splice(i, 1);
        // keep legend in sync
        setSelection(selection);
      }
    }

    // cleanup
    let i = bullets.length; while (i--) if (bullets[i].dead) bullets.splice(i, 1);
    i = enemies.length; while (i--) if (enemies[i].dead) enemies.splice(i, 1);
  }

  function draw() {
    if (gameOver) {
      // Draw current scene background for context, then overlay game-over
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, themeMode === 'wind' ? '#b3e5fc' : '#3b7f3b');
      g.addColorStop(1, themeMode === 'wind' ? '#81d4fa' : '#2e6b2e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e6e6e6'; ctx.font = 'bold 24px -apple-system,Segoe UI,Roboto';
      const msg = gameOver === 'boss' ? 'Defeated by Boss!' : 'Too Many Leaks!';
      ctx.fillText(msg, canvas.width / 2 - 120, canvas.height / 2 - 30);
      ctx.font = '16px -apple-system,Segoe UI,Roboto';
      ctx.fillText('Click Restart to try again.', canvas.width / 2 - 120, canvas.height / 2 + 4);
      return;
    }
    // If a minigame is active, render it full-screen and skip the base scene
    if (
      gameMode === 'menu' ||
      gameMode === 'garden-select' ||
      (gameMode === 'survive' && survive) ||
      (gameMode === 'garden' && garden)
    ) {
      drawMinigameView();
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background by theme
    if (themeMode === 'normal') {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, '#3b7f3b');
      g.addColorStop(1, '#2e6b2e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 160; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }
    } else if (themeMode === 'wind') {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, '#b3e5fc');
      g.addColorStop(1, '#81d4fa');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // draw gentle wind swirls
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      for (const s of windSwirls) {
        ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.quadraticCurveTo(s.cx, s.cy, s.x2, s.y2); ctx.stroke();
      }
    }

    // Ensure road data exists; rebuild if needed
    if (!roadCells.length || roadCells.length < 2) { rebuildRoad(); refreshRoadMetrics(); }

    // Road(s): straight segments along cell centers (orthogonal polylines)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // path by theme
    ctx.lineWidth = 30;
    ctx.strokeStyle = (themeMode === 'wind') ? '#eceff1' : '#b3865b';
    const drawRoutes = (routes && routes.length) ? routes : [roadCells];
    for (const route of drawRoutes) {
      if (!route || route.length < 2) continue;
      ctx.beginPath();
      const startP = cellCenter(route[0].c, route[0].r);
      ctx.moveTo(startP.x, startP.y);
      for (let i = 1; i < route.length; i++) {
        const p = cellCenter(route[i].c, route[i].r);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // centerline removed per request

    // spawn hole at start
    const firstRoute = routes.length ? routes[0] : roadCells;
    const hole = cellCenter(firstRoute[0].c, firstRoute[0].r);
    const pulse = (Math.sin(performance.now() * 0.004) + 1) * 0.5;
    const grad = ctx.createRadialGradient(hole.x, hole.y, 6, hole.x, hole.y, 22);
    grad.addColorStop(0, '#0f0f12');
    grad.addColorStop(1, '#1b1c20');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(hole.x, hole.y, 22, 0, Math.PI * 2); ctx.fill();
    // rim
    ctx.strokeStyle = `rgba(80,80,90,${0.5 + 0.4 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hole.x, hole.y, 22, 0, Math.PI * 2); ctx.stroke();

    // second route spawn indicator (if present)
    if (routes.length > 1 && routes[1] && routes[1].length >= 1) {
      const hole2 = cellCenter(routes[1][0].c, routes[1][0].r);
      const grad2 = ctx.createRadialGradient(hole2.x, hole2.y, 5, hole2.x, hole2.y, 18);
      grad2.addColorStop(0, '#121316');
      grad2.addColorStop(1, '#22252a');
      ctx.fillStyle = grad2;
      ctx.beginPath(); ctx.arc(hole2.x, hole2.y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(90,90,100,${0.5 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hole2.x, hole2.y, 18, 0, Math.PI * 2); ctx.stroke();
    }

    // carrot base
    const cPos = cellCenter(carrotCell.c, carrotCell.r);
    // carrot: tapered orange body + leafy top
    ctx.save();
    ctx.translate(cPos.x, cPos.y);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(12, 10);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();
    // rings
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(8, -4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 2); ctx.stroke();
    // leaves
    ctx.fillStyle = '#66bb6a';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6, -22);
      ctx.quadraticCurveTo(i * 10, -34, i * 4, -26);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // towers: face nearest target by angle
    // precompute angles
    for (const t of towers) {
      // find closest enemy in range
      let target = null; let best = Infinity;
      for (const e of enemies) {
        if (e.dead || e.spawnDelay > 0) continue;
        const dx = e.x - t.x, dy = e.y - t.y; const d2 = dx * dx + dy * dy;
        const isSpike = (t.type === 'spikeHay' || t.type === 'spikeWood' || t.type === 'spikeSilver');
        const range = isSpike ? t.trapRadius : t.range;
        if (d2 <= range * range && d2 < best) { best = d2; target = e; t.angle = Math.atan2(dy, dx); }
      }
      if (!target && t.angle == null) t.angle = 0;
    }
    // draw towers
    for (const t of towers) {
      ctx.save();
      ctx.translate(t.x, t.y);
      const onRoad = isRoad(t.c, t.r);
      ctx.rotate(onRoad ? 0 : (t.angle || 0));
      if (t.type === 'spikeHay') {
        ctx.strokeStyle = '#8d6e63';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.stroke();
        }
      } else if (t.type === 'spikeWood') {
        ctx.strokeStyle = '#6d4c41';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.stroke();
        }
      } else if (t.type === 'spikeSilver') {
        ctx.strokeStyle = '#b0bec5';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); ctx.stroke();
        }
      } else if (t.type === 'archer') {
        ctx.fillStyle = '#607d8b';
        ctx.beginPath(); ctx.roundRect(-10, -10, 20, 20, 6); ctx.fill();
        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
      } else if (t.type === 'cannon') {
        ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.roundRect(-12, -12, 24, 24, 6); ctx.fill();
        ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.roundRect(6, -6, 16, 12, 4); ctx.fill();
      } else if (t.type === 'beam') {
        ctx.fillStyle = '#42a5f5'; ctx.beginPath(); ctx.roundRect(-8, -16, 16, 32, 6); ctx.fill();
        ctx.fillStyle = '#64b5f6'; ctx.beginPath(); ctx.arc(18, -2, 6, 0, Math.PI * 2); ctx.fill();
      } else if (t.type === 'coil') {
        ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.roundRect(-10, -14, 20, 28, 6); ctx.fill();
        ctx.strokeStyle = '#80deea'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -14, 6, 0, Math.PI * 2); ctx.stroke();
      } else if (t.type === 'slow') {
        ctx.fillStyle = '#81d4fa'; ctx.beginPath(); ctx.moveTo(0, -10); for (let a = 0; a < 6; a++) { const ang = a * Math.PI / 3; ctx.lineTo(Math.cos(ang) * 10, Math.sin(ang) * 10); } ctx.closePath(); ctx.fill();
      } else if (t.type === 'poison') {
        ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.roundRect(-10, -12, 20, 24, 8); ctx.fill();
        ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
      } else if (t.type === 'tank') {
        ctx.fillStyle = '#ff8a65'; ctx.beginPath(); ctx.roundRect(-14, -10, 28, 20, 8); ctx.fill();
        ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(18, 0); ctx.stroke();
      } else if (t.type === 'tree') {
        // draw a tree stump + canopy; no range circle
        ctx.fillStyle = '#795548'; ctx.beginPath(); ctx.roundRect(-4, -6, 8, 12, 2); ctx.fill();
        ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(0, -12, 10, 0, Math.PI * 2); ctx.fill();
      } else {
        // default
        ctx.fillStyle = '#90caf9';
        ctx.beginPath(); ctx.arc(0, 0, 10 + t.level * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      // range hint (skip for tree; spikes show trapRadius)
      if (t.type !== 'tree') {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        const isSpikeHint = (t.type === 'spikeHay' || t.type === 'spikeWood' || t.type === 'spikeSilver');
        ctx.beginPath(); ctx.arc(t.x, t.y, isSpikeHint ? t.trapRadius : t.range, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // enemies (ground hidden in sky theme; air visible)
    for (const e of enemies) {
      if (themeMode === 'wind' && !e.isAir) continue;
      if (e.isBoss) {
        // Boss visuals: larger than others; different look per bossType
        const type = e.bossType || 0;
        if (type === 0) {
          // Ogre: big red body with horns
          ctx.fillStyle = '#d32f2f';
          ctx.beginPath(); ctx.arc(e.x, e.y, 18, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, 18, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x - 10, e.y - 12); ctx.lineTo(e.x - 4, e.y - 18); ctx.moveTo(e.x + 10, e.y - 12); ctx.lineTo(e.x + 4, e.y - 18); ctx.stroke();
        } else if (type === 1) {
          // Golem: large gray square
          ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.roundRect(e.x - 16, e.y - 16, 32, 32, 6); ctx.fill();
          ctx.strokeStyle = '#616161'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(e.x - 16, e.y - 16, 32, 32, 6); ctx.stroke();
        } else {
          // Steel Triad: large triangle
          ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.moveTo(e.x, e.y - 20); ctx.lineTo(e.x - 18, e.y + 14); ctx.lineTo(e.x + 18, e.y + 14); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#455a64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x, e.y - 20); ctx.lineTo(e.x - 18, e.y + 14); ctx.lineTo(e.x + 18, e.y + 14); ctx.closePath(); ctx.stroke();
        }
      } else if (e.isAir) {
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath(); ctx.moveTo(e.x, e.y - 8); ctx.lineTo(e.x + 12, e.y + 4); ctx.lineTo(e.x - 12, e.y + 4); ctx.closePath(); ctx.fill();
      } else {
        switch (e.kind) {
          case 'runner':
            ctx.fillStyle = '#ef5350';
            ctx.beginPath(); ctx.arc(e.x, e.y - 6, 4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y - 2); ctx.lineTo(e.x, e.y + 8); ctx.stroke();
            break;
          case 'bug':
            ctx.fillStyle = '#ab47bc';
            ctx.beginPath(); ctx.ellipse(e.x, e.y, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ce93d8'; ctx.beginPath(); ctx.moveTo(e.x - 6, e.y - 2); ctx.lineTo(e.x - 12, e.y - 6); ctx.moveTo(e.x + 6, e.y - 2); ctx.lineTo(e.x + 12, e.y - 6); ctx.stroke();
            break;
          case 'slime':
            ctx.fillStyle = '#4db6ac';
            ctx.beginPath(); ctx.moveTo(e.x - 10, e.y + 6); ctx.quadraticCurveTo(e.x, e.y - 10, e.x + 10, e.y + 6); ctx.closePath(); ctx.fill();
            break;
          case 'brute':
            ctx.fillStyle = '#8e24aa';
            ctx.beginPath(); ctx.roundRect(e.x - 12, e.y - 8, 24, 16, 4); ctx.fill();
            ctx.strokeStyle = '#6a1b9a'; ctx.beginPath(); ctx.moveTo(e.x - 10, e.y - 2); ctx.lineTo(e.x + 12, e.y - 1); ctx.stroke();
            break;
          case 'golem':
            ctx.fillStyle = '#5c6bc0';
            ctx.beginPath(); ctx.roundRect(e.x - 14, e.y - 10, 28, 20, 5); ctx.fill();
            ctx.strokeStyle = '#3f51b5'; ctx.beginPath(); ctx.moveTo(e.x - 8, e.y - 3); ctx.lineTo(e.x + 14, e.y - 4); ctx.stroke();
            break;
          case 'tank':
          default:
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath(); ctx.roundRect(e.x - 10, e.y - 6, 20, 12, 3); ctx.fill();
            ctx.strokeStyle = '#5d4037'; ctx.beginPath(); ctx.moveTo(e.x - 6, e.y - 2); ctx.lineTo(e.x + 10, e.y - 3); ctx.stroke();
            break;
        }
      }
      // hp bar
      ctx.fillStyle = '#263238'; ctx.fillRect(e.x - 12, e.y - 14, 24, 4);
      ctx.fillStyle = '#66bb6a'; ctx.fillRect(e.x - 12, e.y - 14, Math.max(0, 24 * (e.hp / e.maxHp)), 4);
    }

    // bullets: glowing and clearly visible, grey color
    function bulletColor(type) { return '#bdbdbd'; }
    for (const b of bullets) {
      const col = bulletColor(b.type);
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 8);
      grad.addColorStop(0, col);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
      if (b.vx || b.vy) {
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.12, b.y - b.vy * 0.12); ctx.stroke();
      }
    }

    // coin drops rendering
    for (const d of coinDrops) {
      let col;
      if (d.type === 'bronze') col = '#cd7f32';
      else if (d.type === 'silver') col = '#c0c0c0';
      else col = '#ffd700';
      const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, 12);
      glow.addColorStop(0, col);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(d.x, d.y, 10, 0, Math.PI * 2); ctx.fill();
      // coin icon mark
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, Math.PI * 2); ctx.stroke();
    }

    // draw grass tufts only in normal theme
    if (themeMode === 'normal') {
      for (const p of grassTufts) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = '#2e6b2e';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 10); ctx.stroke();
        ctx.restore();
      }
    }

    // bomb visual
    if (bomb) {
      const elapsed = performance.now() - bomb.start;
      const t = Math.max(0, 1 - elapsed / bomb.delay);
      const radius = 40 + (1 - t) * 40;
      ctx.strokeStyle = `rgba(255,64,64,${0.7 + 0.3 * Math.sin(elapsed * 0.01)})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(bomb.x, bomb.y, radius, 0, Math.PI * 2); ctx.stroke();
    }

    // foods near carrot (unchanged)
    for (const f of foods) {
      ctx.fillStyle = f.kind === 0 ? '#ff7043' : (f.kind === 1 ? '#ab47bc' : '#4db6ac');
      ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
    }

    // HUD moved outside canvas; counters updated via DOM

    // Boss health bar at bottom
    const boss = enemies.find(e => e.isBoss && !e.dead);
    if (boss) {
      const barH = 18; const pad = 8; const x0 = pad; const x1 = canvas.width - pad; const y = canvas.height - barH - pad;
      const fullW = x1 - x0; const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
      // draw full red bar then black overlay for lost health
      ctx.fillStyle = '#d32f2f'; ctx.fillRect(x0, y, fullW, barH);
      const lostW = fullW * (1 - ratio);
      ctx.fillStyle = '#000000'; ctx.fillRect(x0 + fullW * ratio, y, lostW, barH);
      ctx.strokeStyle = '#212121'; ctx.lineWidth = 2; ctx.strokeRect(x0, y, fullW, barH);
      ctx.fillStyle = '#e6e6e6'; ctx.font = '12px -apple-system,Segoe UI,Roboto';
      ctx.fillText('Boss', x0 + 6, y - 4);
    }

    // Cave with cooldown label (only in normal/ground theme)
    if (cave && themeMode === 'normal') {
      ctx.fillStyle = '#3a3d44';
      ctx.beginPath(); ctx.arc(cave.x, cave.y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#757575'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cave.x, cave.y, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#bdbdbd'; ctx.font = '12px -apple-system,Segoe UI,Roboto'; ctx.fillText('Cave', cave.x - 16, cave.y - 24);
      // show remaining time
      const nowT = performance.now();
      const last = cave.lastClick || 0;
      const remaining = Math.max(0, 5 * 60 * 1000 - (nowT - last));
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const label = remaining <= 0 ? 'Ready' : `${mins}:${secs.toString().padStart(2, '0')}`;
      ctx.fillStyle = '#e6e6e6'; ctx.font = '12px -apple-system,Segoe UI,Roboto';
      ctx.fillText(label, cave.x - 18, cave.y + 32);
    }
    // Minigame center (only in normal/ground theme)
    if (minigameCenter && themeMode === 'normal') {
      ctx.fillStyle = '#8e24aa'; ctx.beginPath(); ctx.roundRect(minigameCenter.x - 20, minigameCenter.y - 12, 40, 24, 6); ctx.fill();
      ctx.fillStyle = '#e1bee7'; ctx.font = '12px -apple-system,Segoe UI,Roboto'; ctx.fillText('Arcade', minigameCenter.x - 20, minigameCenter.y - 20);
    }

    // roster simple
    rosterCtx.clearRect(0, 0, rosterCanvas.width, rosterCanvas.height);
    rosterCtx.fillStyle = '#bdbdbd';
    rosterCtx.font = '14px -apple-system,Segoe UI,Roboto';
    rosterCtx.fillText('Battle Center: Sky mode hides ground; birds may appear', 12, 24);
    // no in-canvas theme controls; use right-side buttons
  }

  // removed in-canvas theme dots

  // removed in-canvas theme dot click handling

  function drawButton(x, y, w, h, label) {
    ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
    ctx.fillStyle = '#e6e6e6'; ctx.font = '14px -apple-system,Segoe UI,Roboto';
    ctx.fillText(label, x + 12, y + 22);
  }

  // Minigame interactions
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    if (gameMode === 'menu') {
      if (x >= 40 && x <= 260 && y >= 120 && y <= 160) { startSurvive(); gameMode = 'survive'; return; }
      if (x >= 40 && x <= 300 && y >= 180 && y <= 220) { gameMode = 'garden-select'; return; }
    } else if (gameMode === 'garden-select') {
      // seed selection buttons
      if (x >= 40 && x <= 160 && y >= 120 && y <= 160) { startGarden('Carrot'); gameMode = 'garden'; return; }
      if (x >= 180 && x <= 300 && y >= 120 && y <= 160) { startGarden('Potato'); gameMode = 'garden'; return; }
      if (x >= 320 && x <= 440 && y >= 120 && y <= 160) { startGarden('Banana'); gameMode = 'garden'; return; }
    }
  });

  let survive = null; // {x,y,vx,vy,start,duration,hazards,safeX,safeY,safeW,safeH,r}
  function startSurvive() {
    const pad = 0.15; // safe area occupies ~70% of the canvas
    const sx = Math.floor(canvas.width * pad);
    const sy = Math.floor(canvas.height * pad);
    const sw = Math.floor(canvas.width * (1 - 2 * pad));
    const sh = Math.floor(canvas.height * (1 - 2 * pad));
    survive = { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0, start: performance.now(), duration: 30000, hazards: [], safeX: sx, safeY: sy, safeW: sw, safeH: sh, r: 10 };
  }
  function updateSurvive(dt) {
    const s = survive; if (!s || gameMode !== 'survive') return;
    // basic movement (WASD and arrows)
    // use simple held keys state
  }
  // simple keys handling
  const keysHeld = {};
  window.addEventListener('keydown', (ev) => { keysHeld[ev.key] = true; });
  window.addEventListener('keyup', (ev) => { keysHeld[ev.key] = false; });
  function applySurviveInput(s, dt) {
    let ax = 0, ay = 0;
    if (keysHeld['ArrowLeft'] || keysHeld['a']) ax -= 1;
    if (keysHeld['ArrowRight'] || keysHeld['d']) ax += 1;
    if (keysHeld['ArrowUp'] || keysHeld['w']) ay -= 1;
    if (keysHeld['ArrowDown'] || keysHeld['s']) ay += 1;
    const speed = 140;
    s.x = Math.max(0, Math.min(canvas.width, s.x + ax * speed * dt));
    s.y = Math.max(0, Math.min(canvas.height, s.y + ay * speed * dt));
  }
  function drawSurvive() {
    const s = survive; if (!s) return;
    // Lava sea backdrop
    const lg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    lg.addColorStop(0, '#8a1f0f'); lg.addColorStop(1, '#d84315');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stranded island
    ctx.fillStyle = '#3b7f3b';
    ctx.beginPath(); ctx.roundRect(s.safeX, s.safeY, s.safeW, s.safeH, 12); ctx.fill();
    ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(s.safeX, s.safeY, s.safeW, s.safeH, 12); ctx.stroke();
    // hazards
    for (const h of s.hazards) {
      const age = performance.now() - h.t;
      ctx.fillStyle = age < 1000 ? 'rgba(255,0,0,0.5)' : '#ff5722';
      ctx.beginPath(); ctx.arc(h.x, h.y, 18, 0, Math.PI * 2); ctx.fill();
    }
    // player
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    if (s.x < s.safeX || s.x > s.safeX + s.safeW || s.y < s.safeY || s.y > s.safeY + s.safeH) {
      // fell into lava
      gameMode = null; survive = null;
    }
  }
  function drawMinigameView() {
    // menu covers whole screen
    if (gameMode === 'menu') {
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e6e6e6'; ctx.font = '20px -apple-system,Segoe UI,Roboto';
      ctx.fillText('Choose a minigame:', 40, 80);
      drawButton(40, 120, 220, 40, 'Survive!');
      drawButton(40, 180, 300, 40, 'Food Garden');
      return;
    }
    if (gameMode === 'garden-select') {
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e6e6e6'; ctx.font = '18px -apple-system,Segoe UI,Roboto';
      ctx.fillText('Choose a seed:', 40, 80);
      drawButton(40, 120, 120, 40, 'Carrot');
      drawButton(180, 120, 120, 40, 'Potato');
      drawButton(320, 120, 120, 40, 'Banana');
      return;
    }
    if (gameMode === 'survive' && survive) { drawSurvive(); return; }
    if (gameMode === 'garden' && garden) { drawGarden(); return; }
  }

  function updateMinigames(dt) {
    if (gameMode === 'survive' && survive) {
      applySurviveInput(survive, dt);
      if (Math.random() < 0.02) survive.hazards.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, t: performance.now() });
      // check active lava
      for (const h of survive.hazards) {
        const age = performance.now() - h.t;
        if (age >= 1000) {
          const dx = survive.x - h.x, dy = survive.y - h.y;
          if (Math.hypot(dx, dy) < 16 + survive.r) { gameMode = null; survive = null; break; }
        }
      }
      if (survive && performance.now() - survive.start >= survive.duration) { coins += 100; gameMode = null; survive = null; setSelection(selection); }
    } else if (gameMode === 'garden' && garden) {
      updateGarden(dt);
    }
  }

  let garden = null; // {seed,stage,start,stageStart,openCurtain,moisture,sun,lastAction,fail}
  function startGarden(seed) { garden = { seed: seed || 'Carrot', stage: 0, start: performance.now(), stageStart: null, openCurtain: false, moisture: 0.5, sun: 0, lastAction: performance.now(), fail: false }; }
  function updateGarden(dt) {
    const g = garden; if (!g) return;
    const age = performance.now() - g.start;
    if (g.stage === 0 && age > 5000) { g.stage = 1; g.stageStart = performance.now(); }
    if (g.stage === 1) {
      // sun exposure rises when curtain open; falls slowly when closed
      g.sun += (g.openCurtain ? 0.006 : -0.002) * (dt * 60);
      g.sun = Math.max(0, Math.min(1, g.sun));
      // moisture evaporates slowly; water button adds moisture
      g.moisture += (g.openCurtain ? -0.0015 : -0.0008) * (dt * 60);
      g.moisture = Math.max(0, Math.min(1, g.moisture));
      // failure if sun bar hits top or overwatered
      if (g.sun >= 1 || g.moisture >= 1) { g.fail = true; gameMode = null; garden = null; return; }
      // win after 20s of stage 1 survival (independent of lastAction)
      if (g.stageStart && performance.now() - g.stageStart >= 20000) { g.stage = 2; }
    }
    if (g.stage === 2) { coins += 300; gameMode = null; garden = null; setSelection(selection); }
  }
  function drawGarden() {
    const g = garden; if (!g) return;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#e6e6e6'; ctx.font = '16px -apple-system,Segoe UI,Roboto';
    ctx.fillText(`Food Garden: ${g.seed}`, 40, 60);
    ctx.fillText('Keep plant alive for 20s. Don\'t overwater or overheat!', 40, 84);
    // moisture bar
    ctx.fillStyle = '#263238'; ctx.fillRect(40, 100, 220, 12);
    ctx.fillStyle = '#64b5f6'; ctx.fillRect(40, 100, 220 * (g.moisture), 12);
    ctx.fillStyle = '#e6e6e6'; ctx.fillText('Moisture', 270, 110);
    // sun exposure bar (turns red near top)
    ctx.fillStyle = '#263238'; ctx.fillRect(40, 120, 220, 12);
    const nearTop = g.sun > 0.9;
    ctx.fillStyle = nearTop ? '#ff5252' : '#ffd54f';
    ctx.fillRect(40, 120, 220 * (g.sun), 12);
    ctx.fillStyle = '#e6e6e6'; ctx.fillText('Sun', 270, 130);
    // controls
    drawButton(40, 150, 160, 32, g.openCurtain ? 'Close Curtain' : 'Open Curtain');
    drawButton(220, 150, 120, 32, 'Water');
    // plant picture (growth)
    const cx = 140, cy = 220;
    if (g.seed === 'Carrot') {
      ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + 20, cy + 20); ctx.lineTo(cx - 20, cy + 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(cx, cy - 36, 8, 0, Math.PI * 2); ctx.fill();
    } else if (g.seed === 'Potato') {
      ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.ellipse(cx, cy, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(cx - 8, cy - 6, 2, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.moveTo(cx - 20, cy - 10); ctx.quadraticCurveTo(cx, cy - 40, cx + 20, cy - 10); ctx.lineTo(cx - 20, cy - 10); ctx.fill();
      ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(cx - 24, cy - 16, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  canvas.addEventListener('click', (e) => {
    if (gameMode !== 'garden' || !garden) return;
    const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    // curtain toggle
    if (x >= 40 && x <= 200 && y >= 150 && y <= 182) { garden.openCurtain = !garden.openCurtain; garden.lastAction = performance.now(); }
    // water button
    if (x >= 220 && x <= 340 && y >= 150 && y <= 182) { garden.moisture = Math.min(1, garden.moisture + 0.15); garden.lastAction = performance.now(); }
  });

  let last = performance.now();
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    updateMinigames(dt);
    updateHud();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
