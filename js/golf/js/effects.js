// Effects: ball effects, stardust/neon particles, coin/star utilities, secret toast
import * as THREE from 'three';
import G from './globals.js';
import { getAudioCtx, getSfxGain } from './audio.js';
import { BALL_R } from './scene.js';

export const originalBallColor = 0xfefefe;

export function initEffects() {
  const scene = G.scene;

  // Stardust aura particles
  G.stardustParticles = [];
  for (let i = 0; i < 12; i++) {
    const spGeo = new THREE.SphereGeometry(0.035, 6, 6);
    const spMat = new THREE.MeshBasicMaterial({
      color: 0xffee88, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const spMesh = new THREE.Mesh(spGeo, spMat);
    spMesh.visible = false;
    scene.add(spMesh);
    G.stardustParticles.push({ mesh: spMesh, mat: spMat, phase: (i / 12) * Math.PI * 2 });
  }

  // Neon glow under ball
  const neonGlowGeo = new THREE.CircleGeometry(1.0, 20);
  G.neonGlowMat = new THREE.MeshBasicMaterial({
    color: 0xaa55ff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  G.neonGlowMesh = new THREE.Mesh(neonGlowGeo, G.neonGlowMat);
  G.neonGlowMesh.rotation.x = -Math.PI / 2;
  G.neonGlowMesh.visible = false;
  scene.add(G.neonGlowMesh);

  // Score celebration aurora for the aurora trail item
  G.scoreAuroraRibbons = [];
  const ribbonColors = [0x3bf0ad, 0x44d9ff, 0x6f7bff, 0xe15dff, 0x8affd8, 0x6fc4ff];
  for (let i = 0; i < 6; i++) {
    const ribbonGeo = new THREE.PlaneGeometry(0.34, 2.4, 1, 1);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: ribbonColors[i % ribbonColors.length],
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.visible = false;
    scene.add(ribbonMesh);
    G.scoreAuroraRibbons.push({ mesh: ribbonMesh, mat: ribbonMat, phase: (i / 6) * Math.PI * 2 });
  }

  const auroraGlowGeo = new THREE.CircleGeometry(1.35, 40);
  G.scoreAuroraGlowMat = new THREE.MeshBasicMaterial({
    color: 0x59ffd4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  G.scoreAuroraGlow = new THREE.Mesh(auroraGlowGeo, G.scoreAuroraGlowMat);
  G.scoreAuroraGlow.rotation.x = -Math.PI / 2;
  G.scoreAuroraGlow.visible = false;
  scene.add(G.scoreAuroraGlow);

  const auroraRingGeo = new THREE.RingGeometry(0.62, 1.12, 48);
  G.scoreAuroraRingMat = new THREE.MeshBasicMaterial({
    color: 0x8d74ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  G.scoreAuroraRing = new THREE.Mesh(auroraRingGeo, G.scoreAuroraRingMat);
  G.scoreAuroraRing.rotation.x = -Math.PI / 2;
  G.scoreAuroraRing.visible = false;
  scene.add(G.scoreAuroraRing);
}

export function applyActiveEffect() {
  const ballMat = G.ballMat;
  // Reset to default
  ballMat.color.setHex(originalBallColor);
  ballMat.emissive.setHex(0x000000);
  ballMat.emissiveIntensity = 0;
  ballMat.opacity = 1.0;
  ballMat.transparent = false;
  ballMat.clearcoat = 1.0;
  ballMat.clearcoatRoughness = 0.03;
  ballMat.roughness = 0.05;
  ballMat.metalness = 0.0;
  ballMat.sheen = 0.3;
  ballMat.sheenRoughness = 0.25;
  ballMat.sheenColor.setHex(0xffffff);
  ballMat.envMapIntensity = 0.8;
  ballMat.iridescence = 0;
  ballMat.iridescenceIOR = 1.3;
  ballMat.iridescenceThicknessRange = [100, 400];
  G.neonGlowMesh.visible = false;
  G.neonGlowMat.color.setHex(0xaa55ff);
  G.stardustParticles.forEach(sp => { sp.mesh.visible = false; sp.mat.opacity = 0; });
  G.trailMeshes.forEach(t => { t.material.color.setHex(0xffffff); });
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

  if (!G.activeEffect) return;

  switch (G.activeEffect) {
    case 'golden_ball':
      ballMat.color.setHex(0xffd700); ballMat.emissive.setHex(0x996600); ballMat.emissiveIntensity = 0.18;
      ballMat.metalness = 0.85; ballMat.roughness = 0.12; ballMat.envMapIntensity = 1.4;
      ballMat.sheen = 0.6; ballMat.sheenColor.setHex(0xffeeaa); ballMat.sheenRoughness = 0.15;
      ballMat.clearcoat = 0.8; ballMat.clearcoatRoughness = 0.05; break;

    case 'crystal_ball':
      ballMat.color.setHex(0xddeeff); ballMat.transparent = true; ballMat.opacity = 0.55;
      ballMat.emissive.setHex(0x4488cc); ballMat.emissiveIntensity = 0.3;
      ballMat.roughness = 0.02; ballMat.metalness = 0.05; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.01;
      ballMat.envMapIntensity = 1.6; ballMat.iridescence = 0.3; ballMat.iridescenceIOR = 1.5;
      ballMat.sheen = 0.4; ballMat.sheenColor.setHex(0xaaddff); break;

    case 'sunset_ball':
      ballMat.color.setHex(0xcc6644); ballMat.emissive.setHex(0xff8855); ballMat.emissiveIntensity = 0.2;
      ballMat.roughness = 0.25; ballMat.metalness = 0.1;
      ballMat.sheen = 0.5; ballMat.sheenColor.setHex(0xffaa66); ballMat.sheenRoughness = 0.3;
      ballMat.envMapIntensity = 0.9; break;

    case 'emerald_ball':
      ballMat.color.setHex(0x2f7a4b); ballMat.emissive.setHex(0x0a4a2a); ballMat.emissiveIntensity = 0.18;
      ballMat.roughness = 0.08; ballMat.metalness = 0.25; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.02;
      ballMat.envMapIntensity = 1.3; ballMat.sheen = 0.3; ballMat.sheenColor.setHex(0x88ffaa); break;

    case 'moonstone_ball':
      ballMat.color.setHex(0xc5d4e8); ballMat.transparent = true; ballMat.opacity = 0.82;
      ballMat.emissive.setHex(0x6b7c99); ballMat.emissiveIntensity = 0.2;
      ballMat.roughness = 0.06; ballMat.metalness = 0.08; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.02;
      ballMat.iridescence = 0.5; ballMat.iridescenceIOR = 1.6; ballMat.iridescenceThicknessRange = [200, 500];
      ballMat.sheen = 0.7; ballMat.sheenColor.setHex(0xdde8ff); ballMat.sheenRoughness = 0.2;
      ballMat.envMapIntensity = 1.2; break;

    case 'citrus_ball':
      ballMat.color.setHex(0xffb13b); ballMat.emissive.setHex(0xcc7a00); ballMat.emissiveIntensity = 0.2;
      ballMat.roughness = 0.2; ballMat.metalness = 0.05;
      ballMat.sheen = 0.5; ballMat.sheenColor.setHex(0xffdd66); ballMat.sheenRoughness = 0.25;
      ballMat.clearcoat = 0.9; ballMat.clearcoatRoughness = 0.08; ballMat.envMapIntensity = 1.0; break;

    case 'obsidian_ball':
      ballMat.color.setHex(0x0a080e); ballMat.emissive.setHex(0xff5500); ballMat.emissiveIntensity = 0.25;
      ballMat.roughness = 0.03; ballMat.metalness = 0.35; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.01;
      ballMat.envMapIntensity = 1.5; ballMat.sheen = 0.2; ballMat.sheenColor.setHex(0xff6633);
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0xff6a1a); break;

    case 'pearl_ball':
      ballMat.color.setHex(0xf4f0ea); ballMat.transparent = true; ballMat.opacity = 0.92;
      ballMat.emissive.setHex(0xa8b8d8); ballMat.emissiveIntensity = 0.15;
      ballMat.roughness = 0.04; ballMat.metalness = 0.05; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.01;
      ballMat.iridescence = 0.7; ballMat.iridescenceIOR = 1.8; ballMat.iridescenceThicknessRange = [250, 550];
      ballMat.sheen = 0.8; ballMat.sheenColor.setHex(0xffeeff); ballMat.sheenRoughness = 0.15;
      ballMat.envMapIntensity = 1.3; break;

    case 'coral_ball':
      ballMat.color.setHex(0xee8d76); ballMat.emissive.setHex(0xbb5e46); ballMat.emissiveIntensity = 0.16;
      ballMat.roughness = 0.35; ballMat.metalness = 0.05;
      ballMat.sheen = 0.4; ballMat.sheenColor.setHex(0xffaa88); ballMat.sheenRoughness = 0.35;
      ballMat.clearcoat = 0.6; ballMat.clearcoatRoughness = 0.1; ballMat.envMapIntensity = 0.7; break;

    case 'neon_glow': G.neonGlowMesh.visible = true; break;
    case 'stardust_aura': G.stardustParticles.forEach(sp => { sp.mesh.visible = true; }); break;

    case 'galaxy_ball':
      ballMat.color.setHex(0x0a0020); ballMat.emissive.setHex(0x5500cc); ballMat.emissiveIntensity = 0.45;
      ballMat.roughness = 0.15; ballMat.metalness = 0.2; ballMat.clearcoat = 0.8; ballMat.clearcoatRoughness = 0.02;
      ballMat.envMapIntensity = 1.0; ballMat.sheen = 0.4; ballMat.sheenColor.setHex(0x8866ff);
      ballMat.iridescence = 0.25; ballMat.iridescenceIOR = 1.4; break;

    case 'eclipse_ball':
      ballMat.color.setHex(0x080808); ballMat.emissive.setHex(0xff4400); ballMat.emissiveIntensity = 0.65;
      ballMat.roughness = 0.08; ballMat.metalness = 0.3; ballMat.clearcoat = 0.9; ballMat.clearcoatRoughness = 0.02;
      ballMat.envMapIntensity = 0.6; ballMat.sheen = 0.3; ballMat.sheenColor.setHex(0xff6600);
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0xff6600); break;

    case 'marble_ball':
      ballMat.color.setHex(0x8a9b9b); ballMat.emissive.setHex(0x1a2233); ballMat.emissiveIntensity = 0.08;
      ballMat.roughness = 0.45; ballMat.metalness = 0.02; ballMat.clearcoat = 0.4; ballMat.clearcoatRoughness = 0.15;
      ballMat.sheen = 0.15; ballMat.sheenColor.setHex(0xaabbbb); ballMat.sheenRoughness = 0.4;
      ballMat.envMapIntensity = 0.5; break;

    case 'ice_ball':
      ballMat.color.setHex(0x99ccff); ballMat.transparent = true; ballMat.opacity = 0.72;
      ballMat.emissive.setHex(0x3388cc); ballMat.emissiveIntensity = 0.28;
      ballMat.roughness = 0.05; ballMat.metalness = 0.05; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.01;
      ballMat.envMapIntensity = 1.5; ballMat.sheen = 0.5; ballMat.sheenColor.setHex(0xcceeFF);
      ballMat.iridescence = 0.15; ballMat.iridescenceIOR = 1.31; break;

    case 'lava_ball':
      ballMat.color.setHex(0x2a0a00); ballMat.emissive.setHex(0xff4400); ballMat.emissiveIntensity = 0.75;
      ballMat.roughness = 0.65; ballMat.metalness = 0.0; ballMat.clearcoat = 0.0; ballMat.clearcoatRoughness = 0.5;
      ballMat.envMapIntensity = 0.3; ballMat.sheen = 0.0;
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0xff3300); break;

    case 'bubble_ball':
      ballMat.color.setHex(0xddeeff); ballMat.transparent = true; ballMat.opacity = 0.3;
      ballMat.emissive.setHex(0x88aacc); ballMat.emissiveIntensity = 0.15;
      ballMat.roughness = 0.0; ballMat.metalness = 0.0; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.0;
      ballMat.iridescence = 1.0; ballMat.iridescenceIOR = 1.8; ballMat.iridescenceThicknessRange = [100, 600];
      ballMat.envMapIntensity = 1.8; ballMat.sheen = 0.3; ballMat.sheenColor.setHex(0xffffff); break;

    case 'pulse_glow':
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0x9933ff); break;
    case 'firefly_aura': case 'music_notes': case 'heart_aura': case 'celestial_aura':
      G.stardustParticles.forEach(sp => { sp.mesh.visible = true; }); break;

    case 'void_ball':
      ballMat.color.setHex(0x030308); ballMat.emissive.setHex(0x330066); ballMat.emissiveIntensity = 0.35;
      ballMat.roughness = 0.06; ballMat.metalness = 0.15; ballMat.clearcoat = 0.9; ballMat.clearcoatRoughness = 0.02;
      ballMat.envMapIntensity = 0.4; ballMat.sheen = 0.3; ballMat.sheenColor.setHex(0x8800ff);
      ballMat.iridescence = 0.3; ballMat.iridescenceIOR = 1.5;
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0x6600cc); break;

    case 'lightning_ball':
      ballMat.color.setHex(0xbbccff); ballMat.emissive.setHex(0x4488ff); ballMat.emissiveIntensity = 0.55;
      ballMat.roughness = 0.06; ballMat.metalness = 0.25; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.02;
      ballMat.envMapIntensity = 1.2; ballMat.sheen = 0.4; ballMat.sheenColor.setHex(0x88bbff);
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0x4488ff); break;

    case 'diamond_ball':
      ballMat.color.setHex(0xeeeeff); ballMat.emissive.setHex(0xaabbff); ballMat.emissiveIntensity = 0.3;
      ballMat.transparent = true; ballMat.opacity = 0.65;
      ballMat.roughness = 0.0; ballMat.metalness = 0.15; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.0;
      ballMat.iridescence = 0.8; ballMat.iridescenceIOR = 2.4; ballMat.iridescenceThicknessRange = [100, 500];
      ballMat.envMapIntensity = 2.0; ballMat.sheen = 0.5; ballMat.sheenColor.setHex(0xffffff);
      ballMat.sheenRoughness = 0.1; break;

    case 'sun_glow':
      ballMat.color.setHex(0xe8a14f); ballMat.emissive.setHex(0xcc6f1f); ballMat.emissiveIntensity = 0.28;
      ballMat.roughness = 0.2; ballMat.metalness = 0.1; ballMat.clearcoat = 0.7; ballMat.clearcoatRoughness = 0.08;
      ballMat.sheen = 0.6; ballMat.sheenColor.setHex(0xffdd88); ballMat.sheenRoughness = 0.2;
      ballMat.envMapIntensity = 0.9;
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0xffaa44); break;

    case 'nebula_ball':
      ballMat.color.setHex(0x2d1a4f); ballMat.emissive.setHex(0x7b3cff); ballMat.emissiveIntensity = 0.35;
      ballMat.roughness = 0.15; ballMat.metalness = 0.15; ballMat.clearcoat = 0.8; ballMat.clearcoatRoughness = 0.03;
      ballMat.envMapIntensity = 0.9; ballMat.sheen = 0.5; ballMat.sheenColor.setHex(0xcc88ff);
      ballMat.iridescence = 0.3; ballMat.iridescenceIOR = 1.5; break;

    case 'holo_ball':
      ballMat.color.setHex(0x88eeff); ballMat.transparent = true; ballMat.opacity = 0.5;
      ballMat.emissive.setHex(0x7a4dff); ballMat.emissiveIntensity = 0.3;
      ballMat.roughness = 0.0; ballMat.metalness = 0.1; ballMat.clearcoat = 1.0; ballMat.clearcoatRoughness = 0.0;
      ballMat.iridescence = 1.0; ballMat.iridescenceIOR = 2.0; ballMat.iridescenceThicknessRange = [150, 600];
      ballMat.envMapIntensity = 1.8; ballMat.sheen = 0.6; ballMat.sheenColor.setHex(0xff88ff);
      ballMat.sheenRoughness = 0.1; break;

    case 'starfield_ball':
      ballMat.color.setHex(0x060e22); ballMat.emissive.setHex(0x5fb5ff); ballMat.emissiveIntensity = 0.3;
      ballMat.roughness = 0.1; ballMat.metalness = 0.2; ballMat.clearcoat = 0.9; ballMat.clearcoatRoughness = 0.02;
      ballMat.envMapIntensity = 0.8; ballMat.sheen = 0.3; ballMat.sheenColor.setHex(0x88ccff);
      G.neonGlowMesh.visible = true; G.neonGlowMat.color.setHex(0x5fb5ff); break;

    case 'aurora_ball':
      ballMat.color.setHex(0x1d7c63); ballMat.emissive.setHex(0x4ee0b2); ballMat.emissiveIntensity = 0.28;
      ballMat.roughness = 0.08; ballMat.metalness = 0.1; ballMat.clearcoat = 0.9; ballMat.clearcoatRoughness = 0.02;
      ballMat.iridescence = 0.4; ballMat.iridescenceIOR = 1.6; ballMat.iridescenceThicknessRange = [200, 500];
      ballMat.envMapIntensity = 1.1; ballMat.sheen = 0.5; ballMat.sheenColor.setHex(0x88ffcc);
      G.stardustParticles.forEach(sp => { sp.mesh.visible = true; }); break;
  }
}

export function awardExclusiveCoin() {
  G.exclusiveCoins++;
  G.exclusiveCountEl.textContent = G.exclusiveCoins;
  saveShopData();
  G.exclusiveToast.classList.add('show');
  setTimeout(() => G.exclusiveToast.classList.remove('show'), 2500);
  const audioCtx = getAudioCtx();
  const sfxGain = getSfxGain();
  if (audioCtx) {
    const now = audioCtx.currentTime;
    const notes = [523.3, 659.3, 784.0, 1047, 1318.5, 1568, 2093];
    notes.forEach((freq, i) => {
      const t = now + i * 0.08;
      const o = audioCtx.createOscillator();
      o.type = 'sine'; o.frequency.value = freq;
      const o2 = audioCtx.createOscillator();
      o2.type = 'triangle'; o2.frequency.value = freq * 1.5;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g); o2.connect(g); g.connect(sfxGain);
      o.start(t); o.stop(t + 0.65);
      o2.start(t); o2.stop(t + 0.65);
    });
  }
}

