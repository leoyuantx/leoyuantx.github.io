import { ARROW_TYPES, BOW_TYPES, ENEMY_TEMPLATES, GRAVITY, MATERIALS, POTIONS } from './data.js';

export function spawnEnemy(state, type, x, y, scale = 1) {
  const base = ENEMY_TEMPLATES[type] || ENEMY_TEMPLATES.slime;
  const enemy = {
    ...base,
    type,
    x,
    y,
    w: base.w,
    h: base.h,
    hp: Math.ceil(base.hp * scale),
    maxHp: Math.ceil(base.hp * scale),
    speed: base.speed,
    damage: Math.ceil(base.dmg * scale),
    color: base.color,
    vx: 0,
    vy: 0,
    grounded: false,
    alive: true,
    atkCd: 0,
    skillCd: 0,
    hoverOffset: 0,
    status: { burn: 0, freeze: 0 }
  };
  state.enemies.push(enemy);
  return enemy;
}

export function spawnBoss(state, boss, x, y, level) {
  const template = boss.vehicle ? ENEMY_TEMPLATES[boss.vehicle] : ENEMY_TEMPLATES.ogre;
  const enemy = {
    ...template,
    type: boss.name,
    x,
    y,
    w: Math.round((template.w || 64) * (boss.size || 2)),
    h: Math.round((template.h || 80) * (boss.size || 2)),
    hp: boss.hp,
    maxHp: boss.hp,
    damage: boss.dmg,
    speed: Math.max(35, template.speed || 50),
    color: boss.color,
    alive: true,
    grounded: false,
    atkCd: 0,
    skillCd: 3,
    hoverOffset: 0,
    status: { burn: 0, freeze: 0 },
    isBoss: true,
    ability: boss.ability,
    level,
    vehicle: boss.vehicle || null,
    armored: true,
    vx: 0,
    vy: 0
  };
  state.enemies.push(enemy);
}

export function spawnMilestoneBoss(state, boss, x, y, level) {
  if (level === 900) {
    // HYDRA: spawn 3 heads as separate enemies linked together
    const headColors = ['#15803d', '#166534', '#14532d'];
    const headNames = ['HYDRA LEFT HEAD', 'HYDRA CENTER HEAD', 'HYDRA RIGHT HEAD'];
    const headHp = Math.round(boss.hp / 3);
    for (let i = 0; i < 3; i++) {
      const head = {
        type: headNames[i],
        x: x - 120 + i * 120,
        y,
        w: 80,
        h: 100,
        hp: headHp,
        maxHp: headHp,
        damage: boss.dmg,
        speed: 30,
        color: headColors[i],
        alive: true,
        grounded: false,
        atkCd: 0,
        skillCd: 4 + i,
        hoverOffset: 0,
        status: { burn: 0, freeze: 0 },
        isBoss: true,
        ability: 'hydra_breath',
        level,
        vehicle: null,
        armored: true,
        vx: 0,
        vy: 0,
        hydraHead: true,
        headIndex: i,
        milestone: 'hydra'
      };
      state.enemies.push(head);
    }
    return;
  }
  // Other milestone bosses (Bone Giant, Ghost, Dread Amalgam)
  const enemy = {
    type: boss.name,
    x,
    y,
    w: Math.round(64 * (boss.size || 4)),
    h: Math.round(80 * (boss.size || 4)),
    hp: boss.hp,
    maxHp: boss.hp,
    damage: boss.dmg,
    speed: 40,
    color: boss.color,
    alive: true,
    grounded: false,
    atkCd: 0,
    skillCd: 3,
    hoverOffset: 0,
    status: { burn: 0, freeze: 0 },
    isBoss: true,
    ability: boss.ability,
    level,
    vehicle: null,
    armored: true,
    vx: 0,
    vy: 0,
    milestone: boss.name
  };
  // Ghost: phase timer
  if (boss.ability === 'phase') {
    enemy.phaseTimer = 0;
    enemy.phased = false;
  }
  // Dread Amalgam: combined abilities
  if (boss.ability === 'amalgam') {
    enemy.phaseTimer = 0;
    enemy.phased = false;
    enemy.boneStormCd = 0;
  }
  state.enemies.push(enemy);
}

function getSwordDamage(state) {
  const p = state.player;
  // Sword of Light: strongest weapon in the game
  if (p.swordMaterial === 'light') {
    const base = 25 + (p.swordLevel - 1) * 1.2;
    return base * p.potionEffects.damage.mult;
  }
  const index = Math.max(0, MATERIALS.indexOf(p.swordMaterial));
  const base = 3 + index * 2 + (p.swordLevel - 1) * 0.6;
  return base * p.potionEffects.damage.mult;
}

function getShieldBlock(state) {
  let block = 0;
  if (state.player.shieldMaterial) {
    const idx = Math.max(0, MATERIALS.indexOf(state.player.shieldMaterial));
    block += 0.12 + idx * 0.1 + state.player.shieldLevel * 0.02;
  }
  if (state.player.potionEffects.shield.active) block += state.player.potionEffects.shield.strength;
  if (state.input.guard) block += 0.35;
  return Math.max(0, Math.min(1, block));
}

export function performSwordAttack(state) {
  const p = state.player;
  if (p.attackCooldown > 0) return;
  p.attackCooldown = 0.45;
  p.attackTimer = 0.2;
  p.totalSwings += 1;
  if (state.activeQuest && state.activeQuest.goal === 'swings') state.questProgress += 1;
  const hitX = p.x + p.facing * 60;
  const hitY = p.y + p.h / 2;

  state.effects.push({ type: 'slash', x: hitX, y: hitY, t: 0.15, dir: p.facing });
  state.enemies.forEach((e) => {
    if (!e.alive) return;
    const dist = Math.hypot(e.x - hitX, (e.y + e.h / 2) - hitY);
    if (dist < 72) {
      damageEnemy(state, e, getSwordDamage(state), 'sword');
      // Sword of Light: apply ALL element status effects
      if (p.swordMaterial === 'light' && e.status) {
        e.status.burn = Math.max(e.status.burn || 0, 4);
        e.status.freeze = Math.max(e.status.freeze || 0, 2);
        // Chain lightning to 2 nearby enemies
        const near = state.enemies.filter(n => n.alive && n !== e && Math.abs(n.x - e.x) < 130).slice(0, 2);
        near.forEach(n => {
          n.hp -= getSwordDamage(state) * 0.35;
          state.effects.push({ type: 'pickup', x: n.x, y: n.y - 15, t: 0.4, text: '⚡', color: '#fde047' });
        });
      }
      // Blessing of Light: 15% holy smite chance (bonus AoE burst)
      if (p.hasBlessingOfLight && Math.random() < 0.15) {
        const smiteDmg = getSwordDamage(state) * 0.6;
        state.effects.push({ type: 'pickup', x: e.x, y: e.y - 30, t: 0.8, text: '🌟 SMITE!', color: '#fffbe6' });
        state.cameraShake = Math.max(state.cameraShake, 0.15);
        state.enemies.forEach(n => {
          if (!n.alive || n === e) return;
          if (Math.hypot(n.x - e.x, n.y - e.y) < 120) {
            n.hp -= smiteDmg;
            state.effects.push({ type: 'hit', x: n.x, y: n.y + n.h / 2, t: 0.2 });
          }
        });
      }
    }
  });
}

