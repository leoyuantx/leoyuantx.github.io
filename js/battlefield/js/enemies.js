// enemies.js — AI soldiers with stealth detection, ally spawning, weapon drops
import * as THREE from 'three';
import { getTerrainHeight } from './world.js';

const ENEMY_HEIGHT = 1.7;
const ENEMY_SPEED = 6;
const ENEMY_FIRE_RANGE = 80;
const ENEMY_SIGHT_RANGE = 100;
const ENEMY_FIRE_RATE = 2;
const ENEMY_DAMAGE = 12;
const ENEMY_ACCURACY = 0.65;

// Detection thresholds
const DETECT_RANGE_CROUCH = 20;
const DETECT_RANGE_WALK = 50;
const DETECT_RANGE_SPRINT = 80;
const DETECT_RANGE_SHOOT = 120; // shooting = instant alert in range
const DETECT_ALERT_TIME = 3; // seconds to go from patrol→suspicious→alert

const SOLDIER_COLORS = {
  usa:     { body: 0x556b2f, helmet: 0x4a5a2a },
  germany: { body: 0x5a5a4a, helmet: 0x3a3a2a },
  ussr:    { body: 0x5a6e3a, helmet: 0x4a5a34 },
  japan:   { body: 0x6b6b4f, helmet: 0x5a5a3a },
  uk:      { body: 0x6b7b5b, helmet: 0x5a6a4a },
};

// Weapon IDs dropped by each faction
const FACTION_DROPS = {
  usa:     ['m1_garand', 'thompson', 'bar', 'm1911'],
  germany: ['kar98k', 'mp40', 'mg42', 'luger'],
  ussr:    ['mosin', 'ppsh41', 'dp28', 'tt33'],
  japan:   ['arisaka', 'type100', 'nambu'],
  uk:      ['lee_enfield', 'sten', 'bren', 'webley'],
};

function buildSoldier(faction) {
  const c = SOLDIER_COLORS[faction] || SOLDIER_COLORS.usa;
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: c.body, roughness: 0.85 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: c.helmet, roughness: 0.7, metalness: 0.2 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc4956a, roughness: 0.9 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.35), bodyMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), skinMat);
  head.position.y = 1.58;
  head.castShadow = true;
  group.add(head);

  // Helmet
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), helmetMat);
  helmet.position.y = 1.65;
  helmet.castShadow = true;
  group.add(helmet);

  // Legs
  for (const side of [-0.15, 0.15]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.25), bodyMat);
    leg.position.set(side, 0.35, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  // Arms
  for (const side of [-0.4, 0.4]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.2), bodyMat);
    arm.position.set(side, 1.0, 0);
    arm.castShadow = true;
    group.add(arm);
  }

  // Rifle
  const rifle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 })
  );
  rifle.rotation.x = Math.PI / 2;
  rifle.position.set(0.35, 0.95, -0.3);
  group.add(rifle);

  return group;
}

// Blue ally marker sprite
function createAllyMarker() {
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const c = canvas.getContext('2d');
  c.beginPath();
  c.arc(16, 16, 8, 0, Math.PI * 2);
  c.fillStyle = '#4a9eff';
  c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = 2;
  c.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.5, 0.5, 1);
  return sprite;
}

// ── Faction logo drawing functions ──
function _drawGermanCross(ctx, cx, cy, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.22;
  ctx.lineCap = 'butt';
  // Horizontal bar
  ctx.beginPath(); ctx.moveTo(cx - s * 0.7, cy); ctx.lineTo(cx + s * 0.7, cy); ctx.stroke();
  // Vertical bar
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.7); ctx.lineTo(cx, cy + s * 0.7); ctx.stroke();
  // Thin outline
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.06;
  const half = s * 0.72;
  ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
}

function _drawUSAStar(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI / 5);
    const r = s * 0.7;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const angle2 = angle + Math.PI / 5;
    const ri = s * 0.3;
    ctx.lineTo(cx + ri * Math.cos(angle2), cy + ri * Math.sin(angle2));
  }
  ctx.closePath(); ctx.fill();
}

