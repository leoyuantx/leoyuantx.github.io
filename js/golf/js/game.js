// Game entry point: state, physics, input, scoring, main animation loop
import * as THREE from 'three';
import G from './globals.js';
import { CW, CH, BALL_R, HOLE_R, BORDER_H, initScene, rebuildSky, SKY_THEMES, BIOMES, getBiome, applyBiome } from './scene.js';
import { initAudio, startMusic, stopMusic, startNatureSounds, stopNatureSounds,
         playSwingSound, playHitSound, playBounceSound, playWallBounceSound,
         playTapSound, playHoleSound, playWinSound, playLoseSound, playRollSound,
         getAudioCtx, getSfxGain, setMusicVolume, setSfxVolume } from './audio.js';
import { initObjects } from './objects.js';
import { initEffects, applyActiveEffect, awardSparkleLightsPrize, addCoins, addStars,
         showSecretToast, saveShopData, loadShopData } from './effects.js';
import { initShop, openShop, closeShop, renderShop } from './shop.js';
import { mulberry32, dist, generateCourses, generateSecret, buildCourse3D } from './course.js';

// ---- Constants ----
const SWING_DURATION = 400;
const SWING_BACK_ANGLE = -Math.PI * 0.6;
const SWING_HIT_ANGLE = Math.PI * 0.15;
const FRICTION = 0.985;
const BOUNCE = 0.65;

// ---- Initialize Scene ----
initScene();

// ---- Initialize Objects ----
initObjects();

// ---- Initialize Effects ----
initEffects();

// ---- DOM Refs (store on G for cross-module access) ----
G.overlayEl = document.getElementById('overlay');
G.overlayTitle = document.getElementById('overlay-title');
G.overlayText = document.getElementById('overlay-text');
G.overlayBtn = document.getElementById('overlay-btn');
G.shopBtnEl = document.getElementById('shop-btn');
G.shopCloseBtn = document.getElementById('shop-close');
G.designBtnEl = document.getElementById('design-btn');
G.settingsBtnEl = document.getElementById('settings-btn');
G.settingsPanel = document.getElementById('settings-panel');
G.settingsCloseBtn = document.getElementById('settings-close');
G.viewModeSelect = document.getElementById('view-mode-select');
G.continueBtnEl = document.getElementById('continue-btn');
G.rageModeToggle = document.getElementById('rage-mode-toggle');
G.confettiContainer = document.getElementById('confetti-container');
G.musicVolumeEl = document.getElementById('music-volume');
G.sfxVolumeEl = document.getElementById('sfx-volume');
G.musicVolumeValueEl = document.getElementById('music-volume-value');
G.sfxVolumeValueEl = document.getElementById('sfx-volume-value');
G.editorPanel = document.getElementById('editor-panel');
G.editorInfo = document.getElementById('editor-info');
G.editorSummary = document.getElementById('editor-summary');
G.editorEraseBtn = document.getElementById('editor-erase');
G.editorItemStrip = document.getElementById('editor-item-strip');
G.editorThemeStrip = document.getElementById('editor-theme-strip');
G.tournamentNameEl = document.getElementById('tournament-name');
G.holeLabelEl = document.getElementById('hole-label');
G.strokesLabelEl = document.getElementById('strokes-label');
G.parLabelEl = document.getElementById('par-label');
G.totalScoreEl = document.getElementById('total-score');
G.winsLabelEl = document.getElementById('wins-label');
G.coinCountEl = document.getElementById('coin-count');
G.starCountEl = document.getElementById('star-count');
G.powerBar = document.getElementById('power-bar');
G.powerFill = document.getElementById('power-fill');
G.powerLabel = document.getElementById('power-label');
G.tapHint = document.getElementById('tap-hint');
G.secretToast = document.getElementById('secret-toast');
G.secretTitle = document.getElementById('secret-title');
G.secretDesc = document.getElementById('secret-desc');
G.secretReward = document.getElementById('secret-reward');
G.secretHintEl = document.getElementById('secret-hint');
G.exclusiveCountEl = document.getElementById('exclusive-count');
G.exclusiveToast = document.getElementById('exclusive-toast');
G.overlayAction = 'start';

const DEFAULT_OVERLAY_TITLE = G.overlayTitle.textContent;
const DEFAULT_OVERLAY_TEXT = G.overlayText.innerHTML;
const DEFAULT_OVERLAY_BUTTON = G.overlayBtn.textContent;

// ---- Game State (on G for cross-module access) ----
G.ball = { x: 0, z: 0, vx: 0, vz: 0, lastSafeX: 0, lastSafeZ: 0 };
G.holePos = { x: 0, z: 0 };
G.obstacles = [];
G.walls = [];
G.gamePhase = 'menu';
G.aimAngle = 0;
G.power = 0;
G.tapCount = 0;
G.strokes = 0;
G.holeIndex = 0;
G.holesPerTournament = 3;
G.tournamentIndex = 0;
G.totalScore = 0;
G.holeScores = [];
G.wins = 0;
G.coins = 0;
G.stars = 0;
G.exclusiveCoins = 0;
G.lightsCollectedThisStroke = 0;
G.sparklePrizeAwarded = false;
G.ownedItems = {};
G.activeEffect = null;
G.courses = [];
G.viewMode = '3d';
G.musicVolume = 0.35;
G.sfxVolume = 0.7;
G.rageMode = false;
G.isBossHole = false;

// Club swing state
G.clubSwinging = false;
G.clubSwingStart = 0;
G.pendingLaunch = false;
G.savedSpeed = 0;
G.savedAngle = 0;

// Secret system
G.secretData = null;
G.secretMesh = null;
G.secretTargetMeshes = [];
G.secretFound = false;
G.secretPatternProgress = 0;

// Fish, splash, water, flag
G.fishList = [];
G.splashParticles = [];
G.waterMeshRefs = [];
G.flagMeshRef = null;
G.sparkleLights = [];
G.hazardMeshRefs = [];

// Scoring
let scoredTime = 0;
let scoredBallStartX = 0;
let scoredBallStartZ = 0;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInCubic(value) {
  return value * value * value;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

// ---- Load Saved Data ----
loadShopData();

// Show continue button on initial load if player has progress
if (G.tournamentIndex > 0) {
  G.overlayBtn.textContent = 'Start From Level 1';
  G.overlayAction = 'restart';
  G.continueBtnEl.textContent = `▶ Continue (Tournament ${G.tournamentIndex + 1})`;
  G.continueBtnEl.classList.remove('hidden');
}

function applyViewMode(mode, persist = true) {
  const nextMode = mode === '2d' ? '2d' : '3d';
  G.viewMode = nextMode;
  if (G.viewModeSelect) G.viewModeSelect.value = nextMode;
  if (G.ballShadow) G.ballShadow.visible = nextMode !== '2d';
  if (G.camera2D && G.camera3D) {
    G.camera = nextMode === '2d' ? G.camera2D : G.camera3D;
    if (nextMode === '2d') {
      G.camera.position.set(CW / 2, 60, CH / 2);
      G.camera.lookAt(CW / 2, 0, CH / 2);
    } else {
      G.camera.position.set(CW / 2, 22, CH + 10);
      G.camera.lookAt(CW / 2, 0, CH / 2);
    }
  }
  if (persist) saveShopData();
}

function applyMusicVolume(value) {
  const volume = Math.max(0, Math.min(1, Number(value) / 100));
  G.musicVolume = volume;
  if (G.musicVolumeValueEl) G.musicVolumeValueEl.textContent = `${Math.round(volume * 100)}%`;
  setMusicVolume(volume);
  saveShopData();
}

function applySfxVolume(value) {
  const volume = Math.max(0, Math.min(1, Number(value) / 100));
  G.sfxVolume = volume;
  if (G.sfxVolumeValueEl) G.sfxVolumeValueEl.textContent = `${Math.round(volume * 100)}%`;
  setSfxVolume(volume);
  saveShopData();
}

applyViewMode(G.viewMode, false);
if (G.musicVolumeEl) G.musicVolumeEl.value = Math.round(G.musicVolume * 100);
if (G.sfxVolumeEl) G.sfxVolumeEl.value = Math.round(G.sfxVolume * 100);
if (G.musicVolumeValueEl) G.musicVolumeValueEl.textContent = `${Math.round(G.musicVolume * 100)}%`;
if (G.sfxVolumeValueEl) G.sfxVolumeValueEl.textContent = `${Math.round(G.sfxVolume * 100)}%`;
setMusicVolume(G.musicVolume);
setSfxVolume(G.sfxVolume);

// Init display from saved state
G.coinCountEl.textContent = G.coins;
G.starCountEl.textContent = G.stars;
G.exclusiveCountEl.textContent = G.exclusiveCoins;
G.winsLabelEl.textContent = `Wins: ${G.wins}`;

// ---- Initialize Shop ----
initShop();

// ---- Raycaster for mouse -> ground plane ----
const raycaster = new THREE.Raycaster();
const mousev = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let mouseWorldX = CW / 2, mouseWorldZ = CH / 2;

G.renderer.domElement.addEventListener('mousemove', e => {
  mousev.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousev.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mousev, G.camera);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(groundPlane, target);
  if (target) {
    mouseWorldX = target.x;
    mouseWorldZ = target.z;
    if (editorActive && G.gamePhase === 'editor') {
      updateEditorPreview(mouseWorldX, mouseWorldZ);
    }
  }
});

G.renderer.domElement.addEventListener('mousedown', e => {
  e.preventDefault();
  initAudio();
  if (G.gamePhase === 'aiming') {
    G.aimAngle = Math.atan2(mouseWorldZ - G.ball.z, mouseWorldX - G.ball.x);
    G.gamePhase = 'powering';
    G.power = 0;
    G.tapCount = 0;
    G.powerBar.classList.remove('hidden');
    G.tapHint.classList.remove('hidden');
    G.powerFill.style.width = '0%';
    G.powerLabel.textContent = 'TAP to increase power! Right-click or Space to shoot.';
    G.tapCount++;
    G.power = Math.min(G.tapCount * 5, 100);
    G.powerFill.style.width = G.power + '%';
    playTapSound();
  } else if (G.gamePhase === 'powering') {
    G.tapCount++;
    G.power = Math.min(G.tapCount * 5, 100);
    G.powerFill.style.width = G.power + '%';
    playTapSound();
  } else if (G.gamePhase === 'rolling') {
    // Redirect the ball toward the clicked point, keeping its current speed
    const speed = Math.sqrt(G.ball.vx ** 2 + G.ball.vz ** 2);
    if (speed > 0.01) {
      const angle = Math.atan2(mouseWorldZ - G.ball.z, mouseWorldX - G.ball.x);
      G.ball.vx = Math.cos(angle) * speed;
      G.ball.vz = Math.sin(angle) * speed;
      G.strokes++;
      G.strokesLabelEl.textContent = `Strokes: ${G.strokes}`;
      playHitSound();
    }
  } else if (G.gamePhase === 'editor') {
    handleEditorClick(mouseWorldX, mouseWorldZ);
  }
});

G.renderer.domElement.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (G.gamePhase === 'powering') launchBall();
});

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && G.gamePhase === 'powering') {
    e.preventDefault();
    launchBall();
  }
});

function launchBall() {
  if (G.power <= 0) return;
  G.savedSpeed = 0.08 + (G.power / 100) * 0.45;
  G.savedAngle = G.aimAngle;
  G.gamePhase = 'swinging';
  G.powerBar.classList.add('hidden');
  G.tapHint.classList.add('hidden');
  G.powerLabel.textContent = '';
  playSwingSound();
  startClubSwing();
}

function startClubSwing() {
  G.clubPivot.position.set(G.ball.x, 0, G.ball.z);
  G.clubPivot.rotation.set(0, 0, 0);
  G.clubGroup.rotation.set(0, 0, 0);
  G.clubGroup.visible = true;
  G.clubPivot.rotation.y = -G.savedAngle + Math.PI / 2;
  G.clubSwinging = true;
  G.clubSwingStart = Date.now();
  G.pendingLaunch = true;
}

function updateClubSwing() {
  if (!G.clubSwinging) return;
  const elapsed = Date.now() - G.clubSwingStart;
  const t = Math.min(elapsed / SWING_DURATION, 1.0);

  let swingAngle;
  if (t < 0.45) {
    const bt = t / 0.45;
    swingAngle = SWING_BACK_ANGLE * easeOutCubic(bt);
  } else if (t < 0.65) {
    const ht = (t - 0.45) / 0.2;
    swingAngle = SWING_BACK_ANGLE + (SWING_HIT_ANGLE - SWING_BACK_ANGLE) * easeInCubic(ht);
    if (G.pendingLaunch && ht > 0.7) {
      G.pendingLaunch = false;
      G.ball.vx = Math.cos(G.savedAngle) * G.savedSpeed;
      G.ball.vz = Math.sin(G.savedAngle) * G.savedSpeed;
      G.strokes++;
      G.lightsCollectedThisStroke = 0;
      G.strokesLabelEl.textContent = `Strokes: ${G.strokes}`;
      G.gamePhase = 'rolling';
      playHitSound();
    }
  } else {
    const ft = (t - 0.65) / 0.35;
    swingAngle = SWING_HIT_ANGLE + Math.PI * 0.1 * easeOutCubic(ft);
  }

  G.clubGroup.rotation.x = swingAngle;

  if (t >= 1.0) {
    G.clubSwinging = false;
    G.clubGroup.visible = false;
    if (G.pendingLaunch) {
      G.pendingLaunch = false;
      G.ball.vx = Math.cos(G.savedAngle) * G.savedSpeed;
      G.ball.vz = Math.sin(G.savedAngle) * G.savedSpeed;
      G.strokes++;
      G.lightsCollectedThisStroke = 0;
      G.strokesLabelEl.textContent = `Strokes: ${G.strokes}`;
      G.gamePhase = 'rolling';
      playHitSound();
    }
  }
}

function isBallInsideObstacle(ball, obstacle) {
  if (obstacle.type === 'circle') {
    return dist(ball.x, ball.z, obstacle.x, obstacle.z) <= BALL_R + obstacle.r;
  }

  const halfW = obstacle.w / 2;
  const halfD = obstacle.d / 2;
  return ball.x >= obstacle.x - halfW - BALL_R &&
    ball.x <= obstacle.x + halfW + BALL_R &&
    ball.z >= obstacle.z - halfD - BALL_R &&
    ball.z <= obstacle.z + halfD + BALL_R;
}

function showBallEffectMessage(message) {
  if (!message) return;
  G.powerLabel.textContent = message;
}