const ELEMENT_CONFIG = {
  fire:      { damage: 12, range: 140, color: '#ef4444', effectColor: '#f97316', name: 'FIRE BLAST',  statusKey: 'burn',   statusDur: 4 },
  lightning: { damage: 15, range: 180, color: '#facc15', effectColor: '#fde047', name: 'LIGHTNING STRIKE', statusKey: 'freeze', statusDur: 2 },
  water:     { damage: 10, range: 160, color: '#38bdf8', effectColor: '#0ea5e9', name: 'TIDAL WAVE',  statusKey: 'freeze', statusDur: 3 }
};

export function performElementAttack(state) {
  const p = state.player;
  if (!p.element || p.elementCooldown > 0) return false;
  const cfg = ELEMENT_CONFIG[p.element];
  if (!cfg) return false;

  p.elementCooldown = 15;
  p.attackTimer = 0.3;
  p.elementUsed = true;
  if (state.activeQuest && state.activeQuest.goal === 'elements') state.questProgress += 1;

  // Blessing of Light: boosted element attacks
  const blessed = p.hasBlessingOfLight;
  const dmgMult = blessed ? 2.5 : 1;        // 2.5x damage
  const rangeMult = blessed ? 1.5 : 1;       // 50% more range

  const hitX = p.x + p.facing * 40;
  const hitY = p.y + p.h / 2;

  // Element-specific visuals
  if (p.element === 'fire') {
    // Fire blast: expanding cone of flames
    for (let i = 0; i < 5; i++) {
      state.effects.push({ type: 'element_fire', x: hitX + p.facing * i * 28, y: hitY + (Math.random() - 0.5) * 40, t: 0.5, dir: p.facing });
    }
  } else if (p.element === 'lightning') {
    // Lightning: vertical bolt + chain sparks
    state.effects.push({ type: 'element_lightning', x: hitX, y: hitY, t: 0.6, dir: p.facing });
    for (let i = 0; i < 3; i++) {
      state.effects.push({ type: 'element_spark', x: hitX + p.facing * (40 + i * 45), y: hitY + (Math.random() - 0.5) * 60, t: 0.4 });
    }
  } else if (p.element === 'water') {
    // Water: sweeping wave
    state.effects.push({ type: 'element_water', x: hitX, y: hitY, t: 0.55, dir: p.facing });
  }

  // Blessing of Light: also fire off ALL element visuals at once
  if (blessed) {
    if (p.element !== 'fire') {
      for (let i = 0; i < 3; i++) {
        state.effects.push({ type: 'element_fire', x: hitX + p.facing * i * 28, y: hitY + (Math.random() - 0.5) * 30, t: 0.45, dir: p.facing });
      }
    }
    if (p.element !== 'lightning') {
      state.effects.push({ type: 'element_lightning', x: hitX, y: hitY, t: 0.5, dir: p.facing });
      state.effects.push({ type: 'element_spark', x: hitX + p.facing * 60, y: hitY + (Math.random() - 0.5) * 40, t: 0.35 });
    }
    if (p.element !== 'water') {
      state.effects.push({ type: 'element_water', x: hitX, y: hitY, t: 0.45, dir: p.facing });
    }
  }

  const attackName = blessed ? '🌟 BLESSED ' + cfg.name : cfg.name;
  state.effects.push({ type: 'pickup', x: p.x, y: p.y - 30, t: 1.2, text: attackName + '!', color: blessed ? '#fffbe6' : cfg.color });
  state.cameraShake = blessed ? 0.5 : 0.3;

  // Damage enemies in range
  const effectiveRange = cfg.range * rangeMult;
  state.enemies.forEach((e) => {
    if (!e.alive) return;
    const dist = Math.hypot(e.x - hitX, (e.y + e.h / 2) - hitY);
    if (dist < effectiveRange) {
      damageEnemy(state, e, cfg.damage * dmgMult, 'element');
      // Blessing: apply ALL status effects (burn + freeze)
      if (blessed && e.status) {
        e.status.burn = Math.max(e.status.burn || 0, 5);
        e.status.freeze = Math.max(e.status.freeze || 0, 3);
      } else if (cfg.statusKey && e.status) {
        e.status[cfg.statusKey] = cfg.statusDur;
      }
    }
  });
  return true;
}

export function shootArrow(state) {
  if (!state.bowTarget || !state.bowTarget.alive || state.player.arrows <= 0) return;
  state.player.arrows -= 1;
  state.player.totalShots += 1;
  if (state.activeQuest && state.activeQuest.goal === 'arrows') state.questProgress += 1;
  const a = ARROW_TYPES[state.player.arrowType];
  const p = state.player;
  const tx = state.bowTarget.x;
  const ty = state.bowTarget.y + state.bowTarget.h / 2;
  const dx = tx - p.x;
  const dy = ty - (p.y + p.h / 2);
  const len = Math.max(1, Math.hypot(dx, dy));
  state.projectiles.push({
    fromEnemy: false,
    x: p.x,
    y: p.y + p.h / 2,
    vx: (dx / len) * a.speed,
    vy: (dy / len) * a.speed * 0.5,
    damage: a.damage * BOW_TYPES[state.player.bowType].mult,
    bowType: state.player.bowType,
    life: 2.2
  });
  state.bowMode = false;
  state.bowTarget = null;
}

export function usePotionSlot(state, slotIdx) {
  if (slotIdx < 0 || slotIdx >= state.player.maxPotionSlots) return;
  const type = state.player.potionSlots[slotIdx];
  if (!type) return;
  const p = state.player;
  if (type === 'healing') p.hp = Math.min(p.maxHp, p.hp + 15);
  if (type === 'shield') {
    p.potionEffects.shield.active = true;
    p.potionEffects.shield.timer = 30;
    p.potionEffects.shield.strength = 0.6;
  }
  if (type === 'damage') {
    p.potionEffects.damage.active = true;
    p.potionEffects.damage.timer = 45;
    p.potionEffects.damage.mult = 2;
  }
  if (type === 'speed') {
    p.potionEffects.speed.active = true;
    p.potionEffects.speed.timer = 40;
    p.potionEffects.speed.mult = 1.5;
  }
  if (type === 'vitality') {
    p.maxHp += 10;
    p.hp = p.maxHp;
    setTimeout(() => {
      p.maxHp -= 10;
      p.hp = Math.min(p.hp, p.maxHp);
    }, 60000);
  }
  state.effects.push({ type: 'pickup', x: p.x, y: p.y - 20, t: 1, text: `${POTIONS[type].name}!`, color: POTIONS[type].color });
  state.player.potionSlots[slotIdx] = null;
}

export function addPotionToSlots(state, potionType) {
  for (let i = 0; i < state.player.maxPotionSlots; i += 1) {
    if (!state.player.potionSlots[i]) {
      state.player.potionSlots[i] = potionType;
      return true;
    }
  }
  return false;
}

function applyPlayerDamage(state, amount) {
  const p = state.player;
  // Quest tracking: took damage
  if (state.activeQuest && state.activeQuest.goal === 'noDamage') {
    state.questDamageTaken = true;
  }
  if (p.hasForceField && p.forceFieldActive) {
    p.forceFieldHP -= amount;
    if (p.forceFieldHP <= 0) {
      p.forceFieldActive = false;
      p.forceFieldRespawn = 10;
      const overflow = Math.abs(p.forceFieldHP);
      p.forceFieldHP = 0;
      p.hp -= overflow;
    }
    return;
  }
  p.hp -= amount;
}

