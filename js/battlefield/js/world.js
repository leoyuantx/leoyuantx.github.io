// world.js — Terrain, sky, buildings, trees, sandbags, trenches
import * as THREE from 'three';

// ── Terrain ──
export function createTerrain() {
  const size = 500;
  const segments = 200;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  // Vertex colors for ground variation (grass, dirt, rock)
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = fbm(x * 0.008, z * 0.008) * 18
            + fbm(x * 0.03, z * 0.03) * 4
            - craterField(x, z);
    pos.setY(i, y);
  }
  geo.computeVertexNormals();

  // Color based on height + slope
  const normals = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const nx = normals.getX(i), ny = normals.getY(i);
    const slope = 1 - ny; // 0=flat, ~1=steep

    // Base grass
    let r = 0.20 + Math.random() * 0.04;
    let g = 0.35 + Math.random() * 0.05;
    let b = 0.04 + Math.random() * 0.03;

    // Dirt on slopes / craters
    if (slope > 0.15 || y < -1) {
      const t = Math.min(1, slope * 3);
      r = r * (1 - t) + 0.38 * t;
      g = g * (1 - t) + 0.30 * t;
      b = b * (1 - t) + 0.18 * t;
    }
    // Dark mud near water level
    if (y < 0.5) {
      const t = Math.min(1, (0.5 - y) * 2);
      r = r * (1 - t) + 0.18 * t;
      g = g * (1 - t) + 0.15 * t;
      b = b * (1 - t) + 0.10 * t;
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.0,
    flatShading: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

function hash(x, y) {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise2d(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y) {
  let v = 0, amp = 1, freq = 1;
  for (let i = 0; i < 5; i++) {
    v += noise2d(x * freq, y * freq) * amp;
    amp *= 0.5; freq *= 2;
  }
  return v;
}

// Pre-placed craters
const CRATERS = [];
for (let i = 0; i < 30; i++) {
  CRATERS.push({
    x: (Math.random() - 0.5) * 400,
    z: (Math.random() - 0.5) * 400,
    r: Math.random() * 8 + 4,
    d: Math.random() * 3 + 1,
  });
}

function craterField(x, z) {
  let v = 0;
  for (const c of CRATERS) {
    const dx = x - c.x, dz = z - c.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < c.r) {
      v += c.d * Math.cos((dist / c.r) * Math.PI * 0.5);
    }
  }
  return v;
}

export function getTerrainHeight(terrain, x, z) {
  const ray = new THREE.Raycaster(
    new THREE.Vector3(x, 100, z),
    new THREE.Vector3(0, -1, 0)
  );
  const hits = ray.intersectObject(terrain);
  return hits.length > 0 ? hits[0].point.y : 0;
}

// ── Sky ──
export function createSky(scene) {
  // Hemisphere light — warm sky / olive ground bounce
  const hemi = new THREE.HemisphereLight(0xc8d8f0, 0x405030, 0.7);
  scene.add(hemi);

  // Main sun — warm golden hour feel
  const sun = new THREE.DirectionalLight(0xffd9a0, 1.5);
  sun.position.set(100, 100, 80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 500;
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // Fill light from opposite side — cool blue
  const fill = new THREE.DirectionalLight(0x6688cc, 0.35);
  fill.position.set(-80, 60, -60);
  scene.add(fill);

  // Rim / back light
  const rim = new THREE.DirectionalLight(0xffe0c0, 0.3);
  rim.position.set(-40, 30, 100);
  scene.add(rim);

  // Fog — atmospheric haze
  scene.fog = new THREE.FogExp2(0x9aabbf, 0.0025);
  scene.background = new THREE.Color(0x7a99b8);

  // Water plane
  const waterGeo = new THREE.PlaneGeometry(600, 600);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2a5a7a,
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = -2;
  water.receiveShadow = true;
  water.name = 'water';
  scene.add(water);

  return { hemi, sun };
}

// ── Structures (buildings, sandbags, barrels) ──
export function createStructures(scene, terrain) {
  const group = new THREE.Group();
  group.name = 'structures';

  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
  const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x9b8b6e, roughness: 1 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 0.8, metalness: 0.3 });

  // Ruined buildings
  const buildingPositions = [
    { x: 40, z: 40, w: 14, h: 10, d: 10 },
    { x: -60, z: 30, w: 10, h: 8, d: 12 },
    { x: 20, z: -50, w: 16, h: 12, d: 10 },
    { x: -30, z: -70, w: 12, h: 9, d: 14 },
    { x: 80, z: -20, w: 10, h: 7, d: 10 },
    { x: -90, z: -40, w: 14, h: 11, d: 12 },
  ];

  for (const b of buildingPositions) {
    const y = getTerrainHeight(terrain, b.x, b.z);
    // Walls
    const wallGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const wall = new THREE.Mesh(wallGeo, buildingMat);
    wall.position.set(b.x, y + b.h / 2, b.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData = { type: 'building', health: 500 };
    group.add(wall);
    // Roof
    const roofGeo = new THREE.BoxGeometry(b.w + 1, 0.8, b.d + 1);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(b.x, y + b.h + 0.4, b.z);
    roof.castShadow = true;
    group.add(roof);
  }

  // Sandbag walls
  const sandbagPositions = [
    { x: 10, z: 0, rot: 0 }, { x: -20, z: 10, rot: Math.PI / 4 },
    { x: 50, z: -30, rot: Math.PI / 3 }, { x: -70, z: -10, rot: 0 },
    { x: 0, z: 60, rot: Math.PI / 2 }, { x: 30, z: -80, rot: 0.2 },
  ];
  for (const s of sandbagPositions) {
    const y = getTerrainHeight(terrain, s.x, s.z);
    const geo = new THREE.BoxGeometry(6, 1.5, 1.2);
    const mesh = new THREE.Mesh(geo, sandbagMat);
    mesh.position.set(s.x, y + 0.75, s.z);
    mesh.rotation.y = s.rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Barrels
  for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    const y = getTerrainHeight(terrain, x, z);
    const geo = new THREE.CylinderGeometry(0.5, 0.6, 1.4, 8);
    const mesh = new THREE.Mesh(geo, barrelMat);
    mesh.position.set(x, y + 0.7, z);
    mesh.castShadow = true;
    group.add(mesh);
  }

  // Trees — mix of conifers and deciduous
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.85 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3a6830, roughness: 0.85 });
  const deadLeafMat = new THREE.MeshStandardMaterial({ color: 0x4a4a35, roughness: 0.9 });

  for (let i = 0; i < 90; i++) {
    const x = (Math.random() - 0.5) * 460;
    const z = (Math.random() - 0.5) * 460;
    const y = getTerrainHeight(terrain, x, z);
    if (y < -1) continue; // Skip water areas
    const h = Math.random() * 6 + 6;
    const isDead = Math.random() < 0.2;
    const isDeciduous = Math.random() < 0.35;

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, h * 0.45, 6), trunkMat);
    trunk.position.set(x, y + h * 0.22, z);
    trunk.castShadow = true;
    group.add(trunk);

    if (isDead) {
      // Dead tree — just trunk and a few broken branches
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, h * 0.3, 4), trunkMat);
      branch.position.set(x + 0.3, y + h * 0.4, z);
      branch.rotation.z = 0.8;
      group.add(branch);
    } else if (isDeciduous) {
      // Round foliage
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(h * 0.3, 6, 5), leafMat2);
      foliage.position.set(x, y + h * 0.6, z);
      foliage.castShadow = true;
      group.add(foliage);
      // Second crown layer
      const f2 = new THREE.Mesh(new THREE.SphereGeometry(h * 0.22, 5, 4), leafMat);
      f2.position.set(x + 0.5, y + h * 0.75, z - 0.3);
      f2.castShadow = true;
      group.add(f2);
    } else {
      // Conifer — layered cones
      for (let layer = 0; layer < 3; layer++) {
        const layerH = h * 0.25;
        const layerR = h * (0.32 - layer * 0.07);
        const layerY = y + h * (0.38 + layer * 0.2);
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(layerR, layerH, 6),
          Math.random() < 0.5 ? leafMat : leafMat2
        );
        cone.position.set(x, layerY, z);
        cone.castShadow = true;
        group.add(cone);
      }
    }
  }

  // Rubble / debris near buildings
  const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x7a6b5b, roughness: 1 });
  for (const b of buildingPositions) {
    for (let i = 0; i < 6; i++) {
      const rx = b.x + (Math.random() - 0.5) * (b.w + 8);
      const rz = b.z + (Math.random() - 0.5) * (b.d + 8);
      const ry = getTerrainHeight(terrain, rx, rz);
      const size = 0.3 + Math.random() * 0.8;
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(size, size * 0.4, size * 0.7),
        rubbleMat
      );
      rubble.position.set(rx, ry + size * 0.2, rz);
      rubble.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
      rubble.castShadow = true;
      group.add(rubble);
    }
  }

  // Grass tufts (simple vertical planes scattered around)
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x486b30,
    roughness: 1,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.5,
  });
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;
    const y = getTerrainHeight(terrain, x, z);
    if (y < -0.5) continue;
    const gw = 0.6 + Math.random() * 0.5;
    const gh = 0.4 + Math.random() * 0.4;
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), grassMat);
    blade.position.set(x, y + gh * 0.5, z);
    blade.rotation.y = Math.random() * Math.PI;
    group.add(blade);
  }

  scene.add(group);
  return group;
}
