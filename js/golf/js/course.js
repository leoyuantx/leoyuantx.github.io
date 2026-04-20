// Course generation, buildCourse3D, secret system, sparkle lights
import * as THREE from 'three';
import G from './globals.js';
import { CW, CH, BALL_R, HOLE_R, BORDER_H } from './scene.js';
import { getAudioCtx, getSfxGain } from './audio.js';

// ---- Utilities ----
export function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function dist(x1, z1, x2, z2) {
  return Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);
}

// ---- Secret System ----
export function generateSecret(courseData, difficulty, holeNum, tIdx) {
  const seed = tIdx * 1000 + holeNum * 7 + 42;
  const rng = mulberry32(seed);

  const spiralAngle = ((tIdx * 137.5 + holeNum * 60) % 360) * Math.PI / 180;
  const spiralDist = 3 + (tIdx % 5) * 2.5 + holeNum * 1.5;
  let cx = CW / 2 + Math.cos(spiralAngle) * Math.min(spiralDist, CW / 2 - 3);
  let cz = CH / 2 + Math.sin(spiralAngle) * Math.min(spiralDist, CH / 2 - 3);
  cx = Math.max(2, Math.min(CW - 2, cx));
  cz = Math.max(2, Math.min(CH - 2, cz));

  if (dist(cx, cz, courseData.bx, courseData.bz) < 3) {
    cx = (cx + CW / 2) / 2;
    cz = (cz + CH / 2) / 2;
  }
  if (dist(cx, cz, courseData.hx, courseData.hz) < 3) {
    cx = (cx + courseData.bx) / 2;
    cz = (cz + courseData.bz) / 2;
  }

  const isHard = difficulty >= 3;
  const reward = 25 + Math.floor(rng() * 50);

  if (!isHard) {
    return {
      type: 'simple',
      crystal: { x: cx, z: cz, r: 0.4 },
      targets: [],
      found: false,
      patternProgress: 0,
      reward,
      hint: 'Something glimmers nearby...',
    };
  } else {
    const numTargets = 1 + (holeNum % 3);
    const targets = [];
    for (let i = 0; i < numTargets; i++) {
      const tAngle = spiralAngle + (i + 1) * (Math.PI * 2 / (numTargets + 1));
      let tx = cx + Math.cos(tAngle) * (3 + rng() * 2);
      let tz = cz + Math.sin(tAngle) * (3 + rng() * 2);
      tx = Math.max(1.5, Math.min(CW - 1.5, tx));
      tz = Math.max(1.5, Math.min(CH - 1.5, tz));
      targets.push({ x: tx, z: tz, r: 0.35, hit: false });
    }
    return {
      type: 'pattern',
      crystal: { x: cx, z: cz, r: 0.4 },
      targets,
      found: false,
      patternProgress: 0,
      reward,
      hint: `Hit ${numTargets} rune${numTargets > 1 ? 's' : ''} in the right order...`,
    };
  }
}

// ---- Course Generation ----
export function generateCourses(tournamentIdx) {
  const courses = [];
  const baseDifficulty = Math.min(tournamentIdx, 8);
  const rage = G.rageMode;
  // Boss hole: every 10th tournament (0-indexed: 9, 19, 29...) the last hole is a boss
  const isBossTournament = (tournamentIdx + 1) % 10 === 0;
  for (let h = 0; h < G.holesPerTournament; h++) {
    const isBossHole = isBossTournament && h === G.holesPerTournament - 1;
    const diff = rage ? Math.min(baseDifficulty + 4, 12) : baseDifficulty;
    const course = generateHole(diff, h, tournamentIdx, rage, isBossHole);
    if (isBossHole) course.isBossHole = true;
    courses.push(course);
  }
  return courses;
}

function generateHole(difficulty, holeNum, tIdx, rage = false, isBossHole = false) {
  const seed = tIdx * 100 + holeNum;
  const rng = mulberry32(seed);

  const bx = 3 + rng() * 5;
  const bz = CH - 4 - rng() * 3;
  const hx = CW - 6 + rng() * 3;
  const hz = 3 + rng() * 5;

  const obs = [];
  let numObs = 4 + Math.floor(difficulty * 0.8) + holeNum;
  if (rage) numObs = Math.floor(numObs * 1.6) + 3;
  if (isBossHole) numObs = Math.floor(numObs * 1.4) + 5;

  // HIO corridor: narrow path from ball to hole. Obstacles that block it are nudged aside.
  // The corridor is intentionally tight (width ~1.0) so HIO is possible but difficult.
  const hioDx = hx - bx, hioDz = hz - bz;
  const hioLen = Math.sqrt(hioDx * hioDx + hioDz * hioDz);
  const hioNx = -hioDz / hioLen, hioNz = hioDx / hioLen; // perpendicular normal
  function distToHioLine(px, pz) {
    return Math.abs((px - bx) * hioNx + (pz - bz) * hioNz);
  }

  for (let i = 0; i < numObs; i++) {
    const type = rng() < 0.5 ? 'rect' : 'circle';
    if (type === 'rect') {
      const w = 1.5 + rng() * (2.5 + difficulty * 0.4);
      const d = 0.8 + rng() * (1.2 + difficulty * 0.2);
      let x = 5 + rng() * (CW - 12);
      let z = 5 + rng() * (CH - 12);
      // Nudge off HIO corridor if blocking
      const hioClearance = Math.max(w, d) / 2 + 0.5;
      if (distToHioLine(x, z) < hioClearance) {
        const sign = ((x - bx) * hioNx + (z - bz) * hioNz) > 0 ? 1 : -1;
        x += hioNx * (hioClearance - distToHioLine(x, z) + 0.3) * sign;
        z += hioNz * (hioClearance - distToHioLine(x, z) + 0.3) * sign;
        x = Math.max(3, Math.min(CW - 3, x));
        z = Math.max(3, Math.min(CH - 3, z));
      }
      if (dist(x, z, bx, bz) > 4 && dist(x, z, hx, hz) > 4) {
        obs.push({ type: 'rect', x, z, w, d, h: 0.5 + rng() * 0.6 });
      }
    } else {
      const r = 0.6 + rng() * (1.0 + difficulty * 0.15);
      let x = 5 + rng() * (CW - 12);
      let z = 5 + rng() * (CH - 12);
      // Nudge off HIO corridor
      const hioClearance = r + 0.5;
      if (distToHioLine(x, z) < hioClearance) {
        const sign = ((x - bx) * hioNx + (z - bz) * hioNz) > 0 ? 1 : -1;
        x += hioNx * (hioClearance - distToHioLine(x, z) + 0.3) * sign;
        z += hioNz * (hioClearance - distToHioLine(x, z) + 0.3) * sign;
        x = Math.max(3, Math.min(CW - 3, x));
        z = Math.max(3, Math.min(CH - 3, z));
      }
      if (dist(x, z, bx, bz) > 4 && dist(x, z, hx, hz) > 4) {
        obs.push({ type: 'circle', x, z, r });
      }
    }
  }

  const wallList = [];
  if (difficulty >= 0) {
    let numWalls = Math.max(1, Math.floor(difficulty / 2) + 1);
    if (rage) numWalls = Math.floor(numWalls * 1.5) + 2;
    if (isBossHole) numWalls += 3;
    for (let i = 0; i < numWalls; i++) {
      const wx = 6 + rng() * (CW - 14);
      const wz = 6 + rng() * (CH - 14);
      const horizontal = rng() > 0.5;
      const len = 3 + rng() * (4 + difficulty * 0.7);
      const wall = horizontal
        ? { x1: wx, z1: wz, x2: wx + len, z2: wz }
        : { x1: wx, z1: wz, x2: wx, z2: wz + len };
      if (dist(wx, wz, bx, bz) > 3 && dist(wx, wz, hx, hz) > 3) {
        wallList.push(wall);
      }
    }
  }

  const springCount = difficulty >= 2 ? Math.min(1 + Math.floor(difficulty / 3), 3) : 0;
  for (let i = 0; i < springCount; i++) {
    const mix = (i + 1) / (springCount + 1);
    const sx = bx + (hx - bx) * mix + (rng() - 0.5) * 5;
    const sz = bz + (hz - bz) * mix + (rng() - 0.5) * 4;
    if (dist(sx, sz, bx, bz) > 3.5 && dist(sx, sz, hx, hz) > 3.0) {
      obs.push({
        type: 'circle',
        x: Math.max(2, Math.min(CW - 2, sx)),
        z: Math.max(2, Math.min(CH - 2, sz)),
        r: 0.72,
        variant: 'spring_ring',
        color: 0x5f53c7,
        detailColor: 0xb1a6ff,
        passThrough: true,
        effect: { kind: 'spring', multiplier: 1.55, cooldown: 420, message: 'Spring bounce!' },
      });
    }
  }

  // ---- Hazard Zones ----
  const hazardTypes = [
    { variant: 'water_hazard', kind: 'water', r: 1.2, minDiff: 0, message: '💦 Water hazard! +1 stroke' },
    { variant: 'sand_trap', kind: 'sand', r: 1.4, minDiff: 0, slow: 0.86, message: '⛱ Sand trap!' },
    { variant: 'mud_pit', kind: 'mud', r: 1.0, minDiff: 2, slow: 0.82, wobble: 0.004, message: '🟤 Mud pit!' },
    { variant: 'lava_pool', kind: 'lava', r: 0.9, minDiff: 3, message: '🔥 Lava! +1 stroke' },
    { variant: 'magnet_zone', kind: 'magnet', r: 1.3, minDiff: 4, force: 0.005, message: '🧲 Magnet pull!' },
    { variant: 'gravity_well', kind: 'gravity', r: 1.1, minDiff: 5, force: 0.007, message: '🌀 Gravity well!' },
  ];

  // Number of hazards scales with difficulty: 1 at diff 0, up to 4 at diff 8
  let numHazards = Math.min(1 + Math.floor(difficulty * 0.4), 4);
  if (rage) numHazards = Math.min(numHazards + 3, 8);
  if (isBossHole) numHazards = Math.min(numHazards + 2, 8);
  // In rage mode, all hazard types are available regardless of difficulty
  const availableHazards = rage ? hazardTypes : hazardTypes.filter(h => difficulty >= h.minDiff);

  for (let i = 0; i < numHazards; i++) {
    const hazType = availableHazards[Math.floor(rng() * availableHazards.length)];
    const hr = hazType.r + rng() * 0.4;
    // Place hazards along the path between ball and hole, offset to the sides
    const mix = 0.2 + rng() * 0.6;
    let hzX = bx + (hx - bx) * mix + (rng() - 0.5) * 10;
    let hzZ = bz + (hz - bz) * mix + (rng() - 0.5) * 8;
    hzX = Math.max(hr + 1, Math.min(CW - hr - 1, hzX));
    hzZ = Math.max(hr + 1, Math.min(CH - hr - 1, hzZ));

    // Don't place too close to ball start or hole
    if (dist(hzX, hzZ, bx, bz) < 4) continue;
    if (dist(hzX, hzZ, hx, hz) < 4) continue;

    // Don't overlap with solid obstacles
    let overlaps = false;
    for (const existOb of obs) {
      const clearance = existOb.type === 'circle' ? hr + existOb.r + 0.5 : hr + Math.max(existOb.w, existOb.d) / 2 + 0.5;
      if (dist(hzX, hzZ, existOb.x, existOb.z) < clearance) { overlaps = true; break; }
    }
    if (overlaps) continue;

    const effect = { kind: hazType.kind, message: hazType.message };
    if (hazType.slow) effect.slow = hazType.slow;
    if (hazType.wobble) effect.wobble = hazType.wobble;
    if (hazType.force) effect.force = hazType.force;

    obs.push({
      type: 'circle', x: hzX, z: hzZ, r: hr,
      variant: hazType.variant,
      passThrough: true,
      effect,
    });
  }

  // ---- Space Biome: Low Gravity Pads ----
  if (G.activeBiome && G.activeBiome.space) {
    const numPads = 3 + Math.floor(rng() * 3); // 3-5 pads
    for (let i = 0; i < numPads; i++) {
      const padR = 0.9 + rng() * 0.5;
      const mix = 0.15 + rng() * 0.7;
      let px = bx + (hx - bx) * mix + (rng() - 0.5) * 14;
      let pz = bz + (hz - bz) * mix + (rng() - 0.5) * 10;
      px = Math.max(padR + 1, Math.min(CW - padR - 1, px));
      pz = Math.max(padR + 1, Math.min(CH - padR - 1, pz));
      if (dist(px, pz, bx, bz) < 3.5) continue;
      if (dist(px, pz, hx, hz) < 3.5) continue;
      let overlaps = false;
      for (const existOb of obs) {
        const clearance = existOb.type === 'circle' ? padR + existOb.r + 0.4 : padR + Math.max(existOb.w, existOb.d) / 2 + 0.4;
        if (dist(px, pz, existOb.x, existOb.z) < clearance) { overlaps = true; break; }
      }
      if (overlaps) continue;
      obs.push({
        type: 'circle', x: px, z: pz, r: padR,
        variant: 'low_gravity_pad',
        passThrough: true,
        effect: { kind: 'low_gravity', glide: 1.025, message: '🚀 Low gravity!' },
      });
    }
  }

  let par = 2 + Math.floor(numObs / 2) + (wallList.length > 1 ? 1 : 0);
  if (rage) par = Math.max(2, par - 2); // tighter par in rage mode
  if (isBossHole) {
    par = Math.max(2, par - 1);
    // Boss hole: add a moving hole marker (handled in game.js animate)
  }
  return { bx, bz, hx, hz, obs, walls: wallList, par };
}

