// vehicles.js — Tanks, planes, jeeps built from Three.js primitives
import * as THREE from 'three';
import { getTerrainHeight } from './world.js';

// ────── VEHICLE DEFS ──────
export const VEHICLE_DEFS = {
  tiger_tank: {
    name: 'Tiger Tank', type: 'tank', health: 1000,
    speed: 12, turnSpeed: 1.2, fireRate: 2, damage: 120,
    build: buildTank, color1: 0x6b6b4f, color2: 0x4a4a34,
  },
  sherman_tank: {
    name: 'Sherman Tank', type: 'tank', health: 800,
    speed: 14, turnSpeed: 1.4, fireRate: 2.2, damage: 100,
    build: buildTank, color1: 0x556b2f, color2: 0x3a4a1f,
  },
  t34_tank: {
    name: 'T-34 Tank', type: 'tank', health: 750,
    speed: 16, turnSpeed: 1.5, fireRate: 2.5, damage: 90,
    build: buildTank, color1: 0x5a6e3a, color2: 0x3c4c28,
  },
  spitfire: {
    name: 'Spitfire', type: 'plane', health: 400,
    speed: 60, turnSpeed: 1.8, fireRate: 8, damage: 25,
    build: buildPlane, color1: 0x6b8e6b, color2: 0x4a654a,
  },
  bf109: {
    name: 'Bf 109', type: 'plane', health: 380,
    speed: 65, turnSpeed: 1.6, fireRate: 9, damage: 22,
    build: buildPlane, color1: 0x7a7a6a, color2: 0x5a5a4a,
  },
  zero: {
    name: 'A6M Zero', type: 'plane', health: 300,
    speed: 58, turnSpeed: 2.0, fireRate: 7, damage: 20,
    build: buildPlane, color1: 0x8a9a7a, color2: 0x6a7a5a,
  },
  willys_jeep: {
    name: 'Willys Jeep', type: 'jeep', health: 300,
    speed: 22, turnSpeed: 2.5, fireRate: 6, damage: 15,
    build: buildJeep, color1: 0x556b2f, color2: 0x3a4a1f,
  },
  kubelwagen: {
    name: 'Kübelwagen', type: 'jeep', health: 280,
    speed: 24, turnSpeed: 2.6, fireRate: 6, damage: 14,
    build: buildJeep, color1: 0x6b6b4f, color2: 0x4a4a34,
  },  pt_boat: {
    name: 'PT Boat', type: 'boat', health: 600,
    speed: 18, turnSpeed: 1.0, fireRate: 4, damage: 60,
    build: buildBoat, color1: 0x5a6a5a, color2: 0x3a4a3a,
  },};

// ────── VEHICLE CLASS ──────
export class Vehicle {
  constructor(defId, position, terrain) {
    this.def = VEHICLE_DEFS[defId];
    this.terrain = terrain;
    this.health = this.def.health;
    this.maxHealth = this.def.health;
    this.alive = true;
    this.occupied = false;
    this.driver = null;
    this.fireCooldown = 0;

    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0; // planes only
    this.altitude = 0; // planes only

    this.mesh = this.def.build(this.def.color1, this.def.color2);
    this.mesh.position.copy(position);
    this.mesh.userData = { type: 'vehicle', vehicle: this };

    // For tanks: turret rotation
    this.turretYaw = 0;
    this.turret = this.mesh.getObjectByName('turret');
  }

  enter(player) {
    this.occupied = true;
    this.driver = player;
    player.inVehicle = this;
  }

  exit(player) {
    this.occupied = false;
    this.driver = null;
    player.inVehicle = null;
    // Place player beside vehicle
    const side = new THREE.Vector3(3, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    player.position.copy(this.mesh.position).add(side);
    player.position.y += 2;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.alive = false;
      // Kick out driver
      if (this.driver) {
        this.exit(this.driver);
        this.driver = null;
      }
    }
  }

  update(dt, keys, mouseDir) {
    if (!this.alive) return;
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);

