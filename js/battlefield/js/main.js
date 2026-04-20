// main.js — Game initialization, loop, input, raycasting, vehicles, inventory, cutscenes
import * as THREE from 'three';
import { createTerrain, createSky, createStructures, getTerrainHeight } from './world.js';
import { Player } from './player.js';
import { spawnVehicles } from './vehicles.js';
import { WeaponState, TracerSystem, LOADOUTS, WEAPONS } from './weapons.js';
import { ParticleSystem } from './particles.js';
import { spawnEnemies, spawnAllies } from './enemies.js';
import { UI, LOCATIONS } from './ui.js';

// ── Three.js Setup ──
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 600);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Build World ──
const terrain = createTerrain();
scene.add(terrain);
createSky(scene);
const structures = createStructures(scene, terrain);

// ── Systems ──
const ui = new UI();
const particles = new ParticleSystem(scene);
const tracers = new TracerSystem(scene);
const raycaster = new THREE.Raycaster();

let player, enemies, vehicles, allies;
let gameState = 'menu'; // menu | cutscene | playing | paused | dead
let clock = new THREE.Clock();

// ── Weapon Inventory ──
// Player carries 2 weapons: primary (slot 0) and secondary (slot 1)
let inventory = [null, null]; // [WeaponState, WeaponState]
let activeSlot = 0;
let playerShooting = false; // tracked for stealth detection

function getWeapon() { return inventory[activeSlot]; }

function setSlotUI() {
  const w0 = inventory[0], w1 = inventory[1];
  document.getElementById('slot-primary-name').textContent = w0 ? w0.def.name : '---';
  document.getElementById('slot-secondary-name').textContent = w1 ? w1.def.name : '---';
  document.getElementById('slot-primary').classList.toggle('active', activeSlot === 0);
  document.getElementById('slot-secondary').classList.toggle('active', activeSlot === 1);
}

function swapSlot() {
  activeSlot = activeSlot === 0 ? 1 : 0;
  const w = getWeapon();
  if (w) w.cooldown = Math.max(w.cooldown, 0.3); // swap delay
  setSlotUI();
}

// ── Weapon Pickup ──
let pickupHoldTime = 0;
const PICKUP_REQUIRED = 2.0; // seconds
let nearbyPickup = null; // current enemy with weapon nearby

function findNearbyPickup() {
  if (!player || !enemies) return null;
  let best = null, bestDist = 4;
  for (const e of enemies) {
    if (e.alive || !e.droppedWeapon || !e.weaponPickup) continue;
    const d = e.weaponPickup.position.distanceTo(player.position);
    if (d < bestDist) { best = e; bestDist = d; }
  }
  return best;
}

function pickUpWeapon(enemy) {
  const id = enemy.droppedWeapon;
  // Replace current active slot weapon
  inventory[activeSlot] = new WeaponState(id);
  setSlotUI();
  // Remove pickup from world
  if (enemy.weaponPickup) {
    scene.remove(enemy.weaponPickup);
    enemy.weaponPickup.geometry.dispose();
    enemy.weaponPickup.material.dispose();
    enemy.weaponPickup = null;
  }
  enemy.droppedWeapon = null;
}

// ── Cutscene System ──
let cutsceneTimer = 0;
let cutsceneSteps = [];
let cutsceneIdx = 0;
let cutsceneCamStart = new THREE.Vector3();
let cutsceneCamEnd = new THREE.Vector3();
let cutsceneLookTarget = new THREE.Vector3();

const cutsceneOverlay = document.getElementById('cutscene-overlay');
const cutsceneText = document.getElementById('cutscene-text');

function startCutscene(steps, onComplete) {
  cutsceneSteps = steps;
  cutsceneIdx = 0;
  cutsceneTimer = 0;
  gameState = 'cutscene';
  cutsceneOverlay.classList.remove('hidden');
  cutsceneText.textContent = '';
  _applyCutsceneStep();
  cutsceneOnComplete = onComplete;
}
let cutsceneOnComplete = null;