function makeMat(color, roughness = 0.8, metalness = 0.06, emissive = 0x000000, transparent = false, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    transparent,
    opacity,
  });
}

function addRectObstacleVisual(group, ob, defaults) {
  const variant = ob.variant || 'crate';
  const height = ob.h || 0.7;
  const bodyColor = ob.color ?? 0x8b5a2b;
  const topColor = ob.topColor ?? 0xbe8d55;
  const baseColor = ob.baseColor ?? 0x5a3718;

  if (variant === 'boost_pad') {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(ob.w, Math.max(height, 0.08), ob.d), makeMat(bodyColor, 0.26, 0.04, 0x0f5232));
    pad.position.set(ob.x, Math.max(height, 0.08) / 2, ob.z);
    group.add(pad);
    for (let i = -1; i <= 1; i++) {
      const arrow = new THREE.Mesh(new THREE.BoxGeometry(ob.w * 0.18, 0.03, ob.d * 0.18), makeMat(topColor, 0.16, 0.0, 0x2fdc77));
      arrow.rotation.z = Math.PI / 4;
      arrow.position.set(ob.x + i * ob.w * 0.2, Math.max(height, 0.08) + 0.03, ob.z);
      group.add(arrow);
    }
    return;
  }

  if (variant === 'ice_patch') {
    const ice = new THREE.Mesh(
      new THREE.BoxGeometry(ob.w, Math.max(height, 0.04), ob.d),
      new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.08, transmission: 0.45, transparent: true, opacity: 0.78, clearcoat: 0.5, emissive: 0x27587a, emissiveIntensity: 0.2 })
    );
    ice.position.set(ob.x, Math.max(height, 0.04) / 2, ob.z);
    group.add(ice);
    return;
  }

  if (variant === 'wind_fan') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(ob.w, Math.max(height, 0.12), ob.d), makeMat(bodyColor, 0.45, 0.16));
    base.position.set(ob.x, Math.max(height, 0.12) / 2, ob.z);
    group.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.min(ob.w, ob.d) * 0.22, 0.05, 10, 20), makeMat(topColor, 0.28, 0.18, 0x356b99));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(ob.x, Math.max(height, 0.12) + 0.08, ob.z);
    group.add(ring);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.42), makeMat(topColor, 0.32, 0.12));
      blade.rotation.y = i * Math.PI / 2;
      blade.position.set(ob.x, Math.max(height, 0.12) + 0.08, ob.z);
      group.add(blade);
    }
    return;
  }

  let bodyMat = defaults.woodMat;
  let topMat = defaults.woodTopMat;
  let needsBase = true;

  if (variant === 'slab' || variant === 'marble' || variant === 'altar') {
    bodyMat = makeMat(bodyColor, 0.45, 0.12);
    topMat = makeMat(topColor, 0.35, 0.08);
  } else if (variant === 'hedge' || variant === 'hedge_long') {
    bodyMat = makeMat(bodyColor, 0.95, 0.0);
    topMat = makeMat(topColor, 0.92, 0.0);
    needsBase = false;
  } else if (variant === 'bumper') {
    bodyMat = makeMat(bodyColor, 0.28, 0.12, 0x0f5232);
    topMat = makeMat(topColor, 0.2, 0.04, 0x2d8d57);
  } else if (variant === 'flowerbed') {
    bodyMat = makeMat(bodyColor, 0.92, 0.0);
    topMat = makeMat(topColor, 0.88, 0.0);
  } else if (variant === 'bridge') {
    bodyMat = makeMat(bodyColor, 0.76, 0.04);
    topMat = makeMat(topColor, 0.72, 0.05);
  }

  const main = new THREE.Mesh(new THREE.BoxGeometry(ob.w, height, ob.d), bodyMat);
  main.position.set(ob.x, height / 2, ob.z);
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  const top = new THREE.Mesh(new THREE.BoxGeometry(ob.w + 0.02, Math.max(0.05, height * 0.08), ob.d + 0.02), topMat);
  top.position.set(ob.x, height + Math.max(0.025, height * 0.04), ob.z);
  top.castShadow = true;
  group.add(top);

  if (needsBase) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(ob.w + 0.04, 0.06, ob.d + 0.04), makeMat(baseColor, 0.86, 0.03));
    base.position.set(ob.x, 0.03, ob.z);
    group.add(base);
  }

  if (variant === 'flowerbed') {
    const flowerColors = [0xff5a7d, 0xffc24a, 0xff8ad8, 0x9c7cff, 0xfff47a];
    for (let i = 0; i < 7; i++) {
      const fx = ob.x + (Math.random() - 0.5) * (ob.w * 0.65);
      const fz = ob.z + (Math.random() - 0.5) * (ob.d * 0.65);
      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.07 + Math.random() * 0.03, 6, 6),
        makeMat(flowerColors[i % flowerColors.length], 0.55, 0.0)
      );
      blossom.position.set(fx, height + 0.08 + Math.random() * 0.08, fz);
      group.add(blossom);
    }
  }

  if (variant === 'bridge') {
    [-1, 1].forEach(side => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(ob.w, 0.16, 0.08), makeMat(0x704623, 0.8, 0.03));
      rail.position.set(ob.x, height + 0.18, ob.z + side * (ob.d / 2 - 0.08));
      rail.castShadow = true;
      group.add(rail);
    });
  }

  if (variant === 'altar') {
    const accent = new THREE.Mesh(new THREE.BoxGeometry(ob.w * 0.55, 0.14, ob.d * 0.55), makeMat(0xdde5ea, 0.3, 0.08, 0x224455));
    accent.position.set(ob.x, height + 0.14, ob.z);
    accent.castShadow = true;
    group.add(accent);
  }

  if (variant === 'hedge' || variant === 'hedge_long') {
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(Math.min(ob.d, ob.w) * 0.22, 8, 6), makeMat(topColor, 0.96));
      puff.position.set(
        ob.x + (i - 1.5) * (ob.w / 5),
        height + 0.1,
        ob.z + Math.sin(i) * 0.08
      );
      puff.scale.y = 0.8;
      group.add(puff);
    }
  }
}