export function damageEnemy(state, enemy, rawDamage, source = 'any') {
  if (!enemy.alive) return;
  // Ghost / Amalgam phasing: immune when phased
  if (enemy.phased) {
    state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 20, t: 0.6, text: 'PHASED!', color: '#a78bfa' });
    return;
  }
  let dmg = rawDamage;
  if (enemy.armored) dmg *= 0.65;
  const crit = Math.random() < 0.25;
  if (crit) dmg *= 1.5;
  const finalDmg = Math.round(dmg * 10) / 10;
  enemy.hp -= finalDmg;
  state.effects.push({ type: 'hit', x: enemy.x, y: enemy.y + enemy.h / 2, t: 0.25 });
  // Floating damage number
  const dmgText = crit ? Math.ceil(finalDmg) + '!' : String(Math.ceil(finalDmg));
  const dmgColor = crit ? '#fbbf24' : (source === 'element' ? '#22d3ee' : '#ffffff');
  state.effects.push({ type: 'pickup', x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y - 8 - Math.random() * 12, t: 0.7, text: dmgText, color: dmgColor });
  if (crit) state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 22, t: 0.8, text: 'CRITICAL!', color: '#fbbf24' });

  // === VEHICLE EJECTION: rare crit on vehicle boss flings the boss out ===
  if (crit && enemy.isBoss && enemy.vehicle && !enemy._ejected && Math.random() < 0.05) {
    ejectBossFromVehicle(state, enemy);
  }

  if (source === 'arrow') {
    const bow = BOW_TYPES[state.player.bowType];
    if (bow.status === 'light') {
      // Bow of Light: apply ALL effects
      enemy.status.burn = Math.max(enemy.status.burn || 0, 3);
      enemy.status.freeze = Math.max(enemy.status.freeze || 0, 2);
      // Chain to nearby
      const near = state.enemies.filter((x) => x.alive && x !== enemy && Math.abs(x.x - enemy.x) < 130).slice(0, 2);
      near.forEach((n) => {
        n.hp -= dmg * 0.45;
        state.effects.push({ type: 'pickup', x: n.x, y: n.y - 15, t: 0.4, text: '⚡', color: '#fde047' });
      });
    } else {
      if (bow.status === 'burn') enemy.status.burn = 3;
      if (bow.status === 'freeze') enemy.status.freeze = 2;
      if (bow.status === 'chain') {
        const near = state.enemies.filter((x) => x.alive && x !== enemy && Math.abs(x.x - enemy.x) < 130).slice(0, 2);
        near.forEach((n) => {
          n.hp -= dmg * 0.45;
          state.effects.push({ type: 'pickup', x: n.x, y: n.y - 15, t: 0.4, text: '⚡', color: '#fde047' });
        });
      }
    }
  }

  if (enemy.hp <= 0) {
    enemy.alive = false;
    // Quest tracking: enemy kill
    if (state.activeQuest) {
      const q = state.activeQuest;
      if (q.goal === 'kill' && enemy.type === q.target) state.questProgress++;
      if (q.goal === 'killAny') state.questProgress++;
      if (q.goal === 'boss' && enemy.isBoss) state.questProgress++;
    }
    const baseMoney = enemy.isBoss ? (enemy.milestone ? 500 : 120) : enemy.vehicle ? 25 : 10;
    const bonus = Math.floor(Math.random() * (enemy.isBoss ? 60 : 12));
    state.drops.push({ type: 'coin', x: enemy.x, y: enemy.y, value: baseMoney + bonus });
    if (Math.random() < (enemy.isBoss ? 0.5 : 0.14)) {
      const types = ['healing', 'shield', 'damage', 'speed', 'vitality'];
      state.drops.push({ type: 'potion', potion: types[Math.floor(Math.random() * types.length)], x: enemy.x + 12, y: enemy.y - 8 });
    }
    if (Math.random() < 0.35) state.drops.push({ type: 'arrow', x: enemy.x - 10, y: enemy.y - 8, value: 3 });
  }
}

// === VEHICLE EJECTION SYSTEM ===
// States: 'falling' -> 'dizzy' -> 'recovering' -> 'reboarding' (or 'on_foot')
function ejectBossFromVehicle(state, boss) {
  boss._ejected = true;
  boss._ejectPhase = 'falling'; // boss is mid-air
  const vehicleType = boss.vehicle;
  const vehicleTemplate = ENEMY_TEMPLATES[vehicleType] || ENEMY_TEMPLATES.tank;

  // Spawn the abandoned vehicle as a separate enemy
  const vehicle = {
    ...vehicleTemplate,
    type: vehicleType,
    x: boss.x,
    y: boss.y,
    w: boss.w,
    h: boss.h,
    hp: Math.round(boss.maxHp * 0.3),
    maxHp: Math.round(boss.maxHp * 0.3),
    damage: Math.round(boss.damage * 0.5),
    speed: 0,  // vehicle is unmanned, sits still
    color: '#6b7280',
    alive: true,
    grounded: false,
    vx: 0,
    vy: 0,
    atkCd: 0,
    skillCd: 99,
    hoverOffset: 0,
    status: { burn: 0, freeze: 0 },
    isBoss: false,
    vehicle: vehicleType,
    armored: true,
    _abandonedVehicle: true,
    _linkedBoss: boss,
  };
  state.enemies.push(vehicle);

  // Shrink the boss (it's now on foot)
  boss.vehicle = null;
  boss.w = Math.round(boss.w * 0.5);
  boss.h = Math.round(boss.h * 0.5);
  boss.armored = false;
  boss.flying = false;
  boss.cannon = false;
  boss.missile = false;
  boss.artillery = false;
  boss.laser = false;
  boss.speed = Math.max(55, boss.speed);
  boss._ejectedVehicle = vehicle;
  boss._dizzyTimer = 5 + Math.random() * 3; // dizzy for 5-8 seconds
  boss._savedSpeed = boss.speed;
  boss.speed = 0; // can't move while falling/dizzy

  // Fling the boss upward and sideways
  boss.vy = -500;
  boss.vx = (Math.random() > 0.5 ? 1 : -1) * 200;
  boss.grounded = false;
  boss.y -= boss.h;

  // Camera shake + big effect
  state.cameraShake = 0.6;
  state.effects.push({ type: 'pickup', x: boss.x, y: boss.y - 40, t: 1.5, text: '💥 EJECTED!', color: '#f59e0b' });
  state.effects.push({ type: 'pickup', x: boss.x, y: boss.y - 20, t: 2.5, text: 'DESTROY VEHICLE OR KILL BOSS!', color: '#ef4444' });
}