function _applyCutsceneStep() {
  if (cutsceneIdx >= cutsceneSteps.length) {
    endCutscene();
    return;
  }
  const step = cutsceneSteps[cutsceneIdx];
  cutsceneCamStart.copy(step.camFrom);
  cutsceneCamEnd.copy(step.camTo);
  cutsceneLookTarget.copy(step.lookAt);
  cutsceneText.textContent = step.text || '';
  cutsceneText.style.animation = 'none';
  cutsceneText.offsetHeight;
  cutsceneText.style.animation = '';
  cutsceneTimer = 0;
}

function updateCutscene(dt) {
  if (cutsceneIdx >= cutsceneSteps.length) return;
  const step = cutsceneSteps[cutsceneIdx];
  cutsceneTimer += dt;
  const t = Math.min(cutsceneTimer / step.duration, 1);
  const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) / 2;

  camera.position.lerpVectors(cutsceneCamStart, cutsceneCamEnd, ease);
  camera.lookAt(cutsceneLookTarget);

  if (t >= 1) {
    cutsceneIdx++;
    if (cutsceneIdx < cutsceneSteps.length) _applyCutsceneStep();
    else endCutscene();
  }
}

function endCutscene() {
  cutsceneOverlay.classList.add('hidden');
  gameState = 'playing';
  if (cutsceneOnComplete) cutsceneOnComplete();
  cutsceneOnComplete = null;
}

function skipCutscene() {
  cutsceneIdx = cutsceneSteps.length;
  endCutscene();
}

// Build cutscene steps for specific theaters
function getCutsceneSteps(locId) {
  if (locId === 'berlin') {
    // Helicopter approach over ruined city, drop into enemy camp
    return [
      {
        camFrom: new THREE.Vector3(100, 80, 100),
        camTo: new THREE.Vector3(40, 40, 30),
        lookAt: new THREE.Vector3(0, 5, 0),
        text: 'Berlin, 1945. The Red Army closes in on the capital.',
        duration: 4,
      },
      {
        camFrom: new THREE.Vector3(40, 40, 30),
        camTo: new THREE.Vector3(15, 25, 10),
        lookAt: new THREE.Vector3(0, 8, -20),
        text: 'Your helicopter descends over the burning Reichstag.',
        duration: 3.5,
      },
      {
        camFrom: new THREE.Vector3(15, 25, 10),
        camTo: new THREE.Vector3(5, 8, -5),
        lookAt: new THREE.Vector3(0, 2, -40),
        text: 'Jump! Go go go! The enemy camp is just ahead.',
        duration: 3,
      },
    ];
  }
  if (locId === 'atlantic') {
    // Start on boat approaching enemy island
    return [
      {
        camFrom: new THREE.Vector3(0, 12, -120),
        camTo: new THREE.Vector3(0, 8, -60),
        lookAt: new THREE.Vector3(0, 3, 0),
        text: 'North Atlantic, 1942. U-boats stalk the convoy lanes.',
        duration: 4,
      },
      {
        camFrom: new THREE.Vector3(0, 8, -60),
        camTo: new THREE.Vector3(5, 5, -30),
        lookAt: new THREE.Vector3(0, 2, 30),
        text: 'Your corvette pushes through the fog toward the enemy island.',
        duration: 3.5,
      },
      {
        camFrom: new THREE.Vector3(5, 5, -30),
        camTo: new THREE.Vector3(2, 4, -15),
        lookAt: new THREE.Vector3(0, 2, 50),
        text: 'Man the deck gun. Hostile positions ahead.',
        duration: 3,
      },
    ];
  }
  // Default for all other theaters — stealthy ground approach
  return [
    {
      camFrom: new THREE.Vector3(-30, 15, -100),
      camTo: new THREE.Vector3(-10, 6, -70),
      lookAt: new THREE.Vector3(0, 3, 0),
      text: LOCATIONS.find(l => l.id === locId)?.name + ' — You approach under cover of darkness.',
      duration: 3.5,
    },
    {
      camFrom: new THREE.Vector3(-10, 6, -70),
      camTo: new THREE.Vector3(0, 3, -50),
      lookAt: new THREE.Vector3(10, 2, 0),
      text: 'The enemy does not know you are here. Stay quiet.',
      duration: 3,
    },
  ];
}