function addCircleObstacleVisual(group, ob, defaults) {
  const variant = ob.variant || 'boulder';
  const radius = ob.r || 0.8;
  const bodyColor = ob.color ?? 0x70757a;
  const detailColor = ob.detailColor ?? 0xb0b8bf;

  // ---- Hazard: Low Gravity Pad (Space biome) ----
  if (variant === 'low_gravity_pad') {
    // Dark base platform
    const baseGeo = new THREE.CylinderGeometry(radius, radius * 0.92, 0.06, 24);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a2a, roughness: 0.2, metalness: 0.5,
      emissive: 0x111144, emissiveIntensity: 0.2,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(ob.x, 0.03, ob.z);
    group.add(base);
    // Glowing ring
    const ringGeo = new THREE.TorusGeometry(radius * 0.7, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x44ddff, transparent: true, opacity: 0.35, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ob.x, 0.07, ob.z);
    group.add(ring);
    // Outer halo
    const haloGeo = new THREE.RingGeometry(radius * 0.85, radius + 0.1, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x2288ff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(ob.x, 0.005, ob.z);
    group.add(halo);
    // Upward arrow indicator
    const arrowGeo = new THREE.ConeGeometry(0.08, 0.2, 6);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x44ddff, transparent: true, opacity: 0.6,
    });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.position.set(ob.x, 0.2, ob.z);
    group.add(arrow);
    G.hazardMeshRefs.push({ kind: 'low_gravity', ring, ringMat, halo, haloMat, arrow, arrowMat, ob, radius });
    return;
  }

  // ---- Hazard: Water ----
  if (variant === 'water_hazard') {
    const bedGeo = new THREE.CylinderGeometry(radius + 0.15, radius + 0.2, 0.08, 28);
    const bed = new THREE.Mesh(bedGeo, makeMat(0x0a2038, 0.95));
    bed.position.set(ob.x, -0.02, ob.z);
    group.add(bed);
    const waterGeo = new THREE.CylinderGeometry(radius, radius * 0.95, 0.05, 28);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x2288cc, roughness: 0.02, metalness: 0.15, transparent: true, opacity: 0.6,
      clearcoat: 1.0, clearcoatRoughness: 0.01,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(ob.x, 0.01, ob.z);
    group.add(water);
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.3, radius * 0.5, 24),
      new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide })
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(ob.x, 0.04, ob.z);
    group.add(ripple);
    const ripple2 = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.55, radius * 0.7, 24),
      new THREE.MeshBasicMaterial({ color: 0x44aadd, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })
    );
    ripple2.rotation.x = -Math.PI / 2;
    ripple2.position.set(ob.x, 0.04, ob.z);
    group.add(ripple2);
    // Warning marker
    const signGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
    const sign = new THREE.Mesh(signGeo, makeMat(0xdddddd, 0.3, 0.5));
    sign.position.set(ob.x + radius + 0.3, 0.3, ob.z);
    group.add(sign);
    const flagGeo = new THREE.PlaneGeometry(0.25, 0.18);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0x2288ff, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(ob.x + radius + 0.42, 0.52, ob.z);
    group.add(flag);
    G.hazardMeshRefs.push({ kind: 'water', water, waterMat, ripple, ripple2, ob, radius });
    return;
  }
  if (variant === 'sand_trap') {
    const bedGeo = new THREE.CylinderGeometry(radius + 0.1, radius + 0.18, 0.06, 24);
    const bed = new THREE.Mesh(bedGeo, makeMat(0x8a7a50, 0.95));
    bed.position.set(ob.x, -0.01, ob.z);
    group.add(bed);
    const sandGeo = new THREE.CylinderGeometry(radius, radius * 0.92, 0.04, 24);
    const sandMat = makeMat(0xe8d5a3, 0.92, 0.0);
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.position.set(ob.x, 0.01, ob.z);
    group.add(sand);
    // Sand ripple marks
    const sandRipples = [];
    for (let i = 0; i < 4; i++) {
      const rRad = radius * (0.3 + i * 0.15);
      const ripple = new THREE.Mesh(
        new THREE.TorusGeometry(rRad, 0.015, 4, 24),
        makeMat(0xd4c090, 0.95)
      );
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(ob.x + (Math.random() - 0.5) * 0.1, 0.035, ob.z + (Math.random() - 0.5) * 0.1);
      group.add(ripple);
      sandRipples.push(ripple);
    }
    G.hazardMeshRefs.push({ kind: 'sand', sand, sandRipples, ob, radius });
    return;
  }

  // ---- Hazard: Mud Pit ----
  if (variant === 'mud_pit') {
    const bedGeo = new THREE.CylinderGeometry(radius + 0.12, radius + 0.2, 0.07, 24);
    const bed = new THREE.Mesh(bedGeo, makeMat(0x3a2a18, 0.95));
    bed.position.set(ob.x, -0.02, ob.z);
    group.add(bed);
    const mudGeo = new THREE.CylinderGeometry(radius, radius * 0.9, 0.05, 24);
    const mudMat = new THREE.MeshStandardMaterial({
      color: 0x5a4228, roughness: 0.98, metalness: 0.0,
    });
    const mud = new THREE.Mesh(mudGeo, mudMat);
    mud.position.set(ob.x, 0.005, ob.z);
    group.add(mud);
    // Mud bubbles
    const mudBubbles = [];
    for (let i = 0; i < 5; i++) {
      const ba = Math.random() * Math.PI * 2;
      const bd = Math.random() * radius * 0.6;
      const bubbleGeo = new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 6, 6);
      const bubble = new THREE.Mesh(bubbleGeo, makeMat(0x6a5238, 0.7, 0.0, 0x2a1a08));
      bubble.position.set(ob.x + Math.cos(ba) * bd, 0.04, ob.z + Math.sin(ba) * bd);
      bubble.scale.y = 0.5;
      group.add(bubble);
      mudBubbles.push({ mesh: bubble, baseY: 0.04, angle: ba, dist: bd });
    }
    G.hazardMeshRefs.push({ kind: 'mud', mudBubbles, ob, radius });
    return;
  }

  // ---- Hazard: Lava Pool ----
  if (variant === 'lava_pool') {
    const bedGeo = new THREE.CylinderGeometry(radius + 0.15, radius + 0.22, 0.08, 24);
    const bed = new THREE.Mesh(bedGeo, makeMat(0x1a0a00, 0.95));
    bed.position.set(ob.x, -0.02, ob.z);
    group.add(bed);
    const lavaGeo = new THREE.CylinderGeometry(radius, radius * 0.92, 0.05, 24);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xff4400, roughness: 0.6, metalness: 0.0,
      emissive: 0xff2200, emissiveIntensity: 0.5,
    });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.position.set(ob.x, 0.01, ob.z);
    group.add(lava);
    // Crust ring
    const crustGeo = new THREE.RingGeometry(radius * 0.6, radius * 0.85, 24);
    const crustMat = new THREE.MeshStandardMaterial({
      color: 0x330000, emissive: 0x441100, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.5, side: THREE.DoubleSide,
    });
    const crust = new THREE.Mesh(crustGeo, crustMat);
    crust.rotation.x = -Math.PI / 2;
    crust.position.set(ob.x, 0.04, ob.z);
    group.add(crust);
    // Glow underneath
    const glowGeo = new THREE.CircleGeometry(radius + 0.25, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff4400, transparent: true, opacity: 0.12, depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(ob.x, 0.005, ob.z);
    group.add(glow);
    G.hazardMeshRefs.push({ kind: 'lava', lava, lavaMat, crust, crustMat, glow, glowMat, ob, radius });
    return;
  }
  if (variant === 'magnet_zone') {
    const baseGeo = new THREE.CylinderGeometry(radius, radius * 0.95, 0.06, 24);
    const base = new THREE.Mesh(baseGeo, makeMat(0x444455, 0.4, 0.6));
    base.position.set(ob.x, 0.03, ob.z);
    group.add(base);
    // Magnetic ring
    const ringGeo = new THREE.TorusGeometry(radius * 0.6, 0.08, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xcc2222, roughness: 0.3, metalness: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ob.x, 0.08, ob.z);
    group.add(ring);
    // Center pole
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8);
    const pole = new THREE.Mesh(poleGeo, makeMat(0x888899, 0.2, 0.8));
    pole.position.set(ob.x, 0.2, ob.z);
    group.add(pole);
    // Horseshoe cap
    const capGeo = new THREE.TorusGeometry(0.12, 0.04, 6, 12, Math.PI);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.3, metalness: 0.6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.x = -Math.PI / 2;
    cap.position.set(ob.x, 0.4, ob.z);
    group.add(cap);
    G.hazardMeshRefs.push({ kind: 'magnet', ring, cap, ob, radius });
    return;
  }

  // ---- Hazard: Gravity Well ----
  if (variant === 'gravity_well') {
    const baseGeo = new THREE.CylinderGeometry(radius, radius * 0.85, 0.1, 24);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x110022, roughness: 0.2, metalness: 0.3,
      emissive: 0x220044, emissiveIntensity: 0.3,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(ob.x, 0.02, ob.z);
    group.add(base);
    // Spiral rings
    const spirals = [];
    for (let i = 0; i < 3; i++) {
      const rr = radius * (0.3 + i * 0.2);
      const spiralGeo = new THREE.TorusGeometry(rr, 0.02, 6, 24);
      const spiralMat = new THREE.MeshBasicMaterial({
        color: 0x8844ff, transparent: true, opacity: 0.3 - i * 0.07, depthWrite: false,
      });
      const spiral = new THREE.Mesh(spiralGeo, spiralMat);
      spiral.rotation.x = -Math.PI / 2;
      spiral.position.set(ob.x, 0.08 + i * 0.02, ob.z);
      group.add(spiral);
      spirals.push(spiral);
    }
    // Center orb
    const orbGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0x6622cc, roughness: 0.0, metalness: 0.1,
      emissive: 0x8844ff, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.8,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(ob.x, 0.2, ob.z);
    group.add(orb);
    G.hazardMeshRefs.push({ kind: 'gravity', spirals, orb, orbMat, ob, radius });
    return;
  }

  if (variant === 'goo_pool') {
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 0.92, 0.06, 28),
      makeMat(bodyColor, 0.18, 0.0, 0x1d5a36, true, 0.92)
    );
    pool.position.set(ob.x, 0.03, ob.z);
    group.add(pool);
    const sheen = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.72, 24), new THREE.MeshBasicMaterial({ color: detailColor, transparent: true, opacity: 0.24 }));
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.set(ob.x, 0.062, ob.z);
    group.add(sheen);
    return;
  }

  if (variant === 'spring_ring') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.84, radius * 0.9, 0.12, 22), makeMat(0x2c235c, 0.5, 0.12));
    base.position.set(ob.x, 0.06, ob.z);
    group.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.11, 12, 24), makeMat(bodyColor, 0.22, 0.0, detailColor));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(ob.x, 0.14, ob.z);
    group.add(ring);
    return;
  }

  if (variant === 'stump' || variant === 'barrel' || variant === 'totem' || variant === 'lantern' || variant === 'fountain') {
    const cylHeight = variant === 'totem' ? radius * 2.4 : variant === 'fountain' ? radius * 1.1 : radius * 1.5;
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.72, radius * 0.84, cylHeight, 14),
      makeMat(bodyColor, variant === 'lantern' ? 0.35 : 0.7, 0.08)
    );
    body.position.set(ob.x, cylHeight / 2, ob.z);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const capColor = variant === 'lantern' ? 0xfff2a0 : detailColor;
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.6, radius * 0.72, Math.max(0.12, radius * 0.25), 14),
      makeMat(capColor, 0.3, 0.04, variant === 'lantern' ? 0x665500 : 0x000000)
    );
    cap.position.set(ob.x, cylHeight + Math.max(0.06, radius * 0.12), ob.z);
    group.add(cap);

    if (variant === 'barrel') {
      [-1, 1].forEach(side => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.74, 0.035, 8, 20),
          makeMat(0x2f2f38, 0.35, 0.55)
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(ob.x, cylHeight / 2 + side * cylHeight * 0.18, ob.z);
        group.add(ring);
      });
    }

    if (variant === 'lantern') {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.36, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xfff1a2, transparent: true, opacity: 0.5 })
      );
      glow.position.set(ob.x, cylHeight * 0.72, ob.z);
      group.add(glow);
    }

    if (variant === 'fountain') {
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.46, radius * 0.54, 0.08, 16),
        makeMat(0x78d4ff, 0.18, 0.0, 0x224466)
      );
      water.position.set(ob.x, cylHeight + 0.08, ob.z);
      group.add(water);
    }

    return;
  }

  if (variant === 'mushroom') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.18, radius * 0.24, radius * 0.95, 8), makeMat(0xf2eadb, 0.8));
    stem.position.set(ob.x, radius * 0.48, ob.z);
    group.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), makeMat(bodyColor, 0.58, 0.02));
    cap.position.set(ob.x, radius * 0.95, ob.z);
    cap.castShadow = true;
    group.add(cap);
    for (let i = 0; i < 5; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.08, 5, 5), makeMat(detailColor, 0.4));
      dot.position.set(ob.x + (Math.random() - 0.5) * radius * 0.7, radius * 1.02, ob.z + (Math.random() - 0.5) * radius * 0.7);
      group.add(dot);
    }
    return;
  }

  if (variant === 'shrub') {
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(radius * (0.45 + i * 0.08), 10, 8), makeMat(i === 0 ? bodyColor : detailColor, 0.94));
      puff.position.set(ob.x + (i - 1) * radius * 0.22, radius * 0.55 + i * 0.04, ob.z + Math.sin(i * 1.4) * radius * 0.15);
      puff.scale.y = 0.8;
      puff.castShadow = true;
      group.add(puff);
    }
    return;
  }

  if (variant === 'crystal' || variant === 'orb') {
    const geo = variant === 'crystal' ? new THREE.OctahedronGeometry(radius * 0.82, 0) : new THREE.SphereGeometry(radius * 0.72, 14, 12);
    const material = variant === 'crystal'
      ? new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.12, transmission: 0.4, transparent: true, opacity: 0.82, emissive: detailColor, emissiveIntensity: 0.25 })
      : makeMat(bodyColor, 0.15, 0.0, detailColor);
    const main = new THREE.Mesh(geo, material);
    main.position.set(ob.x, radius * 0.8, ob.z);
    main.castShadow = true;
    group.add(main);
    return;
  }

  const rockGroup = new THREE.Group();
  rockGroup.position.set(ob.x, 0, ob.z);
  const mainGeo = new THREE.DodecahedronGeometry(radius, 1);
  const mainPos = mainGeo.attributes.position;
  for (let vi = 0; vi < mainPos.count; vi++) {
    const px = mainPos.getX(vi), py = mainPos.getY(vi), pz = mainPos.getZ(vi);
    const wobble = 1 + (Math.sin(px * 5 + pz * 3) * 0.08 + Math.cos(py * 7) * 0.06);
    mainPos.setXYZ(vi, px * wobble, py * wobble, pz * wobble);
  }
  mainGeo.computeVertexNormals();
  const mainMesh = new THREE.Mesh(mainGeo, makeMat(bodyColor, 0.9, 0.02));
  mainMesh.position.y = radius * 0.5;
  mainMesh.scale.y = 0.55;
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  rockGroup.add(mainMesh);
  const accent = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.35, 8, 6), makeMat(detailColor, 0.95, 0.0));
  accent.position.set(radius * 0.18, radius * 0.35, radius * 0.18);
  accent.scale.y = 0.24;
  rockGroup.add(accent);
  group.add(rockGroup);
}