function _drawUSSRSymbol(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI / 5);
    const r = s * 0.6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const angle2 = angle + Math.PI / 5;
    const ri = s * 0.25;
    ctx.lineTo(cx + ri * Math.cos(angle2), cy + ri * Math.sin(angle2));
  }
  ctx.closePath(); ctx.fill();
  // Hammer handle
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;
  ctx.beginPath(); ctx.moveTo(cx - s * 0.15, cy + s * 0.1); ctx.lineTo(cx - s * 0.15, cy - s * 0.3); ctx.stroke();
}

function _drawJapanSun(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2); ctx.fill();
  // Rays
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.07;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * s * 0.38, cy + Math.sin(angle) * s * 0.38);
    ctx.lineTo(cx + Math.cos(angle) * s * 0.65, cy + Math.sin(angle) * s * 0.65);
    ctx.stroke();
  }
}

function _drawUKRoundel(ctx, cx, cy, s, color) {
  // Outer ring
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.12;
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.55, 0, Math.PI * 2); ctx.stroke();
  // Inner dot
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2); ctx.fill();
}

const FACTION_LOGO_DRAWER = {
  germany: _drawGermanCross,
  usa: _drawUSAStar,
  ussr: _drawUSSRSymbol,
  japan: _drawJapanSun,
  uk: _drawUKRoundel,
};

// Create a faction logo sprite that updates color based on alertLevel
function createFactionLogo(faction) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, opacity: 0 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.9, 0.9, 1);
  sprite.userData.canvas = canvas;
  sprite.userData.texture = tex;
  sprite.userData.faction = faction;
  sprite.userData.lastAlpha = -1; // force first draw
  return sprite;
}

// Redraw logo with current alert color  (0=hidden, partial=yellow→orange, full=bright red)
function updateFactionLogo(sprite, alertLevel) {
  const t = Math.min(1, alertLevel / DETECT_ALERT_TIME); // 0→1
  // Don't redraw if nothing changed
  const quantised = Math.round(t * 20); // 5% steps
  if (quantised === sprite.userData.lastAlpha) return;
  sprite.userData.lastAlpha = quantised;

  const canvas = sprite.userData.canvas;
  const ctx = canvas.getContext('2d');
  const s = canvas.width;
  ctx.clearRect(0, 0, s, s);

  if (t < 0.05) { sprite.material.opacity = 0; return; }

  // Color: white → yellow → orange → red
  let r, g, b;
  if (t < 0.5) {
    const p = t / 0.5;
    r = 255; g = Math.round(255 - p * 55); b = Math.round(255 - p * 200);
  } else {
    const p = (t - 0.5) / 0.5;
    r = 255; g = Math.round(200 - p * 200); b = Math.round(55 - p * 55);
  }
  const color = `rgb(${r},${g},${b})`;

  const drawer = FACTION_LOGO_DRAWER[sprite.userData.faction] || _drawGermanCross;
  drawer(ctx, s / 2, s / 2, s / 2, color);

  // Outer glow at high alert
  if (t > 0.7) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    drawer(ctx, s / 2, s / 2, s / 2, color);
    ctx.shadowBlur = 0;
  }

  sprite.material.opacity = 0.35 + t * 0.65;
  sprite.userData.texture.needsUpdate = true;
}