    if (this.def.type === 'tank') this._updateTank(dt, keys, mouseDir);
    else if (this.def.type === 'plane') this._updatePlane(dt, keys, mouseDir);
    else if (this.def.type === 'jeep') this._updateJeep(dt, keys);
    else if (this.def.type === 'boat') this._updateBoat(dt, keys);
  }

  _updateTank(dt, keys, mouseDir) {
    let accel = 0;
    if (keys['KeyW']) accel = 1;
    if (keys['KeyS']) accel = -0.6;
    if (keys['KeyA']) this.yaw += this.def.turnSpeed * dt;
    if (keys['KeyD']) this.yaw -= this.def.turnSpeed * dt;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.velocity.copy(forward).multiplyScalar(accel * this.def.speed);

    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.z += this.velocity.z * dt;

    const gy = getTerrainHeight(this.terrain, this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = gy + 1.2;
    this.mesh.rotation.y = this.yaw;

    // Turret follows mouse direction (horizontal)
    if (this.turret && mouseDir) {
      this.turretYaw = Math.atan2(-mouseDir.x, -mouseDir.z);
      this.turret.rotation.y = this.turretYaw - this.yaw;
    }
  }

  _updatePlane(dt, keys) {
    const speed = this.def.speed;
    if (keys['KeyW']) this.pitch = Math.max(this.pitch - 1.2 * dt, -0.6);
    else if (keys['KeyS']) this.pitch = Math.min(this.pitch + 1.2 * dt, 0.6);
    else this.pitch *= 0.95;
    if (keys['KeyA']) this.yaw += this.def.turnSpeed * dt;
    if (keys['KeyD']) this.yaw -= this.def.turnSpeed * dt;

    const forward = new THREE.Vector3(0, 0, -1)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    this.mesh.position.addScaledVector(forward, speed * dt);
    // Clamp altitude
    if (this.mesh.position.y < 30) this.mesh.position.y = 30;
    if (this.mesh.position.y > 200) this.mesh.position.y = 200;

    this.mesh.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    // Bank on turn
    const bank = keys['KeyA'] ? 0.4 : keys['KeyD'] ? -0.4 : 0;
    this.mesh.rotation.z = bank;
  }

  _updateJeep(dt, keys) {
    let accel = 0;
    if (keys['KeyW']) accel = 1;
    if (keys['KeyS']) accel = -0.7;
    if (keys['KeyA']) this.yaw += this.def.turnSpeed * dt;
    if (keys['KeyD']) this.yaw -= this.def.turnSpeed * dt;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.velocity.copy(forward).multiplyScalar(accel * this.def.speed);

    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.z += this.velocity.z * dt;

    const gy = getTerrainHeight(this.terrain, this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = gy + 0.6;
    this.mesh.rotation.y = this.yaw;
  }

  _updateBoat(dt, keys) {
    let accel = 0;
    if (keys['KeyW']) accel = 1;
    if (keys['KeyS']) accel = -0.4;
    if (keys['KeyA']) this.yaw += this.def.turnSpeed * dt;
    if (keys['KeyD']) this.yaw -= this.def.turnSpeed * dt;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.velocity.copy(forward).multiplyScalar(accel * this.def.speed);

    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.z += this.velocity.z * dt;

    // Bob on water surface
    const t = performance.now() * 0.001;
    this.mesh.position.y = 0.8 + Math.sin(t * 1.2 + this.mesh.position.x * 0.05) * 0.3;
    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.z = Math.sin(t * 0.8) * 0.04;
    this.mesh.rotation.x = Math.sin(t * 1.0 + 1) * 0.03;
  }

  canFire() { return this.fireCooldown <= 0; }
  fire() { this.fireCooldown = 1 / this.def.fireRate; }

  getMuzzlePosition() {
    if (this.def.type === 'tank') {
      const tip = new THREE.Vector3(0, 2.2, -4);
      tip.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.turretYaw);
      return tip.add(this.mesh.position);
    }
    const tip = new THREE.Vector3(0, 0, -4);
    tip.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return tip.add(this.mesh.position);
  }

  getFireDirection() {
    if (this.def.type === 'tank') {
      return new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.turretYaw);
    }
    return new THREE.Vector3(0, 0, -1)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch || 0)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
  }
}

// ────── BUILDERS (geometry-based models) ──────