function addWallVisual(group, wall, defaults) {
  const dx = wall.x2 - wall.x1;
  const dz = wall.z2 - wall.z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const wallHeight = 0.6;
  const wallThickness = 0.25;
  const midX = (wall.x1 + wall.x2) / 2;
  const midZ = (wall.z1 + wall.z2) / 2;
  const style = wall.style || 'stone';

  if (style === 'fence') {
    [0.2, 0.44].forEach(y => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, wallThickness * 0.55), makeMat(wall.color ?? 0x7a4f27, 0.78, 0.04));
      rail.position.set(midX, y, midZ);
      rail.rotation.y = -angle;
      rail.castShadow = true;
      rail.receiveShadow = true;
      group.add(rail);
    });

    [wall.x1, wall.x2].forEach((px, index) => {
      const pz = index === 0 ? wall.z1 : wall.z2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, wallHeight + 0.14, 8), makeMat(wall.capColor ?? 0xb0814f, 0.74, 0.04));
      post.position.set(px, (wallHeight + 0.14) / 2, pz);
      post.castShadow = true;
      group.add(post);
    });
    return;
  }

  const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(length, wallHeight, wallThickness), makeMat(wall.color ?? 0x66707b, 0.7, 0.08));
  wallMesh.position.set(midX, wallHeight / 2, midZ);
  wallMesh.rotation.y = -angle;
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  group.add(wallMesh);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(length + 0.06, 0.06, wallThickness + 0.06), makeMat(wall.capColor ?? 0xb6c1c8, 0.38, 0.06));
  cap.position.set(midX, wallHeight + 0.03, midZ);
  cap.rotation.y = -angle;
  cap.castShadow = true;
  group.add(cap);

  [wall.x1, wall.x2].forEach((px, index) => {
    const pz = index === 0 ? wall.z1 : wall.z2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, wallHeight + 0.15, 8), makeMat(wall.capColor ?? 0xb6c1c8, 0.45, 0.06));
    post.position.set(px, (wallHeight + 0.15) / 2, pz);
    post.castShadow = true;
    group.add(post);
  });
}

