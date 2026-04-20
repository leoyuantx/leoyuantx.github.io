// weapons.js — Weapon definitions, shooting, projectiles, tracers
import * as THREE from 'three';

// ── WEAPON DEFINITIONS ──
export const WEAPONS = {
  // Rifles
  m1_garand:   { name: 'M1 Garand',   clip: 8,   reserve: 80,  fireRate: 2.5, damage: 45, auto: false, range: 200, recoil: 0.04, reloadTime: 2.2, sound: 'rifle' },
  kar98k:      { name: 'Kar98k',       clip: 5,   reserve: 60,  fireRate: 1.5, damage: 55, auto: false, range: 250, recoil: 0.05, reloadTime: 3.0, sound: 'rifle' },
  mosin:       { name: 'Mosin-Nagant', clip: 5,   reserve: 60,  fireRate: 1.4, damage: 58, auto: false, range: 260, recoil: 0.055, reloadTime: 3.2, sound: 'rifle' },
  arisaka:     { name: 'Arisaka',      clip: 5,   reserve: 60,  fireRate: 1.5, damage: 52, auto: false, range: 240, recoil: 0.05, reloadTime: 3.0, sound: 'rifle' },
  lee_enfield: { name: 'Lee-Enfield',  clip: 10,  reserve: 80,  fireRate: 2.0, damage: 48, auto: false, range: 220, recoil: 0.04, reloadTime: 2.8, sound: 'rifle' },
  // SMGs
  thompson:    { name: 'Thompson',     clip: 30,  reserve: 150, fireRate: 12,  damage: 22, auto: true,  range: 80,  recoil: 0.025, reloadTime: 2.5, sound: 'smg' },
  mp40:        { name: 'MP 40',        clip: 32,  reserve: 160, fireRate: 10,  damage: 20, auto: true,  range: 75,  recoil: 0.02, reloadTime: 2.3, sound: 'smg' },
  ppsh41:      { name: 'PPSh-41',      clip: 71,  reserve: 142, fireRate: 15,  damage: 18, auto: true,  range: 70,  recoil: 0.03, reloadTime: 3.5, sound: 'smg' },
  type100:     { name: 'Type 100',     clip: 30,  reserve: 150, fireRate: 9,   damage: 19, auto: true,  range: 65,  recoil: 0.02, reloadTime: 2.4, sound: 'smg' },
  sten:        { name: 'Sten Gun',     clip: 32,  reserve: 128, fireRate: 9,   damage: 20, auto: true,  range: 70,  recoil: 0.022, reloadTime: 2.2, sound: 'smg' },
  // MGs
  bar:         { name: 'BAR',          clip: 20,  reserve: 120, fireRate: 8,   damage: 28, auto: true,  range: 150, recoil: 0.035, reloadTime: 2.8, sound: 'mg' },
  mg42:        { name: 'MG 42',        clip: 50,  reserve: 200, fireRate: 20,  damage: 24, auto: true,  range: 160, recoil: 0.04, reloadTime: 4.0, sound: 'mg' },
  dp28:        { name: 'DP-28',        clip: 47,  reserve: 141, fireRate: 10,  damage: 26, auto: true,  range: 150, recoil: 0.03, reloadTime: 3.5, sound: 'mg' },
  bren:        { name: 'Bren Gun',     clip: 30,  reserve: 120, fireRate: 8,   damage: 30, auto: true,  range: 160, recoil: 0.032, reloadTime: 3.0, sound: 'mg' },
  // Sidearms
  m1911:       { name: 'M1911',        clip: 7,   reserve: 42,  fireRate: 4,   damage: 30, auto: false, range: 40,  recoil: 0.03, reloadTime: 1.5, sound: 'pistol' },
  luger:       { name: 'Luger P08',    clip: 8,   reserve: 48,  fireRate: 4,   damage: 28, auto: false, range: 40,  recoil: 0.025, reloadTime: 1.4, sound: 'pistol' },
  tt33:        { name: 'TT-33',        clip: 8,   reserve: 48,  fireRate: 4,   damage: 29, auto: false, range: 38,  recoil: 0.028, reloadTime: 1.5, sound: 'pistol' },
  nambu:       { name: 'Nambu',        clip: 8,   reserve: 48,  fireRate: 3.5, damage: 26, auto: false, range: 35,  recoil: 0.025, reloadTime: 1.6, sound: 'pistol' },
  webley:      { name: 'Webley',       clip: 6,   reserve: 36,  fireRate: 2.5, damage: 35, auto: false, range: 35,  recoil: 0.04, reloadTime: 2.0, sound: 'pistol' },
};

// Map faction → weapon loadouts
export const LOADOUTS = {
  usa:     { assault: 'thompson', medic: 'm1_garand',   support: 'bar',   scout: 'm1_garand',   sidearm: 'm1911' },
  germany: { assault: 'mp40',     medic: 'kar98k',      support: 'mg42',  scout: 'kar98k',      sidearm: 'luger' },
  ussr:    { assault: 'ppsh41',   medic: 'mosin',       support: 'dp28',  scout: 'mosin',       sidearm: 'tt33' },
  japan:   { assault: 'type100',  medic: 'arisaka',     support: 'type100',scout: 'arisaka',    sidearm: 'nambu' },
  uk:      { assault: 'sten',     medic: 'lee_enfield', support: 'bren',  scout: 'lee_enfield', sidearm: 'webley' },
};

// ── ACTIVE WEAPON STATE ──
export class WeaponState {
  constructor(weaponId) {
    this.def = WEAPONS[weaponId];
    this.id = weaponId;
    this.clip = this.def.clip;
    this.reserve = this.def.reserve;
    this.cooldown = 0;
    this.reloading = false;
    this.reloadTimer = 0;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const need = this.def.clip - this.clip;
        const take = Math.min(need, this.reserve);
        this.clip += take;
        this.reserve -= take;
        this.reloading = false;
      }
    }
  }

  canFire() {
    return !this.reloading && this.cooldown <= 0 && this.clip > 0;
  }

  fire() {
    this.clip--;
    this.cooldown = 1 / this.def.fireRate;
    return this.def.damage;
  }

  reload() {
    if (this.reloading || this.reserve <= 0 || this.clip === this.def.clip) return;
    this.reloading = true;
    this.reloadTimer = this.def.reloadTime;
  }

  switchTo(weaponId) {
    this.def = WEAPONS[weaponId];
    this.id = weaponId;
    this.clip = this.def.clip;
    this.reserve = this.def.reserve;
    this.cooldown = 0.5; // weapon swap delay
    this.reloading = false;
  }
}

// ── TRACERS ──
const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
const tracerGeo = new THREE.CylinderGeometry(0.02, 0.02, 2, 4);
tracerGeo.rotateX(Math.PI / 2);

export class TracerSystem {
  constructor(scene) {
    this.scene = scene;
    this.tracers = [];
  }

  spawn(origin, direction, speed = 300, maxDist = 250) {
    const mesh = new THREE.Mesh(tracerGeo, tracerMat);
    mesh.position.copy(origin);
    mesh.lookAt(origin.clone().add(direction));
    this.scene.add(mesh);
    this.tracers.push({ mesh, dir: direction.clone().normalize(), speed, dist: 0, maxDist });
  }

  update(dt) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      const step = t.speed * dt;
      t.mesh.position.addScaledVector(t.dir, step);
      t.dist += step;
      if (t.dist >= t.maxDist) {
        this.scene.remove(t.mesh);
        this.tracers.splice(i, 1);
      }
    }
  }
}
