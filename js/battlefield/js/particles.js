// particles.js — Explosions, muzzle flash, smoke, impacts
import * as THREE from 'three';

const _v = new THREE.Vector3();

// ── Particle Pool ──
class Particle {
  constructor() {
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.life = 0;
    this.maxLife = 1;
    this.size = 1;
    this.color = new THREE.Color(1, 1, 1);
    this.alive = false;
  }
}

export class ParticleSystem {
  constructor(scene, maxParticles = 2000) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < maxParticles; i++) this.pool.push(new Particle());

    // Instanced rendering
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexColors: false,
    });
    this.instancedMesh = new THREE.InstancedMesh(geo, mat, maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;
    this.instancedMesh.count = 0;
    scene.add(this.instancedMesh);

    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();
  }

  _getParticle() {
    for (const p of this.pool) {
      if (!p.alive) return p;
    }
    return null;
  }

  // ── Effects ──

  explosion(pos, scale = 1) {
    const count = Math.floor(40 * scale);
    for (let i = 0; i < count; i++) {
      const p = this._getParticle();
      if (!p) break;
      p.alive = true;
      p.position.copy(pos);
      p.velocity.set(
        (Math.random() - 0.5) * 16 * scale,
        Math.random() * 12 * scale,
        (Math.random() - 0.5) * 16 * scale
      );
      p.life = 0;
      p.maxLife = 0.6 + Math.random() * 0.8;
      p.size = (0.5 + Math.random() * 1.5) * scale;
      const t = Math.random();
      p.color.setRGB(1, 0.3 + t * 0.5, t * 0.2); // orange-yellow
    }
    // Smoke
    for (let i = 0; i < Math.floor(20 * scale); i++) {
      const p = this._getParticle();
      if (!p) break;
      p.alive = true;
      p.position.copy(pos);
      p.velocity.set(
        (Math.random() - 0.5) * 6 * scale,
        2 + Math.random() * 5 * scale,
        (Math.random() - 0.5) * 6 * scale
      );
      p.life = 0;
      p.maxLife = 1.5 + Math.random() * 2;
      p.size = (1 + Math.random() * 3) * scale;
      const g = 0.3 + Math.random() * 0.2;
      p.color.setRGB(g, g, g);
    }
  }

  muzzleFlash(pos, dir) {
    for (let i = 0; i < 5; i++) {
      const p = this._getParticle();
      if (!p) break;
      p.alive = true;
      p.position.copy(pos);
      p.velocity.copy(dir).multiplyScalar(8 + Math.random() * 5);
      p.velocity.x += (Math.random() - 0.5) * 3;
      p.velocity.y += (Math.random() - 0.5) * 3;
      p.velocity.z += (Math.random() - 0.5) * 3;
      p.life = 0;
      p.maxLife = 0.08 + Math.random() * 0.06;
      p.size = 0.2 + Math.random() * 0.3;
      p.color.setRGB(1, 0.9, 0.5);
    }
  }

  impact(pos) {
    for (let i = 0; i < 8; i++) {
      const p = this._getParticle();
      if (!p) break;
      p.alive = true;
      p.position.copy(pos);
      p.velocity.set(
        (Math.random() - 0.5) * 6,
        Math.random() * 4,
        (Math.random() - 0.5) * 6
      );
      p.life = 0;
      p.maxLife = 0.3 + Math.random() * 0.3;
      p.size = 0.15 + Math.random() * 0.2;
      const g = 0.5 + Math.random() * 0.3;
      p.color.setRGB(g, g * 0.9, g * 0.7);
    }
  }

  smoke(pos, count = 10) {
    for (let i = 0; i < count; i++) {
      const p = this._getParticle();
      if (!p) break;
      p.alive = true;
      p.position.copy(pos);
      p.position.x += (Math.random() - 0.5) * 2;
      p.position.z += (Math.random() - 0.5) * 2;
      p.velocity.set((Math.random() - 0.5) * 1, 1 + Math.random() * 2, (Math.random() - 0.5) * 1);
      p.life = 0;
      p.maxLife = 2 + Math.random() * 3;
      p.size = 1 + Math.random() * 2;
      const g = 0.4 + Math.random() * 0.15;
      p.color.setRGB(g, g, g);
    }
  }

  // ── Update ──
  update(dt, camera) {
    let count = 0;
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.alive = false;
        continue;
      }

      // Physics
      p.velocity.y -= 6 * dt; // gravity
      p.position.addScaledVector(p.velocity, dt);

      // Fade
      const t = p.life / p.maxLife;
      const alpha = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
      const scale = p.size * (1 + t * 0.5);

      // Billboard towards camera
      this._dummy.position.copy(p.position);
      this._dummy.lookAt(camera.position);
      this._dummy.scale.setScalar(scale);
      this._dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(count, this._dummy.matrix);

      this._color.copy(p.color).multiplyScalar(alpha);
      this.instancedMesh.setColorAt(count, this._color);

      count++;
    }
    this.instancedMesh.count = count;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;
  }
}