// ---- Build 3D Course ----
export function buildCourse3D(courseData) {
  if (G.viewMode === '2d') {
    return buildCourse2D(courseData);
  }

  const scene = G.scene;
  const courseGroup = G.courseGroup;

  // Clear old course
  scene.remove(courseGroup);
  G.courseGroup = new THREE.Group();
  scene.add(G.courseGroup);
  const cg = G.courseGroup;
  G.flagMeshRef = null;
  G.hazardMeshRefs = [];

  // Clean up old fish & splashes
  G.fishList.forEach(f => { scene.remove(f.mesh); });
  G.fishList = [];
  G.splashParticles.forEach(sp => { scene.remove(sp.mesh); });
  G.splashParticles = [];
  G.waterMeshRefs = [];

  // Materials from G
  const grassMat = G.grassMat;
  const borderMat = G.borderMat;
  const borderTopMat = G.borderTopMat;
  const holeMat = G.holeMat;
  const holeRimMat = G.holeRimMat;
  const woodMat = G.woodMat;
  const woodTopMat = G.woodTopMat;
  const rockMat = G.rockMat;
  const rockDarkMat = G.rockDarkMat;
  const rockMossMat = G.rockMossMat;
  const wallMat = G.wallMat;
  const wallCapMat = G.wallCapMat;
  const flagPoleMat = G.flagPoleMat;
  const flagMat = G.flagMat;
  const sandMat = G.sandMat;
  const waterMat = G.waterMat;

  // Green surface
  const surfaceGeo = new THREE.BoxGeometry(CW, 0.25, CH);
  const surface = new THREE.Mesh(surfaceGeo, grassMat);
  surface.position.set(CW / 2, -0.125, CH / 2);
  surface.receiveShadow = true;
  cg.add(surface);

  // Fringe
  const biome = G.activeBiome;
  const fringeTexCanvas = document.createElement('canvas');
  fringeTexCanvas.width = 256; fringeTexCanvas.height = 256;
  const fringeCtx = fringeTexCanvas.getContext('2d');
  const fringeBase = fringeCtx.createLinearGradient(0, 0, 256, 256);
  const fGrads = biome ? biome.fringeGrad : ['#1e6e38','#257840','#1a6430'];
  fringeBase.addColorStop(0, fGrads[0]); fringeBase.addColorStop(0.5, fGrads[1]); fringeBase.addColorStop(1, fGrads[2]);
  fringeCtx.fillStyle = fringeBase;
  fringeCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 20; i++) {
    const px = Math.random() * 256, py = Math.random() * 256;
    const pr = 15 + Math.random() * 35;
    const hue = 85 + Math.random() * 50;
    const lit = 16 + Math.random() * 18;
    const pg = fringeCtx.createRadialGradient(px, py, 0, px, py, pr);
    pg.addColorStop(0, `hsla(${hue}, 45%, ${lit}%, 0.2)`);
    pg.addColorStop(1, `hsla(${hue}, 45%, ${lit}%, 0)`);
    fringeCtx.fillStyle = pg;
    fringeCtx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  for (let i = 0; i < 2200; i++) {
    const bx = Math.random() * 256, by = Math.random() * 256;
    const bl = 5 + Math.random() * 14;
    const hue = 80 + Math.random() * 55;
    const sat = 35 + Math.random() * 35;
    const lit = 16 + Math.random() * 26;
    fringeCtx.strokeStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${0.15 + Math.random() * 0.22})`;
    fringeCtx.lineWidth = 0.8 + Math.random() * 1.5;
    fringeCtx.lineCap = 'round';
    fringeCtx.beginPath(); fringeCtx.moveTo(bx, by);
    const sw = (Math.random() - 0.5) * 7;
    fringeCtx.quadraticCurveTo(bx + sw * 0.6, by - bl * 0.5, bx + sw, by - bl);
    fringeCtx.stroke();
  }
  const fringeTex = new THREE.CanvasTexture(fringeTexCanvas);
  fringeTex.wrapS = fringeTex.wrapT = THREE.RepeatWrapping;
  fringeTex.repeat.set(6, 5);
  fringeTex.anisotropy = 8;
  const fringeGeo = new THREE.BoxGeometry(CW + 2.5, 0.18, CH + 2.5);
  const fringeMat = new THREE.MeshStandardMaterial({ color: biome ? biome.fringeColor : 0x267840, roughness: 0.88, map: fringeTex });
  const fringe = new THREE.Mesh(fringeGeo, fringeMat);
  fringe.position.set(CW / 2, -0.16, CH / 2);
  fringe.receiveShadow = true;
  cg.add(fringe);

  // Border walls
  const bThick = 0.45;
  const borders = [
    { x: CW / 2, z: -bThick / 2, w: CW + bThick * 2, d: bThick },
    { x: CW / 2, z: CH + bThick / 2, w: CW + bThick * 2, d: bThick },
    { x: -bThick / 2, z: CH / 2, w: bThick, d: CH },
    { x: CW + bThick / 2, z: CH / 2, w: bThick, d: CH },
  ];
  borders.forEach(b => {
    const geo = new THREE.BoxGeometry(b.w, BORDER_H, b.d);
    const mesh = new THREE.Mesh(geo, borderMat);
    mesh.position.set(b.x, BORDER_H / 2, b.z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    cg.add(mesh);
    const capGeo = new THREE.BoxGeometry(b.w + 0.04, 0.08, b.d + 0.04);
    const capMesh = new THREE.Mesh(capGeo, borderTopMat);
    capMesh.position.set(b.x, BORDER_H + 0.04, b.z);
    capMesh.castShadow = true;
    cg.add(capMesh);
  });

  // Corner posts
  const corners = [[-bThick / 2, -bThick / 2], [CW + bThick / 2, -bThick / 2],
                    [-bThick / 2, CH + bThick / 2], [CW + bThick / 2, CH + bThick / 2]];
  corners.forEach(([cx, cz]) => {
    const postGeo = new THREE.CylinderGeometry(0.18, 0.18, BORDER_H + 0.2, 12);
    const post = new THREE.Mesh(postGeo, borderTopMat);
    post.position.set(cx, (BORDER_H + 0.2) / 2, cz);
    post.castShadow = true;
    cg.add(post);
    const bGeo = new THREE.SphereGeometry(0.14, 10, 10);
    const bMesh = new THREE.Mesh(bGeo, borderTopMat);
    bMesh.position.set(cx, BORDER_H + 0.3, cz);
    cg.add(bMesh);
  });

  // Hole (grouped for boss hole movement)
  const holeGroup = new THREE.Group();
  holeGroup.position.set(courseData.hx, 0, courseData.hz);

  const holeGeo = new THREE.CylinderGeometry(HOLE_R, HOLE_R, 0.35, 32);
  const holeMesh = new THREE.Mesh(holeGeo, holeMat);
  holeMesh.position.set(0, -0.12, 0);
  holeGroup.add(holeMesh);

  // Hole rim
  const rimGeo = new THREE.TorusGeometry(HOLE_R + 0.03, 0.06, 16, 48);
  const rimMesh = new THREE.Mesh(rimGeo, holeRimMat);
  rimMesh.rotation.x = -Math.PI / 2;
  rimMesh.position.set(0, 0.02, 0);
  holeGroup.add(rimMesh);
  const innerRingGeo = new THREE.CircleGeometry(HOLE_R, 32);
  const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x030303 });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.set(0, 0.008, 0);
  holeGroup.add(innerRing);

  // Flag pole
  const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.5, 12);
  const pole = new THREE.Mesh(poleGeo, flagPoleMat);
  pole.position.set(0, 1.75, 0);
  pole.castShadow = true;
  holeGroup.add(pole);
  const poleTipGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const poleTip = new THREE.Mesh(poleTipGeo, flagPoleMat);
  poleTip.position.set(0, 3.52, 0);
  holeGroup.add(poleTip);

  // Flag
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.quadraticCurveTo(0.5, -0.1, 0.9, -0.3);
  flagShape.lineTo(0, -0.65);
  const flagGeo = new THREE.ShapeGeometry(flagShape, 8);
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(0, 3.45, -0.01);
  flag.castShadow = true;
  holeGroup.add(flag);
  G.flagMeshRef = flag;

  // Hole glow ring
  const holeGlowGeo = new THREE.RingGeometry(HOLE_R + 0.05, HOLE_R + 0.5, 32);
  const holeGlowMat = new THREE.MeshBasicMaterial({
    color: 0x5dffd4, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide,
  });
  const holeGlow = new THREE.Mesh(holeGlowGeo, holeGlowMat);
  holeGlow.rotation.x = -Math.PI / 2;
  holeGlow.position.set(0, 0.01, 0);
  holeGroup.add(holeGlow);

  cg.add(holeGroup);
  G.holeGroupRef = holeGroup;

  // Tee markers
  for (let side = -1; side <= 1; side += 2) {
    const teeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6);
    const teeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    const tee = new THREE.Mesh(teeGeo, teeMat);
    tee.position.set(courseData.bx + side * 0.6, 0.125, courseData.bz);
    cg.add(tee);
    const topGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, roughness: 0.3 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(courseData.bx + side * 0.6, 0.26, courseData.bz);
    cg.add(top);
  }

  // Obstacles
  courseData.obs.forEach(ob => {
    if (ob.type === 'rect') addRectObstacleVisual(cg, ob, { woodMat, woodTopMat, wallMat, wallCapMat });
    else addCircleObstacleVisual(cg, ob, { rockMat, rockDarkMat, rockMossMat });
  });

  // Walls
  courseData.walls.forEach(w => {
    addWallVisual(cg, w, { wallMat, wallCapMat });
  });

  // Decorative trees
  const rng = mulberry32(courseData.bx * 1000 + courseData.hz * 100);
  for (let i = 0; i < 45; i++) {
    const tx = -20 + rng() * (CW + 40);
    const tz = -20 + rng() * (CH + 40);
    if (tx > -2 && tx < CW + 2 && tz > -2 && tz < CH + 2) continue;

    const treeType = rng();
    const biomeLeaf = biome ? biome.treeLeaf : [0x1e6b30, 0x267a38, 0x2e8840];
    const biomeTrunk = biome ? biome.treeTrunk : 0x6b4520;
    if (treeType < 0.4) {
      // Pine tree
      const trunkH = 1.2 + rng() * 0.8;
      const trunkGeo = new THREE.CylinderGeometry(0.1, 0.18, trunkH, 6);
      const trunkMat2 = new THREE.MeshStandardMaterial({ color: biomeTrunk, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat2);
      trunk.position.set(tx, trunkH / 2, tz);
      trunk.castShadow = true;
      cg.add(trunk);
      for (let layer = 0; layer < 3; layer++) {
        const lr = 1.3 - layer * 0.3;
        const lh = 1.6 - layer * 0.2;
        const lGeo = new THREE.ConeGeometry(lr, lh, 8);
        const shade = biomeLeaf[layer % biomeLeaf.length];
        const lMat = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.85 });
        const lMesh = new THREE.Mesh(lGeo, lMat);
        lMesh.position.set(tx, trunkH + 0.4 + layer * 0.7, tz);
        lMesh.castShadow = true;
        cg.add(lMesh);
      }
    } else if (treeType < 0.7) {
      // Round tree
      const trunkH = 1.0 + rng() * 0.6;
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, trunkH, 6);
      const trunkMat2 = new THREE.MeshStandardMaterial({ color: biomeTrunk, roughness: 0.85 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat2);
      trunk.position.set(tx, trunkH / 2, tz);
      trunk.castShadow = true;
      cg.add(trunk);
      const canopyR = 1.0 + rng() * 0.5;
      for (let c = 0; c < 4; c++) {
        const cr = canopyR * (0.5 + rng() * 0.35);
        const ca = rng() * Math.PI * 2;
        const coff = c === 0 ? 0 : canopyR * 0.3;
        const sGeo = new THREE.SphereGeometry(cr, 10, 8);
        const leafBase = new THREE.Color(biomeLeaf[c % biomeLeaf.length]);
        const hsl = {}; leafBase.getHSL(hsl);
        const sMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(hsl.h + rng() * 0.06, hsl.s + rng() * 0.1, hsl.l + rng() * 0.05),
          roughness: 0.85
        });
        const sMesh = new THREE.Mesh(sGeo, sMat);
        sMesh.position.set(tx + Math.cos(ca) * coff, trunkH + canopyR * 0.6, tz + Math.sin(ca) * coff);
        sMesh.castShadow = true;
        cg.add(sMesh);
      }
    } else {
      // Bush
      const bushN = 2 + Math.floor(rng() * 3);
      for (let b = 0; b < bushN; b++) {
        const br = 0.4 + rng() * 0.5;
        const ba = rng() * Math.PI * 2;
        const geoB = new THREE.SphereGeometry(br, 8, 6);
        const bushBase = new THREE.Color(biomeLeaf[b % biomeLeaf.length]);
        const bushHsl = {}; bushBase.getHSL(bushHsl);
        const matB = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(bushHsl.h + rng() * 0.06, bushHsl.s * (0.8 + rng() * 0.2), bushHsl.l * (0.85 + rng() * 0.2)),
          roughness: 0.9
        });
        const meshB = new THREE.Mesh(geoB, matB);
        meshB.position.set(tx + Math.cos(ba) * 0.3, br * 0.65, tz + Math.sin(ba) * 0.3);
        meshB.scale.y = 0.7;
        meshB.castShadow = true;
        cg.add(meshB);
      }
    }
  }

  // Flowers
  for (let i = 0; i < 30; i++) {
    const fx = -5 + rng() * (CW + 10);
    const fz = -5 + rng() * (CH + 10);
    if (fx > -0.5 && fx < CW + 0.5 && fz > -0.5 && fz < CH + 0.5) continue;
    const biomeFlowers = biome ? biome.flowerColors : [0xff6b6b, 0xffd93d, 0xc792ea, 0xff8a5c, 0x48dbfb, 0xff9ff3];
    const fColor = biomeFlowers[Math.floor(rng() * biomeFlowers.length)];
    const fGeo = new THREE.SphereGeometry(0.08 + rng() * 0.06, 6, 6);
    const fMat = new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.7 });
    const flower = new THREE.Mesh(fGeo, fMat);
    flower.position.set(fx, 0.12 + rng() * 0.08, fz);
    cg.add(flower);
    const stemGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.15, 4);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d6b30, roughness: 0.9 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(fx, 0.06, fz);
    cg.add(stem);
  }

  // Sand patches
  courseData.obs.forEach((ob, idx) => {
    if (ob.passThrough) return;
    if (idx % 3 !== 0) return;
    const sx = ob.x + (ob.type === 'rect' ? ob.w * 0.6 : ob.r * 1.2);
    const sz = ob.z;
    if (sx < 1 || sx > CW - 1 || sz < 1 || sz > CH - 1) return;
    const sandGeo = new THREE.CircleGeometry(0.6 + Math.random() * 0.4, 12);
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(sx, 0.006, sz);
    cg.add(sand);
  });

  // Stepping stone path
  {
    const pathStartX = 2 + rng() * 8;
    const pathStartZ = CH * 0.3 + rng() * CH * 0.4;
    const pathAngle = rng() * 0.6 - 0.3;
    const numStones = 4 + Math.floor(rng() * 4);
    for (let s = 0; s < numStones; s++) {
      const stoneX = pathStartX + s * (1.6 + rng() * 0.6) * Math.cos(pathAngle);
      const stoneZ = pathStartZ + s * (1.6 + rng() * 0.6) * Math.sin(pathAngle) + (rng() - 0.5) * 0.4;
      if (stoneX < 0.5 || stoneX > CW - 0.5 || stoneZ < 0.5 || stoneZ > CH - 0.5) continue;
      const sR = 0.2 + rng() * 0.15;
      const stoneGeo = new THREE.CylinderGeometry(sR, sR + 0.03, 0.06, 7 + Math.floor(rng() * 4));
      const shade = 0.55 + rng() * 0.2;
      const stoneMat2 = new THREE.MeshStandardMaterial({
        color: new THREE.Color(shade, shade, shade * 0.95), roughness: 0.85,
      });
      const stone = new THREE.Mesh(stoneGeo, stoneMat2);
      stone.position.set(stoneX, 0.03, stoneZ);
      stone.rotation.y = rng() * Math.PI;
      stone.receiveShadow = true;
      cg.add(stone);
    }
  }

  // Garden patch
  {
    const gpx = CW * 0.3 + rng() * CW * 0.4;
    const gpz = 2 + rng() * 4;
    const gardenR = 0.8 + rng() * 0.6;
    const borderGeo2 = new THREE.TorusGeometry(gardenR, 0.06, 6, 20);
    const borderMat3 = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.8 });
    const borderMesh2 = new THREE.Mesh(borderGeo2, borderMat3);
    borderMesh2.rotation.x = -Math.PI / 2;
    borderMesh2.position.set(gpx, 0.06, gpz);
    cg.add(borderMesh2);
    const soilGeo = new THREE.CircleGeometry(gardenR - 0.05, 20);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.95 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.position.set(gpx, 0.008, gpz);
    cg.add(soil);
    const miniColors = biome ? biome.flowerColors.slice(0, 5) : [0xff4466, 0xffaa33, 0xff66aa, 0xffdd44, 0xaa44ff];
    for (let mf = 0; mf < 6 + Math.floor(rng() * 5); mf++) {
      const ma = rng() * Math.PI * 2;
      const md = rng() * (gardenR - 0.2);
      const mGeo = new THREE.SphereGeometry(0.04 + rng() * 0.03, 5, 5);
      const mMat = new THREE.MeshStandardMaterial({
        color: miniColors[Math.floor(rng() * miniColors.length)], roughness: 0.6,
      });
      const mMesh = new THREE.Mesh(mGeo, mMat);
      mMesh.position.set(gpx + Math.cos(ma) * md, 0.04 + rng() * 0.04, gpz + Math.sin(ma) * md);
      cg.add(mMesh);
    }
  }

  // Mushrooms
  for (let mi = 0; mi < 2 + Math.floor(rng() * 3); mi++) {
    const mx = 2 + rng() * (CW - 4);
    const mz = 2 + rng() * (CH - 4);
    if (dist(mx, mz, courseData.bx, courseData.bz) < 2.5) continue;
    if (dist(mx, mz, courseData.hx, courseData.hz) < 2.5) continue;
    const numMush = 1 + Math.floor(rng() * 3);
    for (let m = 0; m < numMush; m++) {
      const offX = (rng() - 0.5) * 0.5;
      const offZ = (rng() - 0.5) * 0.5;
      const mh = 0.1 + rng() * 0.12;
      const mr = 0.06 + rng() * 0.06;
      const stemGeo2 = new THREE.CylinderGeometry(mr * 0.35, mr * 0.45, mh, 6);
      const stemMat2 = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.8 });
      const stem = new THREE.Mesh(stemGeo2, stemMat2);
      stem.position.set(mx + offX, mh / 2, mz + offZ);
      cg.add(stem);
      const isRed = rng() > 0.5;
      const mushCaps = biome ? biome.mushroomCap : [0xcc2222, 0xc8a050];
      const capGeo = new THREE.SphereGeometry(mr, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({
        color: isRed ? mushCaps[0] : mushCaps[1], roughness: 0.6,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(mx + offX, mh, mz + offZ);
      cg.add(cap);
      if (isRed) {
        for (let wd = 0; wd < 3; wd++) {
          const da = rng() * Math.PI * 2;
          const dotGeo = new THREE.SphereGeometry(0.012, 4, 4);
          const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const dotM = new THREE.Mesh(dotGeo, dotMat);
          dotM.position.set(mx + offX + Math.cos(da) * mr * 0.6, mh + 0.01, mz + offZ + Math.sin(da) * mr * 0.6);
          cg.add(dotM);
        }
      }
    }
  }

  // Wooden bench
  {
    const benchSide = rng() > 0.5;
    const benchX = benchSide ? CW - 0.3 : 0.3;
    const benchZ = 5 + rng() * (CH - 10);
    const benchGroup2 = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(0.6, 0.06, 1.2);
    const benchWood = new THREE.MeshStandardMaterial({ color: 0x8b6b42, roughness: 0.7 });
    const seat = new THREE.Mesh(seatGeo, benchWood);
    seat.position.y = 0.35;
    benchGroup2.add(seat);
    const backGeo = new THREE.BoxGeometry(0.06, 0.35, 1.1);
    const back = new THREE.Mesh(backGeo, benchWood);
    back.position.set(benchSide ? -0.25 : 0.25, 0.5, 0);
    benchGroup2.add(back);
    for (let lz = -0.45; lz <= 0.45; lz += 0.9) {
      const legGeo = new THREE.BoxGeometry(0.06, 0.35, 0.06);
      const leg = new THREE.Mesh(legGeo, benchWood);
      leg.position.set(0, 0.175, lz);
      benchGroup2.add(leg);
    }
    benchGroup2.position.set(benchX, 0, benchZ);
    benchGroup2.castShadow = true;
    cg.add(benchGroup2);
  }

  // Bridge
  {
    const bridgeX = CW * 0.4 + rng() * CW * 0.2;
    const bridgeZ = CH * 0.35 + rng() * CH * 0.3;
    const bridgeLen = 2.5;
    const bridgeW = 1.0;
    const ditchGeo = new THREE.BoxGeometry(bridgeW + 0.4, 0.15, bridgeLen + 0.6);
    const ditchMat = new THREE.MeshStandardMaterial({ color: 0x1a3a28, roughness: 0.95 });
    const ditch = new THREE.Mesh(ditchGeo, ditchMat);
    ditch.position.set(bridgeX, -0.08, bridgeZ);
    cg.add(ditch);
    const bridgeWood = new THREE.MeshStandardMaterial({ color: 0x9a7045, roughness: 0.65 });
    for (let p = -4; p <= 4; p++) {
      const plankGeo = new THREE.BoxGeometry(bridgeW * 0.95, 0.05, 0.22);
      const plank = new THREE.Mesh(plankGeo, bridgeWood);
      plank.position.set(bridgeX, 0.035, bridgeZ + p * 0.28);
      plank.castShadow = true;
      cg.add(plank);
    }
    for (let side = -1; side <= 1; side += 2) {
      for (let pz = -1; pz <= 1; pz += 2) {
        const postGeo2 = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
        const post = new THREE.Mesh(postGeo2, bridgeWood);
        post.position.set(bridgeX + side * bridgeW * 0.45, 0.25, bridgeZ + pz * bridgeLen * 0.4);
        cg.add(post);
      }
      const railGeo = new THREE.CylinderGeometry(0.02, 0.02, bridgeLen * 0.85, 6);
      const rail = new THREE.Mesh(railGeo, bridgeWood);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(bridgeX + side * bridgeW * 0.45, 0.42, bridgeZ);
      cg.add(rail);
    }
  }

  // ---- Ponds with fish ----
  const pondPositions = [
    { x: -5 + rng() * 4, z: 5 + rng() * (CH - 10), r: 2.0 + rng() * 1.5 },
    { x: CW + 2 + rng() * 4, z: 4 + rng() * (CH - 8), r: 1.5 + rng() * 1.2 },
  ];
  if (rng() > 0.5) {
    const side = rng() > 0.5 ? -6 : CW + 3;
    pondPositions.push({ x: side + rng() * 3, z: CH * 0.3 + rng() * CH * 0.4, r: 1.2 + rng() * 0.8 });
  }

  pondPositions.forEach((pond) => {
    const pondX = pond.x, pondZ = pond.z, pondR = pond.r;

    const bedGeo = new THREE.CircleGeometry(pondR + 0.2, 28);
    const bedMat2 = new THREE.MeshStandardMaterial({ color: biome ? biome.pondBed : 0x14384e, roughness: 0.95 });
    const bed = new THREE.Mesh(bedGeo, bedMat2);
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(pondX, -0.05, pondZ);
    cg.add(bed);

    const bankGeo = new THREE.RingGeometry(pondR - 0.05, pondR + 0.4, 28);
    const bankMat2 = new THREE.MeshStandardMaterial({ color: 0xc4ad7a, roughness: 0.9 });
    const bank = new THREE.Mesh(bankGeo, bankMat2);
    bank.rotation.x = -Math.PI / 2;
    bank.position.set(pondX, -0.02, pondZ);
    cg.add(bank);

    const waterGeo = new THREE.CircleGeometry(pondR - 0.1, 28);
    const waterClone = waterMat.clone();
    if (biome) waterClone.color.setHex(biome.waterColor);
    const water = new THREE.Mesh(waterGeo, waterClone);
    water.rotation.x = -Math.PI / 2;
    water.position.set(pondX, 0.0, pondZ);
    cg.add(water);
    G.waterMeshRefs.push(water);

    // Lily pads
    const numLilies = 2 + Math.floor(rng() * 3);
    for (let lp = 0; lp < numLilies; lp++) {
      const la = rng() * Math.PI * 2;
      const ld = pondR * 0.2 + rng() * pondR * 0.5;
      const lilyR = 0.15 + rng() * 0.14;
      const lilyShape = new THREE.Shape();
      const segments = 20;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 1.85 + 0.15;
        const x = Math.cos(a) * lilyR;
        const y = Math.sin(a) * lilyR;
        if (s === 0) lilyShape.moveTo(x, y);
        else lilyShape.lineTo(x, y);
      }
      lilyShape.lineTo(0, 0);
      const lilyGeo = new THREE.ShapeGeometry(lilyShape);
      const shade = rng() > 0.5 ? 0x2d8838 : 0x358540;
      const lilyMat2 = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.65, side: THREE.DoubleSide });
      const lily = new THREE.Mesh(lilyGeo, lilyMat2);
      lily.rotation.x = -Math.PI / 2;
      lily.rotation.z = rng() * Math.PI * 2;
      lily.position.set(pondX + Math.cos(la) * ld, 0.012, pondZ + Math.sin(la) * ld);
      cg.add(lily);
      if (rng() > 0.5) {
        const petalColors = [0xffb7c5, 0xffffff, 0xfff0b0];
        const pc = petalColors[Math.floor(rng() * petalColors.length)];
        const flGeo = new THREE.SphereGeometry(0.05, 6, 6);
        const flMat2 = new THREE.MeshStandardMaterial({ color: pc, roughness: 0.5 });
        const fl = new THREE.Mesh(flGeo, flMat2);
        fl.position.set(pondX + Math.cos(la) * ld, 0.05, pondZ + Math.sin(la) * ld);
        fl.scale.y = 0.5;
        cg.add(fl);
      }
    }

    // Reeds
    const numReeds = 4 + Math.floor(rng() * 4);
    for (let r = 0; r < numReeds; r++) {
      const ra = rng() * Math.PI * 2;
      const rd = pondR * (0.85 + rng() * 0.3);
      const reedH = 0.5 + rng() * 0.7;
      const reedGeo = new THREE.CylinderGeometry(0.012, 0.022, reedH, 4);
      const reedMat2 = new THREE.MeshStandardMaterial({ color: 0x4a7a35, roughness: 0.9 });
      const reed = new THREE.Mesh(reedGeo, reedMat2);
      const rx = pondX + Math.cos(ra) * rd;
      const rz = pondZ + Math.sin(ra) * rd;
      reed.position.set(rx, reedH / 2, rz);
      reed.rotation.z = (rng() - 0.5) * 0.15;
      cg.add(reed);
      if (rng() > 0.4) {
        const catGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.12, 6);
        const catMat2 = new THREE.MeshStandardMaterial({ color: 0x5c3a1a, roughness: 0.95 });
        const cat = new THREE.Mesh(catGeo, catMat2);
        cat.position.set(rx, reedH + 0.04, rz);
        cg.add(cat);
      }
    }

    // Rocks at edge
    for (let sr = 0; sr < 3; sr++) {
      const sra = rng() * Math.PI * 2;
      const srd = pondR * (0.9 + rng() * 0.2);
      const stoneR = 0.08 + rng() * 0.12;
      const stoneGeo = new THREE.DodecahedronGeometry(stoneR, 0);
      const stoneMat2 = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat2);
      stone.position.set(pondX + Math.cos(sra) * srd, stoneR * 0.3, pondZ + Math.sin(sra) * srd);
      stone.scale.y = 0.5;
      cg.add(stone);
    }

    // Fish
    const numFish = 2 + Math.floor(rng() * 2);
    for (let fi = 0; fi < numFish; fi++) {
      const fishGroup = new THREE.Group();
      const fishColors = [0xff6633, 0xe8c840, 0xff4444, 0xffa020, 0xcc3300];
      const fColor = fishColors[Math.floor(rng() * fishColors.length)];
      const fishMat2 = new THREE.MeshPhysicalMaterial({
        color: fColor, roughness: 0.2, metalness: 0.3, clearcoat: 0.8,
      });

      const bodyGeo = new THREE.SphereGeometry(0.12, 10, 8);
      const body = new THREE.Mesh(bodyGeo, fishMat2);
      body.scale.set(1.8, 0.7, 1);
      fishGroup.add(body);

      const bellyGeo = new THREE.SphereGeometry(0.1, 8, 6);
      const bellyMat2 = new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 0.3 });
      const belly = new THREE.Mesh(bellyGeo, bellyMat2);
      belly.scale.set(1.5, 0.4, 0.8);
      belly.position.y = -0.03;
      fishGroup.add(belly);

      const tailShape = new THREE.Shape();
      tailShape.moveTo(0, 0);
      tailShape.quadraticCurveTo(-0.08, 0.06, -0.15, 0.1);
      tailShape.lineTo(-0.12, 0);
      tailShape.lineTo(-0.15, -0.1);
      tailShape.quadraticCurveTo(-0.08, -0.06, 0, 0);
      const tailGeo = new THREE.ShapeGeometry(tailShape);
      const tailMat2 = new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.3, side: THREE.DoubleSide });
      const tail = new THREE.Mesh(tailGeo, tailMat2);
      tail.position.set(-0.2, 0, 0);
      tail.rotation.y = Math.PI / 2;
      fishGroup.add(tail);

      const dorsalShape = new THREE.Shape();
      dorsalShape.moveTo(-0.05, 0);
      dorsalShape.quadraticCurveTo(0, 0.06, 0.08, 0);
      const dorsalGeo = new THREE.ShapeGeometry(dorsalShape);
      const dorsal = new THREE.Mesh(dorsalGeo, tailMat2);
      dorsal.position.set(0.02, 0.07, 0);
      fishGroup.add(dorsal);

      for (let side = -1; side <= 1; side += 2) {
        const eyeGeo = new THREE.SphereGeometry(0.015, 6, 6);
        const eyeMat2 = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat2);
        eye.position.set(0.16, 0.01, side * 0.06);
        fishGroup.add(eye);
      }

      const fAngle = rng() * Math.PI * 2;
      const fDist = rng() * pondR * 0.5;
      fishGroup.position.set(pondX + Math.cos(fAngle) * fDist, -0.02, pondZ + Math.sin(fAngle) * fDist);
      fishGroup.rotation.y = fAngle;
      fishGroup.scale.setScalar(0.7 + rng() * 0.4);
      scene.add(fishGroup);

      G.fishList.push({
        mesh: fishGroup, tail,
        pondX, pondZ, pondR,
        angle: fAngle,
        speed: 0.3 + rng() * 0.4,
        swimRadius: pondR * (0.2 + rng() * 0.4),
        phaseOffset: rng() * Math.PI * 2,
        jumpTime: -1,
        jumpInterval: 3 + rng() * 5,
        lastJump: rng() * -5,
        jumpDuration: 0.9 + rng() * 0.4,
        jumpHeight: 0.7 + rng() * 0.5,
      });
    }
  });

  // Splash particle pool
  for (let sp = 0; sp < 15; sp++) {
    const spGeo = new THREE.SphereGeometry(0.025, 4, 4);
    const spMat2 = new THREE.MeshBasicMaterial({
      color: 0xcceeff, transparent: true, opacity: 0.7, depthWrite: false
    });
    const spMesh = new THREE.Mesh(spGeo, spMat2);
    spMesh.visible = false;
    scene.add(spMesh);
    G.splashParticles.push({
      mesh: spMesh, active: false,
      vx: 0, vy: 0, vz: 0, life: 0,
    });
  }

  // ---- Build Secret Objects ----
  if (G.secretMesh) { cg.remove(G.secretMesh); G.secretMesh = null; }
  if (G.secretTargetMeshes) G.secretTargetMeshes.forEach(m => cg.remove(m));
  G.secretTargetMeshes = [];

  if (G.secretData) {
    const crystalGeo = new THREE.OctahedronGeometry(0.25, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: G.secretData.type === 'simple' ? 0x8844ff : 0x6622cc,
      roughness: 0.05, metalness: 0.3, clearcoat: 1.0,
      transparent: true, opacity: G.secretData.type === 'simple' ? 0.7 : 0.3,
      emissive: 0x6622cc, emissiveIntensity: 0.5,
    });
    G.secretMesh = new THREE.Mesh(crystalGeo, crystalMat);
    G.secretMesh.position.set(G.secretData.crystal.x, 0.35, G.secretData.crystal.z);
    G.secretMesh.castShadow = true;
    cg.add(G.secretMesh);

    const glowGeo = new THREE.RingGeometry(0.15, 0.6, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xaa66ff, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(G.secretData.crystal.x, 0.01, G.secretData.crystal.z);
    cg.add(glow);

    if (G.secretData.type === 'pattern') {
      G.secretData.targets.forEach((tgt, idx) => {
        const runeGroup = new THREE.Group();
        const stoneGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.15, 6);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.7, metalness: 0.1 });
        const stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.y = 0.075;
        runeGroup.add(stone);
        const ringGeo = new THREE.TorusGeometry(0.18, 0.025, 6, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xaa66ff, transparent: true, opacity: 0.4 + idx * 0.15,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.16;
        runeGroup.add(ring);
        for (let d = 0; d <= idx; d++) {
          const dotGeo = new THREE.SphereGeometry(0.03, 6, 6);
          const dotMat = new THREE.MeshBasicMaterial({ color: 0xcc88ff });
          const dot = new THREE.Mesh(dotGeo, dotMat);
          const da = (d / (idx + 1)) * Math.PI * 2;
          dot.position.set(Math.cos(da) * 0.1, 0.2, Math.sin(da) * 0.1);
          runeGroup.add(dot);
        }
        runeGroup.position.set(tgt.x, 0, tgt.z);
        cg.add(runeGroup);
        G.secretTargetMeshes.push(runeGroup);
      });
    }
  }

  // ---- Sparkle Lights ----
  if (G.sparkleLights) G.sparkleLights.forEach(sl => { if (sl.mesh) cg.remove(sl.mesh); });
  G.sparkleLights = [];
  G.lightsCollectedThisStroke = 0;

  const sparkleLevel = G.tournamentIndex * G.holesPerTournament + G.holeIndex;
  const sparkleColors = [
    { gem: 0x44ddff, glow: 0x22aadd, name: 'Aqua' },
    { gem: 0xff88cc, glow: 0xdd66aa, name: 'Rose' },
    { gem: 0xffdd44, glow: 0xddbb22, name: 'Gold' },
    { gem: 0x88ff66, glow: 0x66dd44, name: 'Jade' },
    { gem: 0xffaa44, glow: 0xdd8822, name: 'Amber' },
    { gem: 0xcc88ff, glow: 0xaa66dd, name: 'Violet' },
  ];

  let numSparkles, sparkleSpacing, sparkleStartDist, sparkleCollectRadius;
  if (sparkleLevel <= 2) {
    numSparkles = 3;
    sparkleSpacing = 1.0 + rng() * 0.5;
    sparkleStartDist = 2.0 + rng() * 1.0;
    sparkleCollectRadius = BALL_R + 0.6;
  } else if (sparkleLevel <= 5) {
    numSparkles = 4 + Math.floor(rng() * 2);
    sparkleSpacing = 1.5 + rng() * 0.8;
    sparkleStartDist = 2.5 + rng() * 1.5;
    sparkleCollectRadius = BALL_R + 0.4;
  } else {
    numSparkles = 5 + Math.floor(rng() * 3);
    sparkleSpacing = 2.0 + rng() * 1.5;
    sparkleStartDist = 3.5 + rng() * 2.0;
    sparkleCollectRadius = BALL_R + 0.3;
  }

  let bestAngle = rng() * Math.PI * 2;
  let bestCount = 0;
  for (let attempt = 0; attempt < 12; attempt++) {
    const tryAngle = rng() * Math.PI * 2;
    const tdx = Math.cos(tryAngle);
    const tdz = Math.sin(tryAngle);
    let count = 0;
    for (let si = 0; si < numSparkles; si++) {
      const d = sparkleStartDist + si * sparkleSpacing;
      const px = courseData.bx + tdx * d;
      const pz = courseData.bz + tdz * d;
      if (px >= 1.5 && px <= CW - 1.5 && pz >= 1.5 && pz <= CH - 1.5) count++;
      else break;
    }
    if (count > bestCount) { bestCount = count; bestAngle = tryAngle; }
    if (count >= numSparkles) break;
  }
  const oneShotDx = Math.cos(bestAngle);
  const oneShotDz = Math.sin(bestAngle);

  for (let si = 0; si < numSparkles; si++) {
    const d = sparkleStartDist + si * sparkleSpacing;
    const sx = courseData.bx + oneShotDx * d;
    const sz = courseData.bz + oneShotDz * d;
    if (sx < 1.5 || sx > CW - 1.5 || sz < 1.5 || sz > CH - 1.5) continue;

    const colorSet = sparkleColors[Math.floor(rng() * sparkleColors.length)];
    const reward = 3 + Math.floor(rng() * 6);
    const gemSize = sparkleLevel <= 2 ? 0.18 : sparkleLevel <= 5 ? 0.14 : 0.10;
    const haloSize = sparkleLevel <= 2 ? 0.4 : sparkleLevel <= 5 ? 0.3 : 0.22;

    const sparkleGroup = new THREE.Group();
    const gemGeo = new THREE.OctahedronGeometry(gemSize, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: colorSet.gem, roughness: 0.05, metalness: 0.4,
      clearcoat: 1.0, transparent: true, opacity: 0.85,
      emissive: colorSet.glow, emissiveIntensity: 0.6,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    sparkleGroup.add(gemMesh);

    const haloGeo = new THREE.RingGeometry(0.05, haloSize, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: colorSet.glow, transparent: true, opacity: 0.12,
      depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = -0.15;
    sparkleGroup.add(haloMesh);

    for (let oi = 0; oi < 2; oi++) {
      const orbGeo = new THREE.SphereGeometry(0.02, 4, 4);
      const orbMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.userData.orbitPhase = oi * Math.PI;
      sparkleGroup.add(orbMesh);
    }

    sparkleGroup.position.set(sx, 0.25, sz);
    cg.add(sparkleGroup);

    G.sparkleLights.push({
      x: sx, z: sz, reward, collected: false,
      mesh: sparkleGroup, gemMat, haloMat,
      phase: rng() * Math.PI * 2,
      colorName: colorSet.name,
      collectRadius: sparkleCollectRadius,
    });
  }
}

  function buildCourse2D(courseData) {
    const scene = G.scene;
    const courseGroup = G.courseGroup;

    scene.remove(courseGroup);
    G.courseGroup = new THREE.Group();
    scene.add(G.courseGroup);
    const cg = G.courseGroup;
    G.flagMeshRef = null;
    G.hazardMeshRefs = [];

    G.fishList.forEach(f => { scene.remove(f.mesh); });
    G.fishList = [];
    G.splashParticles.forEach(sp => { scene.remove(sp.mesh); });
    G.splashParticles = [];
    G.waterMeshRefs = [];

    const grassMat = G.grassMat;
    const borderMat = G.borderMat;
    const borderTopMat = G.borderTopMat;
    const holeMat = G.holeMat;
    const holeRimMat = G.holeRimMat;
    const wallMat = G.wallMat;
    const wallCapMat = G.wallCapMat;
    const flagPoleMat = G.flagPoleMat;
    const flagMat = G.flagMat;

    const surface = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), grassMat);
    surface.rotation.x = -Math.PI / 2;
    surface.position.set(CW / 2, 0.001, CH / 2);
    cg.add(surface);

    const borderThickness = 0.45;
    const borderHeight = 0.12;
    const borders = [
      { x: CW / 2, z: -borderThickness / 2, w: CW + borderThickness * 2, d: borderThickness },
      { x: CW / 2, z: CH + borderThickness / 2, w: CW + borderThickness * 2, d: borderThickness },
      { x: -borderThickness / 2, z: CH / 2, w: borderThickness, d: CH },
      { x: CW + borderThickness / 2, z: CH / 2, w: borderThickness, d: CH },
    ];
    borders.forEach(b => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, borderHeight, b.d), borderMat);
      mesh.position.set(b.x, borderHeight / 2, b.z);
      cg.add(mesh);
      const capMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.04, 0.05, b.d + 0.04), borderTopMat);
      capMesh.position.set(b.x, borderHeight + 0.025, b.z);
      cg.add(capMesh);
    });

    const holeGeo = new THREE.CylinderGeometry(HOLE_R, HOLE_R, 0.12, 24);
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.position.set(courseData.hx, 0.02, courseData.hz);
    cg.add(holeMesh);

    const rimGeo = new THREE.TorusGeometry(HOLE_R + 0.03, 0.05, 12, 32);
    const rimMesh = new THREE.Mesh(rimGeo, holeRimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(courseData.hx, 0.08, courseData.hz);
    cg.add(rimMesh);

    const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8);
    const pole = new THREE.Mesh(poleGeo, flagPoleMat);
    pole.position.set(courseData.hx, 1.2, courseData.hz);
    cg.add(pole);
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(0.95, -0.16);
    flagShape.lineTo(0, -0.42);
    const flag = new THREE.Mesh(new THREE.ShapeGeometry(flagShape), flagMat);
    flag.position.set(courseData.hx, 2.2, courseData.hz);
    flag.rotation.x = -Math.PI / 2;
    cg.add(flag);
    G.flagMeshRef = flag;

    const holeGlow = new THREE.Mesh(
      new THREE.RingGeometry(HOLE_R + 0.08, HOLE_R + 0.46, 28),
      new THREE.MeshBasicMaterial({ color: 0x5dffd4, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })
    );
    holeGlow.rotation.x = Math.PI / 2;
    holeGlow.position.set(courseData.hx, 0.02, courseData.hz);
    cg.add(holeGlow);

    const teeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 6);
    [1, -1].forEach(side => {
      const tee = new THREE.Mesh(teeGeo, new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.45 }));
      tee.position.set(courseData.bx + side * 0.5, 0.06, courseData.bz);
      cg.add(tee);
    });

    courseData.obs.forEach(ob => {
      if (ob.variant === 'spring_ring') {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(ob.r * 0.86, ob.r * 0.9, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0x2c235c, roughness: 0.45 }));
        base.position.set(ob.x, 0.04, ob.z);
        cg.add(base);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(ob.r * 0.7, 0.09, 10, 22), new THREE.MeshStandardMaterial({ color: ob.color ?? 0x5f53c7, roughness: 0.22, emissive: ob.detailColor ?? 0xb1a6ff, emissiveIntensity: 0.18 }));
        ring.rotation.x = Math.PI / 2;
        ring.position.set(ob.x, 0.11, ob.z);
        cg.add(ring);
        return;
      }

      if (ob.type === 'rect') {
        const height = ob.h || 0.18;
        const mat = new THREE.MeshStandardMaterial({ color: ob.color ?? 0x8b5a2b, roughness: 0.65 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(ob.w, height, ob.d), mat);
        mesh.position.set(ob.x, height / 2, ob.z);
        cg.add(mesh);
      } else {
        const mat = new THREE.MeshStandardMaterial({ color: ob.color ?? 0x70757a, roughness: 0.78 });
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(ob.r || 0.8, ob.r || 0.8, 0.12, 18), mat);
        mesh.position.set(ob.x, 0.06, ob.z);
        cg.add(mesh);
      }
    });

    courseData.walls.forEach(w => {
      const dx = w.x2 - w.x1;
      const dz = w.z2 - w.z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const midX = (w.x1 + w.x2) / 2;
      const midZ = (w.z1 + w.z2) / 2;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.18), wallMat);
      wall.position.set(midX, 0.04, midZ);
      wall.rotation.y = -angle;
      cg.add(wall);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(length + 0.02, 0.03, 0.22), wallCapMat);
      cap.position.set(midX, 0.085, midZ);
      cap.rotation.y = -angle;
      cg.add(cap);
    });

    G.ballMesh.visible = true;
    G.ballShadow.visible = false;
    G.ballMesh.position.set(courseData.bx, BALL_R, courseData.bz);
    G.ballShadow.position.set(courseData.bx, 0.005, courseData.bz);
  }