function updateVehicleEjection(state, enemy, dt) {
  if (!enemy.isBoss || !enemy._ejected) return;
  const vehicle = enemy._ejectedVehicle;

  // Phase: FALLING - wait for boss to hit the ground
  if (enemy._ejectPhase === 'falling') {
    if (enemy.grounded) {
      enemy._ejectPhase = 'dizzy';
      enemy.speed = 0;
      enemy.vx = 0;
      state.cameraShake = 0.25;
      state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 20, t: 1, text: '💫 STUNNED!', color: '#facc15' });
    }
    return;
  }

  // Phase: DIZZY - boss sits on ground with stars, can't move or attack
  if (enemy._ejectPhase === 'dizzy') {
    enemy.speed = 0;
    enemy.vx = 0;
    enemy.skillCd = 99; // prevent boss abilities while dizzy
    enemy.atkCd = 99;
    enemy._dizzyTimer -= dt;

    // Check if vehicle was destroyed while dizzy
    if (vehicle && !vehicle.alive) {
      enemy._ejectedVehicle = null;
      state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, t: 1.5, text: 'VEHICLE DESTROYED!', color: '#22c55e' });
    }

    if (enemy._dizzyTimer <= 0) {
      // Boss recovers!
      enemy._ejectPhase = 'recovering';
      enemy._recoverTimer = 1.0; // short getting-up animation
      state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, t: 1.2, text: '😠 GETTING UP!', color: '#dc2626' });
    }
    return;
  }

  // Phase: RECOVERING - boss is getting up
  if (enemy._ejectPhase === 'recovering') {
    enemy._recoverTimer -= dt;
    enemy.speed = 0;
    enemy.vx = 0;
    if (enemy._recoverTimer <= 0) {
      enemy.speed = enemy._savedSpeed || 55;
      enemy.atkCd = 0;
      enemy.skillCd = 3;
      // Decide: reboard or fight on foot
      if (enemy._ejectedVehicle && enemy._ejectedVehicle.alive) {
        enemy._ejectPhase = 'reboarding';
        state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, t: 1.5, text: '⚠ HEADING TO VEHICLE!', color: '#f59e0b' });
      } else {
        // No vehicle — fight on foot permanently
        enemy._ejectPhase = 'on_foot';
        enemy._ejected = false;
        enemy._ejectedVehicle = null;
      }
    }
    return;
  }

  // Phase: REBOARDING - boss runs toward vehicle and jumps in
  if (enemy._ejectPhase === 'reboarding') {
    if (!vehicle || !vehicle.alive) {
      // Vehicle destroyed while running to it
      enemy._ejectPhase = 'on_foot';
      enemy._ejected = false;
      enemy._ejectedVehicle = null;
      state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, t: 1.5, text: 'VEHICLE DESTROYED!', color: '#22c55e' });
      return;
    }
    const dx = vehicle.x - enemy.x;
    const dist = Math.abs(dx);
    if (dist < 60) {
      // Jump into vehicle!
      enemy.vy = -400; // jump animation
      enemy.grounded = false;
      vehicle.alive = false;
      enemy.vehicle = vehicle.type;
      enemy.w = vehicle.w;
      enemy.h = vehicle.h;
      enemy.armored = true;
      enemy._ejected = false;
      enemy._ejectedVehicle = null;
      enemy._ejectPhase = null;
      // Restore vehicle properties from template
      const tpl = ENEMY_TEMPLATES[vehicle.type];
      if (tpl) {
        if (tpl.flying) enemy.flying = true;
        if (tpl.cannon) enemy.cannon = true;
        if (tpl.missile) enemy.missile = true;
        if (tpl.artillery) enemy.artillery = true;
        if (tpl.laser) enemy.laser = true;
      }
      state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 30, t: 1.5, text: '🚀 BOSS REBOARDED!', color: '#dc2626' });
      state.cameraShake = 0.4;
    } else {
      // Run toward vehicle
      enemy.vx = Math.sign(dx) * Math.max(enemy.speed, 120);
      enemy.x += enemy.vx * dt;
    }
    return;
  }
}

function bossAbility(state, boss) {
  const p = state.player;
  if (boss.ability === 'slam' && Math.abs(p.x - boss.x) < 230) applyPlayerDamage(state, 14);
  if (boss.ability === 'firewall') {
    for (let i = 0; i < 3; i += 1) state.hazards.push({ type: 'fire', x: p.x - 120 + i * 120, y: state.groundY(window.innerHeight) - 20, t: 2.4 });
  }
  if (boss.ability === 'lightning') state.hazards.push({ type: 'lightning', x: p.x, y: 0, t: 1.4, strikeAt: 0.8 });
  if (boss.ability === 'meteor') {
    for (let i = 0; i < 5; i += 1) state.hazards.push({ type: 'meteor', x: p.x - 250 + i * 110, y: -30 - i * 14, vx: -30 + i * 14, vy: 210, t: 2.8 });
  }
  if (boss.ability === 'vortex') p.x += Math.sign(boss.x - p.x) * 65;
  if (boss.ability === 'tankcharge') {
    boss.charge = { dir: Math.sign(p.x - boss.x) || 1, t: 1.3 };
  }
  if (boss.ability === 'airassault') {
    for (let i = 0; i < 4; i += 1) {
      state.projectiles.push({
        fromEnemy: true,
        x: boss.x,
        y: boss.y + boss.h / 2,
        vx: -150 + i * 100,
        vy: 260,
        damage: 10,
        missile: true,
        life: 3
      });
    }
  }
  if (boss.ability === 'artillery') {
    for (let i = 0; i < 3; i += 1) {
      state.projectiles.push({ fromEnemy: true, x: boss.x, y: boss.y + 8, vx: (Math.random() > 0.5 ? 1 : -1) * 220, vy: -460 + i * 40, damage: 13, shell: true, life: 3.2 });
    }
  }
  // === BONE GIANT ability: Bone Storm – rains bone shards from above ===
  if (boss.ability === 'bone_storm') {
    for (let i = 0; i < 8; i++) {
      state.hazards.push({
        type: 'bone_shard',
        x: p.x - 300 + i * 80 + Math.random() * 40,
        y: -40 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 80,
        vy: 250 + Math.random() * 100,
        t: 3.0
      });
    }
    state.cameraShake = 0.5;
    state.effects.push({ type: 'pickup', x: boss.x, y: boss.y - 40, t: 1.5, text: 'BONE STORM!', color: '#e2e8f0' });
  }
  // === GHOST ability: Phase – becomes untargetable ===
  if (boss.ability === 'phase') {
    boss.phased = true;
    boss.phaseTimer = 3.5;
    state.effects.push({ type: 'pickup', x: boss.x, y: boss.y - 40, t: 1.5, text: 'PHASING...', color: '#a78bfa' });
    // Ghostly projectiles while phased
    for (let i = 0; i < 3; i++) {
      state.projectiles.push({
        fromEnemy: true, x: boss.x, y: boss.y + boss.h / 2,
        vx: Math.sign(p.x - boss.x) * (200 + i * 60), vy: -60 + i * 40,
        damage: boss.damage * 0.4, life: 2.5, ghost: true
      });
    }
  }
  // === HYDRA HEAD ability: acid breath ===
  if (boss.ability === 'hydra_breath') {
    for (let i = 0; i < 4; i++) {
      state.projectiles.push({
        fromEnemy: true, x: boss.x, y: boss.y + 20,
        vx: Math.sign(p.x - boss.x) * (180 + i * 40),
        vy: -80 + i * 50,
        damage: boss.damage * 0.3, life: 2.0, poison: true
      });
    }
    // Area denial acid pools
    state.hazards.push({ type: 'fire', x: p.x + (Math.random() - 0.5) * 200, y: state.groundY(window.innerHeight) - 20, t: 3.0 });
  }
  // === DREAD AMALGAM: combined abilities ===
  if (boss.ability === 'amalgam') {
    const roll = Math.random();
    if (roll < 0.25) {
      // Bone storm
      for (let i = 0; i < 6; i++) {
        state.hazards.push({ type: 'bone_shard', x: p.x - 200 + i * 70, y: -30 - Math.random() * 50, vx: (Math.random() - 0.5) * 80, vy: 250, t: 2.5 });
      }
      state.effects.push({ type: 'pickup', x: boss.x, y: boss.y - 40, t: 1, text: 'BONE RAIN!', color: '#e2e8f0' });
    } else if (roll < 0.5) {
      // Phase
      boss.phased = true;
      boss.phaseTimer = 2.5;
      state.effects.push({ type: 'pickup', x: boss.x, y: boss.y - 40, t: 1, text: 'PHASING!', color: '#a78bfa' });
    } else if (roll < 0.75) {
      // Hydra breath x3
      for (let h = 0; h < 3; h++) {
        for (let i = 0; i < 3; i++) {
          state.projectiles.push({
            fromEnemy: true, x: boss.x + (h - 1) * 60, y: boss.y + 30,
            vx: Math.sign(p.x - boss.x) * (160 + i * 50), vy: -60 + i * 40 + h * 20,
            damage: boss.damage * 0.2, life: 2.0
          });
        }
      }
    } else {
      // Mega slam + meteor
      if (Math.abs(p.x - boss.x) < 300) applyPlayerDamage(state, boss.damage * 0.5);
      for (let i = 0; i < 4; i++) {
        state.hazards.push({ type: 'meteor', x: p.x - 180 + i * 100, y: -30 - i * 15, vx: -20 + i * 12, vy: 220, t: 2.8 });
      }
    }
    state.cameraShake = 0.4;
  }
  // === Generated boss abilities ===
  if (boss.ability === 'bone_rain') {
    for (let i = 0; i < 5; i++) {
      state.hazards.push({ type: 'bone_shard', x: p.x - 200 + i * 90, y: -40, vx: 0, vy: 200, t: 2.5 });
    }
  }
  if (boss.ability === 'freeze_wave') {
    state.hazards.push({ type: 'fire', x: p.x - 100, y: state.groundY(window.innerHeight) - 20, t: 3 });
    state.hazards.push({ type: 'fire', x: p.x + 100, y: state.groundY(window.innerHeight) - 20, t: 3 });
  }
  if (boss.ability === 'poison_cloud') {
    for (let i = 0; i < 4; i++) {
      state.hazards.push({ type: 'fire', x: p.x - 150 + i * 100, y: state.groundY(window.innerHeight) - 20, t: 2.8 });
    }
  }
  if (boss.ability === 'shockwave') {
    if (Math.abs(p.x - boss.x) < 250) applyPlayerDamage(state, 12);
    state.cameraShake = 0.3;
  }
  if (boss.ability === 'chaos') {
    for (let i = 0; i < 4; i++) state.hazards.push({ type: 'meteor', x: p.x - 150 + Math.random() * 300, y: -20, vx: (Math.random() - 0.5) * 80, vy: 200, t: 2.5 });
    state.hazards.push({ type: 'fire', x: p.x, y: state.groundY(window.innerHeight) - 20, t: 2 });
  }
  if (boss.ability === 'mechstomp') {
    if (Math.abs(p.x - boss.x) < 180) applyPlayerDamage(state, 20);
    state.cameraShake = 0.4;
  }
}