function applyObstacleEffects(ball) {
  const now = Date.now();
  let frictionScale = 1;

  for (const obstacle of G.obstacles) {
    if (!obstacle.effect || !isBallInsideObstacle(ball, obstacle)) continue;

    const effect = obstacle.effect;
    if (effect.kind === 'ice') {
      frictionScale *= effect.glide || 1.01;
      showBallEffectMessage(effect.message);
      continue;
    }

    if (effect.kind === 'sticky') {
      frictionScale *= effect.slow || 0.92;
      showBallEffectMessage(effect.message);
      continue;
    }

    if (effect.kind === 'wind') {
      ball.vx += Math.cos(effect.angle || 0) * (effect.force || 0.0025);
      ball.vz += Math.sin(effect.angle || 0) * (effect.force || 0.0025);
      showBallEffectMessage(effect.message);
      continue;
    }

    // SAND — heavy friction (continuous, no cooldown)
    if (effect.kind === 'sand') {
      frictionScale *= effect.slow || 0.88;
      showBallEffectMessage(effect.message || '⛱ Sand trap!');
      continue;
    }

    // MUD — extreme slow + random wobble (continuous, no cooldown)
    if (effect.kind === 'mud') {
      frictionScale *= effect.slow || 0.84;
      ball.vx += (Math.random() - 0.5) * (effect.wobble || 0.003);
      ball.vz += (Math.random() - 0.5) * (effect.wobble || 0.003);
      showBallEffectMessage(effect.message || '🟤 Mud pit!');
      continue;
    }

    // MAGNET — pulls ball toward center (continuous, no cooldown)
    if (effect.kind === 'magnet') {
      const dx = obstacle.x - ball.x, dz = obstacle.z - ball.z;
      const pullDist = Math.hypot(dx, dz) || 1;
      const pullForce = effect.force || 0.004;
      ball.vx += (dx / pullDist) * pullForce;
      ball.vz += (dz / pullDist) * pullForce;
      showBallEffectMessage(effect.message || '🧲 Magnet pull!');
      continue;
    }

    // GRAVITY WELL — curves ball orbit-style (continuous, no cooldown)
    if (effect.kind === 'gravity') {
      const dx = obstacle.x - ball.x, dz = obstacle.z - ball.z;
      const pullDist = Math.hypot(dx, dz) || 1;
      const force = (effect.force || 0.006) / Math.max(pullDist * 0.5, 0.3);
      ball.vx += (dx / pullDist) * force;
      ball.vz += (dz / pullDist) * force;
      showBallEffectMessage(effect.message || '🌀 Gravity well!');
      continue;
    }

    // LOW GRAVITY — ball rolls much further, less friction (continuous, no cooldown)
    if (effect.kind === 'low_gravity') {
      frictionScale *= effect.glide || 1.025;
      showBallEffectMessage(effect.message || '🚀 Low gravity!');
      continue;
    }

    // WATER — reset to last safe position + 1 stroke penalty (own cooldown)
    if (effect.kind === 'water') {
      if ((obstacle._effectCooldownUntil || 0) > now) continue;
      obstacle._effectCooldownUntil = now + 800;
      ball.x = ball.lastSafeX; ball.z = ball.lastSafeZ;
      ball.vx = 0; ball.vz = 0;
      G.strokes++;
      G.strokesLabelEl.textContent = `Strokes: ${G.strokes}`;
      G.ballMesh.position.set(ball.x, BALL_R, ball.z);
      G.ballShadow.position.set(ball.x, 0.005, ball.z);
      G.gamePhase = 'aiming';
      showBallEffectMessage(effect.message || '💦 Water hazard! +1 stroke');
      G.powerLabel.textContent = '💦 Water hazard! +1 stroke penalty';
      continue;
    }

    // LAVA — bounce away violently + 1 stroke penalty (own cooldown)
    if (effect.kind === 'lava') {
      const speed = Math.sqrt(ball.vx ** 2 + ball.vz ** 2);
      if ((obstacle._effectCooldownUntil || 0) > now) continue;
      obstacle._effectCooldownUntil = now + 600;
      const cx = obstacle.x, cz = obstacle.z;
      let nx = ball.x - cx, nz = ball.z - cz;
      const nd = Math.hypot(nx, nz) || 1;
      nx /= nd; nz /= nd;
      const launchSpeed = Math.max(speed * 1.8, 0.3);
      ball.vx = nx * launchSpeed;
      ball.vz = nz * launchSpeed;
      ball.x = cx + nx * (BALL_R + (obstacle.r || 0.8) + 0.1);
      ball.z = cz + nz * (BALL_R + (obstacle.r || 0.8) + 0.1);
      G.strokes++;
      G.strokesLabelEl.textContent = `Strokes: ${G.strokes}`;
      playBounceSound(launchSpeed);
      showBallEffectMessage(effect.message || '🔥 Lava! +1 stroke');
      G.powerLabel.textContent = '🔥 Lava pool! +1 stroke penalty';
      continue;
    }

    // ---- Cooldown-gated effects below ----
    if ((obstacle._effectCooldownUntil || 0) > now) continue;
    obstacle._effectCooldownUntil = now + (effect.cooldown || 350);

    const speed = Math.sqrt(ball.vx ** 2 + ball.vz ** 2);
    if (speed < 0.01) continue;

    if (effect.kind === 'boost') {
      const multiplier = effect.multiplier || 1.2;
      ball.vx *= multiplier;
      ball.vz *= multiplier;
      showBallEffectMessage(effect.message);
      continue;
    }

    if (effect.kind === 'spring') {
      const cx = obstacle.x;
      const cz = obstacle.z;
      let nx = ball.x - cx;
      let nz = ball.z - cz;
      const nd = Math.hypot(nx, nz) || 1;
      nx /= nd;
      nz /= nd;
      const launchSpeed = Math.max(speed * (effect.multiplier || 1.5), effect.launchSpeed || 0.22);
      ball.vx = ball.vx * 0.18 + nx * launchSpeed * 0.82;
      ball.vz = ball.vz * 0.18 + nz * launchSpeed * 0.82;
      ball.x = cx + nx * (BALL_R + (obstacle.r || 0.7) + 0.06);
      ball.z = cz + nz * (BALL_R + (obstacle.r || 0.7) + 0.06);
      playBounceSound(speed);
      showBallEffectMessage(effect.message);
    }
  }

  return frictionScale;
}

// ---- Physics ----
function updateBall() {
  if (G.gamePhase !== 'rolling') return;
  const ball = G.ball;

  ball.x += ball.vx;
  ball.z += ball.vz;
  const frictionScale = applyObstacleEffects(ball);
  ball.vx *= FRICTION * frictionScale;
  ball.vz *= FRICTION * frictionScale;

  // Border collisions
  if (ball.x - BALL_R < 0) { ball.x = BALL_R; playWallBounceSound(Math.abs(ball.vx)); ball.vx = Math.abs(ball.vx) * BOUNCE; }
  if (ball.x + BALL_R > CW) { ball.x = CW - BALL_R; playWallBounceSound(Math.abs(ball.vx)); ball.vx = -Math.abs(ball.vx) * BOUNCE; }
  if (ball.z - BALL_R < 0) { ball.z = BALL_R; playWallBounceSound(Math.abs(ball.vz)); ball.vz = Math.abs(ball.vz) * BOUNCE; }
  if (ball.z + BALL_R > CH) { ball.z = CH - BALL_R; playWallBounceSound(Math.abs(ball.vz)); ball.vz = -Math.abs(ball.vz) * BOUNCE; }

  // Obstacle collisions
  for (const ob of G.obstacles) {
    if (ob.passThrough) continue;
    if (ob.type === 'circle') collideCircle(ob);
    else collideRect(ob);
  }

  // Wall collisions
  for (const w of G.walls) collideWallSegment(w);

  // Check hole
  const d = dist(ball.x, ball.z, G.holePos.x, G.holePos.z);
  const speed = Math.sqrt(ball.vx ** 2 + ball.vz ** 2);
  if (d < HOLE_R - 0.05 && speed < 0.3) {
    ballScored();
    return;
  }

  // Stop when slow
  if (speed < 0.005) {
    ball.vx = 0; ball.vz = 0;
    ball.lastSafeX = ball.x; ball.lastSafeZ = ball.z;
    G.gamePhase = 'aiming';
    G.powerLabel.textContent = 'Click to aim, then TAP to build power!';
  }

  // ---- Secret collision detection ----
  if (G.secretData && !G.secretFound) {
    if (G.secretData.type === 'simple') {
      const sd = dist(ball.x, ball.z, G.secretData.crystal.x, G.secretData.crystal.z);
      if (sd < BALL_R + G.secretData.crystal.r) {
        G.secretFound = true;
        triggerSecretFound();
      }
    } else if (G.secretData.type === 'pattern') {
      const nextIdx = G.secretPatternProgress;
      if (nextIdx < G.secretData.targets.length) {
        const tgt = G.secretData.targets[nextIdx];
        const td = dist(ball.x, ball.z, tgt.x, tgt.z);
        if (td < BALL_R + tgt.r) {
          tgt.hit = true;
          G.secretPatternProgress++;
          if (G.secretTargetMeshes[nextIdx]) {
            G.secretTargetMeshes[nextIdx].children.forEach(c => {
              if (c.material && c.material.color) c.material.color.setHex(0x44ff88);
              if (c.material && c.material.emissive) c.material.emissive.setHex(0x22ff66);
            });
          }
          const audioCtx = getAudioCtx();
          const sfxGain = getSfxGain();
          if (audioCtx) {
            const now = audioCtx.currentTime;
            const freq = 440 * Math.pow(2, nextIdx / 6);
            const o = audioCtx.createOscillator();
            o.type = 'sine'; o.frequency.value = freq;
            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0.2, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            o.connect(g); g.connect(sfxGain);
            o.start(now); o.stop(now + 0.55);
          }
          G.powerLabel.textContent = `✨ Rune ${G.secretPatternProgress}/${G.secretData.targets.length} activated!`;
          if (G.secretPatternProgress >= G.secretData.targets.length) {
            if (G.secretMesh) {
              G.secretMesh.material.opacity = 0.9;
              G.secretMesh.material.emissiveIntensity = 1.5;
            }
            G.powerLabel.textContent = '✨ Crystal awakened! Hit it!';
          }
        }
      } else {
        const sd = dist(ball.x, ball.z, G.secretData.crystal.x, G.secretData.crystal.z);
        if (sd < BALL_R + G.secretData.crystal.r) {
          G.secretFound = true;
          triggerSecretFound();
        }
      }
    }
  }

  // ---- Sparkle light collision ----
  G.sparkleLights.forEach(sl => {
    if (sl.collected) return;
    const sd = dist(ball.x, ball.z, sl.x, sl.z);
    if (sd < (sl.collectRadius || BALL_R + 0.3)) {
      sl.collected = true;
      G.lightsCollectedThisStroke++;
      addCoins(sl.reward);
      const audioCtx = getAudioCtx();
      const sfxGain = getSfxGain();
      if (audioCtx) {
        const now = audioCtx.currentTime;
        const freqs = [880, 1100, 1320];
        freqs.forEach((f, i) => {
          const o = audioCtx.createOscillator();
          o.type = 'sine'; o.frequency.value = f;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.15, now + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
          o.connect(g); g.connect(sfxGain);
          o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.35);
        });
      }
      if (sl.mesh) {
        sl.gemMat.emissive.setHex(0x000000);
        sl.gemMat.emissiveIntensity = 0;
        sl.gemMat.opacity = 0.4;
        sl.gemMat.color.setHex(0x333340);
        sl.haloMat.opacity = 0;
        sl.mesh.children.forEach((child, ci) => {
          if (ci >= 2) child.visible = false;
        });
      }
      const collectedLights = G.sparkleLights.filter(light => light.collected).length;
      if (!G.sparklePrizeAwarded && collectedLights === G.sparkleLights.length && G.sparkleLights.length > 0) {
        G.sparklePrizeAwarded = true;
        awardSparkleLightsPrize(G.strokes);
      }
    }
  });

  // Update 3D ball
  G.ballMesh.position.set(ball.x, BALL_R, ball.z);
  G.ballShadow.position.set(ball.x, 0.005, ball.z);
  const rollSpeed = Math.sqrt(ball.vx ** 2 + ball.vz ** 2);
  if (rollSpeed > 0.001) {
    const rollAxis = new THREE.Vector3(-ball.vz, 0, ball.vx).normalize();
    G.ballMesh.rotateOnWorldAxis(rollAxis, rollSpeed / BALL_R * 0.5);
    playRollSound(rollSpeed);
  }
}

function collideCircle(ob) {
  const ball = G.ball;
  const dx = ball.x - ob.x, dz = ball.z - ob.z;
  const d = Math.sqrt(dx * dx + dz * dz);
  const minDist = BALL_R + ob.r;
  if (d < minDist && d > 0) {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vz * ball.vz);
    const nx = dx / d, nz = dz / d;
    ball.x = ob.x + nx * minDist;
    ball.z = ob.z + nz * minDist;
    const dot = ball.vx * nx + ball.vz * nz;
    ball.vx -= 2 * dot * nx;
    ball.vz -= 2 * dot * nz;
    ball.vx *= BOUNCE; ball.vz *= BOUNCE;
    playBounceSound(speed);
  }
}

function collideRect(ob) {
  const ball = G.ball;
  const hw = ob.w / 2, hd = ob.d / 2;
  const cx = Math.max(ob.x - hw, Math.min(ball.x, ob.x + hw));
  const cz = Math.max(ob.z - hd, Math.min(ball.z, ob.z + hd));
  const dx = ball.x - cx, dz = ball.z - cz;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < BALL_R && d > 0) {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vz * ball.vz);
    const nx = dx / d, nz = dz / d;
    ball.x = cx + nx * BALL_R;
    ball.z = cz + nz * BALL_R;
    const dot = ball.vx * nx + ball.vz * nz;
    ball.vx -= 2 * dot * nx;
    ball.vz -= 2 * dot * nz;
    ball.vx *= BOUNCE; ball.vz *= BOUNCE;
    playBounceSound(speed);
  }
}

function collideWallSegment(w) {
  const ball = G.ball;
  const ax = w.x2 - w.x1, az = w.z2 - w.z1;
  const len = Math.sqrt(ax * ax + az * az);
  if (len === 0) return;
  const dx = ball.x - w.x1, dz = ball.z - w.z1;
  let t = (dx * ax + dz * az) / (len * len);
  t = Math.max(0, Math.min(1, t));
  const closestX = w.x1 + t * ax;
  const closestZ = w.z1 + t * az;
  const cdx = ball.x - closestX, cdz = ball.z - closestZ;
  const cd = Math.sqrt(cdx * cdx + cdz * cdz);
  const wallThick = 0.15;
  if (cd < BALL_R + wallThick && cd > 0) {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vz * ball.vz);
    const nx = cdx / cd, nz = cdz / cd;
    ball.x = closestX + nx * (BALL_R + wallThick);
    ball.z = closestZ + nz * (BALL_R + wallThick);
    const dot = ball.vx * nx + ball.vz * nz;
    ball.vx -= 2 * dot * nx;
    ball.vz -= 2 * dot * nz;
    ball.vx *= BOUNCE; ball.vz *= BOUNCE;
    playWallBounceSound(speed);
  }
}

