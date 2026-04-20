// player.js — First-person player controller with pointer lock
import * as THREE from 'three';
import { getTerrainHeight } from './world.js';

const PLAYER_HEIGHT = 1.7;
const MOVE_SPEED = 14;
const SPRINT_MULT = 1.8;
const JUMP_FORCE = 8;
const GRAVITY = 22;
const MOUSE_SENS = 0.002;

export class Player {
  constructor(camera, terrain) {
    this.camera = camera;
    this.terrain = terrain;
    this.position = new THREE.Vector3(0, 10, 0);
    this.velocity = new THREE.Vector3();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.onGround = false;

    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    this.kills = 0;
    this.deaths = 0;
    this.score = 0;

    // Input state
    this.keys = {};
    this.mouseDown = false;
    this.locked = false;
    this.sprinting = false;

    // Vehicle
    this.inVehicle = null;

    this._boundKeyDown = (e) => this._onKeyDown(e);
    this._boundKeyUp = (e) => this._onKeyUp(e);
    this._boundMouseMove = (e) => this._onMouseMove(e);
    this._boundMouseDown = () => { this.mouseDown = true; };
    this._boundMouseUp = () => { this.mouseDown = false; };
  }

  enable() {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
    document.addEventListener('mousemove', this._boundMouseMove);
    document.addEventListener('mousedown', this._boundMouseDown);
    document.addEventListener('mouseup', this._boundMouseUp);
  }

  disable() {
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    document.removeEventListener('mousemove', this._boundMouseMove);
    document.removeEventListener('mousedown', this._boundMouseDown);
    document.removeEventListener('mouseup', this._boundMouseUp);
    this.keys = {};
    this.mouseDown = false;
  }

  _onKeyDown(e) { this.keys[e.code] = true; }
  _onKeyUp(e) { this.keys[e.code] = false; }
  _onMouseMove(e) {
    if (!this.locked) return;
    this.euler.y -= e.movementX * MOUSE_SENS;
    this.euler.x -= e.movementY * MOUSE_SENS;
    this.euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.euler.x));
  }

  spawn(x, z) {
    const y = getTerrainHeight(this.terrain, x, z) + PLAYER_HEIGHT;
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.alive = true;
    this.euler.set(0, 0, 0, 'YXZ');
  }

  takeDamage(amount, source) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.alive = false;
      this.deaths++;
      return { died: true, source };
    }
    return { died: false };
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  update(dt) {
    if (!this.alive) return;
    if (this.inVehicle) return; // Vehicle handles movement

    this.sprinting = !!this.keys['ShiftLeft'];
    const speed = MOVE_SPEED * (this.sprinting ? SPRINT_MULT : 1);

    // Direction from camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.euler.y, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, this.euler.y, 0));

    const move = new THREE.Vector3();
    if (this.keys['KeyW']) move.add(forward);
    if (this.keys['KeyS']) move.sub(forward);
    if (this.keys['KeyD']) move.add(right);
    if (this.keys['KeyA']) move.sub(right);
    if (move.lengthSq() > 0) move.normalize();

    this.velocity.x = move.x * speed;
    this.velocity.z = move.z * speed;

    // Jump
    if (this.keys['Space'] && this.onGround) {
      this.velocity.y = JUMP_FORCE;
      this.onGround = false;
    }

    // Gravity
    this.velocity.y -= GRAVITY * dt;

    // Apply
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Terrain collision
    const groundY = getTerrainHeight(this.terrain, this.position.x, this.position.z) + PLAYER_HEIGHT;
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.onGround = true;
    }

    // World bounds
    const BOUND = 240;
    this.position.x = Math.max(-BOUND, Math.min(BOUND, this.position.x));
    this.position.z = Math.max(-BOUND, Math.min(BOUND, this.position.z));

    // Update camera
    this.camera.position.copy(this.position);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  getForward() {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
  }

  getWorldDir() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }
}