export function updateCombat(state, canvas, dt) {
  const p = state.player;

  if (p.attackCooldown > 0) p.attackCooldown -= dt;
  if (p.attackTimer > 0) p.attackTimer -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.elementCooldown > 0) p.elementCooldown -= dt;

  // ─── BLESSING OF LIGHT PASSIVES ───
  if (p.hasBlessingOfLight) {
    // Passive HP regen: 1 HP/sec
    if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 1.0 * dt);
    // Halved element cooldown (drain extra dt)
    if (p.elementCooldown > 0) p.elementCooldown -= dt;
    // Radiance aura: 2 dmg/sec to enemies within 100px
    p.blessingAuraTimer = (p.blessingAuraTimer || 0) + dt;
    if (p.blessingAuraTimer >= 0.5) {
      p.blessingAuraTimer -= 0.5;
      state.enemies.forEach(e => {
        if (!e.alive) return;
        const dist = Math.hypot(e.x - p.x, (e.y + e.h / 2) - (p.y + p.h / 2));
        if (dist < 100) {
          e.hp -= 1;
          if (Math.random() < 0.3) state.effects.push({ type: 'pickup', x: e.x + (Math.random() - 0.5) * 16, y: e.y - 8, t: 0.4, text: '✧', color: '#fde68a' });
        }
      });
    }
  }

  Object.values(p.potionEffects).forEach((effect) => {
    if (!effect.active) return;
    effect.timer -= dt;
    if (effect.timer <= 0) {
      effect.active = false;
      if ('mult' in effect) effect.mult = 1;
      if ('strength' in effect) effect.strength = 0;
    }
  });

  if (p.hasForceField && !p.forceFieldActive && p.forceFieldRespawn > 0) {
    p.forceFieldRespawn -= dt;
    if (p.forceFieldRespawn <= 0) {
      p.forceFieldActive = true;
      p.forceFieldHP = p.forceFieldMaxHP;
    }
  }

  if (p.hasJetpack) {
    if (p.jetpackActive && p.jetpackFuel > 0) {
      p.vy = -200;
      const drain = p.jetpackUpgraded ? 10 : 14.3;
      p.jetpackFuel = Math.max(0, p.jetpackFuel - drain * dt);
      if (p.jetpackFuel <= 0) p.jetpackActive = false;
    } else if (p.grounded) {
      p.jetpackFuel = Math.min(100, p.jetpackFuel + 24 * dt);
    }
  }

  state.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    if (enemy.status.burn > 0) {
      enemy.status.burn -= dt;
      enemy.hp -= dt * 1.6;
    }
    if (enemy.status.freeze > 0) enemy.status.freeze -= dt;
    if (enemy.hp <= 0 && enemy.alive) {
      enemy.alive = false;
      const baseMoney = enemy.isBoss ? (enemy.milestone ? 500 : 120) : enemy.vehicle ? 25 : 10;
      const bonus = Math.floor(Math.random() * (enemy.isBoss ? 60 : 12));
      state.drops.push({ type: 'coin', x: enemy.x, y: enemy.y, value: baseMoney + bonus });
      if (Math.random() < 0.14) {
        const types = ['healing', 'shield', 'damage', 'speed', 'vitality'];
        state.drops.push({ type: 'potion', potion: types[Math.floor(Math.random() * types.length)], x: enemy.x + 12, y: enemy.y - 8 });
      }
      if (Math.random() < 0.35) state.drops.push({ type: 'arrow', x: enemy.x - 10, y: enemy.y - 8, value: 3 });
      return;
    }

    const dx = p.x - enemy.x;
    const dist = Math.abs(dx);
    const speed = enemy.status.freeze > 0 ? enemy.speed * 0.3 : enemy.speed;

    // Update vehicle ejection reboard logic
    updateVehicleEjection(state, enemy, dt);

    if (enemy.isBoss && enemy.skillCd > 0) enemy.skillCd -= dt;
    if (enemy.isBoss && enemy.skillCd <= 0) {
      bossAbility(state, enemy);
      enemy.skillCd = 4 + Math.random() * 3;
    }

    if (enemy.charge && enemy.charge.t > 0) {
      enemy.charge.t -= dt;
      enemy.x += enemy.charge.dir * 380 * dt;
    } else {
      enemy.charge = null;
      if (enemy.teleporter) {
        enemy.skillCd -= dt;
        if (enemy.skillCd <= 0 && dist < 500) {
          enemy.x = p.x + (Math.random() > 0.5 ? -120 : 120);
          enemy.skillCd = 5;
        }
      }

      if (!state.arenaMode || state.arenaActive) {
        if (enemy.flying) {
          enemy.hoverOffset += dt * 2;
          enemy.y += Math.sin(enemy.hoverOffset) * 12 * dt * 8;
          enemy.x += Math.sign(dx) * speed * dt;
        } else if (enemy.floating) {
          enemy.hoverOffset += dt * 3;
          enemy.y = state.groundY(canvas.height) - enemy.h - 42 + Math.sin(enemy.hoverOffset) * 14;
          enemy.x += Math.sign(dx) * speed * dt;
        } else {
          enemy.vx = Math.sign(dx) * speed;
          enemy.x += enemy.vx * dt;
          enemy.vy += GRAVITY * dt;
          enemy.y += enemy.vy * dt;
          const gy = state.groundY(canvas.height) - enemy.h;
          if (enemy.y >= gy) {
            enemy.y = gy;
            enemy.vy = 0;
            enemy.grounded = true;
          }
          if (enemy.jumpy && enemy.grounded && Math.random() < 0.012) {
            enemy.vy = -380;
            enemy.grounded = false;
          }
        }
      }
    }

    // Decrement attack cooldown for ALL enemies (melee + ranged)
    enemy.atkCd -= dt;

    if (enemy.ranged || enemy.caster || enemy.cannon || enemy.missile || enemy.artillery || enemy.laser) {
      const inRange = dist < (enemy.isBoss ? 620 : 460);
      if (enemy.atkCd <= 0 && inRange && (!state.arenaMode || state.arenaActive)) {
        enemy.atkCd = enemy.cannon || enemy.artillery ? 3.2 : enemy.missile ? 3.8 : 2.4;
        const dy = (p.y + p.h / 2) - (enemy.y + enemy.h / 2);
        const len = Math.max(1, Math.hypot(dx, dy));
        state.projectiles.push({
          fromEnemy: true,
          x: enemy.x,
          y: enemy.y + enemy.h / 2,
          vx: (dx / len) * (enemy.laser ? 560 : enemy.artillery ? 280 : 360),
          vy: (dy / len) * (enemy.laser ? 200 : enemy.artillery ? 110 : 220),
          damage: enemy.damage,
          life: 3,
          laser: !!enemy.laser,
          missile: !!enemy.missile,
          shell: !!enemy.artillery
        });
      }
    }

    if (enemy.summoner && !enemy.lich) {
      enemy.skillCd -= dt;
      if (enemy.skillCd <= 0 && state.enemies.filter((e) => e.alive).length < 40) {
        const summonType = enemy.shaman ? (['slime', 'spider', 'fire_imp'][Math.floor(Math.random() * 3)]) : 'skeleton';
        spawnEnemy(state, summonType, enemy.x + (Math.random() - 0.5) * 120, state.groundY(canvas.height) - 50, 1 + state.currentLevel * 0.02);
        enemy.skillCd = enemy.shaman ? 6 : 8;
      }
    }

    // Vampire lifesteal on hit
    if (enemy.vampire && enemy.atkCd <= 0.05 && dist < 50) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + 2);
    }

    // Berserker enrage below 50% HP
    if (enemy.berserker && enemy.hp < enemy.maxHp * 0.5) {
      enemy.speed = 140;
      enemy.damage = Math.max(enemy.damage, 16);
      enemy._enraged = true;
    }

    // Mimic surprise: sits still then lunges when player gets close
    if (enemy.mimic) {
      if (dist > 130) {
        enemy.speed = 0;
      } else if (!enemy._mimicWoke) {
        enemy._mimicWoke = true;
        enemy.speed = 180;
        enemy.vy = -350;
        enemy.grounded = false;
      }
    }

    // Dragon fire breath
    if (enemy.dragon && !enemy.isBoss) {
      if (!enemy._breathCd) enemy._breathCd = 4;
      enemy._breathCd -= dt;
      if (enemy._breathCd <= 0 && dist < 400 && (!state.arenaMode || state.arenaActive)) {
        for (let fb = 0; fb < 3; fb++) {
          state.projectiles.push({
            fromEnemy: true, x: enemy.x, y: enemy.y + enemy.h / 2,
            vx: Math.sign(dx) * (280 + fb * 50), vy: -40 + fb * 40,
            damage: 6, life: 1.5, laser: false
          });
        }
        enemy._breathCd = 5;
      }
    }

    // Phoenix revive
    if (enemy.phoenix && enemy.hp <= 0 && !enemy._revived) {
      enemy._revived = true;
      enemy.hp = Math.ceil(enemy.maxHp * 0.5);
      enemy.alive = true;
      state.effects.push({ type: 'hit', x: enemy.x, y: enemy.y, t: 0.5, text: 'REVIVE!', color: '#f97316' });
    }

    // Troll regeneration
    if (enemy.troll && enemy.hp > 0 && enemy.hp < enemy.maxHp) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + 2 * dt);
    }

    // Werewolf transform when low HP
    if (enemy.werewolf && enemy.hp < enemy.maxHp * 0.4 && !enemy._transformed) {
      enemy._transformed = true;
      enemy.speed = 180;
      enemy.damage = Math.round(enemy.damage * 1.8);
      enemy.w = Math.round(enemy.w * 1.3);
      enemy.h = Math.round(enemy.h * 1.2);
      enemy.color = '#374151';
      state.effects.push({ type: 'pickup', x: enemy.x, y: enemy.y - 20, t: 1, text: 'TRANSFORM!', color: '#dc2626' });
    }

    // Mushroom spore cloud
    if (enemy.mushroom && !enemy.isBoss) {
      if (!enemy._sporeCd) enemy._sporeCd = 5;
      enemy._sporeCd -= dt;
      if (enemy._sporeCd <= 0 && dist < 200 && (!state.arenaMode || state.arenaActive)) {
        state.hazards.push({ type: 'fire', x: enemy.x, y: state.groundY(canvas.height) - 20, t: 2 });
        enemy._sporeCd = 6;
      }
    }

    // Lich summoning (enhanced summoner)
    if (enemy.lich && !enemy.isBoss) {
      if (!enemy._lichCd) enemy._lichCd = 7;
      enemy._lichCd -= dt;
      if (enemy._lichCd <= 0 && state.enemies.filter(e => e.alive).length < 40) {
        const sumTypes = ['skeleton', 'wraith', 'shade'];
        spawnEnemy(state, sumTypes[Math.floor(Math.random() * sumTypes.length)], enemy.x + (Math.random() - 0.5) * 100, state.groundY(canvas.height) - 50, 1 + state.currentLevel * 0.02);
        enemy._lichCd = 8;
      }
    }

    // Ghost/Amalgam phase timer
    if (enemy.phased && enemy.phaseTimer !== undefined) {
      enemy.phaseTimer -= dt;
      if (enemy.phaseTimer <= 0) {
        enemy.phased = false;
      }
    }

    // Ghost: periodically phase out (untargetable) then back in
    if (enemy.ghost && !enemy.isBoss) {
      if (!enemy._ghostCd) enemy._ghostCd = 3;
      enemy._ghostCd -= dt;
      if (enemy._ghostCd <= 0 && !enemy.phased) {
        enemy.phased = true;
        enemy.phaseTimer = 1.5;
        enemy._ghostCd = 4 + Math.random() * 2;
      }
    }

    // Sand worm: burrow when far, emerge near player for a surprise strike
    if (enemy.sand_worm && !enemy.isBoss) {
      if (!enemy._wormCd) enemy._wormCd = 3;
      enemy._wormCd -= dt;
      if (enemy._wormCd <= 0 && dist > 150 && (!state.arenaMode || state.arenaActive)) {
        enemy.x = p.x + (Math.random() - 0.5) * 80;
        enemy.vy = -300;
        enemy.grounded = false;
        enemy._wormCd = 5 + Math.random() * 2;
        state.effects.push({ type: 'hit', x: enemy.x, y: enemy.y, t: 0.4, text: 'EMERGE!', color: '#d4a017' });
      }
    }

    // Frost wolf: on hit applies brief slow to player (handled in damage section — here just track aura)
    if (enemy.frost_wolf) {
      if (!enemy._frostCd) enemy._frostCd = 0;
      enemy._frostCd = Math.max(0, enemy._frostCd - dt);
    }

    // Plague rat: leaves poison hazard trail
    if (enemy.plague_rat && !enemy.isBoss) {
      if (!enemy._poisonCd) enemy._poisonCd = 2;
      enemy._poisonCd -= dt;
      if (enemy._poisonCd <= 0 && (!state.arenaMode || state.arenaActive)) {
        state.hazards.push({ type: 'fire', x: enemy.x, y: state.groundY(canvas.height) - 20, t: 3 });
        enemy._poisonCd = 3 + Math.random();
      }
    }

    // Djinn: teleport away when player gets close, fire magic from range
    if (enemy.djinn && !enemy.isBoss) {
      if (dist < 80 && (!enemy._djinnTpCd || enemy._djinnTpCd <= 0)) {
        const side = Math.random() > 0.5 ? 200 : -200;
        enemy.x = Math.min(canvas.width - 40, Math.max(40, enemy.x + side));
        enemy._djinnTpCd = 4;
        state.effects.push({ type: 'hit', x: enemy.x, y: enemy.y, t: 0.3, text: 'VANISH', color: '#c084fc' });
      }
      if (enemy._djinnTpCd) enemy._djinnTpCd -= dt;
    }

    // Death knight: summon undead minions periodically
    if (enemy.death_knight && !enemy.isBoss) {
      if (!enemy._dkCd) enemy._dkCd = 8;
      enemy._dkCd -= dt;
      if (enemy._dkCd <= 0 && state.enemies.filter(e => e.alive).length < 40) {
        const sumTypes = ['skeleton', 'ghost', 'wraith'];
        spawnEnemy(state, sumTypes[Math.floor(Math.random() * sumTypes.length)], enemy.x + (Math.random() - 0.5) * 80, state.groundY(canvas.height) - 50, 1 + state.currentLevel * 0.02);
        enemy._dkCd = 9 + Math.random() * 3;
        state.effects.push({ type: 'hit', x: enemy.x, y: enemy.y - 20, t: 0.5, text: 'RISE!', color: '#dc2626' });
      }
    }

    // Hydra mob: spit projectiles from multiple heads
    if (enemy.hydra_mob && !enemy.isBoss) {
      if (!enemy._hydraCd) enemy._hydraCd = 3;
      enemy._hydraCd -= dt;
      if (enemy._hydraCd <= 0 && dist < 500 && (!state.arenaMode || state.arenaActive)) {
        for (let hd = 0; hd < 3; hd++) {
          const spread = (hd - 1) * 40;
          state.projectiles.push({
            fromEnemy: true, x: enemy.x + spread * 0.3, y: enemy.y + 10,
            vx: Math.sign(dx) * (200 + hd * 30), vy: -60 + spread,
            damage: 4, life: 1.5, laser: false
          });
        }
        enemy._hydraCd = 4 + Math.random();
      }
    }

    if (dist < (enemy.isBoss ? 80 : 48) && enemy.atkCd <= 0 && p.invuln <= 0 && (!state.arenaMode || state.arenaActive)) {
      // Phased bosses don't melee attack but also can't be touched
      if (!enemy.phased) {
        enemy.atkCd = enemy.isBoss ? 1.1 : (3 + Math.random() * 2);
        const block = getShieldBlock(state);
        const dmg = Math.ceil(enemy.damage * (1 - block));
        applyPlayerDamage(state, Math.max(0, dmg));
        p.invuln = 0.7;
        state.effects.push({ type: block > 0 ? 'block' : 'hit', x: p.x, y: p.y + p.h / 2, t: 0.35, blocked: Math.round(block * 100) });
        // Frost wolf: slow player on hit
        if (enemy.frost_wolf) {
          p._frostSlow = 2;
          state.effects.push({ type: 'hit', x: p.x, y: p.y, t: 0.3, text: 'CHILLED', color: '#93c5fd' });
        }
      }
    }
  });

  for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
    const proj = state.projectiles[i];
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;

    if (proj.fromEnemy) {
      if (Math.abs(proj.x - p.x) < p.w / 2 + 8 && Math.abs(proj.y - (p.y + p.h / 2)) < p.h / 2 + 8 && p.invuln <= 0) {
        const block = getShieldBlock(state);
        const dmg = Math.ceil(proj.damage * (1 - block));
        applyPlayerDamage(state, Math.max(0, dmg));
        p.invuln = 0.5;
        state.effects.push({ type: block > 0 ? 'block' : 'hit', x: p.x, y: p.y + p.h / 2, t: 0.3, blocked: Math.round(block * 100) });
        state.projectiles.splice(i, 1);
        continue;
      }
    } else {
      const target = state.enemies.find((e) => e.alive && Math.abs(proj.x - e.x) < e.w / 2 + 8 && Math.abs(proj.y - (e.y + e.h / 2)) < e.h / 2 + 10);
      if (target) {
        damageEnemy(state, target, proj.damage, 'arrow');
        state.projectiles.splice(i, 1);
        continue;
      }
    }

    if (proj.life <= 0 || proj.x < -100 || proj.x > canvas.width + 100 || proj.y > canvas.height + 100 || proj.y < -120) {
      state.projectiles.splice(i, 1);
    }
  }

  for (let i = state.hazards.length - 1; i >= 0; i -= 1) {
    const hz = state.hazards[i];
    hz.t -= dt;
    if (hz.type === 'meteor') {
      hz.x += hz.vx * dt;
      hz.y += hz.vy * dt;
      hz.vy += 300 * dt;
      if (Math.abs(hz.x - p.x) < p.w / 2 + 18 && Math.abs(hz.y - (p.y + p.h / 2)) < p.h / 2 + 18 && p.invuln <= 0) {
        applyPlayerDamage(state, 16);
        p.invuln = 0.7;
      }
    }
    if (hz.type === 'fire') {
      if (Math.abs(hz.x - p.x) < 30 && p.y + p.h >= state.groundY(canvas.height) - 30 && p.invuln <= 0) {
        applyPlayerDamage(state, 6 * dt);
      }
    }
    if (hz.type === 'lightning' && hz.t < hz.strikeAt && Math.abs(hz.x - p.x) < 20 && p.invuln <= 0) {
      applyPlayerDamage(state, 18);
      p.invuln = 0.7;
      hz.t = -1;
    }
    // Bone Shard hazard (from Bone Giant / Dread Amalgam)
    if (hz.type === 'bone_shard') {
      hz.x += (hz.vx || 0) * dt;
      hz.y += hz.vy * dt;
      hz.vy += 180 * dt;
      if (Math.abs(hz.x - p.x) < p.w / 2 + 14 && Math.abs(hz.y - (p.y + p.h / 2)) < p.h / 2 + 14 && p.invuln <= 0) {
        applyPlayerDamage(state, 14);
        p.invuln = 0.6;
        hz.t = -1;
      }
    }
    // Icicle hazard (ice area environmental)
    if (hz.type === 'icicle') {
      hz.y += hz.vy * dt;
      hz.vy += 200 * dt;
      if (Math.abs(hz.x - p.x) < p.w / 2 + 10 && Math.abs(hz.y - (p.y + p.h / 2)) < p.h / 2 + 12 && p.invuln <= 0) {
        applyPlayerDamage(state, 12);
        p.invuln = 0.6;
        hz.t = -1;
      }
      // Shatter on ground
      if (hz.y > state.groundY(canvas.height) - 5) {
        hz.t = -1;
      }
    }
    // Wind gust (grassy area environmental) — pushes player sideways
    if (hz.type === 'wind_gust') {
      p.x += hz.dir * 120 * dt;
      p.x = Math.max(p.w / 2, Math.min(canvas.width - p.w / 2, p.x));
    }
    if (hz.t <= 0) state.hazards.splice(i, 1);
  }

  for (let i = state.drops.length - 1; i >= 0; i -= 1) {
    const d = state.drops[i];
    d.y += 80 * dt;
    if (d.y > state.groundY(canvas.height) - 10) d.y = state.groundY(canvas.height) - 10;
    if (Math.hypot(d.x - p.x, d.y - (p.y + p.h / 2)) < 40) {
      if (d.type === 'coin') state.player.money += d.value;
      if (d.type === 'arrow') state.player.arrows += d.value;
      if (d.type === 'potion') addPotionToSlots(state, d.potion);
      state.drops.splice(i, 1);
    }
  }

  state.companions.forEach((c) => {
    let nearest = null;
    let nearestD = Infinity;
    state.enemies.forEach((e) => {
      if (!e.alive) return;
      const d = Math.abs(e.x - c.x);
      if (d < nearestD) {
        nearestD = d;
        nearest = e;
      }
    });
    if (nearest && nearestD < 360) {
      if (Math.abs(nearest.x - c.x) > 42) {
        c.vx = Math.sign(nearest.x - c.x) * 170;
      } else {
        c.vx = 0;
        c.attackCd -= dt;
        if (c.attackCd <= 0) {
          const mult = c.specialReady ? 3 : 1;
          damageEnemy(state, nearest, 2 * mult, 'companion');
          c.attackCd = 0.8;
          c.kills += 1;
          if (c.kills >= 6) {
            c.specialReady = true;
            c.kills = 0;
          } else c.specialReady = false;
        }
      }
    } else {
      const targetX = p.x - 56 - state.companions.indexOf(c) * 28;
      c.vx = Math.abs(targetX - c.x) > 10 ? Math.sign(targetX - c.x) * 180 : 0;
    }
    c.x += c.vx * dt;
    c.vy += GRAVITY * dt;
    c.y += c.vy * dt;
    const gy = state.groundY(canvas.height) - c.h;
    if (c.y >= gy) {
      c.y = gy;
      c.vy = 0;
    }
  });

  for (let i = state.effects.length - 1; i >= 0; i -= 1) {
    state.effects[i].t -= dt;
    if (state.effects[i].t <= 0) state.effects.splice(i, 1);
  }

  if (state.player.hp <= 0) {
    state.player.hp = state.player.maxHp;
    state.player.x = 140;
    state.player.y = state.groundY(canvas.height) - state.player.h;
    state.player.vx = 0;
    state.player.vy = 0;
    state.effects.push({ type: 'pickup', x: canvas.width / 2, y: 80, t: 2, text: 'YOU DIED! TRY AGAIN', color: '#ef4444' });
  }
}