function buildTank(c1, c2) {
  const group = new THREE.Group();
  const m1 = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.7, metalness: 0.3 });
  const m2 = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.8 });

  // Hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 5.5), m1);
  hull.position.y = 0.7;
  hull.castShadow = true;
  group.add(hull);

  // Treads
  for (const side of [-1, 1]) {
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 6), m2);
    tread.position.set(side * 2, 0.5, 0);
    tread.castShadow = true;
    group.add(tread);
  }

  // Turret group
  const turret = new THREE.Group();
  turret.name = 'turret';
  const turretBody = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 2.2), m1);
  turretBody.position.y = 1.85;
  turretBody.castShadow = true;
  turret.add(turretBody);
  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8), m2);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 1.85, -2.5);
  barrel.castShadow = true;
  turret.add(barrel);
  group.add(turret);

  return group;
}

function buildPlane(c1, c2) {
  const group = new THREE.Group();
  const m1 = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.5, metalness: 0.2 });
  const m2 = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.6 });

  // Fuselage
  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 6, 8), m1);
  fuse.rotation.x = Math.PI / 2;
  fuse.castShadow = true;
  group.add(fuse);

  // Wings
  const wing = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 1.5), m1);
  wing.position.set(0, 0, 0.3);
  wing.castShadow = true;
  group.add(wing);

  // Tail
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.8), m2);
  tailH.position.set(0, 0, 2.8);
  group.add(tailH);
  const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), m2);
  tailV.position.set(0, 0.6, 2.8);
  group.add(tailV);

  // Propeller
  const prop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 0.1), m2);
  prop.position.set(0, 0, -3.1);
  prop.name = 'propeller';
  group.add(prop);

  // Cockpit
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.4, roughness: 0.1 })
  );
  cockpit.position.set(0, 0.35, -0.3);
  group.add(cockpit);

  return group;
}

function buildJeep(c1, c2) {
  const group = new THREE.Group();
  const m1 = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.7, metalness: 0.2 });
  const m2 = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.9 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 3.5), m1);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.2), m2);
  hood.position.set(0, 0.85, -1.0);
  hood.castShadow = true;
  group.add(hood);

  // Wheels
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * 1.1, 0.35, sz * 1.2);
      group.add(wheel);
    }
  }

  // Windshield frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.08), m2);
  frame.position.set(0, 1.3, -0.3);
  group.add(frame);

  return group;
}

function buildBoat(c1, c2) {
  const group = new THREE.Group();
  const m1 = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.6, metalness: 0.3 });
  const m2 = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.7, metalness: 0.2 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.7 });

  // Hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 8), m1);
  hull.position.y = 0.3;
  hull.castShadow = true;
  group.add(hull);

  // Bow taper (front wedge)
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 4), m1);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0, 0.3, -5.2);
  bow.castShadow = true;
  group.add(bow);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 2.5), m2);
  cabin.position.set(0, 1.4, 0.5);
  cabin.castShadow = true;
  group.add(cabin);

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 7.5), m2);
  deck.position.set(0, 0.95, -0.2);
  group.add(deck);

  // Gun turret (fore)
  const turret = new THREE.Group();
  turret.name = 'turret';
  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 8), metalMat);
  turretBase.position.set(0, 1.2, -2.8);
  turret.add(turretBase);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6), metalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 1.35, -4);
  turret.add(barrel);
  group.add(turret);

  // Railing
  const railMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
  for (const side of [-1.3, 1.3]) {
    for (let z = -3; z <= 3; z += 1.5) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4), railMat);
      post.position.set(side, 1.25, z);
      group.add(post);
    }
  }

  return group;
}

// ────── SPAWN VEHICLES ON MAP ──────
export function spawnVehicles(scene, terrain) {
  const vehicles = [];
  const spawns = [
    { id: 'tiger_tank', x: 50, z: 50 },
    { id: 'sherman_tank', x: -50, z: -50 },
    { id: 't34_tank', x: -80, z: 60 },
    { id: 'spitfire', x: 30, z: -40, y: 80 },
    { id: 'bf109', x: -40, z: 70, y: 90 },
    { id: 'zero', x: 70, z: 30, y: 85 },
    { id: 'willys_jeep', x: 20, z: -20 },
    { id: 'kubelwagen', x: -30, z: 20 },
    { id: 'pt_boat', x: 0, z: -100, y: 1 },
  ];
  for (const s of spawns) {
    const y = s.y ?? getTerrainHeight(terrain, s.x, s.z) + 1;
    const v = new Vehicle(s.id, new THREE.Vector3(s.x, y, s.z), terrain);
    scene.add(v.mesh);
    vehicles.push(v);
  }
  return vehicles;
}
