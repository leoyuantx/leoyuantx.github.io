// 3D Objects: ball, club, particles, trail, ambient effects, ground
import * as THREE from 'three';
import G from './globals.js';
import { CW, CH, BALL_R, HOLE_R } from './scene.js';

export function initObjects() {
  const scene = G.scene;

  // Course group
  G.courseGroup = new THREE.Group();
  scene.add(G.courseGroup);

  // Ball
  const ballGeo = new THREE.SphereGeometry(BALL_R, 48, 48);
  {
    const pos = ballGeo.attributes.position;
    const normal = ballGeo.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      const nx = normal.getX(i), ny = normal.getY(i), nz = normal.getZ(i);
      const theta = Math.atan2(nz, nx);
      const phi = Math.acos(ny);
      const dimple = Math.sin(theta * 14) * Math.sin(phi * 10) * 0.006;
      pos.setXYZ(i, pos.getX(i) + nx * dimple, pos.getY(i) + ny * dimple, pos.getZ(i) + nz * dimple);
    }
    ballGeo.computeVertexNormals();
  }
  G.ballMesh = new THREE.Mesh(ballGeo, G.ballMat);
  G.ballMesh.castShadow = true;
  G.ballMesh.position.y = BALL_R;
  scene.add(G.ballMesh);

  const ballShadowGeo = new THREE.CircleGeometry(BALL_R * 1.3, 24);
  const ballShadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false });
  G.ballShadow = new THREE.Mesh(ballShadowGeo, ballShadowMat);
  G.ballShadow.rotation.x = -Math.PI / 2;
  G.ballShadow.position.y = 0.005;
  scene.add(G.ballShadow);

  // ---- Golf Club ----
  const clubGroup = new THREE.Group();
  const clubPivot = new THREE.Group();
  clubPivot.add(clubGroup);
  scene.add(clubPivot);
  clubGroup.visible = false;
  G.clubGroup = clubGroup;
  G.clubPivot = clubPivot;

  // Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.022, 0.032, 2.8, 12);
  const shaft = new THREE.Mesh(shaftGeo, G.clubShaftMat);
  shaft.position.y = 1.55; shaft.castShadow = true;
  clubGroup.add(shaft);

  // Ferrule
  const ferruleGeo = new THREE.CylinderGeometry(0.038, 0.035, 0.08, 12);
  const ferrule = new THREE.Mesh(ferruleGeo, G.clubFerMat);
  ferrule.position.y = 0.15;
  clubGroup.add(ferrule);

  // Hosel
  const hoselGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.22, 10);
  const hosel = new THREE.Mesh(hoselGeo, G.clubHeadMat);
  hosel.position.set(0.02, 0.04, 0); hosel.rotation.z = -0.15; hosel.castShadow = true;
  clubGroup.add(hosel);

  // Grip
  {
    const gripPts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const r = 0.038 + Math.sin(t * Math.PI) * 0.012 + (1 - t) * 0.006;
      gripPts.push(new THREE.Vector2(r, t * 0.75));
    }
    const gripGeo = new THREE.LatheGeometry(gripPts, 16);
    const grip = new THREE.Mesh(gripGeo, G.clubGripMat);
    grip.position.y = 2.6; grip.castShadow = true;
    clubGroup.add(grip);
    const capGeo = new THREE.SphereGeometry(0.042, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, G.clubGripMat);
    cap.position.y = 3.35; clubGroup.add(cap);
    const ringGeo = new THREE.TorusGeometry(0.042, 0.008, 8, 16);
    const ring = new THREE.Mesh(ringGeo, G.clubFerMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 2.6;
    clubGroup.add(ring);
  }

  // Club head
  {
    const headGroup = new THREE.Group();
    const headShape = new THREE.Shape();
    headShape.moveTo(0, -0.06);
    headShape.bezierCurveTo(0.15, -0.07, 0.35, -0.065, 0.42, -0.04);
    headShape.bezierCurveTo(0.46, -0.02, 0.46, 0.02, 0.42, 0.04);
    headShape.bezierCurveTo(0.35, 0.065, 0.15, 0.07, 0, 0.06);
    headShape.bezierCurveTo(-0.04, 0.04, -0.04, -0.04, 0, -0.06);
    const extrudeSettings = { depth: 0.14, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 4 };
    const headGeo = new THREE.ExtrudeGeometry(headShape, extrudeSettings);
    headGeo.center();
    const headMesh = new THREE.Mesh(headGeo, G.clubHeadMat);
    headMesh.rotation.x = Math.PI / 2; headMesh.position.set(0.2, -0.04, 0); headMesh.castShadow = true;
    headGroup.add(headMesh);
    const faceGeo = new THREE.PlaneGeometry(0.38, 0.12, 1, 1);
    const faceMesh = new THREE.Mesh(faceGeo, G.clubFaceMat);
    faceMesh.position.set(0.2, -0.04, -0.082);
    headGroup.add(faceMesh);
    for (let i = -3; i <= 3; i++) {
      const grooveGeo = new THREE.BoxGeometry(0.28, 0.004, 0.003);
      const groove = new THREE.Mesh(grooveGeo, new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, metalness: 0.7 }));
      groove.position.set(0.2, -0.04 + i * 0.014, -0.084);
      headGroup.add(groove);
    }
    const cavityShape = new THREE.Shape();
    cavityShape.moveTo(-0.1, -0.03);
    cavityShape.bezierCurveTo(-0.05, -0.04, 0.1, -0.04, 0.15, -0.03);
    cavityShape.bezierCurveTo(0.18, -0.01, 0.18, 0.01, 0.15, 0.03);
    cavityShape.bezierCurveTo(0.1, 0.04, -0.05, 0.04, -0.1, 0.03);
    cavityShape.bezierCurveTo(-0.13, 0.01, -0.13, -0.01, -0.1, -0.03);
    const cavityGeo = new THREE.ShapeGeometry(cavityShape);
    const cavityMesh = new THREE.Mesh(cavityGeo, new THREE.MeshPhysicalMaterial({ color: 0x707880, roughness: 0.35, metalness: 0.9, clearcoat: 0.2 }));
    cavityMesh.position.set(0.22, -0.04, 0.075);
    headGroup.add(cavityMesh);
    const badgeGeo = new THREE.CircleGeometry(0.022, 16);
    const badge = new THREE.Mesh(badgeGeo, G.clubBadgeMat);
    badge.position.set(0.22, -0.02, 0.076);
    headGroup.add(badge);
    const soleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8, 1, false, 0, Math.PI);
    const sole = new THREE.Mesh(soleGeo, G.clubHeadMat);
    sole.rotation.z = Math.PI / 2; sole.rotation.y = Math.PI; sole.position.set(0.2, -0.1, 0);
    headGroup.add(sole);
    const edgeGeo = new THREE.BoxGeometry(0.4, 0.008, 0.02);
    const edge = new THREE.Mesh(edgeGeo, G.clubHeadMat);
    edge.position.set(0.2, -0.095, -0.065);
    headGroup.add(edge);
    clubGroup.add(headGroup);
  }

  // Aim arrow
  G.aimLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  const aimLineGeo = new THREE.BufferGeometry();
  aimLineGeo.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0,0,0], 3));
  G.aimLine = new THREE.Line(aimLineGeo, G.aimLineMat);
  G.aimLine.frustumCulled = false;
  scene.add(G.aimLine);

  G.aimDots = [];
  for (let i = 0; i < 8; i++) {
    const dotGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.visible = false; scene.add(dot);
    G.aimDots.push(dot);
  }

  // Sparkles for scoring
  G.sparkles = [];
  for (let i = 0; i < 20; i++) {
    const sg = new THREE.SphereGeometry(0.06, 8, 8);
    const sm = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
    const s = new THREE.Mesh(sg, sm);
    s.visible = false; scene.add(s);
    G.sparkles.push(s);
  }
  G.starSparkles = [];
  for (let i = 0; i < 8; i++) {
    const starShape = new THREE.Shape();
    const outerR = 0.12, innerR = 0.05, points = 5;
    for (let j = 0; j <= points * 2; j++) {
      const r = j % 2 === 0 ? outerR : innerR;
      const a = (j / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      if (j === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const sg = new THREE.ShapeGeometry(starShape);
    const sm = new THREE.MeshBasicMaterial({ color: 0xffe66d, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const s = new THREE.Mesh(sg, sm);
    s.visible = false; scene.add(s);
    G.starSparkles.push(s);
  }

  // Ground plane
  const groundTexCanvas = document.createElement('canvas');
  groundTexCanvas.width = 512; groundTexCanvas.height = 512;
  const groundTexCtx = groundTexCanvas.getContext('2d');
  const gndBase = groundTexCtx.createRadialGradient(256, 256, 0, 256, 256, 360);
  gndBase.addColorStop(0, '#267842'); gndBase.addColorStop(0.5, '#2e8848'); gndBase.addColorStop(1, '#1e6838');
  groundTexCtx.fillStyle = gndBase; groundTexCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 35; i++) {
    const px = Math.random() * 512, py = Math.random() * 512;
    const pr = 25 + Math.random() * 60;
    const hue = 85 + Math.random() * 50, sat = 40 + Math.random() * 30, lit = 18 + Math.random() * 22;
    const pg = groundTexCtx.createRadialGradient(px, py, 0, px, py, pr);
    pg.addColorStop(0, `hsla(${hue}, ${sat}%, ${lit}%, 0.25)`);
    pg.addColorStop(1, `hsla(${hue}, ${sat}%, ${lit}%, 0)`);
    groundTexCtx.fillStyle = pg; groundTexCtx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  for (let i = 0; i < 3000; i++) {
    const bx = Math.random() * 512, by = Math.random() * 512;
    const bl = 6 + Math.random() * 16;
    const hue = 80 + Math.random() * 55, sat = 38 + Math.random() * 38;
    const lit = 18 + Math.random() * 30, alpha = 0.12 + Math.random() * 0.22;
    groundTexCtx.strokeStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;
    groundTexCtx.lineWidth = 0.8 + Math.random() * 1.6; groundTexCtx.lineCap = 'round';
    groundTexCtx.beginPath(); groundTexCtx.moveTo(bx, by);
    const sway = (Math.random() - 0.5) * 8;
    groundTexCtx.quadraticCurveTo(bx + sway * 0.6, by - bl * 0.5, bx + sway, by - bl);
    groundTexCtx.stroke();
  }
  const wfColors = ['rgba(255,255,150,', 'rgba(255,200,220,', 'rgba(200,180,255,', 'rgba(255,255,255,'];
  for (let i = 0; i < 60; i++) {
    const fx = Math.random() * 512, fy = Math.random() * 512;
    const col = wfColors[Math.floor(Math.random() * wfColors.length)];
    groundTexCtx.fillStyle = col + (0.25 + Math.random() * 0.3) + ')';
    groundTexCtx.beginPath(); groundTexCtx.arc(fx, fy, 1.0 + Math.random() * 1.5, 0, Math.PI * 2);
    groundTexCtx.fill();
  }
  for (let i = 0; i < 20; i++) {
    const dx = Math.random() * 512, dy = Math.random() * 512;
    const dr = 5 + Math.random() * 12;
    groundTexCtx.fillStyle = `rgba(70,55,30,${0.07 + Math.random() * 0.08})`;
    groundTexCtx.beginPath(); groundTexCtx.ellipse(dx, dy, dr, dr * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    groundTexCtx.fill();
  }
  const groundTex = new THREE.CanvasTexture(groundTexCanvas);
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(20, 20); groundTex.anisotropy = 8;
  const groundGeo = new THREE.PlaneGeometry(400, 400);
  const groundMat2 = new THREE.MeshStandardMaterial({ color: 0x28803e, roughness: 0.85, map: groundTex });
  const ground = new THREE.Mesh(groundGeo, groundMat2);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(CW / 2, -0.06, CH / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- Ambient Floating Particles ----
  const particleCount = 80;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  G.particleData = [];
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = -10 + Math.random() * (CW + 20);
    particlePositions[i * 3 + 1] = 0.5 + Math.random() * 6;
    particlePositions[i * 3 + 2] = -10 + Math.random() * (CH + 20);
    G.particleData.push({
      vx: (Math.random() - 0.5) * 0.005, vy: (Math.random() - 0.5) * 0.003,
      vz: (Math.random() - 0.5) * 0.005, phase: Math.random() * Math.PI * 2,
    });
  }
  particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  G.particleMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.07, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  G.particles = new THREE.Points(particleGeo, G.particleMat);
  G.particleCount = particleCount;
  scene.add(G.particles);

  // ---- Fireflies ----
  const fireflyCount = 35;
  G.fireflies = [];
  for (let i = 0; i < fireflyCount; i++) {
    const ffGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 8, 8);
    const ffMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.12 + Math.random() * 0.08, 0.9, 0.6),
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const ffMesh = new THREE.Mesh(ffGeo, ffMat);
    ffMesh.position.set(-5 + Math.random() * (CW + 10), 0.3 + Math.random() * 3, -5 + Math.random() * (CH + 10));
    scene.add(ffMesh);
    const glowGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: ffMat.color.clone(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    ffMesh.add(glowMesh);
    G.fireflies.push({
      mesh: ffMesh, mat: ffMat, glowMat,
      baseX: ffMesh.position.x, baseY: ffMesh.position.y, baseZ: ffMesh.position.z,
      phase: Math.random() * Math.PI * 2, speed: 0.2 + Math.random() * 0.4,
      driftRadius: 1.5 + Math.random() * 3, pulseSpeed: 0.5 + Math.random() * 1.5,
      pulsePhase: Math.random() * Math.PI * 2, brightness: 0.4 + Math.random() * 0.6,
    });
  }

  // ---- Dandelion Seeds ----
  G.dandelionSeeds = [];
  for (let i = 0; i < 15; i++) {
    const seedGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 3);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xddddcc, transparent: true, opacity: 0.6 });
    seedGroup.add(new THREE.Mesh(stemGeo, stemMat));
    const fluffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
    for (let f = 0; f < 8; f++) {
      const fGeo = new THREE.CylinderGeometry(0.001, 0.003, 0.06, 3);
      const fMesh = new THREE.Mesh(fGeo, fluffMat);
      const fa = (f / 8) * Math.PI * 2;
      fMesh.position.set(Math.cos(fa) * 0.015, 0.06, Math.sin(fa) * 0.015);
      fMesh.rotation.x = Math.cos(fa) * 0.8; fMesh.rotation.z = Math.sin(fa) * 0.8;
      seedGroup.add(fMesh);
    }
    seedGroup.position.set(Math.random() * CW, 1 + Math.random() * 5, Math.random() * CH);
    scene.add(seedGroup);
    G.dandelionSeeds.push({
      mesh: seedGroup, vx: (Math.random() - 0.5) * 0.008, vy: (Math.random() - 0.5) * 0.002,
      vz: (Math.random() - 0.5) * 0.008, phase: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.02,
    });
  }

  // ---- Shooting Stars ----
  G.shootingStars = [];
  for (let i = 0; i < 3; i++) {
    const ssGeo = new THREE.BufferGeometry();
    const ssPositions = new Float32Array(6);
    ssGeo.setAttribute('position', new THREE.Float32BufferAttribute(ssPositions, 3));
    const ssMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, linewidth: 2, blending: THREE.AdditiveBlending, depthWrite: false });
    const ssLine = new THREE.Line(ssGeo, ssMat);
    scene.add(ssLine);
    const headGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xeeeeff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    scene.add(headMesh);
    G.shootingStars.push({
      line: ssLine, mat: ssMat, headMesh, headMat,
      active: false, nextTime: 5 + Math.random() * 20,
      startX: 0, startY: 0, startZ: 0, dirX: 0, dirY: 0, dirZ: 0,
      progress: 0, duration: 0, tailLen: 0,
    });
  }

  // ---- Ground Glow Spots ----
  G.groundGlows = [];
  for (let i = 0; i < 6; i++) {
    const ggGeo = new THREE.CircleGeometry(1.5 + Math.random() * 2, 16);
    const ggColor = new THREE.Color().setHSL(0.12 + Math.random() * 0.15, 0.4, 0.35);
    const ggMat = new THREE.MeshBasicMaterial({ color: ggColor, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const ggMesh = new THREE.Mesh(ggGeo, ggMat);
    ggMesh.rotation.x = -Math.PI / 2;
    ggMesh.position.set(3 + Math.random() * (CW - 6), 0.01, 3 + Math.random() * (CH - 6));
    scene.add(ggMesh);
    G.groundGlows.push({ mesh: ggMesh, mat: ggMat, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.4, maxOpacity: 0.04 + Math.random() * 0.06 });
  }

  // ---- Ball Trail ----
  const trailCount = 16;
  G.trailMeshes = [];
  G.trailPositions = [];
  for (let i = 0; i < trailCount; i++) {
    const tGeo = new THREE.SphereGeometry(BALL_R * (1 - i / trailCount) * 0.5, 6, 6);
    const tMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 * (1 - i / trailCount), depthWrite: false });
    const tMesh = new THREE.Mesh(tGeo, tMat);
    tMesh.visible = false; scene.add(tMesh);
    G.trailMeshes.push(tMesh);
    G.trailPositions.push({ x: 0, z: 0 });
  }
  G.trailCount = trailCount;
}