export function drawCombat(ctx, state, canvas) {
  state.projectiles.forEach((p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    const angle = Math.atan2(p.vy, p.vx);
    ctx.rotate(angle);
    ctx.fillStyle = p.fromEnemy ? '#fb7185' : '#f8fafc';
    ctx.fillRect(-10, -2, 20, 4);
    ctx.restore();
  });

  state.hazards.forEach((h) => {
    if (h.type === 'meteor') {
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(h.x, h.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    if (h.type === 'fire') {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(h.x - 18, h.y - 8, 36, 16);
    }
    if (h.type === 'lightning') {
      ctx.strokeStyle = h.t > h.strikeAt ? '#facc15' : '#fef08a';
      ctx.lineWidth = h.t > h.strikeAt ? 2 : 6;
      ctx.beginPath();
      ctx.moveTo(h.x, 0);
      ctx.lineTo(h.x, canvas.height);
      ctx.stroke();
    }
    if (h.type === 'bone_shard') {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(Math.atan2(h.vy, h.vx || 0.1));
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, -2, 16, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-6, -3, 4, 6);
      ctx.restore();
    }
    // Icicle
    if (h.type === 'icicle') {
      ctx.save();
      ctx.translate(h.x, h.y);
      // pointy icicle shape
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(5, 6);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(-1, -10);
      ctx.lineTo(2, 4);
      ctx.lineTo(-3, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Wind gust
    if (h.type === 'wind_gust') {
      ctx.save();
      ctx.globalAlpha = 0.3 * Math.min(1, h.t);
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 2;
      const cx = canvas.width / 2;
      for (let row = 0; row < 5; row++) {
        const yy = 60 + row * 70;
        const off = (Date.now() / 200 + row * 30) % 80;
        ctx.beginPath();
        ctx.moveTo(cx - 200 + off * h.dir, yy);
        ctx.bezierCurveTo(cx - 100 + off * h.dir, yy - 10, cx + 100 + off * h.dir, yy + 10, cx + 200 + off * h.dir, yy);
        ctx.stroke();
      }
      ctx.restore();
    }
  });

  state.drops.forEach((d) => {
    if (d.type === 'coin') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (d.type === 'arrow') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(d.x - 8, d.y - 2, 16, 4);
    }
    if (d.type === 'potion') {
      ctx.fillStyle = POTIONS[d.potion].color;
      ctx.fillRect(d.x - 6, d.y - 10, 12, 14);
    }
  });

  state.effects.forEach((e) => {
    if (e.type === 'slash') {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 30, -0.4, 0.4);
      ctx.stroke();
    }
    if (e.type === 'hit') {
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 20 * Math.max(0.1, e.t), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.type === 'block') {
      ctx.strokeStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.type === 'pickup') {
      ctx.fillStyle = e.color || '#facc15';
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(e.text || '', e.x, e.y - (1 - e.t) * 24);
    }
    if (e.type === 'element_fire') {
      const s = (1 - e.t / 0.5) * 22 + 8;
      ctx.globalAlpha = Math.min(1, e.t * 3);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(e.x, e.y, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(e.x, e.y - 4, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(e.x, e.y - 7, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (e.type === 'element_lightning') {
      ctx.globalAlpha = Math.min(1, e.t * 3);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 12;
      // Jagged bolt
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - 80);
      ctx.lineTo(e.x + 12, e.y - 50);
      ctx.lineTo(e.x - 8, e.y - 30);
      ctx.lineTo(e.x + 15, e.y);
      ctx.lineTo(e.x - 5, e.y + 25);
      ctx.lineTo(e.x + 10, e.y + 50);
      ctx.stroke();
      // Flash circle
      ctx.fillStyle = 'rgba(250,204,21,0.3)';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    if (e.type === 'element_spark') {
      ctx.globalAlpha = Math.min(1, e.t * 4);
      ctx.fillStyle = '#fde047';
      const sz = 4 + Math.random() * 4;
      ctx.fillRect(e.x - sz / 2, e.y - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
    }
    if (e.type === 'element_water') {
      const progress = 1 - e.t / 0.55;
      const waveWidth = progress * 180;
      ctx.globalAlpha = Math.min(1, e.t * 3);
      // Wave arc
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(e.x + e.dir * waveWidth * 0.5, e.y, waveWidth * 0.5, -0.8, 0.8);
      ctx.stroke();
      // Splash dots
      ctx.fillStyle = '#0ea5e9';
      for (let i = 0; i < 6; i++) {
        const sx = e.x + e.dir * (waveWidth * 0.3 + i * 18);
        const sy = e.y + Math.sin(i * 1.5 + progress * 8) * 20;
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
    }
  });
}