export function awardSparkleLightsPrize(hitsUsed) {
  if (hitsUsed <= 1) {
    awardExclusiveCoin();
    if (G.powerLabel) G.powerLabel.textContent = '💎 Exclusive coin! All lights in one shot!';
    return;
  }

  if (hitsUsed === 2) {
    addCoins(20);
    addStars(1);
    showSecretToast('✨ Light Sweep!', 'You collected every light in 2 shots.<br>Bonus: +1 star.', 20);
    if (G.powerLabel) G.powerLabel.textContent = '✨ Light sweep in 2 shots! +20 coins and +1 star';
    return;
  }

  if (hitsUsed === 3) {
    addCoins(10);
    showSecretToast('✨ Light Sweep!', 'You collected every light in 3 shots.', 10);
    if (G.powerLabel) G.powerLabel.textContent = '✨ Light sweep in 3 shots! +10 coins';
  }
}

export function addCoins(amount) {
  G.coins += amount;
  G.coinCountEl.textContent = G.coins;
  saveShopData();
  const floater = document.createElement('div');
  floater.className = 'coin-add';
  floater.textContent = `+${amount}`;
  G.container.appendChild(floater);
  setTimeout(() => floater.remove(), 1200);
}

export function addStars(amount) {
  G.stars += amount;
  G.starCountEl.textContent = G.stars;
  saveShopData();
}