// ── Save/Checkpoint System ──
const SAVE_KEY = 'battlefield_save';

function saveGame() {
  if (!player || !ui.selectedLocation) return;
  const data = {
    locationId: ui.selectedLocation.id,
    playerPos: { x: player.position.x, y: player.position.y, z: player.position.z },
    playerYaw: player.euler.y,
    health: player.health,
    kills: player.kills,
    deaths: player.deaths,
    score: player.score,
    activeSlot,
    weapons: inventory.map(w => w ? { id: w.id, clip: w.clip, reserve: w.reserve } : null),
    enemiesAlive: enemies ? enemies.filter(e => e.alive).length : 0,
    timestamp: Date.now(),
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (_) {}
  // Show save notification
  showSaveNotify();
}

function showSaveNotify() {
  const el = document.getElementById('save-notify');
  if (!el) return;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = '';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 2600);
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
}

// ── Pointer Lock ──
function requestLock() { canvas.requestPointerLock(); }
document.addEventListener('pointerlockchange', () => {
  if (player) player.locked = document.pointerLockElement === canvas;
});

// ── Menu Wiring ──
ui.buildMap();
ui.showMenu();

// Show continue button if save exists
const existingSave = loadSave();
const btnContinue = document.getElementById('btn-continue');
if (existingSave) {
  btnContinue.classList.remove('hidden');
  const loc = LOCATIONS.find(l => l.id === existingSave.locationId);
  if (loc) btnContinue.textContent = 'CONTINUE — ' + loc.name;
}

document.getElementById('btn-play').addEventListener('click', () => ui.showMapSelect());
document.getElementById('btn-controls').addEventListener('click', () => ui.showControls());
document.getElementById('btn-back-controls').addEventListener('click', () => ui.showMenu());
document.getElementById('btn-back-menu').addEventListener('click', () => ui.showMenu());
document.getElementById('btn-deploy').addEventListener('click', startGame);
document.getElementById('btn-resume').addEventListener('click', resumeGame);
document.getElementById('btn-quit').addEventListener('click', quitToMenu);
document.getElementById('btn-respawn').addEventListener('click', respawn);
btnContinue.addEventListener('click', () => {
  const save = loadSave();
  if (!save) return;
  const loc = LOCATIONS.find(l => l.id === save.locationId);
  if (!loc) return;
  ui.selectedLocation = loc;
  startGame();
});

// ── Start Game ──
function startGame() {
  const loc = ui.selectedLocation;
  if (!loc) return;

  // Player
  player = new Player(camera, terrain);
  player.enable();

  const spawnX = (Math.random() - 0.5) * 40;
  const spawnZ = -80 + (Math.random() - 0.5) * 20;
  player.spawn(spawnX, spawnZ);

  // Weapon inventory — primary + sidearm
  const faction = loc.playerFaction;
  const primaryId = loc.weaponId;
  const sidearmId = LOADOUTS[faction]?.sidearm || 'm1911';
  inventory[0] = new WeaponState(primaryId);
  inventory[1] = new WeaponState(sidearmId);
  activeSlot = 0;
  setSlotUI();
  playerShooting = false;
  pickupHoldTime = 0;

  // Enemies
  if (enemies) enemies.forEach(e => { scene.remove(e.mesh); if (e.weaponPickup) scene.remove(e.weaponPickup); });
  enemies = spawnEnemies(scene, terrain, 30, loc.enemyFaction);

  // Allies
  if (allies) allies.forEach(a => scene.remove(a.mesh));
  allies = spawnAllies(scene, terrain, 8, loc.playerFaction);

  // Vehicles
  if (vehicles) vehicles.forEach(v => scene.remove(v.mesh));
  vehicles = spawnVehicles(scene, terrain);

  // Auto-enter boat for Atlantic theater
  if (loc.vehicle === 'boat') {
    const boat = vehicles.find(v => v.def.type === 'boat' && !v.occupied);
    if (boat) {
      boat.enter(player);
      player.position.copy(boat.mesh.position);
    }
  }

  ui.showHUD();
  clock.start();

  // Start cutscene
  const steps = getCutsceneSteps(loc.id);
  startCutscene(steps, () => {
    requestLock();
  });
}