export class Enemy {
  constructor(x, z, terrain, faction = 'germany', isAlly = false) {
    this.terrain = terrain;
    this.faction = faction;
    this.isAlly = isAlly;
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    this.mesh = buildSoldier(faction);
    const y = getTerrainHeight(terrain, x, z) + ENEMY_HEIGHT * 0.5;
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.userData = { type: isAlly ? 'ally' : 'enemy', enemy: this };

    // AI state
    this.state = 'patrol';
    this.alertLevel = 0; // 0=unaware, 1+=suspicious, 3+=alert (shoots)
    this.patrolTarget = new THREE.Vector3(x + (Math.random() - 0.5) * 60, 0, z + (Math.random() - 0.5) * 60);
    this.fireCooldown = 0;
    this.stateTimer = 0;
    this.lastKnownPlayerPos = null;

    // Weapon drop
    this.droppedWeapon = null; // set on death
    this.weaponPickup = null; // 3D object on ground

    // Blue marker for allies / faction logo for enemies
    if (isAlly) {
      this.marker = createAllyMarker();
      this.marker.position.y = ENEMY_HEIGHT + 0.6;
      this.mesh.add(this.marker);
    } else {
      this.logoSprite = createFactionLogo(faction);
      this.logoSprite.position.y = ENEMY_HEIGHT + 0.6;
      this.mesh.add(this.logoSprite);
    }
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.state = 'dead';
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.position.y -= 0.5;

      // Drop weapon on death (enemies only)
      if (!this.isAlly) {
        const drops = FACTION_DROPS[this.faction] || ['m1_garand'];
        this.droppedWeapon = drops[Math.floor(Math.random() * drops.length)];
        this._createWeaponPickup();
      }

      // Remove markers
      if (this.marker) { this.mesh.remove(this.marker); this.marker = null; }
      if (this.logoSprite) { this.mesh.remove(this.logoSprite); this.logoSprite = null; }
      return true;
    }
    // Getting hit → full alert
    this.alertLevel = DETECT_ALERT_TIME;
    this.state = 'chase';
    return false;
  }

  _createWeaponPickup() {
    const pos = this.mesh.position.clone();
    pos.y += 0.3;
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xddcc88, emissive: 0x554400, emissiveIntensity: 0.4 });
    this.weaponPickup = new THREE.Mesh(geo, mat);
    this.weaponPickup.position.copy(pos);
    this.weaponPickup.userData = { type: 'weaponPickup', weaponId: this.droppedWeapon, owner: this };
    this.mesh.parent.add(this.weaponPickup);
  }

  // Detection: returns whether enemies should be aware
  updateDetection(dt, playerPos, playerSprinting, playerShooting) {
    if (this.isAlly || !this.alive) return;

    const dist = this.mesh.position.distanceTo(playerPos);

    // Shooting in earshot = instant full alert
    if (playerShooting && dist < DETECT_RANGE_SHOOT) {
      this.alertLevel = DETECT_ALERT_TIME;
    }

    // Proximity detection based on movement
    let detectRange = DETECT_RANGE_WALK;
    if (playerSprinting) detectRange = DETECT_RANGE_SPRINT;

    if (dist < detectRange) {
      // Closer = faster detection
      const rate = (1 - dist / detectRange) * 2.5;
      this.alertLevel = Math.min(DETECT_ALERT_TIME, this.alertLevel + rate * dt);
    } else {
      // Slowly lose awareness if player is far
      this.alertLevel = Math.max(0, this.alertLevel - 0.3 * dt);
    }

    // Update faction logo color
    if (this.logoSprite) updateFactionLogo(this.logoSprite, this.alertLevel);
  }

  // Alert nearby comrades when fully alerted
  alertComrades(allEnemies) {
    if (!this.alive || this.alertLevel < DETECT_ALERT_TIME) return;
    const ALERT_RADIUS = 60;
    for (const e of allEnemies) {
      if (e === this || !e.alive || e.isAlly) continue;
      if (e.alertLevel >= DETECT_ALERT_TIME) continue;
      const d = this.mesh.position.distanceTo(e.mesh.position);
      if (d < ALERT_RADIUS) {
        // Closer comrades get alerted faster
        e.alertLevel = Math.min(DETECT_ALERT_TIME, e.alertLevel + (1 - d / ALERT_RADIUS) * 0.8);
      }
    }
  }

  update(dt, playerPos, playerAlive) {
    if (!this.alive) return null;
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.stateTimer += dt;

    // Rotate weapon pickup
    if (this.weaponPickup) {
      this.weaponPickup.rotation.y += dt * 2;
      this.weaponPickup.position.y = this.mesh.position.y + 0.5 + Math.sin(performance.now() * 0.003) * 0.15;
    }

    // Allies just patrol, don't chase player
    if (this.isAlly) {
      this._moveToward(this.patrolTarget, dt);
      if (this.mesh.position.distanceTo(this.patrolTarget) < 3 || this.stateTimer > 10) {
        this.patrolTarget.set(
          this.mesh.position.x + (Math.random() - 0.5) * 80, 0,
          this.mesh.position.z + (Math.random() - 0.5) * 80
        );
        this.stateTimer = 0;
      }
      return null;
    }

    const pos = this.mesh.position;
    const toPlayer = new THREE.Vector3().subVectors(playerPos, pos);
    const distToPlayer = toPlayer.length();
    const isAlert = this.alertLevel >= DETECT_ALERT_TIME;
    const canSeePlayer = playerAlive && distToPlayer < ENEMY_SIGHT_RANGE && isAlert;

    // State machine
    if (this.state === 'patrol') {
      if (canSeePlayer) {
        this.state = 'chase';
        this.lastKnownPlayerPos = playerPos.clone();
        this.stateTimer = 0;
      } else {
        this._moveToward(this.patrolTarget, dt);
        if (pos.distanceTo(this.patrolTarget) < 3 || this.stateTimer > 10) {
          this.patrolTarget.set(
            pos.x + (Math.random() - 0.5) * 80, 0,
            pos.z + (Math.random() - 0.5) * 80
          );
          this.stateTimer = 0;
        }
      }
    } else if (this.state === 'chase') {
      this.lastKnownPlayerPos = playerPos.clone();
      if (distToPlayer < ENEMY_FIRE_RANGE && canSeePlayer) {
        this.state = 'fire';
        this.stateTimer = 0;
      } else if (!canSeePlayer && this.stateTimer > 8) {
        this.state = 'patrol';
        this.stateTimer = 0;
      } else {
        this._moveToward(playerPos, dt);
      }
    } else if (this.state === 'fire') {
      this.mesh.lookAt(new THREE.Vector3(playerPos.x, pos.y, playerPos.z));
      if (!canSeePlayer || distToPlayer > ENEMY_FIRE_RANGE * 1.2) {
        this.state = 'chase';
        this.stateTimer = 0;
      } else if (this.fireCooldown <= 0) {
        this.fireCooldown = 1 / ENEMY_FIRE_RATE;
        const hit = Math.random() < ENEMY_ACCURACY;
        return { hit, damage: ENEMY_DAMAGE, from: pos.clone(), dir: toPlayer.normalize() };
      }
    }
    return null;
  }

  _moveToward(target, dt) {
    const pos = this.mesh.position;
    const dir = new THREE.Vector3().subVectors(target, pos);
    dir.y = 0;
    if (dir.lengthSq() < 1) return;
    dir.normalize();
    pos.x += dir.x * ENEMY_SPEED * dt;
    pos.z += dir.z * ENEMY_SPEED * dt;
    const gy = getTerrainHeight(this.terrain, pos.x, pos.z);
    pos.y = gy + ENEMY_HEIGHT * 0.5;
    this.mesh.lookAt(new THREE.Vector3(target.x, pos.y, target.z));
  }

  // Reset for respawn
  resetForRespawn(x, z) {
    const y = getTerrainHeight(this.terrain, x, z) + ENEMY_HEIGHT * 0.5;
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.set(0, 0, 0);
    this.health = this.maxHealth;
    this.alive = true;
    this.alertLevel = 0;
    this.state = 'patrol';
    this.stateTimer = 0;
    if (this.weaponPickup && this.mesh.parent) {
      this.mesh.parent.remove(this.weaponPickup);
      this.weaponPickup = null;
    }
    this.droppedWeapon = null;
    // Re-create logo
    if (!this.isAlly && !this.logoSprite) {
      this.logoSprite = createFactionLogo(this.faction);
      this.logoSprite.position.y = ENEMY_HEIGHT + 0.6;
      this.mesh.add(this.logoSprite);
    }
  }
}

// ── SPAWN ──
export function spawnEnemies(scene, terrain, count = 25, faction = 'germany') {
  const enemies = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 350;
    const z = (Math.random() - 0.5) * 350;
    const e = new Enemy(x, z, terrain, faction, false);
    scene.add(e.mesh);
    enemies.push(e);
  }
  return enemies;
}

export function spawnAllies(scene, terrain, count = 8, faction = 'usa') {
  const allies = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = -80 + (Math.random() - 0.5) * 30;
    const a = new Enemy(x, z, terrain, faction, true);
    scene.add(a.mesh);
    allies.push(a);
  }
  return allies;
}