export function showSecretToast(title, desc, reward) {
  G.secretTitle.textContent = title;
  G.secretDesc.innerHTML = desc;
  G.secretReward.textContent = reward ? `+${reward} coins!` : '';
  G.secretToast.classList.add('show');
  setTimeout(() => G.secretToast.classList.remove('show'), 3000);
}

export function saveShopData() {
  try {
    localStorage.setItem('tg_shop', JSON.stringify({
      coins: G.coins, stars: G.stars, exclusiveCoins: G.exclusiveCoins,
      owned: G.ownedItems, active: G.activeEffect, wins: G.wins, tournamentIndex: G.tournamentIndex,
      viewMode: G.viewMode,
      musicVolume: G.musicVolume,
      sfxVolume: G.sfxVolume,
      rageMode: G.rageMode,
    }));
  } catch(e) {}
}

export function loadShopData() {
  try {
    const saved = JSON.parse(localStorage.getItem('tg_shop') || '{}');
    if (saved.coins !== undefined) G.coins = saved.coins;
    if (saved.stars !== undefined) G.stars = saved.stars;
    if (saved.exclusiveCoins !== undefined) G.exclusiveCoins = saved.exclusiveCoins;
    if (saved.owned) G.ownedItems = saved.owned;
    if (saved.active) G.activeEffect = saved.active;
    if (saved.wins !== undefined) G.wins = saved.wins;
    if (saved.tournamentIndex !== undefined) G.tournamentIndex = saved.tournamentIndex;
    if (saved.viewMode) G.viewMode = saved.viewMode;
    if (saved.musicVolume !== undefined) G.musicVolume = saved.musicVolume;
    if (saved.sfxVolume !== undefined) G.sfxVolume = saved.sfxVolume;
    if (saved.rageMode !== undefined) G.rageMode = saved.rageMode;
  } catch(e) {}
}