function resumeGame() {
  gameState = 'playing';
  ui.hidePause();
  requestLock();
}

function quitToMenu() {
  gameState = 'menu';
  if (player) player.disable();
  document.exitPointerLock();
  ui.showMenu();
}

function respawn() {
  ui.hideDeath();
  // Try to load last save
  const save = loadSave();
  if (save && save.locationId === ui.selectedLocation?.id) {
    player.position.set(save.playerPos.x, save.playerPos.y, save.playerPos.z);
    player.velocity.set(0, 0, 0);
    player.euler.y = save.playerYaw;
    player.health = save.health;
    player.alive = true;
    player.kills = save.kills;
    player.deaths = player.deaths; // keep running death count
    player.score = save.score;
    // Restore weapons
    if (save.weapons) {
      for (let i = 0; i < 2; i++) {
        if (save.weapons[i]) {
          inventory[i] = new WeaponState(save.weapons[i].id);
          inventory[i].clip = save.weapons[i].clip;
          inventory[i].reserve = save.weapons[i].reserve;
        }
      }
      activeSlot = save.activeSlot || 0;
      setSlotUI();
    }
  } else {
    player.spawn((Math.random() - 0.5) * 40, -80 + (Math.random() - 0.5) * 20);
  }
  // Reset stealth
  if (enemies) enemies.forEach(e => { if (e.alive) e.alertLevel = 0; });
  gameState = 'playing';
  requestLock();
}