// ---- Confetti ----
function spawnConfetti() {
  const container = G.confettiContainer;
  container.innerHTML = '';
  const colors = ['#ff4444','#ffdd44','#44ff88','#44aaff','#ff44cc','#ffaa22','#aa44ff','#44ffdd'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${6 + Math.random() * 8}px`;
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

function playHoleInOneSound() {
  const audioCtx = getAudioCtx();
  const sfxGain = getSfxGain();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const notes = [523.3, 659.3, 784.0, 1047, 1318.5, 1568, 2093];
  notes.forEach((freq, i) => {
    const t = now + i * 0.08;
    const o = audioCtx.createOscillator();
    o.type = i < 4 ? 'sine' : 'triangle';
    o.frequency.value = freq;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + 1.05);
  });
}

// ---- Scoring ----
function ballScored() {
  G.gamePhase = 'scored';
  scoredTime = Date.now();
  scoredBallStartX = G.ball.x;
  scoredBallStartZ = G.ball.z;
  G.ball.vx = 0; G.ball.vz = 0;
  G.ballMesh.scale.set(1, 1, 1);

  const isHoleInOne = G.strokes === 1;

  if (isHoleInOne) {
    playHoleInOneSound();
    spawnConfetti();
  } else {
    playHoleSound();
  }

  const par = G.courses[G.holeIndex].par;
  const diff = G.strokes - par;
  G.totalScore += diff;
  G.holeScores.push(G.strokes);
  G.totalScoreEl.textContent = `Total: ${G.totalScore >= 0 ? '+' : ''}${G.totalScore}`;

  const scoreName = isHoleInOne ? '🎉 HOLE IN ONE! 🎉' : getScoreName(diff);
  G.powerLabel.textContent = `⛳ ${scoreName}! (${G.strokes} strokes, par ${par})`;

  // Bonus coins for hole-in-one
  if (isHoleInOne) {
    addCoins(50);
    addStars(2);
  }

  setTimeout(() => {
    if (G.isCustomLevel) {
      G.overlayTitle.textContent = '⛳ Custom Level Complete!';
      const par = editorCourseData.par;
      const diff = G.strokes - par;
      const scoreName = getScoreName(diff);
      G.overlayText.innerHTML = `${scoreName}!<br>Strokes: ${G.strokes} (Par ${par})<br><br>Nice work on your custom course!`;
      G.overlayBtn.textContent = 'Main Menu';
      G.overlayAction = 'menu';
      G.overlayEl.classList.remove('hidden');
      G.gamePhase = 'menu';
      G.isCustomLevel = false;
      G.holesPerTournament = 3;
    } else if (G.holeIndex < G.holesPerTournament - 1) {
      G.holeIndex++;
      loadHole();
    } else {
      endTournament();
    }
  }, 1500);
}

function getScoreName(diff) {
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  return 'Triple Bogey+';
}

// ---- Secret Found Handler ----
function triggerSecretFound() {
  if (!G.secretData) return;
  const reward = G.secretData.reward;
  const audioCtx = getAudioCtx();
  const sfxGain = getSfxGain();
  if (audioCtx) {
    const now = audioCtx.currentTime;
    const notes = [523.3, 659.3, 784.0, 1047, 1318.5];
    notes.forEach((freq, i) => {
      const t = now + i * 0.1;
      const o = audioCtx.createOscillator();
      o.type = 'sine'; o.frequency.value = freq;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      o.connect(g); g.connect(sfxGain);
      o.start(t); o.stop(t + 0.85);
    });
  }
  addCoins(reward);
  addStars(1);
  if (G.secretMesh) G.secretMesh.visible = false;

  const giftNames = ['Mystery Chest', 'Ancient Relic', 'Golden Orb', 'Crystal Shard', 'Enchanted Gem'];
  const giftName = giftNames[Math.floor(Math.random() * giftNames.length)];
  showSecretToast(
    `🎁 ${giftName}!`,
    G.secretData.type === 'pattern'
      ? 'You solved the rune pattern!<br>The crystal revealed its treasure.'
      : 'You found the hidden crystal!',
    reward
  );
}

function endTournament() {
  const won = G.totalScore <= 0;
  const opponentScores = [];
  const tRng = mulberry32(G.tournamentIndex * 777);
  for (let i = 0; i < 3; i++) {
    opponentScores.push(Math.floor(tRng() * 10) - 3);
  }
  opponentScores.sort((a, b) => a - b);
  let placement = 1;
  for (const os of opponentScores) {
    if (os < G.totalScore) placement++;
  }
  placement = Math.min(placement, 4);

  let placementCoins = 0;
  let placementText = '';
  if (placement === 1) { placementCoins = 100; placementText = '🥇 1st Place! +100 coins'; }
  else if (placement === 2) { placementCoins = 75; placementText = '🥈 2nd Place! +75 coins'; }
  else if (placement === 3) { placementCoins = 50; placementText = '🥉 3rd Place! +50 coins'; }
  else { placementText = '4th Place'; }

  let roundWinCoins = 0;
  for (let i = 0; i < G.holeScores.length; i++) {
    if (G.holeScores[i] <= G.courses[i].par) roundWinCoins += 10;
  }

  const totalEarned = placementCoins + roundWinCoins;
  if (totalEarned > 0) addCoins(totalEarned);

  if (won) {
    G.wins++;
    G.winsLabelEl.textContent = `Wins: ${G.wins}`;
    G.overlayTitle.textContent = '🏆 You Win!';
    playWinSound();
    G.overlayText.innerHTML = `Tournament ${G.tournamentIndex + 1} complete!<br>
      Score: ${G.totalScore >= 0 ? '+' : ''}${G.totalScore}<br>
      Holes: ${G.holeScores.join(', ')}<br>
      <span style="color:#ffd700">${placementText}</span><br>
      <span style="color:#ffd700">Round wins: +${roundWinCoins} coins</span><br><br>
      Advancing to Tournament ${G.tournamentIndex + 2}...`;
    G.overlayBtn.textContent = 'Next Tournament';
    G.overlayAction = 'start';
    G.tournamentIndex++;
  } else {
    G.overlayTitle.textContent = '😤 Try Again!';
    G.overlayText.innerHTML = `Tournament ${G.tournamentIndex + 1} — you went over par.<br>
      Score: +${G.totalScore}<br>
      Holes: ${G.holeScores.join(', ')}<br>
      <span style="color:#ffd700">${placementText}</span><br>
      <span style="color:#ffd700">Round wins: +${roundWinCoins} coins</span><br><br>
      Moving on to a new tournament...`;
    G.overlayBtn.textContent = 'New Tournament';
    G.overlayAction = 'start';
    G.tournamentIndex++;
    playLoseSound();
  }
  G.overlayEl.classList.remove('hidden');
  G.gamePhase = 'menu';
  saveShopData();
}

// ---- Load Hole ----
function loadHole() {
  const c = G.courses[G.holeIndex];

  // Apply sky theme based on tournament + hole (or editor pick)
  if (G.isCustomLevel && G.editorSkyIndex != null) {
    rebuildSky(G.editorSkyIndex);
  } else {
    const themeIdx = (G.tournamentIndex * G.holesPerTournament + G.holeIndex) % SKY_THEMES.length;
    rebuildSky(themeIdx);
  }

  // Apply biome (changes every 10 tournaments, or editor pick)
  if (G.isCustomLevel && G.editorBiomeIndex != null) {
    applyBiome(BIOMES[G.editorBiomeIndex]);
  } else {
    const biome = getBiome(G.tournamentIndex);
    applyBiome(biome);
  }

  G.ball.x = c.bx; G.ball.z = c.bz; G.ball.vx = 0; G.ball.vz = 0;
  G.ball.lastSafeX = c.bx; G.ball.lastSafeZ = c.bz;
  G.holePos.x = c.hx; G.holePos.z = c.hz;
  G.obstacles = c.obs;
  G.walls = c.walls;
  G.strokes = 0;
  G.power = 0;
  G.tapCount = 0;
  G.sparklePrizeAwarded = false;
  G.gamePhase = 'aiming';
  G.isBossHole = Boolean(c.isBossHole);
  G.bossHoleBaseX = c.hx;
  G.bossHoleBaseZ = c.hz;

  const difficulty = Math.min(G.tournamentIndex, 8);
  G.secretData = generateSecret(c, difficulty, G.holeIndex, G.tournamentIndex);
  G.secretFound = false;
  G.secretPatternProgress = 0;
  G.secretHintEl.textContent = G.secretData.hint;
  G.secretHintEl.classList.add('visible');
  setTimeout(() => G.secretHintEl.classList.remove('visible'), 4000);

  buildCourse3D(c);
  G.ballMesh.visible = true;
  G.ballMesh.position.set(G.ball.x, BALL_R, G.ball.z);
  G.ballShadow.position.set(G.ball.x, 0.005, G.ball.z);
  G.ballShadow.visible = G.viewMode !== '2d';
  G.clubGroup.visible = false;
  G.clubSwinging = false;

  // Update env map
  G.ballMesh.visible = false;
  G.cubeCamera.position.copy(G.ballMesh.position);
  G.cubeCamera.update(G.renderer, G.scene);
  G.ballMesh.visible = true;

  G.holeLabelEl.textContent = G.isBossHole
    ? `⚠ BOSS HOLE ⚠`
    : `Hole ${G.holeIndex + 1}/${G.holesPerTournament}`;
  G.strokesLabelEl.textContent = 'Strokes: 0';
  G.parLabelEl.textContent = `Par: ${c.par}`;
  G.powerBar.classList.add('hidden');
  G.tapHint.classList.add('hidden');
  G.powerLabel.textContent = G.isBossHole
    ? '⚠ BOSS HOLE — The hole is moving!'
    : 'Click to aim, then TAP to build power!';
}

// ---- Start Game ----
function startGame() {
  try {
    initAudio();
    startMusic();
    startNatureSounds();
  } catch (error) {
    console.warn('Audio startup failed:', error);
  }
  G.overlayEl.classList.add('hidden');
  G.overlayAction = 'start';
  G.isCustomLevel = false;
  G.courses = generateCourses(G.tournamentIndex);
  G.holeIndex = 0;
  G.totalScore = 0;
  G.holeScores = [];
  G.totalScoreEl.textContent = 'Total: 0';
  const startBiome = getBiome(G.tournamentIndex);
  const isBossTournament = (G.tournamentIndex + 1) % 10 === 0;
  let tName = `Tournament ${G.tournamentIndex + 1} — ${startBiome.name}`;
  if (isBossTournament) tName += ' ⚠ BOSS';
  if (G.rageMode) tName += ' 🔥 RAGE';
  G.tournamentNameEl.textContent = tName;
  applyActiveEffect();
  applyViewMode(G.viewMode, false);
  loadHole();
}

function showMainMenuOverlay() {
  G.overlayTitle.textContent = DEFAULT_OVERLAY_TITLE;
  G.overlayText.innerHTML = DEFAULT_OVERLAY_TEXT;
  // Show continue button if player has progress
  if (G.tournamentIndex > 0) {
    G.overlayBtn.textContent = 'Start From Level 1';
    G.overlayAction = 'restart';
    G.continueBtnEl.textContent = `▶ Continue (Tournament ${G.tournamentIndex + 1})`;
    G.continueBtnEl.classList.remove('hidden');
  } else {
    G.overlayBtn.textContent = DEFAULT_OVERLAY_BUTTON;
    G.overlayAction = 'start';
    G.continueBtnEl.classList.add('hidden');
  }
  G.overlayEl.classList.remove('hidden');
}

function handleStartGame(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (G.overlayAction === 'menu') {
    showMainMenuOverlay();
    return;
  }

  if (G.overlayAction === 'restart') {
    // "Start from Level 1" — reset tournament
    G.tournamentIndex = 0;
    saveShopData();
  }
  G.continueBtnEl.classList.add('hidden');
  startGame();
}

function continueGame() {
  G.continueBtnEl.classList.add('hidden');
  startGame();
}

function handleOverlayKeydown(event) {
  if (G.overlayEl.classList.contains('hidden')) return;
  if (G.settingsPanel && G.settingsPanel.classList.contains('open')) return;
  if (G.shopPanel && G.shopPanel.classList.contains('open')) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  handleStartGame(event);
}

window.startGame = startGame;

window.openShop = openShop;
window.closeShop = closeShop;

G.overlayBtn.onclick = handleStartGame;
G.shopBtnEl.addEventListener('click', () => window.openShop());
G.shopCloseBtn.addEventListener('click', () => window.closeShop());
G.designBtnEl.addEventListener('click', () => openEditor());
G.settingsBtnEl.addEventListener('click', () => openSettings());
G.settingsCloseBtn.addEventListener('click', () => closeSettings());
G.viewModeSelect.addEventListener('change', event => applyViewMode(event.target.value));
G.musicVolumeEl.addEventListener('input', event => applyMusicVolume(event.target.value));
G.sfxVolumeEl.addEventListener('input', event => applySfxVolume(event.target.value));
G.rageModeToggle.addEventListener('change', () => {
  G.rageMode = G.rageModeToggle.checked;
  saveShopData();
});
G.continueBtnEl.addEventListener('click', () => continueGame());
window.addEventListener('keydown', handleOverlayKeydown);

// ---- Level Editor ----
const DEFAULT_EDITOR_COURSE = Object.freeze({ bx: 5, bz: CH - 5, hx: CW - 5, hz: 5, obs: [], walls: [], par: 3 });

function makeRectItem(id, name, icon, w, d, h, variant, color, topColor, baseColor) {
  return { id, name, icon, kind: 'obstacle', shape: 'rect', w, d, h, variant, color, topColor, baseColor };
}

function makeCircleItem(id, name, icon, r, variant, color, detailColor) {
  return { id, name, icon, kind: 'obstacle', shape: 'circle', r, variant, color, detailColor };
}

function makeWallItem(id, name, icon, length, angle, style, color, capColor) {
  return { id, name, icon, kind: 'wall', shape: 'wall', length, angle, thickness: 0.25, style, color, capColor };
}

function withExtras(item, extras) {
  return { ...item, ...extras };
}

const EDITOR_ITEMS = [
  { id: 'start', name: 'Start Pad', icon: '⛳', kind: 'ball', radius: 0.8 },
  { id: 'hole', name: 'Cup', icon: '🕳️', kind: 'hole', radius: 0.9 },
  makeRectItem('crate', 'Crate', '📦', 1.8, 1.2, 0.72, 'crate', 0x8b5a2b, 0xc08a4d, 0x5e3415),
  makeRectItem('cargo', 'Cargo Box', '🧰', 2.5, 1.4, 0.86, 'cargo', 0x7b4b28, 0xa86b38, 0x532b15),
  makeRectItem('plank', 'Plank', '🪵', 3.9, 0.68, 0.28, 'plank', 0x8d6235, 0xb48759, 0x5b3921),
  makeRectItem('timber', 'Timber Stack', '🪚', 2.7, 0.92, 0.52, 'timber', 0x7f5732, 0xb08957, 0x4d2e18),
  makeRectItem('slab', 'Stone Slab', '🪨', 2.8, 1.6, 0.26, 'slab', 0x8f989d, 0xb9c1c5, 0x5f666c),
  makeRectItem('marble', 'Marble Block', '⬜', 1.55, 1.55, 1.02, 'marble', 0xd8dfe3, 0xf6fbff, 0xa8b0b4),
  makeRectItem('hedge', 'Hedge', '🌿', 2.2, 0.9, 0.76, 'hedge', 0x2d8343, 0x44aa61, 0x1d5528),
  makeRectItem('hedge-long', 'Long Hedge', '🌲', 3.8, 0.9, 0.86, 'hedge_long', 0x24703d, 0x3e9e5b, 0x184d28),
  makeRectItem('bumper', 'Neon Bumper', '🟩', 1.65, 1.65, 0.95, 'bumper', 0x1fa37f, 0x6cffc9, 0x0d4b3a),
  makeRectItem('flowerbed', 'Flower Bed', '🌺', 2.65, 1.6, 0.2, 'flowerbed', 0x6c4a2d, 0x91643d, 0x4a311d),
  makeRectItem('bridge', 'Bridge Deck', '🌉', 4.2, 0.82, 0.36, 'bridge', 0x8f673f, 0xc29b6b, 0x57341b),
  makeRectItem('altar', 'Stone Altar', '🏛️', 2.1, 1.45, 1.14, 'altar', 0x9ba3a8, 0xcfd7dc, 0x667078),
  withExtras(makeRectItem('boost-pad', 'Boost Pad', '⚡', 2.5, 1.25, 0.08, 'boost_pad', 0x0e6d52, 0x70ffbe, 0x073226), {
    passThrough: true,
    effect: { kind: 'boost', multiplier: 1.3, cooldown: 380, message: 'Boost pad!' },
  }),
  withExtras(makeRectItem('ice-sheet', 'Ice Sheet', '🧊', 2.9, 1.7, 0.04, 'ice_patch', 0x89dfff, 0xe4fbff, 0x4a7f93), {
    passThrough: true,
    effect: { kind: 'ice', glide: 1.018, message: 'Ice patch!' },
  }),
  withExtras(makeRectItem('wind-fan', 'Wind Fan', '🌬️', 2.1, 1.5, 0.12, 'wind_fan', 0x495f78, 0xa7d8ff, 0x223041), {
    passThrough: true,
    effect: { kind: 'wind', angle: 0, force: 0.0032, message: 'Tailwind!' },
  }),
  makeCircleItem('pebble', 'Pebble', '🪙', 0.52, 'pebble', 0x70757a, 0x9ea4a9),
  makeCircleItem('boulder', 'Boulder', '🪨', 0.88, 'boulder', 0x676d72, 0x9ca3aa),
  makeCircleItem('moss-rock', 'Moss Rock', '🪴', 1.0, 'moss', 0x616968, 0x4f935d),
  makeCircleItem('stump', 'Stump', '🪵', 0.62, 'stump', 0x7b5630, 0xc69658),
  makeCircleItem('barrel', 'Barrel', '🛢️', 0.56, 'barrel', 0x7a4a26, 0xcf9952),
  makeCircleItem('lantern', 'Lantern', '🏮', 0.46, 'lantern', 0x42515f, 0xfff08a),
  makeCircleItem('mushroom', 'Mushroom', '🍄', 0.52, 'mushroom', 0xc72e2e, 0xffffff),
  makeCircleItem('shrub', 'Shrub', '🌳', 0.78, 'shrub', 0x2f7f46, 0x59c06b),
  makeCircleItem('crystal', 'Crystal', '💎', 0.62, 'crystal', 0x7c6dff, 0xbef8ff),
  makeCircleItem('orb', 'Glow Orb', '🔮', 0.44, 'orb', 0x66ffcc, 0xddfff6),
  makeCircleItem('totem', 'Totem', '🗿', 0.58, 'totem', 0x7f8070, 0xbeb59a),
  makeCircleItem('fountain', 'Fountain', '⛲', 0.76, 'fountain', 0x7e8f97, 0x88d8ff),
  withExtras(makeCircleItem('goo-pool', 'Goo Pool', '🟢', 0.95, 'goo_pool', 0x2f9158, 0x7cff89), {
    passThrough: true,
    effect: { kind: 'sticky', slow: 0.9, message: 'Sticky goo!' },
  }),
  withExtras(makeCircleItem('spring-ring', 'Spring Ring', '🌀', 0.72, 'spring_ring', 0x5f53c7, 0xb1a6ff), {
    passThrough: true,
    effect: { kind: 'spring', multiplier: 1.36, cooldown: 420, message: 'Spring ring!' },
  }),
  withExtras(makeCircleItem('water-hazard', 'Water Hazard', '💦', 1.2, 'water_hazard', 0x2288cc, 0x66ccff), {
    passThrough: true,
    effect: { kind: 'water', message: '💦 Water hazard! +1 stroke' },
  }),
  withExtras(makeCircleItem('sand-trap', 'Sand Trap', '⛱', 1.4, 'sand_trap', 0xe8d5a3, 0xd4c090), {
    passThrough: true,
    effect: { kind: 'sand', slow: 0.86, message: '⛱ Sand trap!' },
  }),
  withExtras(makeCircleItem('mud-pit', 'Mud Pit', '🟤', 1.0, 'mud_pit', 0x5a4228, 0x6a5238), {
    passThrough: true,
    effect: { kind: 'mud', slow: 0.82, wobble: 0.004, message: '🟤 Mud pit!' },
  }),
  withExtras(makeCircleItem('lava-pool', 'Lava Pool', '🔥', 0.9, 'lava_pool', 0xff4400, 0xff2200), {
    passThrough: true,
    effect: { kind: 'lava', message: '🔥 Lava! +1 stroke' },
  }),
  withExtras(makeCircleItem('magnet-zone', 'Magnet', '🧲', 1.3, 'magnet_zone', 0xcc2222, 0x888899), {
    passThrough: true,
    effect: { kind: 'magnet', force: 0.005, message: '🧲 Magnet pull!' },
  }),
  withExtras(makeCircleItem('gravity-well', 'Gravity Well', '🌀', 1.1, 'gravity_well', 0x6622cc, 0x8844ff), {
    passThrough: true,
    effect: { kind: 'gravity', force: 0.007, message: '🌀 Gravity well!' },
  }),
  withExtras(makeCircleItem('low-gravity', 'Low Gravity', '🚀', 1.0, 'low_gravity_pad', 0x0a0a2a, 0x44ddff), {
    passThrough: true,
    effect: { kind: 'low_gravity', glide: 1.025, message: '🚀 Low gravity!' },
  }),
  makeWallItem('fence-short-h', 'Short Fence', '🪵', 2.2, 0, 'fence', 0x7a4f27, 0xb0814f),
  makeWallItem('fence-long-h', 'Long Fence', '🚧', 4.2, 0, 'fence', 0x7a4f27, 0xb0814f),
  makeWallItem('fence-short-v', 'Fence Vertical', '🧱', 2.2, Math.PI / 2, 'fence', 0x7a4f27, 0xb0814f),
  makeWallItem('fence-long-v', 'Tall Vertical', '🪜', 4.2, Math.PI / 2, 'fence', 0x7a4f27, 0xb0814f),
  makeWallItem('stone-wall-h', 'Stone Wall', '🧱', 3.0, 0, 'stone', 0x66707b, 0xb6c1c8),
  makeWallItem('stone-wall-v', 'Stone Wall V', '🧱', 3.0, Math.PI / 2, 'stone', 0x66707b, 0xb6c1c8),
  makeWallItem('diag-up', 'Diagonal Up', '📐', 3.4, Math.PI / 4, 'fence', 0x82542b, 0xb78a56),
  makeWallItem('diag-down', 'Diagonal Down', '📏', 3.4, -Math.PI / 4, 'stone', 0x68737a, 0xbac4cb),
];

const EDITOR_ITEM_MAP = new Map(EDITOR_ITEMS.map(item => [item.id, item]));
const EDITOR_START_HOLE_CLEARANCE = 5.5;
const EDITOR_OBJECT_CLEARANCE = 2.25;

let editorCourseData = createEmptyEditorCourse();
let editorActive = false;
let editorUiBound = false;
let editorSelectedItemId = 'start';
let editorEraseMode = false;
let editorPreviewKey = '';
let editorPlacementValid = true;
let editorPlacementReason = '';
let editorBiomeIndex = 0;
let editorSkyIndex = 0;

function createEmptyEditorCourse() {
  return {
    bx: DEFAULT_EDITOR_COURSE.bx,
    bz: DEFAULT_EDITOR_COURSE.bz,
    hx: DEFAULT_EDITOR_COURSE.hx,
    hz: DEFAULT_EDITOR_COURSE.hz,
    obs: [],
    walls: [],
    par: DEFAULT_EDITOR_COURSE.par,
  };
}

function cloneEditorCourse(course) {
  return {
    bx: course.bx,
    bz: course.bz,
    hx: course.hx,
    hz: course.hz,
    obs: course.obs.map(ob => ({ ...ob })),
    walls: course.walls.map(wall => ({ ...wall })),
    par: course.par,
  };
}

function getSelectedEditorItem() {
  return EDITOR_ITEM_MAP.get(editorSelectedItemId);
}

function ensureEditorPreview() {
  if (G.editorPreviewGroup) return;
  const group = new THREE.Group();
  group.visible = false;
  G.scene.add(group);
  G.editorPreviewGroup = group;
}

function clearEditorPreview() {
  if (!G.editorPreviewGroup) return;
  while (G.editorPreviewGroup.children.length) {
    const child = G.editorPreviewGroup.children[0];
    G.editorPreviewGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose());
      else child.material.dispose();
    }
  }
  G.editorPreviewGroup.visible = false;
  editorPreviewKey = '';
}

function buildEditorPreviewMesh(item) {
  ensureEditorPreview();
  clearEditorPreview();

  const footprintMat = new THREE.MeshBasicMaterial({
    color: 0x66ff8a,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x7cff9f,
    transparent: true,
    opacity: 0.24,
    emissive: 0x22aa55,
    emissiveIntensity: 0.4,
    depthWrite: false,
  });
  const outlineMat = new THREE.LineBasicMaterial({ color: 0xa8ffbf, transparent: true, opacity: 0.8 });

  let footprint;
  let shell;

  if (item.kind === 'ball' || item.kind === 'hole') {
    const radius = item.radius;
    footprint = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), footprintMat);
    footprint.rotation.x = -Math.PI / 2;
    footprint.position.y = 0.015;

    shell = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius * 0.75, 0.18, 24), shellMat);
    shell.position.y = 0.09;
  } else if (item.shape === 'rect') {
    footprint = new THREE.Mesh(new THREE.PlaneGeometry(item.w, item.d), footprintMat);
    footprint.rotation.x = -Math.PI / 2;
    footprint.position.y = 0.015;

    shell = new THREE.Mesh(new THREE.BoxGeometry(item.w, Math.max(item.h, 0.2), item.d), shellMat);
    shell.position.y = Math.max(item.h, 0.2) / 2;
  } else if (item.shape === 'circle') {
    footprint = new THREE.Mesh(new THREE.CircleGeometry(item.r, 32), footprintMat);
    footprint.rotation.x = -Math.PI / 2;
    footprint.position.y = 0.015;

    shell = new THREE.Mesh(new THREE.CylinderGeometry(item.r * 0.82, item.r, Math.max(item.r * 1.2, 0.24), 20), shellMat);
    shell.position.y = Math.max(item.r * 1.2, 0.24) / 2;
  } else {
    footprint = new THREE.Mesh(new THREE.PlaneGeometry(item.length, item.thickness + 0.18), footprintMat);
    footprint.rotation.x = -Math.PI / 2;
    footprint.position.y = 0.015;

    shell = new THREE.Mesh(new THREE.BoxGeometry(item.length, 0.62, item.thickness), shellMat);
    shell.position.y = 0.31;
  }

  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), outlineMat);
  outline.position.copy(shell.position);

  G.editorPreviewGroup.add(footprint, shell, outline);
  G.editorPreviewGroup.visible = true;
  editorPreviewKey = item.id;
}

function getPlacementBounds(item) {
  if (item.kind === 'ball' || item.kind === 'hole') {
    return { halfX: item.radius, halfZ: item.radius };
  }
  if (item.shape === 'rect') {
    return { halfX: item.w / 2, halfZ: item.d / 2 };
  }
  if (item.shape === 'circle') {
    return { halfX: item.r, halfZ: item.r };
  }

  const halfLenX = Math.abs(Math.cos(item.angle)) * item.length / 2;
  const halfLenZ = Math.abs(Math.sin(item.angle)) * item.length / 2;
  const halfThickX = Math.abs(Math.sin(item.angle)) * item.thickness / 2;
  const halfThickZ = Math.abs(Math.cos(item.angle)) * item.thickness / 2;
  return {
    halfX: halfLenX + halfThickX,
    halfZ: halfLenZ + halfThickZ,
  };
}

function getPlacementRadius(item) {
  const bounds = getPlacementBounds(item);
  return Math.sqrt(bounds.halfX ** 2 + bounds.halfZ ** 2);
}

function validateEditorPlacement(item, x, z) {
  if (!item) return { valid: false, reason: 'Choose an item from the bottom dock.' };

  if (item.kind === 'ball') {
    if (dist(x, z, editorCourseData.hx, editorCourseData.hz) < EDITOR_START_HOLE_CLEARANCE) {
      return { valid: false, reason: 'Move the start farther away from the hole.' };
    }
    return { valid: true, reason: '' };
  }

  if (item.kind === 'hole') {
    if (dist(x, z, editorCourseData.bx, editorCourseData.bz) < EDITOR_START_HOLE_CLEARANCE) {
      return { valid: false, reason: 'Move the hole farther away from the start.' };
    }
    return { valid: true, reason: '' };
  }

  const clearanceRadius = getPlacementRadius(item) + EDITOR_OBJECT_CLEARANCE;
  if (dist(x, z, editorCourseData.bx, editorCourseData.bz) < clearanceRadius) {
    return { valid: false, reason: 'That item is too close to the start.' };
  }
  if (dist(x, z, editorCourseData.hx, editorCourseData.hz) < clearanceRadius) {
    return { valid: false, reason: 'That item is too close to the hole.' };
  }

  return { valid: true, reason: '' };
}

function setEditorPreviewState(valid) {
  if (!G.editorPreviewGroup) return;
  const footprintColor = valid ? 0x66ff8a : 0xff6b6b;
  const shellColor = valid ? 0x7cff9f : 0xff8f8f;
  const emissiveColor = valid ? 0x22aa55 : 0xaa3333;
  const outlineColor = valid ? 0xa8ffbf : 0xffb0b0;

  G.editorPreviewGroup.children.forEach(child => {
    if (!child.material) return;
    if (child.isLineSegments) {
      child.material.color.setHex(outlineColor);
      return;
    }
    if (child.geometry && child.geometry.type === 'PlaneGeometry') {
      child.material.color.setHex(footprintColor);
      return;
    }
    child.material.color.setHex(shellColor);
    if ('emissive' in child.material) child.material.emissive.setHex(emissiveColor);
  });
}

function clampEditorPlacement(item, worldX, worldZ) {
  const bounds = getPlacementBounds(item);
  return {
    x: Math.max(bounds.halfX + 0.2, Math.min(CW - bounds.halfX - 0.2, worldX)),
    z: Math.max(bounds.halfZ + 0.2, Math.min(CH - bounds.halfZ - 0.2, worldZ)),
  };
}

function updateEditorPreview(worldX = mouseWorldX, worldZ = mouseWorldZ) {
  if (!editorActive || G.gamePhase !== 'editor' || editorEraseMode) {
    if (G.editorPreviewGroup) G.editorPreviewGroup.visible = false;
    return;
  }

  const item = getSelectedEditorItem();
  if (!item) return;

  if (editorPreviewKey !== item.id) {
    buildEditorPreviewMesh(item);
  }

  const { x, z } = clampEditorPlacement(item, worldX, worldZ);
  const placementState = validateEditorPlacement(item, x, z);
  editorPlacementValid = placementState.valid;
  editorPlacementReason = placementState.reason;
  G.editorPreviewGroup.visible = true;
  G.editorPreviewGroup.position.set(x, 0, z);
  G.editorPreviewGroup.rotation.set(0, item.shape === 'wall' ? -item.angle : 0, 0);
  setEditorPreviewState(editorPlacementValid);
}

function renderEditorThemes() {
  G.editorThemeStrip.innerHTML = '';
  BIOMES.forEach((biome, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-theme-btn' + (i === editorBiomeIndex ? ' active' : '');
    btn.dataset.themeIndex = i;
    const hex = '#' + (biome.grass & 0xffffff).toString(16).padStart(6, '0');
    btn.innerHTML = `<span class="theme-swatch" style="background:${hex}"></span>${biome.name}`;
    G.editorThemeStrip.appendChild(btn);
  });
}

function selectEditorTheme(index) {
  editorBiomeIndex = index;
  editorSkyIndex = index % SKY_THEMES.length;
  applyBiome(BIOMES[editorBiomeIndex]);
  rebuildSky(editorSkyIndex);
  syncEditorScene();
  G.editorThemeStrip.querySelectorAll('.editor-theme-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.themeIndex) === editorBiomeIndex);
  });
}

function renderEditorPalette() {
  G.editorItemStrip.innerHTML = '';
  EDITOR_ITEMS.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'editor-item';
    button.dataset.itemId = item.id;
    button.innerHTML = `<span class="editor-item-icon">${item.icon}</span><span class="editor-item-name">${item.name}</span>`;
    G.editorItemStrip.appendChild(button);
  });
}

function updateEditorSelectionUi() {
  G.editorItemStrip.querySelectorAll('.editor-item').forEach(button => {
    button.classList.toggle('active', !editorEraseMode && button.dataset.itemId === editorSelectedItemId);
  });
  G.editorEraseBtn.classList.toggle('active', editorEraseMode);
}

function selectEditorItem(itemId) {
  if (!EDITOR_ITEM_MAP.has(itemId)) return;
  editorSelectedItemId = itemId;
  editorEraseMode = false;
  updateEditorSelectionUi();
  updateEditorInfo();
  updateEditorPreview();
}

function toggleEditorEraseMode() {
  editorEraseMode = !editorEraseMode;
  updateEditorSelectionUi();
  updateEditorInfo();
  updateEditorPreview();
}

function bindEditorUi() {
  if (editorUiBound) return;
  renderEditorPalette();
  renderEditorThemes();
  G.editorItemStrip.addEventListener('click', event => {
    const button = event.target.closest('.editor-item');
    if (!button) return;
    selectEditorItem(button.dataset.itemId);
  });
  G.editorThemeStrip.addEventListener('click', event => {
    const btn = event.target.closest('.editor-theme-btn');
    if (!btn) return;
    selectEditorTheme(parseInt(btn.dataset.themeIndex));
  });
  G.editorEraseBtn.addEventListener('click', toggleEditorEraseMode);
  document.getElementById('editor-play').addEventListener('click', playEditorLevel);
  document.getElementById('editor-clear').addEventListener('click', clearEditor);
  document.getElementById('editor-back').addEventListener('click', closeEditor);
  editorUiBound = true;
}

function syncEditorScene() {
  buildCourse3D(editorCourseData);
  G.ballMesh.visible = true;
  G.ballMesh.position.set(editorCourseData.bx, BALL_R, editorCourseData.bz);
  G.ballShadow.position.set(editorCourseData.bx, 0.005, editorCourseData.bz);
}

function recalcEditorPar() {
  editorCourseData.par = 2 + Math.floor(editorCourseData.obs.length / 2) + Math.min(2, editorCourseData.walls.length);
}

function refreshEditorHud() {
  G.tournamentNameEl.textContent = 'Level Designer';
  G.holeLabelEl.textContent = 'Build Mode';
  G.strokesLabelEl.textContent = `Objects: ${editorCourseData.obs.length + editorCourseData.walls.length}`;
  G.parLabelEl.textContent = `Par: ${editorCourseData.par}`;
  G.totalScoreEl.textContent = `Start ${Math.round(editorCourseData.bx)}, ${Math.round(editorCourseData.bz)}  •  Hole ${Math.round(editorCourseData.hx)}, ${Math.round(editorCourseData.hz)}`;
  G.editorSummary.textContent = `Items ${EDITOR_ITEMS.length} • Obstacles ${editorCourseData.obs.length} • Walls ${editorCourseData.walls.length} • Start ${Math.round(editorCourseData.bx)}, ${Math.round(editorCourseData.bz)} • Hole ${Math.round(editorCourseData.hx)}, ${Math.round(editorCourseData.hz)}`;
}

function updateEditorInfo() {
  if (editorEraseMode) {
    G.editorInfo.textContent = 'Erase mode is active. Click near an obstacle or wall to remove it.';
    return;
  }

  const item = getSelectedEditorItem();
  if (!item) {
    G.editorInfo.textContent = 'Choose an item from the bottom dock.';
    return;
  }

  if (item.kind === 'ball') {
    G.editorInfo.textContent = `${item.name} selected. Hover to preview the green placement area, then click to place the start.`;
  } else if (item.kind === 'hole') {
    G.editorInfo.textContent = `${item.name} selected. Hover to preview the green placement area, then click to place the cup.`;
  } else if (item.kind === 'wall') {
    G.editorInfo.textContent = `${item.name} selected. Hover to see the wall footprint, then click once to place it.`;
  } else if (item.effect) {
    G.editorInfo.textContent = `${item.name} selected. Hover for the green preview, click to place it, and it will affect the ball during play.`;
  } else {
    G.editorInfo.textContent = `${item.name} selected. Hover to preview the green footprint, then click to put it on the map.`;
  }

  if (!editorPlacementValid && editorPlacementReason) {
    G.editorInfo.textContent = editorPlacementReason;
  }
}

function eraseEditorObjectAt(x, z) {
  let bestObstacleIdx = -1;
  let bestObstacleDist = 2.4;
  editorCourseData.obs.forEach((ob, index) => {
    const distance = dist(x, z, ob.x, ob.z);
    if (distance < bestObstacleDist) {
      bestObstacleDist = distance;
      bestObstacleIdx = index;
    }
  });

  if (bestObstacleIdx >= 0) {
    editorCourseData.obs.splice(bestObstacleIdx, 1);
    return true;
  }

  let bestWallIdx = -1;
  let bestWallDist = 2.6;
  editorCourseData.walls.forEach((wall, index) => {
    const midpointX = (wall.x1 + wall.x2) / 2;
    const midpointZ = (wall.z1 + wall.z2) / 2;
    const distance = dist(x, z, midpointX, midpointZ);
    if (distance < bestWallDist) {
      bestWallDist = distance;
      bestWallIdx = index;
    }
  });

  if (bestWallIdx >= 0) {
    editorCourseData.walls.splice(bestWallIdx, 1);
    return true;
  }

  return false;
}

function placeSelectedEditorItem(worldX, worldZ) {
  const item = getSelectedEditorItem();
  if (!item) return;

  const { x, z } = clampEditorPlacement(item, worldX, worldZ);
  const placementState = validateEditorPlacement(item, x, z);
  editorPlacementValid = placementState.valid;
  editorPlacementReason = placementState.reason;
  if (!placementState.valid) {
    updateEditorInfo();
    return;
  }

  if (item.kind === 'ball') {
    editorCourseData.bx = x;
    editorCourseData.bz = z;
    return;
  }

  if (item.kind === 'hole') {
    editorCourseData.hx = x;
    editorCourseData.hz = z;
    return;
  }

  if (item.kind === 'wall') {
    const halfLength = item.length / 2;
    const deltaX = Math.cos(item.angle) * halfLength;
    const deltaZ = Math.sin(item.angle) * halfLength;
    editorCourseData.walls.push({
      x1: x - deltaX,
      z1: z - deltaZ,
      x2: x + deltaX,
      z2: z + deltaZ,
      style: item.style,
      color: item.color,
      capColor: item.capColor,
    });
    return;
  }

  if (item.shape === 'rect') {
    editorCourseData.obs.push({
      type: 'rect',
      x,
      z,
      w: item.w,
      d: item.d,
      h: item.h,
      variant: item.variant,
      color: item.color,
      topColor: item.topColor,
      baseColor: item.baseColor,
      passThrough: Boolean(item.passThrough),
      effect: item.effect ? { ...item.effect } : null,
    });
    return;
  }

  editorCourseData.obs.push({
    type: 'circle',
    x,
    z,
    r: item.r,
    variant: item.variant,
    color: item.color,
    detailColor: item.detailColor,
    passThrough: Boolean(item.passThrough),
    effect: item.effect ? { ...item.effect } : null,
  });
}

function handleEditorClick(worldX, worldZ) {
  if (!editorActive || G.gamePhase !== 'editor') return;

  if (editorEraseMode) {
    eraseEditorObjectAt(worldX, worldZ);
    editorPlacementValid = true;
    editorPlacementReason = '';
  } else {
    placeSelectedEditorItem(worldX, worldZ);
  }

  recalcEditorPar();
  syncEditorScene();
  refreshEditorHud();
  updateEditorInfo();
  updateEditorPreview(worldX, worldZ);
}

function openEditor() {
  try { initAudio(); startMusic(); } catch (e) {}
  G.overlayEl.classList.add('hidden');
  G.editorPanel.classList.add('open');
  G.settingsPanel.classList.remove('open');
  editorActive = true;
  G.overlayAction = 'start';
  editorCourseData = createEmptyEditorCourse();
  editorSelectedItemId = 'start';
  editorEraseMode = false;
  recalcEditorPar();
  editorBiomeIndex = Math.floor(Math.random() * BIOMES.length);
  editorSkyIndex = editorBiomeIndex % SKY_THEMES.length;
  applyBiome(BIOMES[editorBiomeIndex]);
  rebuildSky(editorSkyIndex);
  syncEditorScene();
  G.clubGroup.visible = false;
  G.gamePhase = 'editor';
  G.powerBar.classList.add('hidden');
  G.tapHint.classList.add('hidden');
  G.powerLabel.textContent = '';

  bindEditorUi();
  updateEditorSelectionUi();
  // Update theme strip selection to match random pick
  G.editorThemeStrip.querySelectorAll('.editor-theme-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.themeIndex) === editorBiomeIndex);
  });
  // Scroll active theme into view
  const activeThemeBtn = G.editorThemeStrip.querySelector('.editor-theme-btn.active');
  if (activeThemeBtn) activeThemeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  refreshEditorHud();
  updateEditorInfo();
  updateEditorPreview();
}

function playEditorLevel() {
  const customCourse = cloneEditorCourse(editorCourseData);
  editorActive = false;
  if (G.editorPreviewGroup) G.editorPreviewGroup.visible = false;
  G.editorPanel.classList.remove('open');
  G.courses = [customCourse];
  G.holesPerTournament = 1;
  G.holeIndex = 0;
  G.totalScore = 0;
  G.holeScores = [];
  G.strokes = 0;
  G.tournamentNameEl.textContent = 'Custom Level';
  G.totalScoreEl.textContent = 'Total: 0';
  G.isCustomLevel = true;
  G.editorBiomeIndex = editorBiomeIndex;
  G.editorSkyIndex = editorSkyIndex;
  applyActiveEffect();
  loadHole();
}

function clearEditor() {
  editorCourseData = createEmptyEditorCourse();
  editorEraseMode = false;
  editorSelectedItemId = 'start';
  recalcEditorPar();
  syncEditorScene();
  updateEditorSelectionUi();
  refreshEditorHud();
  updateEditorInfo();
  updateEditorPreview();
}

function closeEditor() {
  editorActive = false;
  if (G.editorPreviewGroup) G.editorPreviewGroup.visible = false;
  G.editorPanel.classList.remove('open');
  G.overlayAction = 'start';
  G.gamePhase = 'menu';
  G.overlayEl.classList.remove('hidden');
}

function openSettings() {
  G.editorPanel.classList.remove('open');
  G.settingsPanel.classList.add('open');
  if (G.viewModeSelect) G.viewModeSelect.value = G.viewMode;
  if (G.musicVolumeEl) G.musicVolumeEl.value = Math.round(G.musicVolume * 100);
  if (G.sfxVolumeEl) G.sfxVolumeEl.value = Math.round(G.sfxVolume * 100);
  if (G.musicVolumeValueEl) G.musicVolumeValueEl.textContent = `${Math.round(G.musicVolume * 100)}%`;
  if (G.sfxVolumeValueEl) G.sfxVolumeValueEl.textContent = `${Math.round(G.sfxVolume * 100)}%`;
  if (G.rageModeToggle) G.rageModeToggle.checked = G.rageMode;
}

function closeSettings() {
  G.settingsPanel.classList.remove('open');
}

// ---- Aim Visuals ----
function updateAimVisuals() {
  const ball = G.ball;
  if (G.gamePhase === 'aiming') {
    const angle = Math.atan2(mouseWorldZ - ball.z, mouseWorldX - ball.x);
    const len = 5;
    const positions = G.aimLine.geometry.attributes.position.array;
    positions[0] = ball.x; positions[1] = 0.12; positions[2] = ball.z;
    positions[3] = ball.x + Math.cos(angle) * len;
    positions[4] = 0.12;
    positions[5] = ball.z + Math.sin(angle) * len;
    G.aimLine.geometry.attributes.position.needsUpdate = true;
    G.aimLine.visible = true;
    G.aimLineMat.color.set(0xffffff);
    G.aimLineMat.opacity = 0.8;

    const time = Date.now() * 0.003;
    for (let i = 0; i < G.aimDots.length; i++) {
      const t = (i + 1) / (G.aimDots.length + 1);
      const pulse = 0.5 + Math.sin(time + i * 0.6) * 0.3;
      G.aimDots[i].position.set(
        ball.x + Math.cos(angle) * len * t,
        0.12 + Math.sin(time * 2 + i) * 0.02,
        ball.z + Math.sin(angle) * len * t
      );
      G.aimDots[i].visible = true;
      G.aimDots[i].material.opacity = 0.3 + pulse * (1 - t);
      G.aimDots[i].scale.setScalar(0.8 + pulse * 0.5);
    }
  } else if (G.gamePhase === 'powering') {
    const len = 2 + (G.power / 100) * 6;
    const positions = G.aimLine.geometry.attributes.position.array;
    positions[0] = ball.x; positions[1] = 0.12; positions[2] = ball.z;
    positions[3] = ball.x + Math.cos(G.aimAngle) * len;
    positions[4] = 0.12;
    positions[5] = ball.z + Math.sin(G.aimAngle) * len;
    G.aimLine.geometry.attributes.position.needsUpdate = true;
    G.aimLine.visible = true;

    const r = G.power / 100;
    G.aimLineMat.color.setRGB(r, 1 - r * 0.7, 0.15);
    G.aimLineMat.opacity = 0.6 + r * 0.3;

    for (let i = 0; i < G.aimDots.length; i++) {
      const t = (i + 1) / (G.aimDots.length + 1);
      G.aimDots[i].position.set(
        ball.x + Math.cos(G.aimAngle) * len * t,
        0.12,
        ball.z + Math.sin(G.aimAngle) * len * t
      );
      G.aimDots[i].visible = true;
      G.aimDots[i].material.color.setRGB(r, 1 - r * 0.7, 0.15);
      G.aimDots[i].scale.setScalar(0.8 + r * 0.6);
    }
  } else {
    G.aimLine.visible = false;
    G.aimDots.forEach(d => d.visible = false);
  }
}

// ---- Scored Sparkle Animation ----
function updateSparkles() {
  if (G.gamePhase === 'scored') {
    const elapsed = (Date.now() - scoredTime) / 1000;
    const t = elapsed * 4;
    const burst = 1 - clamp01(elapsed / 1.5);
    const settle = easeOutCubic(clamp01(elapsed / 0.24));
    const orbit = easeInOutCubic(clamp01((elapsed - 0.12) / 0.72));
    const sink = easeInCubic(clamp01((elapsed - 0.62) / 0.72));
    const startAngle = Math.atan2(scoredBallStartZ - G.holePos.z, scoredBallStartX - G.holePos.x);
    const startRadius = Math.max(Math.hypot(scoredBallStartX - G.holePos.x, scoredBallStartZ - G.holePos.z), 0.14);
    const settleRadius = THREE.MathUtils.lerp(startRadius, 0.24, settle);
    const orbitRadius = THREE.MathUtils.lerp(settleRadius, 0.018, orbit);
    const orbitAngle = startAngle + orbit * Math.PI * 2.35;
    const scoreX = elapsed < 0.24
      ? THREE.MathUtils.lerp(scoredBallStartX, G.holePos.x + Math.cos(startAngle) * 0.24, settle)
      : G.holePos.x + Math.cos(orbitAngle) * orbitRadius;
    const scoreZ = elapsed < 0.24
      ? THREE.MathUtils.lerp(scoredBallStartZ, G.holePos.z + Math.sin(startAngle) * 0.24, settle)
      : G.holePos.z + Math.sin(orbitAngle) * orbitRadius;
    const hopHeight = Math.sin(Math.min(elapsed / 0.24, 1) * Math.PI) * 0.18;
    const spiralLift = (1 - orbit) * 0.08;
    const scoreY = BALL_R + hopHeight + spiralLift - sink * 0.95;
    const squash = Math.sin(Math.min(elapsed / 0.22, 1) * Math.PI) * 0.18;
    const sinkScale = 1 - sink * 0.82;

    G.ball.x = scoreX;
    G.ball.z = scoreZ;
    G.ballMesh.position.set(scoreX, scoreY, scoreZ);
    G.ballMesh.rotation.y += 0.18 + (1 - sink) * 0.08;
    G.ballMesh.rotation.z += 0.11;
    G.ballMesh.scale.set(
      (1 + squash * 0.35) * sinkScale,
      (1 - squash * 0.25) * sinkScale,
      (1 + squash * 0.35) * sinkScale,
    );
    G.ballShadow.position.set(scoreX, 0.005, scoreZ);
    G.ballShadow.visible = scoreY > -0.02;

    G.sparkles.forEach((s, i) => {
      s.visible = true;
      const angle = t * 1.4 + (i / G.sparkles.length) * Math.PI * 2;
      const r = 0.55 + burst * 0.95 + Math.sin(t * 2.2 + i * 0.7) * 0.18;
      const yBounce = 0.25 + Math.abs(Math.sin(t * 3.4 + i * 0.8)) * (0.6 + burst * 0.8);
      s.position.set(G.holePos.x + Math.cos(angle) * r, yBounce, G.holePos.z + Math.sin(angle) * r);
      const hue = ((i / G.sparkles.length) + t * 0.06) % 1;
      s.material.color.setHSL(hue, 0.95, 0.68);
      s.material.opacity = (0.35 + Math.sin(t * 4 + i) * 0.25) * (0.45 + burst);
      s.scale.setScalar(0.55 + burst * 0.6 + Math.sin(t * 5 + i * 2) * 0.18);
    });
    G.starSparkles.forEach((s, i) => {
      s.visible = true;
      const angle = -t * 0.9 + (i / G.starSparkles.length) * Math.PI * 2;
      const r = 0.95 + burst * 1.3 + Math.sin(t * 1.7 + i) * 0.22;
      s.position.set(G.holePos.x + Math.cos(angle) * r, 0.6 + burst * 0.85 + Math.sin(t * 2.5 + i * 1.2) * 0.35, G.holePos.z + Math.sin(angle) * r);
      s.rotation.z = t * 2.4 + i;
      s.scale.setScalar(0.5 + burst * 0.55 + Math.sin(t * 3 + i) * 0.2);
      s.material.opacity = 0.3 + burst * 0.6;
    });

    if (G.activeEffect === 'aurora_trail' && G.scoreAuroraRibbons) {
      const auroraStrength = Math.sin(clamp01(elapsed / 0.2) * Math.PI * 0.5) * (1 - clamp01((elapsed - 0.95) / 0.55));
      if (G.scoreAuroraGlow) {
        G.scoreAuroraGlow.visible = true;
        G.scoreAuroraGlow.position.set(G.holePos.x, 0.012, G.holePos.z);
        G.scoreAuroraGlow.scale.setScalar(0.9 + auroraStrength * 0.9 + Math.sin(t * 1.6) * 0.08);
        G.scoreAuroraGlowMat.opacity = auroraStrength * 0.32;
        G.scoreAuroraGlowMat.color.setHSL(0.44 + Math.sin(t * 0.25) * 0.05, 0.9, 0.62);
      }
      if (G.scoreAuroraRing) {
        G.scoreAuroraRing.visible = true;
        G.scoreAuroraRing.position.set(G.holePos.x, 0.018, G.holePos.z);
        G.scoreAuroraRing.scale.setScalar(0.95 + auroraStrength * 0.75);
        G.scoreAuroraRing.rotation.z = t * 0.22;
        G.scoreAuroraRingMat.opacity = auroraStrength * 0.45;
        G.scoreAuroraRingMat.color.setHSL(0.73 + Math.sin(t * 0.4) * 0.05, 0.85, 0.68);
      }
      G.scoreAuroraRibbons.forEach((ribbon, i) => {
        ribbon.mesh.visible = true;
        const angle = t * 0.45 + ribbon.phase;
        const radius = 0.5 + Math.sin(t * 1.3 + i) * 0.08;
        const height = 1.15 + Math.sin(t * 2.3 + i * 1.4) * 0.32;
        ribbon.mesh.position.set(
          G.holePos.x + Math.cos(angle) * radius,
          0.75 + height * 0.35,
          G.holePos.z + Math.sin(angle) * radius,
        );
        ribbon.mesh.lookAt(G.camera.position.x, ribbon.mesh.position.y + 0.1, G.camera.position.z);
        ribbon.mesh.rotation.z += Math.sin(t * 2.1 + i) * 0.08;
        ribbon.mesh.scale.set(1 + Math.sin(t * 1.7 + i) * 0.22, 0.85 + auroraStrength * 0.95, 1);
        ribbon.mat.opacity = auroraStrength * (0.24 + Math.sin(t * 1.9 + i) * 0.08);
        ribbon.mat.color.setHSL((0.42 + i * 0.07 + Math.sin(t * 0.6 + i) * 0.03) % 1, 0.9, 0.64);
      });
    } else {
      if (G.scoreAuroraGlow) {
        G.scoreAuroraGlow.visible = false;
        G.scoreAuroraGlowMat.opacity = 0;
      }
      if (G.scoreAuroraRing) {
        G.scoreAuroraRing.visible = false;
        G.scoreAuroraRingMat.opacity = 0;
      }
      if (G.scoreAuroraRibbons) {
        G.scoreAuroraRibbons.forEach(ribbon => {
          ribbon.mesh.visible = false;
          ribbon.mat.opacity = 0;
        });
      }
    }
  } else {
    G.sparkles.forEach(s => s.visible = false);
    G.starSparkles.forEach(s => s.visible = false);
    if (G.scoreAuroraGlow) {
      G.scoreAuroraGlow.visible = false;
      G.scoreAuroraGlowMat.opacity = 0;
    }
    if (G.scoreAuroraRing) {
      G.scoreAuroraRing.visible = false;
      G.scoreAuroraRingMat.opacity = 0;
    }
    if (G.scoreAuroraRibbons) {
      G.scoreAuroraRibbons.forEach(ribbon => {
        ribbon.mesh.visible = false;
        ribbon.mat.opacity = 0;
      });
    }
    G.ballMesh.scale.set(1, 1, 1);
    G.ballShadow.visible = true;
  }
}

// ---- Main Loop ----
let frameCount = 0;
const camTarget = new THREE.Vector3(CW / 2, 0, CH / 2 - 1);
const camLookTarget = new THREE.Vector3(CW / 2, 0, CH / 2 - 1);

function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.001;
  const ball = G.ball;

  updateBall();
  updateClubSwing();
  updateAimVisuals();
  updateSparkles();

  // ---- Animate floating particles ----
  const ppos = G.particles.geometry.attributes.position.array;
  const particleCount = G.particleData.length;
  for (let i = 0; i < particleCount; i++) {
    const pd = G.particleData[i];
    ppos[i * 3] += pd.vx + Math.sin(time * 0.5 + pd.phase) * 0.002;
    ppos[i * 3 + 1] += pd.vy + Math.sin(time * 0.3 + pd.phase * 2) * 0.001;
    ppos[i * 3 + 2] += pd.vz + Math.cos(time * 0.4 + pd.phase) * 0.002;
    if (ppos[i * 3] < -15) ppos[i * 3] = CW + 15;
    if (ppos[i * 3] > CW + 15) ppos[i * 3] = -15;
    if (ppos[i * 3 + 1] < 0.3) ppos[i * 3 + 1] = 6;
    if (ppos[i * 3 + 1] > 7) ppos[i * 3 + 1] = 0.5;
    if (ppos[i * 3 + 2] < -15) ppos[i * 3 + 2] = CH + 15;
    if (ppos[i * 3 + 2] > CH + 15) ppos[i * 3 + 2] = -15;
  }
  G.particles.geometry.attributes.position.needsUpdate = true;
  G.particleMat.opacity = 0.3 + Math.sin(time * 0.7) * 0.15;

  // ---- Fireflies ----
  G.fireflies.forEach(ff => {
    const t2 = time * ff.speed + ff.phase;
    ff.mesh.position.x = ff.baseX + Math.sin(t2 * 0.7) * ff.driftRadius;
    ff.mesh.position.y = ff.baseY + Math.sin(t2 * 0.5 + 1) * 0.8;
    ff.mesh.position.z = ff.baseZ + Math.cos(t2 * 0.6 + 2) * ff.driftRadius * 0.7;
    const pulse = Math.sin(time * ff.pulseSpeed + ff.pulsePhase);
    const glow = pulse > 0.2 ? (pulse - 0.2) * 1.25 * ff.brightness : 0;
    ff.mat.opacity = glow;
    ff.glowMat.opacity = glow * 0.35;
  });

  // ---- Dandelion seeds ----
  G.dandelionSeeds.forEach(ds => {
    const m = ds.mesh;
    m.position.x += ds.vx + Math.sin(time * 0.3 + ds.phase) * 0.003;
    m.position.y += ds.vy + Math.sin(time * 0.2 + ds.phase * 2) * 0.001;
    m.position.z += ds.vz + Math.cos(time * 0.25 + ds.phase) * 0.003;
    m.rotation.y += ds.rotSpeed;
    m.rotation.x = Math.sin(time * 0.4 + ds.phase) * 0.3;
    if (m.position.x < -8) m.position.x = CW + 8;
    if (m.position.x > CW + 8) m.position.x = -8;
    if (m.position.y < 0.5) m.position.y = 5;
    if (m.position.y > 7) m.position.y = 1;
    if (m.position.z < -8) m.position.z = CH + 8;
    if (m.position.z > CH + 8) m.position.z = -8;
  });

  // ---- Shooting stars ----
  G.shootingStars.forEach(ss => {
    if (!ss.active) {
      ss.nextTime -= 0.016;
      if (ss.nextTime <= 0) {
        ss.active = true;
        ss.progress = 0;
        ss.duration = 0.5 + Math.random() * 0.8;
        ss.tailLen = 8 + Math.random() * 12;
        const angle = Math.random() * Math.PI * 2;
        const elev = 40 + Math.random() * 30;
        const dist2 = 60 + Math.random() * 40;
        ss.startX = CW / 2 + Math.cos(angle) * dist2;
        ss.startY = elev;
        ss.startZ = CH / 2 + Math.sin(angle) * dist2;
        const da = angle + Math.PI * 0.6 + (Math.random() - 0.5) * 0.8;
        ss.dirX = Math.cos(da) * 80;
        ss.dirY = -20 - Math.random() * 30;
        ss.dirZ = Math.sin(da) * 80;
      }
    } else {
      ss.progress += 0.016 / ss.duration;
      if (ss.progress >= 1) {
        ss.active = false;
        ss.nextTime = 8 + Math.random() * 25;
        ss.mat.opacity = 0;
        ss.headMat.opacity = 0;
      } else {
        const p = ss.progress;
        const headX = ss.startX + ss.dirX * p;
        const headY = ss.startY + ss.dirY * p;
        const headZ = ss.startZ + ss.dirZ * p;
        const tailP = Math.max(0, p - 0.15);
        const tailX = ss.startX + ss.dirX * tailP;
        const tailY = ss.startY + ss.dirY * tailP;
        const tailZ = ss.startZ + ss.dirZ * tailP;
        const pos = ss.line.geometry.attributes.position.array;
        pos[0] = headX; pos[1] = headY; pos[2] = headZ;
        pos[3] = tailX; pos[4] = tailY; pos[5] = tailZ;
        ss.line.geometry.attributes.position.needsUpdate = true;
        const fade = p < 0.2 ? p / 0.2 : (1 - p) / 0.8;
        ss.mat.opacity = fade * 0.7;
        ss.headMesh.position.set(headX, headY, headZ);
        ss.headMat.opacity = fade * 0.5;
      }
    }
  });

  // ---- Ground glow spots ----
  G.groundGlows.forEach(gg => {
    const pulse = (Math.sin(time * gg.speed + gg.phase) + 1) * 0.5;
    gg.mat.opacity = pulse * gg.maxOpacity;
  });

  // ---- Breathing ambient light ----
  const breathe = Math.sin(time * 0.4) * 0.08;
  const baseAmbient = G.activeBiome ? G.activeBiome.ambientIntensity : 0.3;
  G.ambientLight.intensity = baseAmbient + breathe;

  // ---- Ball trail ----
  const ballSpeed = Math.sqrt(ball.vx ** 2 + ball.vz ** 2);
  const trailCount = G.trailMeshes.length;
  if (G.gamePhase === 'rolling' && ballSpeed > 0.02) {
    for (let i = trailCount - 1; i > 0; i--) {
      G.trailPositions[i].x = G.trailPositions[i - 1].x;
      G.trailPositions[i].z = G.trailPositions[i - 1].z;
    }
    G.trailPositions[0].x = ball.x;
    G.trailPositions[0].z = ball.z;
    const trailIntensity = Math.min(ballSpeed * 5, 1);
    for (let i = 0; i < trailCount; i++) {
      G.trailMeshes[i].visible = true;
      G.trailMeshes[i].position.set(G.trailPositions[i].x, BALL_R * 0.5, G.trailPositions[i].z);
      G.trailMeshes[i].material.opacity = 0.25 * (1 - i / trailCount) * trailIntensity;

      if (G.activeEffect === 'rainbow_trail') {
        const hue = ((time * 0.5 + i * 0.08) % 1);
        G.trailMeshes[i].material.color.setHSL(hue, 0.9, 0.6);
        G.trailMeshes[i].material.opacity = 0.4 * (1 - i / trailCount) * trailIntensity;
      } else if (G.activeEffect === 'comet_trail') {
        const heat = 1 - i / trailCount;
        G.trailMeshes[i].material.color.setHSL(0.07 - heat * 0.04, 1.0, 0.4 + heat * 0.3);
        G.trailMeshes[i].material.opacity = 0.5 * heat * trailIntensity;
        G.trailMeshes[i].scale.setScalar(1 + heat * 0.8);
      } else if (G.activeEffect === 'aurora_trail') {
        const hue = ((time * 0.3 + i * 0.12) % 1) * 0.4 + 0.45;
        G.trailMeshes[i].material.color.setHSL(hue, 0.8, 0.5);
        G.trailMeshes[i].material.opacity = 0.35 * (1 - i / trailCount) * trailIntensity;
        G.trailMeshes[i].scale.setScalar(1 + Math.sin(time * 3 + i * 0.5) * 0.3);
      } else if (G.activeEffect === 'phoenix_trail') {
        const flame = 1 - i / trailCount;
        const flicker = Math.sin(time * 8 + i * 1.5) * 0.15;
        G.trailMeshes[i].material.color.setHSL(0.05 + flame * 0.08 + flicker * 0.02, 1.0, 0.35 + flame * 0.35);
        G.trailMeshes[i].material.opacity = 0.55 * flame * trailIntensity;
        G.trailMeshes[i].scale.setScalar(1 + flame * 1.2 + flicker);
      } else if (G.activeEffect === 'snowflake_trail') {
        G.trailMeshes[i].material.color.setHSL(0.55, 0.3, 0.8 + Math.sin(time * 4 + i) * 0.1);
        G.trailMeshes[i].material.opacity = 0.35 * (1 - i / trailCount) * trailIntensity;
        G.trailMeshes[i].scale.setScalar(0.8 + Math.sin(time * 5 + i * 0.8) * 0.4);
      } else if (G.activeEffect === 'sakura_trail') {
        const pink = 0.95 + Math.sin(time * 2 + i * 0.5) * 0.03;
        G.trailMeshes[i].material.color.setHSL(pink, 0.6, 0.75);
        G.trailMeshes[i].material.opacity = 0.4 * (1 - i / trailCount) * trailIntensity;
        G.trailMeshes[i].scale.setScalar(0.7 + Math.sin(time * 3 + i * 1.2) * 0.5);
        G.trailMeshes[i].position.y = BALL_R * 0.5 + Math.sin(time * 2.5 + i * 0.7) * 0.2;
      } else if (G.activeEffect === 'electric_trail') {
        const spark = Math.random() > 0.5 ? 1.0 : 0.4;
        G.trailMeshes[i].material.color.setHSL(0.6, 0.9, 0.5 + spark * 0.3);
        G.trailMeshes[i].material.opacity = 0.45 * (1 - i / trailCount) * trailIntensity * spark;
        G.trailMeshes[i].scale.setScalar(0.6 + spark * 0.8);
      } else if (G.activeEffect === 'prism_trail') {
        const hue = ((i * 0.15 + time * 0.4) % 1);
        G.trailMeshes[i].material.color.setHSL(hue, 1.0, 0.65);
        G.trailMeshes[i].material.opacity = 0.5 * (1 - i / trailCount) * trailIntensity;
        const sc = 0.5 + (1 - i / trailCount) * 0.8 + Math.sin(time * 6 + i * 2) * 0.2;
        G.trailMeshes[i].scale.setScalar(sc);
      } else if (G.activeEffect === 'dragon_trail') {
        const flame = 1 - i / trailCount;
        const breath = Math.sin(time * 6 + i * 1.0) * 0.2;
        G.trailMeshes[i].material.color.setHSL(0.02 + flame * 0.1 + breath * 0.03, 1.0, 0.3 + flame * 0.4);
        G.trailMeshes[i].material.opacity = 0.6 * flame * trailIntensity;
        G.trailMeshes[i].scale.setScalar(1.2 + flame * 1.5 + breath);
      } else if (G.activeEffect === 'ember_trail') {
        const ember = 1 - i / trailCount;
        const drift = Math.sin(time * 4 + i * 2.0) * 0.1;
        G.trailMeshes[i].material.color.setHSL(0.06 + ember * 0.04 + drift * 0.02, 0.9, 0.3 + ember * 0.3);
        G.trailMeshes[i].material.opacity = 0.45 * ember * trailIntensity;
        G.trailMeshes[i].scale.setScalar(0.7 + ember * 0.6 + drift);
        G.trailMeshes[i].position.y = BALL_R * 0.5 + Math.sin(time * 3 + i * 0.9) * 0.15;
      } else if (G.activeEffect === 'royal_trail') {
        const royal = 1 - i / trailCount;
        const shimmer = Math.sin(time * 2.6 + i * 0.9) * 0.08;
        G.trailMeshes[i].material.color.setHSL(0.58 + royal * 0.06 + shimmer * 0.03, 0.7, 0.55 + royal * 0.15);
        G.trailMeshes[i].material.opacity = 0.5 * royal * trailIntensity;
        G.trailMeshes[i].scale.setScalar(0.75 + royal * 0.75 + shimmer);
      } else if (G.activeEffect === 'silver_trail') {
        const silver = 1 - i / trailCount;
        const glint = Math.sin(time * 6 + i * 1.2) * 0.06;
        G.trailMeshes[i].material.color.setHSL(0.58, 0.12, 0.82 + silver * 0.12 + glint);
        G.trailMeshes[i].material.opacity = 0.45 * silver * trailIntensity;
        G.trailMeshes[i].scale.setScalar(0.7 + silver * 0.7 + glint);
      } else {
        G.trailMeshes[i].material.color.setHex(0xffffff);
        G.trailMeshes[i].scale.setScalar(1);
      }
    }
  } else {
    G.trailMeshes.forEach(t => { t.visible = false; t.scale.setScalar(1); });
  }

  // ---- Shop: Stardust/Firefly/Music/Heart/Celestial Aura ----
  if (G.activeEffect === 'stardust_aura' || G.activeEffect === 'firefly_aura' || G.activeEffect === 'music_notes' || G.activeEffect === 'heart_aura' || G.activeEffect === 'celestial_aura') {
    G.stardustParticles.forEach((sp, i) => {
      sp.mesh.visible = true;
      let a, r, hue, opacity;
      if (G.activeEffect === 'firefly_aura') {
        a = time * 1.5 + sp.phase;
        r = 0.6 + Math.sin(time * 0.8 + sp.phase) * 0.25;
        hue = 0.17 + Math.sin(time + sp.phase) * 0.03;
        opacity = Math.sin(time * 3 + sp.phase) > 0.2 ? 0.5 : 0.05;
      } else if (G.activeEffect === 'music_notes') {
        a = time * 2.0 + sp.phase;
        r = 0.55 + Math.sin(time * 1.2 + sp.phase) * 0.2;
        hue = (i * 0.12 + time * 0.15) % 1;
        opacity = 0.35 + Math.sin(time * 5 + sp.phase) * 0.25;
      } else if (G.activeEffect === 'heart_aura') {
        a = time * 1.8 + sp.phase;
        r = 0.4 + Math.sin(time * 1.0 + sp.phase) * 0.15;
        hue = 0.95 + Math.sin(time * 0.5 + sp.phase) * 0.03;
        opacity = 0.45 + Math.sin(time * 2 + sp.phase) * 0.2;
      } else if (G.activeEffect === 'celestial_aura') {
        a = time * 1.2 + sp.phase;
        r = 0.7 + Math.sin(time * 0.6 + sp.phase) * 0.3;
        hue = (0.15 + i * 0.07 + time * 0.05) % 1;
        opacity = 0.4 + Math.sin(time * 1.5 + sp.phase) * 0.25;
      } else {
        a = time * 2.5 + sp.phase;
        r = 0.5 + Math.sin(time * 1.5 + sp.phase) * 0.15;
        hue = (time * 0.1 + i * 0.08) % 1;
        opacity = 0.4 + Math.sin(time * 4 + sp.phase) * 0.3;
      }
      sp.mesh.position.set(ball.x + Math.cos(a) * r, BALL_R + Math.sin(a * 1.3 + sp.phase) * 0.3, ball.z + Math.sin(a) * r);
      sp.mat.opacity = opacity;
      sp.mat.color.setHSL(hue, 0.7, 0.7);
    });
  }

  // ---- Shop: Neon Glow ----
  if (G.activeEffect === 'neon_glow' && G.neonGlowMesh.visible) {
    G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
    const np = 0.6 + Math.sin(time * 2.0) * 0.2;
    G.neonGlowMat.opacity = np * 0.12;
    G.neonGlowMesh.scale.setScalar(0.8 + np * 0.4);
    const nh = (time * 0.05) % 1;
    G.neonGlowMat.color.setHSL(nh * 0.3 + 0.7, 0.8, 0.5);
  }

  // ---- Shop: Crystal Ball ----
  if (G.activeEffect === 'crystal_ball') {
    const cp = 0.5 + Math.sin(time * 1.5) * 0.3;
    G.ballMat.emissiveIntensity = 0.2 + cp * 0.2;
    G.ballMat.opacity = 0.5 + cp * 0.15;
    G.ballMat.iridescence = 0.2 + cp * 0.2;
    G.ballMat.sheenColor.setHSL(0.55 + Math.sin(time * 0.8) * 0.05, 0.4, 0.8);
  }

  // ---- Shop: Golden Ball ----
  if (G.activeEffect === 'golden_ball') {
    const gp = 0.5 + Math.sin(time * 2.0) * 0.3;
    G.ballMat.emissiveIntensity = 0.12 + gp * 0.15;
    G.ballMat.envMapIntensity = 1.2 + gp * 0.4;
    G.ballMat.sheenColor.setHSL(0.12 + Math.sin(time * 1.2) * 0.02, 0.6, 0.7 + gp * 0.15);
  }

  // ---- Shop: Pulse Glow ----
  if (G.activeEffect === 'pulse_glow' && G.neonGlowMesh.visible) {
    G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
    const pp = Math.sin(time * 3.0) * 0.5 + 0.5;
    G.neonGlowMat.opacity = pp * 0.18;
    G.neonGlowMesh.scale.setScalar(0.6 + pp * 0.8);
  }

  // ---- Shop: Lava Ball ----
  if (G.activeEffect === 'lava_ball') {
    const lp = 0.5 + Math.sin(time * 2.5) * 0.3;
    G.ballMat.emissiveIntensity = 0.55 + lp * 0.4;
    const lavaHue = 0.02 + Math.sin(time * 1.5) * 0.02;
    G.ballMat.emissive.setHSL(lavaHue, 1.0, 0.35 + lp * 0.1);
    if (G.neonGlowMesh.visible) {
      G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
      G.neonGlowMat.opacity = lp * 0.16;
      G.neonGlowMesh.scale.setScalar(0.7 + lp * 0.5);
    }
  }

  // ---- Shop: Ice Ball ----
  if (G.activeEffect === 'ice_ball') {
    const ip = 0.5 + Math.sin(time * 1.8) * 0.3;
    G.ballMat.emissiveIntensity = 0.18 + ip * 0.2;
    G.ballMat.iridescence = 0.1 + ip * 0.1;
    G.ballMat.sheenColor.setHSL(0.55, 0.5, 0.8 + ip * 0.1);
  }

  // ---- Shop: Bubble Ball ----
  if (G.activeEffect === 'bubble_ball') {
    const bh = (time * 0.08) % 1;
    G.ballMat.emissive.setHSL(bh, 0.4, 0.3);
    G.ballMat.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.08;
    G.ballMat.iridescenceIOR = 1.6 + Math.sin(time * 0.7) * 0.3;
    G.ballMat.sheenColor.setHSL(bh, 0.5, 0.8);
  }

  // ---- Shop: Void Ball ----
  if (G.activeEffect === 'void_ball' && G.neonGlowMesh.visible) {
    G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
    const vp = 0.5 + Math.sin(time * 1.5) * 0.3;
    G.neonGlowMat.opacity = vp * 0.15;
    G.neonGlowMesh.scale.setScalar(0.9 + Math.sin(time * 2) * 0.4);
    G.ballMat.emissiveIntensity = 0.25 + Math.sin(time * 3) * 0.15;
    G.ballMat.iridescence = 0.2 + Math.sin(time * 1.2) * 0.15;
    G.ballMat.sheenColor.setHSL(0.75 + Math.sin(time * 0.6) * 0.05, 0.6, 0.5);
  }

  // ---- Shop: Lightning Ball ----
  if (G.activeEffect === 'lightning_ball') {
    const lk = Math.random() > 0.85 ? 1.0 : 0.4;
    G.ballMat.emissiveIntensity = 0.35 + lk * 0.4;
    G.ballMat.envMapIntensity = 1.0 + lk * 0.5;
    if (G.neonGlowMesh.visible) {
      G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
      G.neonGlowMat.opacity = lk * 0.2;
      G.neonGlowMesh.scale.setScalar(0.8 + lk * 0.7);
    }
  }

  // ---- Shop: Eclipse Ball ----
  if (G.activeEffect === 'eclipse_ball' && G.neonGlowMesh.visible) {
    G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
    const ep = 0.5 + Math.sin(time * 1.2) * 0.3;
    G.neonGlowMat.opacity = ep * 0.18;
    G.neonGlowMesh.scale.setScalar(1.0 + ep * 0.6);
    G.ballMat.sheenColor.setHSL(0.06 + Math.sin(time * 0.8) * 0.02, 0.8, 0.5 + ep * 0.15);
  }

  // ---- Shop: Diamond Ball ----
  if (G.activeEffect === 'diamond_ball') {
    const dp = Math.sin(time * 3) * 0.5 + 0.5;
    G.ballMat.emissiveIntensity = 0.2 + dp * 0.2;
    const dh = (time * 0.06) % 1;
    G.ballMat.emissive.setHSL(dh, 0.3, 0.5);
    G.ballMat.iridescenceIOR = 2.2 + Math.sin(time * 1.5) * 0.3;
    G.ballMat.envMapIntensity = 1.6 + dp * 0.6;
  }

  // ---- Shop: Holo Ball ----
  if (G.activeEffect === 'holo_ball') {
    const hp = Math.sin(time * 2.0) * 0.5 + 0.5;
    G.ballMat.emissiveIntensity = 0.2 + hp * 0.2;
    G.ballMat.iridescenceIOR = 1.8 + Math.sin(time * 0.9) * 0.4;
    G.ballMat.sheenColor.setHSL((time * 0.1) % 1, 0.7, 0.7);
    G.ballMat.emissive.setHSL((time * 0.08 + 0.5) % 1, 0.5, 0.35);
  }

  // ---- Shop: Nebula Ball ----
  if (G.activeEffect === 'nebula_ball') {
    const np2 = Math.sin(time * 1.5) * 0.5 + 0.5;
    G.ballMat.emissiveIntensity = 0.25 + np2 * 0.2;
    G.ballMat.emissive.setHSL(0.75 + Math.sin(time * 0.5) * 0.08, 0.7, 0.35 + np2 * 0.1);
    G.ballMat.sheenColor.setHSL(0.8 + Math.sin(time * 0.7) * 0.05, 0.6, 0.7);
    G.ballMat.iridescence = 0.2 + np2 * 0.2;
  }

  // ---- Shop: Starfield Ball ----
  if (G.activeEffect === 'starfield_ball') {
    const sf = Math.sin(time * 2.5) * 0.5 + 0.5;
    G.ballMat.emissiveIntensity = 0.2 + sf * 0.2 + (Math.random() > 0.92 ? 0.15 : 0);
    if (G.neonGlowMesh.visible) {
      G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
      G.neonGlowMat.opacity = sf * 0.1;
      G.neonGlowMesh.scale.setScalar(0.8 + sf * 0.3);
    }
  }

  // ---- Shop: Aurora Ball ----
  if (G.activeEffect === 'aurora_ball') {
    const ab = Math.sin(time * 1.2) * 0.5 + 0.5;
    G.ballMat.emissiveIntensity = 0.2 + ab * 0.2;
    G.ballMat.emissive.setHSL(0.42 + Math.sin(time * 0.4) * 0.08, 0.7, 0.35 + ab * 0.1);
    G.ballMat.iridescence = 0.3 + ab * 0.2;
    G.ballMat.sheenColor.setHSL(0.42 + Math.sin(time * 0.6) * 0.06, 0.5, 0.7 + ab * 0.1);
  }

  // ---- Shop: Obsidian Ball ----
  if (G.activeEffect === 'obsidian_ball') {
    const ob = Math.sin(time * 1.8) * 0.5 + 0.5;
    G.ballMat.emissiveIntensity = 0.18 + ob * 0.15;
    if (G.neonGlowMesh.visible) {
      G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
      G.neonGlowMat.opacity = ob * 0.12;
      G.neonGlowMesh.scale.setScalar(0.7 + ob * 0.4);
    }
  }

  // ---- Shop: Pearl Ball ----
  if (G.activeEffect === 'pearl_ball') {
    const pp2 = Math.sin(time * 1.2) * 0.5 + 0.5;
    G.ballMat.iridescenceIOR = 1.6 + Math.sin(time * 0.7) * 0.3;
    G.ballMat.sheenColor.setHSL((time * 0.04) % 1, 0.3, 0.85 + pp2 * 0.1);
  }

  // ---- Shop: Sun Glow ----
  if (G.activeEffect === 'sun_glow') {
    const sg = Math.sin(time * 1.5) * 0.5 + 0.5;
    G.ballMat.emissiveIntensity = 0.2 + sg * 0.15;
    if (G.neonGlowMesh.visible) {
      G.neonGlowMesh.position.set(ball.x, 0.008, ball.z);
      G.neonGlowMat.opacity = sg * 0.1;
      G.neonGlowMesh.scale.setScalar(0.8 + sg * 0.4);
    }
  }

  // ---- Shop: Moonstone Ball ----
  if (G.activeEffect === 'moonstone_ball') {
    const ms = Math.sin(time * 1.0) * 0.5 + 0.5;
    G.ballMat.iridescence = 0.35 + ms * 0.25;
    G.ballMat.sheenColor.setHSL(0.6 + Math.sin(time * 0.5) * 0.06, 0.4, 0.8 + ms * 0.1);
  }

  // ---- Animate flag wave ----
  if (G.flagMeshRef) {
    const geo = G.flagMeshRef.geometry;
    const positions = geo.attributes.position;
    if (!G.flagMeshRef.userData.origPositions) {
      G.flagMeshRef.userData.origPositions = positions.array.slice();
    }
    const orig = G.flagMeshRef.userData.origPositions;
    for (let i = 0; i < positions.count; i++) {
      const ox = orig[i * 3];
      const wave = Math.sin(time * 4 + ox * 6) * 0.04 * ox;
      positions.setZ(i, orig[i * 3 + 2] + wave);
    }
    positions.needsUpdate = true;
  }

  // ---- Animate water ----
  G.waterMeshRefs.forEach((wm, wi) => {
    wm.material.opacity = 0.45 + Math.sin(time * 1.5 + wi * 2) * 0.08;
    wm.position.y = -0.01 + Math.sin(time * 0.8 + wi) * 0.008;
  });

  // ---- Animate fish ----
  const audioCtx = getAudioCtx();
  const sfxGain = getSfxGain();
  G.fishList.forEach(fish => {
    const t2 = time + fish.phaseOffset;
    const timeSinceLastJump = time - fish.lastJump;
    if (fish.jumpTime < 0 && timeSinceLastJump > fish.jumpInterval) {
      fish.jumpTime = time;
      fish.lastJump = time;
      if (audioCtx) {
        const now = audioCtx.currentTime;
        const bufSize = Math.floor(audioCtx.sampleRate * 0.15);
        const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          const st = i / audioCtx.sampleRate;
          d[i] = (Math.random() * 2 - 1) * Math.exp(-st * 20) * 0.15;
        }
        const s = audioCtx.createBufferSource();
        s.buffer = buf;
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 3000;
        s.connect(lp); lp.connect(sfxGain);
        s.start(now);
      }
    }

    const isJumping = fish.jumpTime >= 0;
    let jumpProgress = 0;
    if (isJumping) {
      jumpProgress = (time - fish.jumpTime) / fish.jumpDuration;
      if (jumpProgress >= 1) {
        fish.jumpTime = -1;
        jumpProgress = 0;
        let spawned = 0;
        for (const sp of G.splashParticles) {
          if (!sp.active && spawned < 5) {
            sp.active = true;
            sp.mesh.visible = true;
            sp.mesh.position.copy(fish.mesh.position);
            sp.mesh.position.y = 0.05;
            const sa = Math.random() * Math.PI * 2;
            const sv = 0.02 + Math.random() * 0.03;
            sp.vx = Math.cos(sa) * sv;
            sp.vy = 0.04 + Math.random() * 0.04;
            sp.vz = Math.sin(sa) * sv;
            sp.life = 0.6 + Math.random() * 0.3;
            spawned++;
          }
        }
      }
    }

    const swimX = fish.pondX + Math.cos(t2 * fish.speed) * fish.swimRadius;
    const swimZ = fish.pondZ + Math.sin(t2 * fish.speed * 0.7) * fish.swimRadius * 0.6;
    const dx = swimX - fish.mesh.position.x;
    const dz = swimZ - fish.mesh.position.z;
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      fish.mesh.rotation.y = Math.atan2(dx, dz);
    }
    fish.mesh.position.x = swimX;
    fish.mesh.position.z = swimZ;

    if (isJumping && jumpProgress < 1) {
      const jp = jumpProgress;
      const height = fish.jumpHeight * 4 * jp * (1 - jp);
      fish.mesh.position.y = -0.02 + height;
      fish.mesh.rotation.x = (0.5 - jp) * Math.PI * 0.6;
      fish.mesh.rotation.z = Math.sin(jp * Math.PI) * 0.3;
    } else {
      fish.mesh.position.y = -0.02 + Math.sin(t2 * 2) * 0.01;
      fish.mesh.rotation.x = 0;
      fish.mesh.rotation.z = 0;
    }

    const wagSpeed = isJumping ? 12 : 5;
    const wagAmount = isJumping ? 0.5 : 0.3;
    fish.tail.rotation.y = Math.PI / 2 + Math.sin(t2 * wagSpeed) * wagAmount;
  });

  // ---- Splash particles ----
  G.splashParticles.forEach(sp => {
    if (!sp.active) return;
    sp.mesh.position.x += sp.vx;
    sp.mesh.position.y += sp.vy;
    sp.mesh.position.z += sp.vz;
    sp.vy -= 0.002;
    sp.life -= 0.016;
    sp.mesh.material.opacity = Math.max(0, sp.life / 0.6) * 0.7;
    if (sp.life <= 0 || sp.mesh.position.y < -0.1) {
      sp.active = false;
      sp.mesh.visible = false;
    }
  });

  // ---- Animate secret crystal ----
  if (G.secretMesh && G.secretMesh.visible && G.secretData && !G.secretFound) {
    G.secretMesh.rotation.y = time * 1.5;
    G.secretMesh.rotation.x = Math.sin(time * 0.8) * 0.2;
    G.secretMesh.position.y = 0.35 + Math.sin(time * 2) * 0.12;
    const pulse = 0.3 + Math.sin(time * 3) * 0.25;
    G.secretMesh.material.emissiveIntensity = pulse;
    if (G.gamePhase === 'aiming' || G.gamePhase === 'rolling') {
      const dToCrystal = dist(ball.x, ball.z, G.secretData.crystal.x, G.secretData.crystal.z);
      if (dToCrystal < 5) {
        G.secretMesh.material.opacity = 0.5 + (1 - dToCrystal / 5) * 0.4;
      }
    }
  }

  // ---- Animate sparkle lights ----
  G.sparkleLights.forEach(sl => {
    if (sl.collected || !sl.mesh || !sl.mesh.visible) return;
    sl.mesh.position.y = 0.25 + Math.sin(time * 1.8 + sl.phase) * 0.08;
    sl.mesh.children[0].rotation.y = time * 2.0 + sl.phase;
    sl.mesh.children[0].rotation.x = Math.sin(time * 1.2 + sl.phase) * 0.15;
    const gp = 0.5 + Math.sin(time * 2.5 + sl.phase) * 0.35;
    sl.gemMat.emissiveIntensity = 0.4 + gp * 0.5;
    sl.haloMat.opacity = 0.08 + gp * 0.08;
    sl.mesh.children[1].scale.setScalar(0.8 + gp * 0.4);
    sl.mesh.children.forEach((child, ci) => {
      if (ci < 2) return;
      const oa = time * 3 + (child.userData.orbitPhase || 0) + sl.phase;
      child.position.set(Math.cos(oa) * 0.2, Math.sin(oa * 0.7) * 0.08, Math.sin(oa) * 0.2);
    });
  });

  // Animate rune targets
  if (G.secretData && G.secretData.type === 'pattern' && !G.secretFound) {
    G.secretTargetMeshes.forEach((rm, idx) => {
      if (G.secretData.targets[idx] && !G.secretData.targets[idx].hit) {
        rm.children.forEach(c => {
          if (c.geometry && c.geometry.type === 'TorusGeometry') {
            c.rotation.z = time * 0.5 + idx;
            c.material.opacity = 0.3 + Math.sin(time * 2 + idx * 1.5) * 0.15;
          }
        });
      }
    });
  }

  // ---- Animated Hazards ----
  G.hazardMeshRefs.forEach(h => {
    if (h.kind === 'water') {
      // Water ripple animation
      const rScale1 = 1 + Math.sin(time * 2.0) * 0.12;
      const rScale2 = 1 + Math.sin(time * 1.5 + 1) * 0.1;
      h.ripple.scale.set(rScale1, rScale1, 1);
      h.ripple2.scale.set(rScale2, rScale2, 1);
      h.ripple.material.opacity = 0.1 + Math.sin(time * 2.5) * 0.06;
      h.ripple2.material.opacity = 0.07 + Math.sin(time * 1.8 + 0.5) * 0.04;
      h.water.position.y = 0.01 + Math.sin(time * 1.2) * 0.003;
    } else if (h.kind === 'lava') {
      // Lava pulsing glow
      const lp = 0.5 + Math.sin(time * 2.0) * 0.3;
      h.lavaMat.emissiveIntensity = 0.4 + lp * 0.4;
      h.lavaMat.emissive.setHSL(0.04 + Math.sin(time * 1.5) * 0.02, 1.0, 0.3 + lp * 0.1);
      h.crustMat.opacity = 0.3 + lp * 0.3;
      h.crust.rotation.z = time * 0.3;
      h.glowMat.opacity = 0.08 + lp * 0.08;
      h.glow.scale.setScalar(1 + lp * 0.15);
    } else if (h.kind === 'mud') {
      // Mud bubbles rise and fall
      h.mudBubbles.forEach((b, i) => {
        const phase = time * 1.5 + i * 1.3;
        const pop = Math.sin(phase) * 0.5 + 0.5;
        b.mesh.position.y = b.baseY + pop * 0.06;
        b.mesh.scale.setScalar(0.5 + pop * 0.6);
        b.mesh.material.opacity = 0.3 + pop * 0.4;
      });
    } else if (h.kind === 'sand') {
      // Sand ripple shimmer
      h.sandRipples.forEach((r, i) => {
        r.rotation.z = time * 0.2 + i * 0.5;
        r.material.opacity = 0.5 + Math.sin(time * 1.5 + i) * 0.2;
      });
    } else if (h.kind === 'magnet') {
      // Magnet ring pulse and cap spin
      h.ring.rotation.z = time * 1.5;
      h.cap.rotation.z = time * 2.0;
      const mp = Math.sin(time * 3) * 0.5 + 0.5;
      h.ring.material.emissive = h.ring.material.emissive || new THREE.Color();
      h.ring.material.emissive.setHSL(0.0, 0.8, mp * 0.2);
      h.ring.material.emissiveIntensity = mp * 0.3;
    } else if (h.kind === 'gravity') {
      // Gravity well spirals spin + orb pulse
      h.spirals.forEach((s, i) => {
        s.rotation.z = time * (1.5 + i * 0.5);
        s.material.opacity = 0.15 + Math.sin(time * 2 + i) * 0.1;
      });
      h.orb.position.y = 0.2 + Math.sin(time * 2) * 0.05;
      h.orbMat.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.3;
    } else if (h.kind === 'low_gravity') {
      // Ring pulses scale, halo breathes, arrow bobs up/down
      const pulse = 1 + Math.sin(time * 2) * 0.08;
      h.ring.scale.set(pulse, 1, pulse);
      h.ringMat.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.3;
      h.haloMat.opacity = 0.08 + Math.sin(time * 1.5) * 0.04;
      h.arrow.position.y = 0.25 + Math.sin(time * 2.5) * 0.1;
      h.arrowMat.emissiveIntensity = 0.4 + Math.sin(time * 2) * 0.3;
    }
  });

  // ---- Boss Hole: Moving Target ----
  if (G.isBossHole && G.gamePhase !== 'scored' && G.gamePhase !== 'menu') {
    const bossSpeed = 0.8;
    const bossRadius = 2.5;
    G.holePos.x = G.bossHoleBaseX + Math.sin(time * bossSpeed) * bossRadius;
    G.holePos.z = G.bossHoleBaseZ + Math.cos(time * bossSpeed * 0.7) * bossRadius * 0.6;
    // Clamp to course bounds
    G.holePos.x = Math.max(HOLE_R + 1, Math.min(CW - HOLE_R - 1, G.holePos.x));
    G.holePos.z = Math.max(HOLE_R + 1, Math.min(CH - HOLE_R - 1, G.holePos.z));
    // Move hole meshes (the hole group is the 2nd child of course group typically)
    if (G.holeGroupRef) {
      G.holeGroupRef.position.x = G.holePos.x;
      G.holeGroupRef.position.z = G.holePos.z;
    }
  }

  if (G.viewMode === '2d') {
    G.camera.position.set(CW / 2, 60, CH / 2);
    G.camera.lookAt(CW / 2, 0, CH / 2);
    G.ballShadow.visible = false;
  } else {
    // Smooth camera
    if (G.gamePhase === 'rolling' || G.gamePhase === 'aiming' || G.gamePhase === 'powering') {
      camLookTarget.set(
        CW / 2 + (ball.x - CW / 2) * 0.15,
        0,
        CH / 2 - 1 + (ball.z - CH / 2) * 0.1
      );
    }
    camTarget.lerp(camLookTarget, 0.03);
    G.camera.lookAt(camTarget);
    G.ballShadow.visible = true;
  }

  // Keep sky dome centered
  G.skyDome.position.copy(G.camera.position);

  // Ball shadow
  G.ballShadow.material.opacity = G.ballMesh.visible ? 0.22 : 0;

  // Refresh env map occasionally
  frameCount++;
  if (frameCount % 180 === 1 && G.gamePhase !== 'rolling') {
    G.ballMesh.visible = false;
    G.cubeCamera.position.copy(G.ballMesh.position);
    G.cubeCamera.update(G.renderer, G.scene);
    G.ballMesh.visible = true;
  }

  G.renderer.render(G.scene, G.camera);
}

animate();
