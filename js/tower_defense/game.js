// 保卫萝卜 · Canvas 塔防（无图片，使用形状+emoji）
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
    // base color varies with level for a cooler look
    const baseColors = ['#5f7380', '#607d8b', '#6a8291', '#748a99', '#7e92a1'];
    ctx.fillStyle = baseColors[Math.min(t.level - 1, baseColors.length - 1)];
  const rosterCtx = rosterCanvas.getContext('2d');
  const startBtn = document.getElementById('startWave');
  const selSingleBtn = document.getElementById('selSingle');
  const selAoeBtn = document.getElementById('selAoe');
  const selBeamBtn = document.getElementById('selBeam');
  const selCoilBtn = document.getElementById('selCoil');
  const selSlowBtn = document.getElementById('selSlow');
  const selDotBtn = document.getElementById('selDot');
  const legendEl = document.getElementById('legend');
      const headColor = t.level >= 4 ? '#e0f2f1' : '#cfd8dc';
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.arc(0, -2, 10 + Math.min(2, t.level - 1), 0, Math.PI * 2);
      ctx.fill();
  const CELL = 80; // 12*80=960, 8*80=640
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 3 + Math.min(2, t.level - 1);
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(14 + Math.min(6, 2 * (t.level - 1)), -2);
      ctx.stroke();
      // extra barrel at high level
      if (t.level >= 3) {
        ctx.beginPath();
        ctx.moveTo(-1, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
      }
      // scope at max level
      if (t.level >= 5) {
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.roundRect(-6, -14, 12, 6, 3);
        ctx.fill();
      }
  const segments = [
    { from: { c: 0, r: 1 }, to: { c: 4, r: 1 } },
    { from: { c: 4, r: 1 }, to: { c: 4, r: 2 } },
    { from: { c: 4, r: 2 }, to: { c: 1, r: 2 } },
    { from: { c: 1, r: 2 }, to: { c: 1, r: 4 } },
      ctx.fillStyle = t.level >= 4 ? '#a1887f' : '#8d6e63';
    { from: { c: 7, r: 4 }, to: { c: 7, r: 2 } },
      const baseW = 10 + Math.min(4, t.level);
      ctx.moveTo(-baseW, 6);
      ctx.lineTo(baseW, 6);
      ctx.lineTo(0, -12 - Math.min(4, t.level));
    { from: { c: 6, r: 5 }, to: { c: 6, r: 6 } },
    { from: { c: 6, r: 6 }, to: { c: 6, r: 7 } },
    { from: { c: 6, r: 7 }, to: { c: 9, r: 7 } },
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 3 + Math.min(2, t.level - 1);
    { from: { c: 11, r: 3 }, to: { c: 11, r: 6 } },
  ];
      ctx.lineTo(10 + Math.min(6, 2 * (t.level - 1)), -12);
  const roadCells = [];
      if (t.level >= 5) {
        // accent stripes
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, 4);
        ctx.lineTo(6, 4);
        ctx.stroke();
      }
  for (const seg of segments) {
    const dc = Math.sign(seg.to.c - seg.from.c);
    const dr = Math.sign(seg.to.r - seg.from.r);
    let c = seg.from.c;
      ctx.fillStyle = t.level >= 4 ? '#40e0ff' : '#00cfff';
    roadCells.push({ c, r });
      ctx.roundRect(-8, -12, 16 + Math.min(4, t.level), 24, 4);
      c += dc;
// Carrot Defense – clean rebuild
// Non-crossing serpentine road, visible dashed centerline
// Bomb power-up with 2s countdown that wipes all enemies

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const rosterCanvas = document.getElementById('enemyRoster');
  const rosterCtx = rosterCanvas.getContext('2d');
  const legendEl = document.getElementById('legend');

  const COLS = 16;
  const ROWS = 10;
  const CW = canvas.width / COLS;
  const CH = canvas.height / ROWS;

  const carrotCell = { c: COLS - 1, r: ROWS - 1 };

  // Road: serpentine across rows 1..ROWS-2
  const roadCells = [];
  (function buildRoad() {
    let startRow = 1;
    for (let band = 0; band < ROWS - 2; band++) {
      const r = startRow + band;
      if (band % 2 === 0) {
        for (let c = 0; c < COLS; c++) roadCells.push({ c, r });
      } else {
        for (let c = COLS - 1; c >= 0; c--) roadCells.push({ c, r });
      }
    }
    // descend to carrot corner
    for (let r = ROWS - 2; r < ROWS; r++) roadCells.push({ c: COLS - 1, r });
  })();

  // Game state
  let coins = 120; // starter coins
  let wave = 0;
  const towers = [];
  const enemies = [];
  const bullets = [];
  let selection = 'archer';
  let bomb = null; // {x,y,start,delay}

  const TOWER_TYPES = {
    archer: { label: '🎯 Archer', cost: 20, range: 3.5, rate: 0.8, damage: 12 },
    cannon: { label: '💥 Cannon', cost: 50, range: 3.2, rate: 1.0, damage: 18, splash: 60 },
    beam: { label: '🔦 Laser', cost: 60, range: 3.8, rate: 0.6, damage: 10 },
    coil: { label: '⚡️ Coil', cost: 70, range: 2.4, rate: 0.0, damage: 4 },
    slow: { label: '❄️ Slow', cost: 40, range: 3.0, rate: 0.0, damage: 0, slow: 0.55 },
    poison: { label: '☠️ Poison', cost: 50, range: 3.2, rate: 0.9, damage: 8, dot: 2, dotTime: 3 },
    spike: { label: '🪤 Spike', cost: 30, trapRadius: 48, rate: 0.0, damage: 6, roadOnly: true },
    tank: { label: '🧨 Tank', cost: 80, range: 999, rate: 3.5, damage: 45 },
  };

  function isRoad(c, r) {
    return roadCells.some(p => p.c === c && p.r === r);
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
    legendEl.textContent = `Current weapon: ${cfg ? cfg.label : '—'} · ${placeHint} · Coins: ${coins}`;
  }
  setSelection('archer');

  // Hook up toolbar
  document.getElementById('selSingle').onclick = () => setSelection('archer');
  document.getElementById('selAoe').onclick = () => setSelection('cannon');
  document.getElementById('selBeam').onclick = () => setSelection('beam');
  document.getElementById('selCoil').onclick = () => setSelection('coil');
  document.getElementById('selSlow').onclick = () => setSelection('slow');
  document.getElementById('selPoison').onclick = () => setSelection('poison');
  document.getElementById('selSpike').onclick = () => setSelection('spike');
  document.getElementById('selTank').onclick = () => setSelection('tank');
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

  document.getElementById('startWave').onclick = () => startWave();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / CW);
    const r = Math.floor(y / CH);
    const cfg = TOWER_TYPES[selection];

    const existing = towers.find(t => t.c === c && t.r === r);
    if (existing) {
      // upgrade
      const upCost = Math.round((cfg.cost || 20) * (1 + existing.level * 0.6));
      if (coins >= upCost) {
        coins -= upCost;
        existing.level++;
        existing.range *= 1.15;
        existing.damage *= 1.2;
      }
      setSelection(selection);
      return;
    }

    if (cfg.roadOnly && !isRoad(c, r)) return;
    if (!cfg.roadOnly && isRoad(c, r)) return;
    if (hasTower(c, r)) return;
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

  function startWave() {
    wave++;
    const count = 10 + wave * 2;
    for (let i = 0; i < count; i++) {
      enemies.push(makeEnemy(i * 500));
    }
    setSelection(selection);
  }

  function makeEnemy(delay) {
    const start = roadCells[0];
    const p = cellCenter(start.c, start.r);
    return {
      x: p.x, y: p.y,
      speed: 80 + wave * 6,
      hp: 60 + wave * 20,
      maxHp: 60 + wave * 20,
      pathIndex: 0,
      offset: 0,
      spawnDelay: delay,
      dead: false,
      poisonUntil: 0,
      slowUntil: 0,
    };
  }

  function nearestEnemy(x, y, rangePx) {
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

  function update(dt) {
    // enemies
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.spawnDelay > 0) { e.spawnDelay -= dt * 1000; continue; }

      // poison tick
      if (performance.now() < e.poisonUntil) {
        e.hp -= 1.5 * dt * 60; // mild DoT scaled by FPS
      }
      // slow
      const slowed = performance.now() < e.slowUntil ? 0.6 : 1.0;

      const nextIdx = Math.min(roadCells.length - 1, e.pathIndex + 1);
      const a = cellCenter(roadCells[e.pathIndex].c, roadCells[e.pathIndex].r);
      const b = cellCenter(roadCells[nextIdx].c, roadCells[nextIdx].r);
      const dx = b.x - a.x, dy = b.y - a.y;
      const segLen = Math.max(1, Math.hypot(dx, dy));
      const step = e.speed * slowed * dt;
      e.offset += step;
      if (e.offset >= segLen) { e.pathIndex = nextIdx; e.offset = 0; }
      const t = e.offset / segLen;
      e.x = a.x + dx * t; e.y = a.y + dy * t;

      // reach carrot
      if (e.pathIndex >= roadCells.length - 1) {
        e.dead = true; // reached base; for now just remove
      }
    }

    // towers
    for (const t of towers) {
      t.cooldown = Math.max(0, t.cooldown - dt);
      if (t.type === 'spike') {
        for (const e of enemies) {
          if (e.dead || e.spawnDelay > 0) continue;
          const dx = e.x - t.x, dy = e.y - t.y;
          if (dx * dx + dy * dy <= t.trapRadius * t.trapRadius) {
            e.hp -= t.damage * dt * 2.0; // DPS
          }
        }
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

      if (t.type === 'tank') {
        if (t.cooldown <= 0) {
          // global blast
          for (const e of enemies) {
            if (e.dead || e.spawnDelay > 0) continue;
            e.hp -= t.damage;
          }
          t.cooldown = t.rate;
        }
        continue;
      }

      // targeted weapons
      if (t.cooldown <= 0) {
        const target = nearestEnemy(t.x, t.y, t.range);
        if (target) {
          addBullet(t, target, t.type);
          t.cooldown = t.rate;
        }
      }
    }

    // bullets
    for (const b of bullets) {
      if (!b.target || b.target.dead) {
        b.dead = true; // remove if target gone
        continue;
      }
      const dx = b.target.x - b.x, dy = b.target.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        // hit
        if (b.splash > 0) {
          for (const e of enemies) {
            const ex = e.x - b.x, ey = e.y - b.y;
            if (ex * ex + ey * ey <= b.splash * b.splash) e.hp -= b.damage * 0.9;
          }
        } else {
          b.target.hp -= b.damage;
        }
        if (b.type === 'poison') {
          b.target.poisonUntil = performance.now() + b.dotTime * 1000;
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

    // cleanup
    for (const e of enemies) if (e.hp <= 0) e.dead = true;
    let i = bullets.length; while (i--) if (bullets[i].dead) bullets.splice(i, 1);
    i = enemies.length; while (i--) if (enemies[i].dead) enemies.splice(i, 1);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // grid
    ctx.strokeStyle = '#2f3136';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CW, 0); ctx.lineTo(c * CW, canvas.height); ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CH); ctx.lineTo(canvas.width, r * CH); ctx.stroke();
    }

    // road base
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5c6bc0';
    ctx.lineWidth = 18;
    ctx.beginPath();
    let p0 = cellCenter(roadCells[0].c, roadCells[0].r);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < roadCells.length; i++) {
      const p = cellCenter(roadCells[i].c, roadCells[i].r);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // dashed centerline for visibility
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    p0 = cellCenter(roadCells[0].c, roadCells[0].r);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < roadCells.length; i++) {
      const p = cellCenter(roadCells[i].c, roadCells[i].r);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // carrot base
    const cPos = cellCenter(carrotCell.c, carrotCell.r);
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath(); ctx.arc(cPos.x, cPos.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#66bb6a'; ctx.fillRect(cPos.x - 5, cPos.y - 22, 10, 12);

    // towers
    for (const t of towers) {
      ctx.save();
      ctx.translate(t.x, t.y);
      if (t.type === 'spike') {
        ctx.strokeStyle = '#b0bec5';
        ctx.beginPath(); ctx.arc(0, 0, t.trapRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#b0bec5';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#90caf9';
        ctx.beginPath(); ctx.arc(0, 0, 10 + t.level * 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 14 + t.level, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      // range hint
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.type === 'spike' ? t.trapRadius : t.range, 0, Math.PI * 2); ctx.stroke();
    }

    // enemies
    for (const e of enemies) {
      ctx.fillStyle = '#ef5350';
      ctx.beginPath(); ctx.arc(e.x, e.y, 8, 0, Math.PI * 2); ctx.fill();
      // hp bar
      ctx.fillStyle = '#263238'; ctx.fillRect(e.x - 12, e.y - 14, 24, 4);
      ctx.fillStyle = '#66bb6a'; ctx.fillRect(e.x - 12, e.y - 14, Math.max(0, 24 * (e.hp / e.maxHp)), 4);
    }

    // bullets
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2;
    for (const b of bullets) {
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.08, b.y - b.vy * 0.08); ctx.stroke();
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

    // HUD
    ctx.fillStyle = '#e6e6e6';
    ctx.font = '14px -apple-system,Segoe UI,Roboto';
    ctx.fillText(`Coins: ${coins} · Wave: ${wave} · Enemies: ${enemies.length}`, 12, 20);

    // roster simple
    rosterCtx.clearRect(0, 0, rosterCanvas.width, rosterCanvas.height);
    rosterCtx.fillStyle = '#bdbdbd';
    rosterCtx.font = '14px -apple-system,Segoe UI,Roboto';
    rosterCtx.fillText('Enemy roster preview · Runners and Tanks scale with waves', 12, 24);
  }

  let last = performance.now();
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
      this.maxHp = this.hp;
      ctx.lineTo(18 + Math.min(8, 2 * (t.level - 1)), 0);
      this.defense = typeCfg.defense;
      if (t.level >= 5) {
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(-6, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      this.baseDamage = typeCfg.damage;
      this.radius = 14;
      this.rewarded = false;
      this.statuses = []; // {type:'slow'|'dot', amount?, duration, dps?}
      this.isAir = !!typeCfg.isAir;
      this.isStealth = !!typeCfg.isStealth;
      this.resists = typeCfg.resists || {}; // damageType -> multiplier
      this.weaknesses = typeCfg.weaknesses || {}; // damageType -> multiplier
      this.immunities = typeCfg.immunities || {}; // flags for 'slow','dot'
      this.revealTimer = 0; // seconds visible while stealth
      this.visible = !this.isStealth;
    }
    update(dt) {
      const targetCell = roadCells[this.pathIndex + 1];
      if (this.isAir) {
        // straight-line to base
        const tp = toPixel(baseCell.c, baseCell.r);
        const dx = tp.x - this.x;
        const dy = tp.y - this.y;
        const dist = Math.hypot(dx, dy);
        const effSpeed = this.speed * (1 - Math.max(0, Math.min(0.8, this.maxSlowFactor())));
        const step = effSpeed * dt;
        if (step >= dist) {
          baseHP -= this.baseDamage;
          this.hp = 0;
          return;
        } else {
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        }
      } else {
        if (!targetCell) {
          baseHP -= this.baseDamage;
          this.hp = 0;
          return;
        }
      }
      // tick statuses
      let slowFactor = 0; // 0..1 fraction to reduce speed
      let dotDps = 0;
      for (const s of this.statuses) {
        s.duration -= dt;
        if (s.type === 'slow') slowFactor = Math.max(slowFactor, s.amount || 0);
        if (s.type === 'dot') dotDps += s.dps || 0;
      }
      // remove expired
      for (let i = this.statuses.length - 1; i >= 0; i--) {
        if (this.statuses[i].duration <= 0) this.statuses.splice(i, 1);
      }
      if (dotDps > 0) {
        this.hp -= dotDps * dt;
        if (this.hp <= 0 && !this.rewarded) {
          coins += 5;
          this.rewarded = true;
        }
      }
      if (!this.isAir) {
        const tp = toPixel(targetCell.c, targetCell.r);
        const dx = tp.x - this.x;
        const dy = tp.y - this.y;
        const dist = Math.hypot(dx, dy);
        const effSpeed = this.speed * (1 - Math.max(0, Math.min(0.8, slowFactor)));
        const step = effSpeed * dt;
        if (step >= dist) {
          this.x = tp.x;
          this.y = tp.y;
          this.pathIndex++;
        } else {
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        }
      }
      // stealth visibility countdown
      if (this.revealTimer > 0) this.revealTimer -= dt;
      this.visible = !this.isStealth || this.revealTimer > 0;
    }
    draw() {
      // enemy shape (dim if hidden stealth)
      if (this.isStealth && !this.visible) ctx.globalAlpha = 0.35;
      drawEnemyShape(this);
      if (this.isStealth && !this.visible) ctx.globalAlpha = 1.0;
      // status indicators (canvas shapes)
      const hasSlow = this.statuses.some(s => s.type === 'slow');
      const hasDot = this.statuses.some(s => s.type === 'dot');
      if (hasSlow) drawSnowflake(this.x - 10, this.y - this.radius - 12, 6, '#5ec8ff');
      if (hasDot) drawDroplet(this.x + 10, this.y - this.radius - 12, 6, '#ff784e');
      // HP bar
      const w = 26;
      const h = 4;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#222';
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 10, w, h);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 10, w * hpRatio, h);
    }
  }

  class Bullet {
    constructor(x, y, target, damage, splash = 0, speed = 240, slow = null, dot = null, damageType = 'physical') {
      this.x = x;
      this.y = y;
      this.target = target;
      this.speed = speed;
      this.damage = damage;
      this.radius = 4;
      this.splash = splash; // area-of-effect radius (0 = single-target)
      this.slow = slow; // {factor:0..1, duration:s}
      this.dot = dot;   // {dps:number, duration:s}
      this.damageType = damageType;
    }
    update(dt) {
      if (!this.target || this.target.hp <= 0) { this.remove = true; return; }
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (step >= dist) {
        // hit
        this.x = this.target.x;
        this.y = this.target.y;
        // hit target
        applyHitEffects(this.target, this);
        if (this.splash > 0) {
          // area damage
          for (const e of enemies) {
            if (e.hp <= 0) continue;
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d <= this.splash) {
              applyHitEffects(e, this);
            }
          }
          // explosion effect
          effects.push({ type: 'explosion', x: this.x, y: this.y, r: this.splash, life: 0.18 });
        }
        this.remove = true;
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
    }
    draw() {
      ctx.fillStyle = '#00cfff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function applyHitEffects(enemy, bullet) {
    // reveal stealth on hit
    enemy.revealTimer = Math.max(enemy.revealTimer, 1.0);
    // damage type multipliers
    let mult = 1;
    if (enemy.resists && enemy.resists[bullet.damageType]) mult *= enemy.resists[bullet.damageType];
    if (enemy.weaknesses && enemy.weaknesses[bullet.damageType]) mult *= enemy.weaknesses[bullet.damageType];
    // damage with defense
    const eff = Math.max(1, Math.round(bullet.damage * mult) - (enemy.defense || 0));
    enemy.hp -= eff;
    if (enemy.hp <= 0 && !enemy.rewarded) {
      coins += 5;
      enemy.rewarded = true;
    }
    // apply slow
    if (bullet.slow && !enemy.immunities?.slow) {
      enemy.statuses.push({ type: 'slow', amount: bullet.slow.factor, duration: bullet.slow.duration });
    }
    // apply dot
    if (bullet.dot && !enemy.immunities?.dot) {
      // DoT is also affected by damage type multipliers
      const dm = (enemy.resists?.[bullet.damageType] || 1) * (enemy.weaknesses?.[bullet.damageType] || 1);
      enemy.statuses.push({ type: 'dot', dps: bullet.dot.dps * dm, duration: bullet.dot.duration });
    }
  }

  Enemy.prototype.maxSlowFactor = function () {
    let s = 0;
    for (const st of this.statuses) {
      if (st.type === 'slow') s = Math.max(s, st.amount || 0);
    }
    return s;
  };

  const TOWER_TYPES = {
    single: { name: 'Archer', emoji: '🎯', cost: 20, range: 160, rate: 0.8, damage: 12, bulletSpeed: 260, damageType: 'physical', detectRange: 0 },
    aoe: { name: 'Cannon', emoji: '💥', cost: 50, range: 150, rate: 0.5, damage: 22, splash: 80, bulletSpeed: 200, damageType: 'explosive', detectRange: 0 },
    beam: { name: 'Laser', emoji: '🔦', cost: 60, range: 200, rate: 0.6, damage: 10, beamWidth: 22, damageType: 'beam', detectRange: 200 },
    coil: { name: 'Coil', emoji: '⚡️', cost: 70, range: 140, dps: 28, tickRate: 12, damageType: 'electric', detectRange: 140 },
    slow: { name: 'Slow', emoji: '❄️', cost: 40, range: 180, rate: 0.7, damage: 6, bulletSpeed: 240, slow: { factor: 0.5, duration: 2.5 }, damageType: 'ice', detectRange: 120 },
    poison: { name: 'Poison', emoji: '☠️', cost: 50, range: 170, rate: 0.6, damage: 5, bulletSpeed: 230, dot: { dps: 12, duration: 3.0 }, damageType: 'poison', detectRange: 80 },
    spike: { name: 'Spike', emoji: '🪤', cost: 30, range: 0, dps: 25, tickRate: 10, damageType: 'physical', trapRadius: 32 },
    tank: { name: 'Tank', emoji: '🧨', cost: 80, range: 1200, rate: 0.15, damage: 50, splash: 140, bulletSpeed: 200, damageType: 'explosive', detectRange: 0 },
  };

  let selectedTowerType = 'single';
  selSingleBtn.addEventListener('click', () => {
    selectedTowerType = 'single';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a non-road tile to place`;
  });
  selAoeBtn.addEventListener('click', () => {
    selectedTowerType = 'aoe';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a non-road tile to place`;
  });
  selBeamBtn.addEventListener('click', () => {
    selectedTowerType = 'beam';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a non-road tile to place`;
  });
  selCoilBtn.addEventListener('click', () => {
    selectedTowerType = 'coil';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a non-road tile to place`;
  });
  selSlowBtn.addEventListener('click', () => {
    selectedTowerType = 'slow';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a non-road tile to place`;
  });
  const selPoisonBtn = document.getElementById('selPoison');
  const selSpikeBtn = document.getElementById('selSpike');
  const selTankBtn = document.getElementById('selTank');
  selPoisonBtn.addEventListener('click', () => {
    selectedTowerType = 'poison';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a non-road tile to place`;
  });
  selSpikeBtn.addEventListener('click', () => {
    selectedTowerType = 'spike';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a road tile to place`;
  });
  selTankBtn.addEventListener('click', () => {
    selectedTowerType = 'tank';
    legendEl.textContent = `Current weapon: ${TOWER_TYPES[selectedTowerType].emoji} ${TOWER_TYPES[selectedTowerType].name} · Click a non-road tile to place`;
  });

  function createTower(c, r) {
    const p = toPixel(c, r);
    const cfg = TOWER_TYPES[selectedTowerType];
    return {
      c,
      r,
      x: p.x,
      y: p.y,
      type: selectedTowerType,
      range: cfg.range,
      rate: cfg.rate || 0,
      cooldown: 0,
      damage: cfg.damage || 0,
      emoji: cfg.emoji,
      splash: cfg.splash || 0,
      bulletSpeed: cfg.bulletSpeed || 240,
      beamWidth: cfg.beamWidth || 0,
      cost: cfg.cost,
      slow: cfg.slow || null,
      dot: cfg.dot || null,
      damageType: cfg.damageType || 'physical',
      detectRange: cfg.detectRange || 0,
      // coil-specific
      dps: cfg.dps || 0,
      tickRate: cfg.tickRate || 0,
      tickCooldown: 0,
      level: 1,
      maxLevel: 5,
    };
  }

  function findTarget(tower) {
    let chosen = null;
    let bestHP = Infinity;
    let bestDist = Infinity;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - tower.x, e.y - tower.y);
      if (d <= tower.range) {
        if (e.hp < bestHP || (e.hp === bestHP && d < bestDist)) {
          chosen = e;
          bestHP = e.hp;
          bestDist = d;
        }
      }
    }
    return chosen;
  }

  // Input: place tower on click
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const { c, r } = toCell(x, y);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
    if (hasTower(c, r)) {
      const t = towers.find(t => t.c === c && t.r === r);
      if (!t) return;
      attemptUpgrade(t);
      return;
    }
    if (isRoad(c, r) && selectedTowerType !== 'spike') return; // only spike can be on road
    const tempTower = createTower(c, r);
    if (coins < tempTower.cost) return;
    towers.push(tempTower);
    coins -= tempTower.cost;
  });

  function getUpgradeCost(t) {
    const base = TOWER_TYPES[t.type].cost;
    return Math.round(base * (0.6 + 0.4 * t.level));
  }

  function attemptUpgrade(t) {
    if (t.level >= t.maxLevel) return;
    const cost = getUpgradeCost(t);
    if (coins < cost) return;
    coins -= cost;
    t.level += 1;
    // upgrade rules
    if (t.type === 'coil') {
      t.dps = Math.round(t.dps * 1.25);
      t.tickRate = Math.round(t.tickRate * 1.1);
      t.range = Math.round(t.range * 1.05);
    } else if (t.type === 'beam') {
      t.damage = Math.round(t.damage * 1.25);
      t.range = Math.round(t.range * 1.08);
    } else {
      t.damage = Math.round(t.damage * 1.2);
      t.rate = t.rate * 1.15;
    }
    // upgrade effect
    effects.push({ type: 'upgrade', x: t.x, y: t.y, life: 0.35 });
  }

  // Waves
  let spawning = false;
  let spawnCount = 0;
  let spawnTimer = 0;
  let spawnInterval = 0.8; // seconds
  let spawnQueue = [];
  let waveRoster = [];

  function startWave() {
    if (spawning) return;
    wave += 1;
    const total = 6 + wave * 2;
    spawnQueue = [];
    for (let i = 0; i < total; i++) spawnQueue.push(enemyForWave());
    // build static roster counts by enemy name
    const counts = new Map();
    for (const t of spawnQueue) counts.set(t.name, (counts.get(t.name) || 0) + 1);
    waveRoster = Array.from(counts.entries()).map(([name, count]) => {
      const typeCfg = ENEMY_TYPES.find(e => e.name === name);
      return { type: typeCfg, count };
    });
    spawnCount = spawnQueue.length;
    spawnTimer = 0;
    spawning = true;
    startBtn.disabled = true;
  }

  startBtn.addEventListener('click', startWave);

  function update(dt) {
    // spawn logic
    if (spawning) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && spawnCount > 0) {
        const nextType = spawnQueue.shift();
        enemies.push(new Enemy(nextType));
        spawnCount--;
        spawnTimer = spawnInterval;
      }
      if (spawnCount <= 0) {
        // done spawning, wait until all enemies dead to enable next wave
        if (enemies.every(e => e.hp <= 0)) {
          spawning = false;
          startBtn.disabled = false;
          // keep last waveRoster for reference; will be replaced when starting next wave
        }
      }
    }

    // towers fire
    for (const t of towers) {
      t.cooldown -= dt;
      // continuous coil tick
      if (t.type === 'coil') {
        t.tickCooldown -= dt;
        if (t.tickCooldown <= 0) {
          const tickDamage = (t.dps || 0) / Math.max(1, t.tickRate || 1);
          if (tickDamage > 0) {
            // pulse effect
            effects.push({ type: 'pulse', x: t.x, y: t.y, r: t.range, life: 0.08 });
            for (const e of enemies) {
              if (e.hp <= 0) continue;
              const d = Math.hypot(e.x - t.x, e.y - t.y);
              if (d <= t.range) {
                // reuse hit calc with pseudo bullet
                applyHitEffects(e, { damage: tickDamage, damageType: t.damageType });
              }
            }
          }
          t.tickCooldown = 1 / Math.max(1, t.tickRate || 1);
        }
      }
      if (t.cooldown <= 0) {
        const target = findTarget(t);
        if (target) {
          if (t.type === 'single') {
            bullets.push(new Bullet(t.x, t.y, target, t.damage, 0, t.bulletSpeed, null, null, t.damageType));
          } else if (t.type === 'aoe') {
            bullets.push(new Bullet(t.x, t.y, target, t.damage, t.splash, t.bulletSpeed, null, null, t.damageType));
          } else if (t.type === 'beam') {
            // Beam: instant line damage towards target within range
            const dx = target.x - t.x;
            const dy = target.y - t.y;
            const dist = Math.hypot(dx, dy) || 1;
            const maxDist = Math.min(dist, t.range);
            const x2 = t.x + (dx / dist) * maxDist;
            const y2 = t.y + (dy / dist) * maxDist;
            const w = t.beamWidth;
            for (const e of enemies) {
              if (e.hp <= 0) continue;
              // distance from point e to segment (t -> x2,y2)
              const d = pointToSegmentDistance(e.x, e.y, t.x, t.y, x2, y2);
              if (d <= w / 2) {
                // apply type multipliers
                let mult = 1;
                mult *= (e.resists?.[t.damageType] || 1);
                mult *= (e.weaknesses?.[t.damageType] || 1);
                const eff = Math.max(1, Math.round(t.damage * mult) - (e.defense || 0));
                e.hp -= eff;
                if (e.hp <= 0 && !e.rewarded) { coins += 5; e.rewarded = true; }
              }
            }
            // add beam effect
            effects.push({ type: 'beam', x1: t.x, y1: t.y, x2, y2, width: w, life: 0.12 });
          } else if (t.type === 'slow' || t.type === 'poison') {
            bullets.push(new Bullet(t.x, t.y, target, t.damage, 0, t.bulletSpeed, t.slow, t.dot, t.damageType));
          } else if (t.type === 'tank') {
            const splash = t.level >= 3 ? Math.round(t.splash * 1.2) : t.splash;
            const dmg = t.level >= 3 ? Math.round(t.damage * 1.3) : t.damage;
            bullets.push(new Bullet(t.x, t.y, target, dmg, splash, t.bulletSpeed, null, null, t.damageType));
          }
          if (t.type !== 'coil') {
            t.cooldown = 1 / Math.max(0.0001, t.rate);
          }
        }
      }
      // Spike trap tick
      if (t.type === 'spike') {
        t.tickCooldown = (t.tickCooldown || 0) - dt;
        if (t.tickCooldown <= 0) {
          for (const e of enemies) {
            if (e.hp <= 0) continue;
            // inside trap radius (cell center)
            const d = Math.hypot(e.x - t.x, e.y - t.y);
            if (d <= (t.trapRadius || 32)) {
              applyHitEffects(e, { damage: (t.dps || 25) / Math.max(1, t.tickRate || 10), damageType: t.damageType });
            }
          }
          t.tickCooldown = 1 / Math.max(1, t.tickRate || 10);
        }
      }
    }

    // update enemies
    for (const e of enemies) {
      if (e.hp > 0) e.update(dt);
    }

    // update bullets
    for (const b of bullets) {
      if (!b.remove) b.update(dt);
    }

    // cleanup
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].remove) bullets.splice(i, 1);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].hp <= 0) enemies.splice(i, 1);
    }
  }

  function drawGrid() {
    ctx.strokeStyle = '#2a2c31';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL + 0.5, 0);
      ctx.lineTo(c * CELL + 0.5, ROWS * CELL);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL + 0.5);
      ctx.lineTo(COLS * CELL, r * CELL + 0.5);
      ctx.stroke();
    }
  }

  function getRoadPathPoints() {
    const pts = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (i === 0) {
        const p0 = toPixel(seg.from.c, seg.from.r);
        pts.push(p0);
      }
      const p1 = toPixel(seg.to.c, seg.to.r);
      pts.push(p1);
    }
    return pts;
  }

  function drawRoad() {
    const pts = getRoadPathPoints();
    if (pts.length < 2) return;
    const baseW = CELL - 24; // road width
    // base road
    ctx.strokeStyle = '#b58a5a';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = baseW;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    // center highlight
    ctx.strokeStyle = '#cfa77c';
    ctx.lineWidth = baseW * 0.6;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    // subtle edges
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = baseW * 1.02;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  function drawPlacementTiles() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isRoad(c, r)) continue;
        const x = c * CELL;
        const y = r * CELL;
        const pad = 6;
        const tone = (c + r) % 2 === 0 ? '#2f3137' : '#30333a';
        ctx.fillStyle = tone;
        ctx.fillRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2);
      }
    }
  }

  function drawBase() {
    const p = toPixel(baseCell.c, baseCell.r);
    // platform
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.roundRect(p.x - 26, p.y - 26, 52, 52, 10);
    ctx.fill();
    // carrot emoji
    ctx.font = '32px Apple Color Emoji, Segoe UI Emoji';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🥕', p.x, p.y);
  }

  // Polyfill for roundRect on older canvases
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const radii = Array.isArray(r) ? r : [r, r, r, r];
      const [r0, r1, r2, r3] = radii.map(v => Math.max(0, Math.min(v, Math.min(w, h) / 2)));
      this.beginPath();
      this.moveTo(x + r0, y);
      this.lineTo(x + w - r1, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r1);
      this.lineTo(x + w, y + h - r2);
      this.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
      this.lineTo(x + r3, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r3);
      this.lineTo(x, y + r0);
      this.quadraticCurveTo(x, y, x + r0, y);
      return this;
    };
  }

  function drawTowers() {
    for (const t of towers) {
      drawTowerShape(t);
      // range (faint)
      ctx.strokeStyle = 'rgba(96,125,139,0.18)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.stroke();
      // level badge
      ctx.fillStyle = '#eeeeee';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`Lv${t.level}`, t.x, t.y + 20);
    }
  }

  function drawUI() {
    const pad = 10;
    ctx.fillStyle = '#121317';
    ctx.fillRect(0, 0, canvas.width, 36);
    ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillStyle = '#e6e6e6';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`💰 ${coins}`, pad, 18);
    ctx.fillText(`🥕 HP: ${baseHP}`, 120, 18);
    ctx.fillText(`Wave ${wave}`, 220, 18);
    const sel = TOWER_TYPES[selectedTowerType];
    ctx.fillText(`${sel.emoji} ${sel.name} Cost:${sel.cost}`, 320, 18);
    if (baseHP <= 0) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px system-ui';
      ctx.fillStyle = '#ff6f61';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '16px system-ui';
      ctx.fillStyle = '#bdbdbd';
      ctx.fillText('Refresh the page to restart', canvas.width / 2, canvas.height / 2 + 32);
    }
  }

  // visibility detection for stealth enemies
  function updateVisibility() {
    // if any detect tower is close, reveal enemy briefly
    for (const e of enemies) {
      if (!e.isStealth) { e.visible = true; continue; }
      let revealed = e.revealTimer > 0; 
      if (!revealed) {
        for (const t of towers) {
          if (t.detectRange <= 0) continue;
          const d = Math.hypot(e.x - t.x, e.y - t.y);
          if (d <= t.detectRange) { revealed = true; break; }
        }
      }
      e.visible = revealed;
    }
  }

  function drawBullets() {
    for (const b of bullets) b.draw();
  }

  function drawEnemies() {
    for (const e of enemies) e.draw();
  }

  // Tooltip on hover
  let mouseX = 0, mouseY = 0, hoverEnemy = null, hoverTower = null;
  canvas.addEventListener('mousemove', (ev) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ev.clientX - rect.left;
    mouseY = ev.clientY - rect.top;
  });

  function pickHoverEnemy() {
    hoverEnemy = null;
    for (const e of enemies) {
      const d = Math.hypot(e.x - mouseX, e.y - mouseY);
      if (d <= e.radius + 6) { hoverEnemy = e; break; }
    }
  }

  function drawEnemyTooltip() {
    if (!hoverEnemy) return;
    const e = hoverEnemy;
    const lines = [];
    lines.push(`${e.name} · ${e.isAir ? 'Flying' : 'Ground'}${e.isStealth ? '·Stealth' : ''}`);
    lines.push(`HP ${Math.max(0, Math.round(e.hp))}/${e.maxHp} Defense ${e.defense}`);
    const resList = Object.keys(e.resists || {});
    const weakList = Object.keys(e.weaknesses || {});
    if (resList.length) lines.push(`Resists: ${resList.join(', ')}`);
    if (weakList.length) lines.push(`Weaknesses: ${weakList.join(', ')}`);
    const x = e.x + 20;
    const y = e.y - 24;
    const w = 160;
    const h = 18 * lines.length + 10;
    ctx.fillStyle = 'rgba(20,22,28,0.85)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, -apple-system';
    ctx.fillStyle = '#e6e6e6';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x + 8, y + 6 + i * 18);
    }
  }

  function pickHoverTower() {
    hoverTower = null;
    for (const t of towers) {
      const d = Math.hypot(t.x - mouseX, t.y - mouseY);
      if (d <= 22) { hoverTower = t; break; }
    }
  }

  function drawTowerTooltip() {
    if (!hoverTower) return;
    const t = hoverTower;
    const cfg = TOWER_TYPES[t.type];
    const lines = [];
    lines.push(`${cfg.emoji} ${cfg.name} · Lv${t.level}/${t.maxLevel}`);
    if (t.type === 'coil') {
      lines.push(`Range ${t.range} DPS ${t.dps}`);
    } else if (t.type === 'beam') {
      lines.push(`Range ${t.range} Damage ${t.damage}/shot`);
      lines.push(`Rate ${(t.rate).toFixed(2)} shots/sec`);
    } else {
      lines.push(`Range ${t.range} Damage ${t.damage}/shot`);
      lines.push(`Rate ${(t.rate).toFixed(2)} shots/sec`);
    }
    if (t.level < t.maxLevel) {
      const cost = getUpgradeCost(t);
      lines.push(`Upgrade Cost: ${cost} ${coins >= cost ? '(Upgradeable)' : '(Not enough coins)'}`);
      lines.push(`Hint: Click this tower to upgrade`);
    } else {
      lines.push(`Max level reached`);
    }
    const x = t.x + 20;
    const y = t.y - 24;
    const w = 200;
    const h = 18 * lines.length + 10;
    ctx.fillStyle = 'rgba(20,22,28,0.85)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px system-ui, -apple-system';
    ctx.fillStyle = '#e6e6e6';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x + 8, y + 6 + i * 18);
    }
  }

  // simple effects for visuals
  const effects = [];

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(px - x1, py - y1);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(px - x2, py - y2);
    const b = c1 / c2;
    const bx = x1 + b * vx;
    const by = y1 + b * vy;
    return Math.hypot(px - bx, py - by);
  }

  function updateEffects(dt) {
    for (const eff of effects) {
      eff.life -= dt;
    }
    for (let i = effects.length - 1; i >= 0; i--) {
      if (effects[i].life <= 0) effects.splice(i, 1);
    }
  }

  function drawEffects() {
    for (const eff of effects) {
      if (eff.type === 'explosion') {
        ctx.strokeStyle = 'rgba(255, 99, 71, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(eff.x, eff.y, eff.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (eff.type === 'beam') {
        ctx.strokeStyle = 'rgba(0, 207, 255, 0.85)';
        ctx.lineWidth = eff.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(eff.x1, eff.y1);
        ctx.lineTo(eff.x2, eff.y2);
        ctx.stroke();
      } else if (eff.type === 'pulse') {
        const alpha = Math.max(0, eff.life / 0.08);
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.25 * alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(eff.x, eff.y, eff.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (eff.type === 'upgrade') {
        // sparkle
        const a = Math.max(0, eff.life / 0.35);
        ctx.strokeStyle = `rgba(255, 215, 0, ${a})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const x1 = eff.x + Math.cos(ang) * 4;
          const y1 = eff.y + Math.sin(ang) * 4;
          const x2 = eff.x + Math.cos(ang) * 10;
          const y2 = eff.y + Math.sin(ang) * 10;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }
  }

  // ---------- Enemy roster panel ----------
  let rosterItems = [];
  let rosterHover = null;
  rosterCanvas.addEventListener('mousemove', (ev) => {
    const rect = rosterCanvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    rosterHover = null;
    for (const it of rosterItems) {
      const d = Math.hypot(mx - it.x, my - it.y);
      if (d <= it.r) { rosterHover = it.type; break; }
    }
  });

  function drawEnemyRoster() {
    rosterCtx.clearRect(0, 0, rosterCanvas.width, rosterCanvas.height);
    // background
    rosterCtx.fillStyle = '#222327';
    rosterCtx.fillRect(0, 0, rosterCanvas.width, rosterCanvas.height);
    rosterItems = [];
    // layout
    const iconR = 12;
    const pad = 12;
    const cols = Math.floor((rosterCanvas.width - pad * 2) / (iconR * 3));
    let i = 0;
    for (const item of waveRoster) {
      const type = item.type;
      const count = item.count;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (iconR * 3) + iconR * 1.5;
      const y = pad + row * (iconR * 3) + iconR * 1.5;
      drawEnemyIcon(rosterCtx, type.name, x, y, iconR);
      // count label
      rosterCtx.fillStyle = '#e6e6e6';
      rosterCtx.font = '12px system-ui';
      rosterCtx.textAlign = 'left';
      rosterCtx.textBaseline = 'top';
      rosterCtx.fillText(`x${count}`, x + iconR + 6, y - 6);
      rosterItems.push({ type, x, y, r: iconR });
      i++;
      if (pad + row * (iconR * 3) + iconR * 3 > rosterCanvas.height - pad) break;
    }
    if (rosterHover) {
      drawTypeTooltip(rosterCtx, rosterHover, pad, rosterCanvas.height - 80);
    }
  }

  function drawEnemyIcon(c, name, x, y, r) {
    // minimal shapes per type
    c.save();
    c.translate(x, y);
    c.fillStyle = '#3a3d44';
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.9;
    // simple color per type
    const colorMap = {
      Runner: '#26c6da', Tank: '#8d6e63', Armored: '#b0bec5', Dragon: '#ff7043', Bat: '#9575cd', Ghost: '#cfd8dc', Golem: '#6d4c41'
    };
    c.fillStyle = colorMap[name] || '#ef9a9a';
    c.beginPath(); c.arc(0, 0, r - 4, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function drawTypeTooltip(c, typeCfg, x, y) {
    const hpPreview = Math.round(typeCfg.hp * (1 + wave * 0.15));
    const lines = [];
    lines.push(`${typeCfg.name} · ${typeCfg.isAir ? 'Flying' : 'Ground'}${typeCfg.isStealth ? '·Stealth' : ''}`);
    lines.push(`HP ${hpPreview} Defense ${typeCfg.defense || 0}`);
    const resList = Object.keys(typeCfg.resists || {});
    const weakList = Object.keys(typeCfg.weaknesses || {});
    const immList = Object.keys(typeCfg.immunities || {});
    if (resList.length) lines.push(`Resists: ${resList.join(', ')}`);
    if (weakList.length) lines.push(`Weaknesses: ${weakList.join(', ')}`);
    if (immList.length) lines.push(`Immunities: ${immList.join(', ')}`);
    const w = 220;
    const h = 18 * lines.length + 10;
    c.fillStyle = 'rgba(20,22,28,0.85)';
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(x, y, w, h, 8);
    c.fill();
    c.stroke();
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.font = '13px system-ui, -apple-system';
    c.fillStyle = '#e6e6e6';
    for (let i = 0; i < lines.length; i++) {
      c.fillText(lines[i], x + 8, y + 6 + i * 18);
    }
  }

  // ---------- Shapes (no emoji) ----------
  function drawTowerShape(t) {
    // base
    ctx.fillStyle = '#5f7380';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
    ctx.fill();
    // head by type
    const ang = findAngleToNearest(t) ?? -Math.PI / 2;
    if (t.type === 'single') {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.arc(0, -2, 10, 0, Math.PI * 2);
      ctx.fill();
      // barrel
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(14, -2);
      ctx.stroke();
      ctx.restore();
    } else if (t.type === 'aoe') {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(ang - Math.PI / 6);
      ctx.fillStyle = '#a1887f';
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(10, 6);
      ctx.lineTo(0, -12);
      ctx.closePath();
      ctx.fill();
      // tube
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(10, -12);
      ctx.stroke();
      ctx.restore();
    } else if (t.type === 'beam') {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.fillStyle = '#00cfff';
      ctx.beginPath();
      ctx.roundRect(-8, -12, 16, 24, 4);
      ctx.fill();
      // lens + orientation indicator
      ctx.rotate(ang);
      ctx.strokeStyle = '#00cfff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();
      ctx.restore();
    } else if (t.type === 'slow') {
      drawSnowflake(t.x, t.y, 12, '#5ec8ff');
    } else if (t.type === 'dot') {
      drawFlame(t.x, t.y, 12);
    } else if (t.type === 'coil') {
      ctx.strokeStyle = '#00e1ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
      ctx.stroke();
      // lightning bolt
      ctx.strokeStyle = '#00e1ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - 6, t.y - 2);
      ctx.lineTo(t.x - 1, t.y - 2);
      ctx.lineTo(t.x - 5, t.y + 6);
      ctx.lineTo(t.x + 6, t.y - 6);
      ctx.stroke();
    } else if (t.type === 'poison') {
      // green droplet
      drawDroplet(t.x, t.y, 12, '#4caf50');
    } else if (t.type === 'spike') {
      // small spike triangle pattern
      ctx.fillStyle = '#b0bec5';
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const sx = t.x + i * 10;
          const sy = t.y + j * 10;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 6);
          ctx.lineTo(sx - 5, sy + 6);
          ctx.lineTo(sx + 5, sy + 6);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (t.type === 'tank') {
      // big cannon
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#607d8b';
      ctx.beginPath();
      ctx.roundRect(-12, -10, 24, 20, 6);
      ctx.fill();
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEnemyShape(e) {
    const x = e.x, y = e.y, r = e.radius;
    const ang = angleTowardsEnemy(e);
    if (e.name === 'Runner') {
      // teardrop + ear + eye oriented forward
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = '#26c6da';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, -10, 10, 0);
      ctx.quadraticCurveTo(0, 10, -6, 0);
      ctx.fill();
      // ear
      ctx.strokeStyle = '#80deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(2, -12);
      ctx.stroke();
      // eye
      ctx.fillStyle = '#102a43';
      ctx.beginPath();
      ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (e.name === 'Tank') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      // tracks
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.roundRect(-r + 2, 4, (r - 2) * 2, 6, 3);
      ctx.fill();
      // body
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.roundRect(-r + 4, -r + 2, (r - 4) * 2, r + 6, 6);
      ctx.fill();
      // turret
      ctx.fillStyle = '#6d4c41';
      ctx.beginPath();
      ctx.arc(0, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      // barrel
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(12, -2);
      ctx.stroke();
      ctx.restore();
    } else if (e.name === 'Armored') {
      // shield shape
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r, -r / 2, r * 0.6, r * 0.4);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.6, r * 0.4);
      ctx.quadraticCurveTo(-r, -r / 2, 0, -r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (e.name === 'Dragon') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      // head
      ctx.fillStyle = '#ff7043';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(2, -5);
      ctx.lineTo(2, 5);
      ctx.closePath();
      ctx.fill();
      // back spikes
      ctx.fillStyle = '#ff8a65';
      for (let i = -8; i <= 6; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, -3);
        ctx.lineTo(i + 2, 0);
        ctx.lineTo(i, 3);
        ctx.closePath();
        ctx.fill();
      }
      // body
      ctx.strokeStyle = '#ff7043';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(-2, -6, 6, 0);
      ctx.quadraticCurveTo(-2, 6, -10, 0);
      ctx.stroke();
      ctx.restore();
    } else if (e.name === 'Bat') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      // body
      ctx.fillStyle = '#7e57c2';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      // wings
      ctx.fillStyle = '#9575cd';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-8, -6, -14, 0);
      ctx.quadraticCurveTo(-8, 6, 0, 0);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(8, -6, 14, 0);
      ctx.quadraticCurveTo(8, 6, 0, 0);
      ctx.fill();
      ctx.restore();
    } else if (e.name === 'Ghost') {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.moveTo(-r + 4, -r + 2);
      ctx.lineTo(r - 4, -r + 2);
      ctx.quadraticCurveTo(r, 0, r - 6, r - 4);
      // wavy bottom
      for (let i = r - 4; i >= -r + 2; i -= 6) {
        ctx.quadraticCurveTo(i - 3, r + 4, i - 6, r - 4);
      }
      ctx.quadraticCurveTo(-r, 0, -r + 4, -r + 2);
      ctx.closePath();
      ctx.fill();
      // eyes
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(-6, 0, 3, 0, Math.PI * 2);
      ctx.arc(6, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (e.name === 'Golem') {
      ctx.save();
      ctx.translate(x, y);
      drawStone(-6, -4, 12, 10, '#8d6e63');
      drawStone(4, 6, 10, 8, '#a1887f');
      drawStone(-10, 6, 8, 6, '#6d4c41');
      drawStone(8, -6, 9, 7, '#795548');
      ctx.restore();
    } else {
      // default
      ctx.fillStyle = '#ef9a9a';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPolygon(x, y, radius, sides, color) {
    if (sides < 3) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawStar(x, y, innerR, outerR, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerR : innerR;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawSnowflake(x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * size, y - Math.sin(a) * size);
      ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
      ctx.stroke();
    }
  }

  function drawDroplet(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.bezierCurveTo(x + size, y - size, x + size, y + size * 0.4, x, y + size);
    ctx.bezierCurveTo(x - size, y + size * 0.4, x - size, y - size, x, y - size);
    ctx.fill();
  }

  function drawFlame(x, y, size) {
    // outer
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.bezierCurveTo(x + size, y - size * 0.6, x + size * 0.8, y + size * 0.4, x, y + size);
    ctx.bezierCurveTo(x - size * 0.8, y + size * 0.4, x - size, y - size * 0.6, x, y - size);
    ctx.fill();
    // inner
    ctx.fillStyle = '#ffd180';
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.6);
    ctx.bezierCurveTo(x + size * 0.6, y - size * 0.3, x + size * 0.4, y + size * 0.2, x, y + size * 0.6);
    ctx.bezierCurveTo(x - size * 0.4, y + size * 0.2, x - size * 0.6, y - size * 0.3, x, y - size * 0.6);
    ctx.fill();
  }

  function drawStone(cx, cy, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy);
    ctx.lineTo(cx - w / 4, cy - h / 2);
    ctx.lineTo(cx + w / 4, cy - h / 2 + 2);
    ctx.lineTo(cx + w / 2, cy + 2);
    ctx.lineTo(cx + w / 4, cy + h / 2);
    ctx.lineTo(cx - w / 4, cy + h / 2 - 2);
    ctx.closePath();
    ctx.fill();
  }

  function angleTowardsEnemy(e) {
    let tx = e.x, ty = e.y;
    if (e.isAir) {
      const p = toPixel(baseCell.c, baseCell.r);
      tx = p.x; ty = p.y;
    } else {
      const nextCell = roadCells[e.pathIndex + 1] || roadCells[e.pathIndex];
      if (nextCell) {
        const p = toPixel(nextCell.c, nextCell.r);
        tx = p.x; ty = p.y;
      }
    }
    return Math.atan2(ty - e.y, tx - e.x);
  }

  function findAngleToNearest(t) {
    let best = null;
    let bestD = Infinity;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d <= t.range && d < bestD) { best = e; bestD = d; }
    }
    if (!best) return null;
    return Math.atan2(best.y - t.y, best.x - t.x);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // board bg
    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(0, 36, canvas.width, canvas.height - 36);

    // world
    drawPlacementTiles();
    drawRoad();
    drawBase();
    drawGrid();

    if (baseHP > 0) {
      update(dt);
      updateVisibility();
      updateEffects(dt);
    }

    // entities
    drawBullets();
    drawTowers();
    drawEnemies();
    drawEffects();
    pickHoverEnemy();
    pickHoverTower();
    drawTowerTooltip();
    drawEnemyTooltip();
    drawEnemyRoster();

    // UI
    drawUI();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