// ── Key Handling ──
let vKeyDown = false;
document.addEventListener('keydown', (e) => {
  if (gameState === 'cutscene') {
    if (e.code === 'Space') skipCutscene();
    return;
  }
  if (gameState === 'playing') {
    if (e.code === 'Escape') {
      gameState = 'paused';
      document.exitPointerLock();
      ui.showPause();
    }
    if (e.code === 'KeyR' && getWeapon() && !player.inVehicle) {
      getWeapon().reload();
    }
    if (e.code === 'KeyE') {
      handleVehicleInteract();
    }
    if (e.code === 'Tab') {
      e.preventDefault();
      ui.showScoreboard();
      ui.updateScoreboard(player, enemies);
    }
    // Weapon slot select
    if (e.code === 'Digit1' && activeSlot !== 0) {
      activeSlot = 0;
      setSlotUI();
    }
    if (e.code === 'Digit2' && activeSlot !== 1) {
      activeSlot = 1;
      setSlotUI();
    }
    // V = swap weapon / start hold to pick up
    if (e.code === 'KeyV') {
      vKeyDown = true;
      // Instant swap if no pickup nearby
      if (!findNearbyPickup()) {
        swapSlot();
      }
    }
  } else if (gameState === 'paused') {
    if (e.code === 'Escape') resumeGame();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Tab') ui.hideScoreboard();
  if (e.code === 'KeyV') {
    vKeyDown = false;
    pickupHoldTime = 0;
    const fill = document.getElementById('pickup-fill');
    if (fill) fill.style.width = '0%';
  }
});

// ── Vehicle Enter/Exit ──
function handleVehicleInteract() {
  if (player.inVehicle) {
    player.inVehicle.exit(player);
    ui.hideVehicleHUD();
    return;
  }
  let nearest = null, nearestDist = Infinity;
  for (const v of vehicles) {
    if (!v.alive || v.occupied) continue;
    const d = v.mesh.position.distanceTo(player.position);
    if (d < 6 && d < nearestDist) { nearest = v; nearestDist = d; }
  }
  if (nearest) nearest.enter(player);
}

// ── Shooting ──
function handleShooting(dt) {
  if (!player.alive) return;
  // Update both weapons each frame (cooldowns, reloads)
  if (inventory[0]) inventory[0].update(dt);
  if (inventory[1]) inventory[1].update(dt);

  const weapon = getWeapon();
  if (!weapon) return;
  playerShooting = false;

  if (player.inVehicle) {
    const v = player.inVehicle;
    if (player.mouseDown && v.canFire()) {
      v.fire();
      const muzzle = v.getMuzzlePosition();
      const dir = v.getFireDirection();
      tracers.spawn(muzzle, dir);
      particles.muzzleFlash(muzzle, dir);
      vehicleHitCheck(muzzle, dir, v.def.damage);
      playerShooting = true;
    }
    return;
  }

  // Infantry fire
  const auto = weapon.def.auto;
  if (player.mouseDown) {
    if (weapon.canFire()) {
      const dmg = weapon.fire();
      playerShooting = true;

      player.euler.x += weapon.def.recoil * (0.5 + Math.random() * 0.5);

      const origin = player.position.clone();
      const dir = player.getWorldDir();
      dir.x += (Math.random() - 0.5) * 0.015;
      dir.y += (Math.random() - 0.5) * 0.015;
      dir.z += (Math.random() - 0.5) * 0.015;
      dir.normalize();

      tracers.spawn(origin.clone().addScaledVector(dir, 1), dir);
      particles.muzzleFlash(origin.clone().addScaledVector(dir, 1.2), dir);

      // Raycast hits
      raycaster.set(origin, dir);
      raycaster.far = weapon.def.range;

      // Check enemies (skip allies)
      const enemyMeshes = enemies.filter(e => e.alive).map(e => e.mesh);
      const hits = raycaster.intersectObjects(enemyMeshes, true);
      if (hits.length > 0) {
        let enemy = null;
        let obj = hits[0].object;
        while (obj) {
          if (obj.userData?.enemy) { enemy = obj.userData.enemy; break; }
          obj = obj.parent;
        }
        if (enemy) {
          const killed = enemy.takeDamage(dmg);
          ui.showHitmarker();
          particles.impact(hits[0].point);
          if (killed) {
            player.kills++;
            player.score += 100;
            ui.updateKills(player.kills);
            ui.addKillfeed('You', enemy.faction.toUpperCase() + ' Soldier');
            // Auto-save every 5 kills
            if (player.kills % 5 === 0) {
              saveGame();
            }
          }
        }
      } else {
        const allHits = raycaster.intersectObjects([terrain, ...structures.children], true);
        if (allHits.length > 0) particles.impact(allHits[0].point);
      }

      if (!auto) player.mouseDown = false;
    }
  }
}

function vehicleHitCheck(origin, dir, dmg) {
  raycaster.set(origin, dir);
  raycaster.far = 300;
  const enemyMeshes = enemies.filter(e => e.alive).map(e => e.mesh);
  const hits = raycaster.intersectObjects(enemyMeshes, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj) {
      if (obj.userData?.enemy) {
        const killed = obj.userData.enemy.takeDamage(dmg);
        particles.explosion(hits[0].point, 0.5);
        if (killed) {
          player.kills++;
          player.score += 100;
          ui.updateKills(player.kills);
          ui.addKillfeed('You', 'Enemy');
        }
        break;
      }
      obj = obj.parent;
    }
  } else {
    const terrainHits = raycaster.intersectObject(terrain);
    if (terrainHits.length > 0) particles.explosion(terrainHits[0].point, 0.8);
  }
}

// ── Game Loop ──
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (gameState === 'cutscene') {
    updateCutscene(dt);
    // Still update particles for atmosphere
    tracers.update(dt);
    particles.update(dt, camera);
    renderer.render(scene, camera);
    return;
  }

  if (gameState === 'playing') {
    // Player
    player.update(dt);

    // Vehicle
    if (player.inVehicle) {
      const v = player.inVehicle;
      const mouseDir = player.getWorldDir();
      v.update(dt, player.keys, mouseDir);
      if (v.def.type === 'plane') {
        const behind = new THREE.Vector3(0, 3, 8)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw);
        camera.position.copy(v.mesh.position).add(behind);
        camera.lookAt(v.mesh.position);
      } else if (v.def.type === 'boat') {
        const behind = new THREE.Vector3(0, 5, 12)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw);
        camera.position.copy(v.mesh.position).add(behind);
        camera.lookAt(v.mesh.position);
      } else {
        camera.position.copy(v.mesh.position);
        camera.position.y += v.def.type === 'tank' ? 3.5 : 2;
        camera.quaternion.setFromEuler(player.euler);
      }
      ui.showVehicleHUD(v.def.name, v.health, v.maxHealth);
      const prop = v.mesh.getObjectByName('propeller');
      if (prop) prop.rotation.z += 30 * dt;
    } else {
      ui.hideVehicleHUD();
    }

    // Nearby vehicle prompt
    if (!player.inVehicle) {
      let nearVehicle = false;
      for (const v of vehicles) {
        if (v.alive && !v.occupied && v.mesh.position.distanceTo(player.position) < 6) {
          nearVehicle = true;
          break;
        }
      }
      if (nearVehicle) ui.showInteract();
      else ui.hideInteract();
    } else {
      ui.hideInteract();
    }

    // Weapon pickup — hold V
    const pickupPrompt = document.getElementById('pickup-prompt');
    const pickupFill = document.getElementById('pickup-fill');
    nearbyPickup = findNearbyPickup();
    if (nearbyPickup && vKeyDown) {
      pickupHoldTime += dt;
      pickupPrompt.classList.remove('hidden');
      pickupFill.style.width = Math.min(100, (pickupHoldTime / PICKUP_REQUIRED) * 100) + '%';
      if (pickupHoldTime >= PICKUP_REQUIRED) {
        pickUpWeapon(nearbyPickup);
        pickupHoldTime = 0;
        vKeyDown = false;
        pickupPrompt.classList.add('hidden');
        pickupFill.style.width = '0%';
      }
    } else if (nearbyPickup && !vKeyDown) {
      pickupPrompt.classList.remove('hidden');
      pickupFill.style.width = '0%';
    } else {
      pickupPrompt.classList.add('hidden');
      pickupHoldTime = 0;
    }

    // Shooting
    handleShooting(dt);

    // Enemy detection + updates
    const isSprinting = player.sprinting;
    for (const e of enemies) {
      // Update stealth detection
      e.updateDetection(dt, player.position, isSprinting, playerShooting);

      // Fully alerted enemies call comrades
      if (e.alertLevel >= 3 && e.alive) {
        e.alertComrades(enemies);
      }

      const shot = e.update(dt, player.position, player.alive);
      if (shot && shot.hit && player.alive) {
        const result = player.takeDamage(shot.damage);
        ui.showDamageFlash();
        if (result.died) {
          gameState = 'dead';
          document.exitPointerLock();
          const save = loadSave();
          const deathMsg = save && save.locationId === ui.selectedLocation?.id
            ? 'Killed by enemy soldier — respawning at last save'
            : 'Killed by enemy soldier';
          ui.showDeath(deathMsg);
        }
      }
      if (shot) tracers.spawn(shot.from, shot.dir, 200, 120);
    }

    // Ally updates
    if (allies) {
      for (const a of allies) {
        a.update(dt, player.position, player.alive);
      }
    }

    // Tracers & Particles
    tracers.update(dt);
    particles.update(dt, camera);

    // HUD
    const weapon = getWeapon();
    if (weapon && !player.inVehicle) {
      ui.updateAmmo(weapon.clip, weapon.reserve);
      ui.updateWeaponName(weapon.def.name + (weapon.reloading ? ' (RELOADING)' : ''));
    } else if (player.inVehicle) {
      ui.updateAmmo('\u221e', '');
      ui.updateWeaponName(player.inVehicle.def.name);
    }
    ui.updateHealth(player.health, player.maxHealth);
    ui.updateCompass(player.euler.y);
    ui.updateMinimap(player.position, player.euler.y, enemies, vehicles, allies);

    // Respawn dead enemies periodically
    for (const e of enemies) {
      if (!e.alive && !e._respawnTimer) {
        e._respawnTimer = 15;
      }
      if (!e.alive && e._respawnTimer !== undefined) {
        e._respawnTimer -= dt;
        if (e._respawnTimer <= 0) {
          e._respawnTimer = undefined;
          // Remove old weapon pickup
          if (e.weaponPickup) {
            scene.remove(e.weaponPickup);
            e.weaponPickup = null;
          }
          e.droppedWeapon = null;
          const x = (Math.random() - 0.5) * 350;
          const z = (Math.random() - 0.5) * 350;
          e.resetForRespawn(x, z);
        }
      }
    }
  }

  renderer.render(scene, camera);
}

animate();
