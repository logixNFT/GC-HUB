import * as THREE from "three";
import { pathTo, type Cell, type Grid } from "./path";
import { S, T } from "./textures";

/** A blocky worker: walks a grid path between stations and works each one in turn. */

export interface Task {
  /** The block to stand beside, or a free cell to stand on. */
  target: Cell;
  /** What the name tag says while this task runs. */
  label: string;
  /** How long the work takes once there, ms. */
  act: number;
  /** Where to look while working. */
  look?: THREE.Vector3;
  /** What is in its hands from this task on; null empties them, undefined leaves them. */
  carry?: number | null;
  home?: boolean;
  /** First step of a job, so the backlog can be counted in jobs. */
  start?: boolean;
  onArrive?: (now: number) => void;
}

type RGB = [number, number, number];

const lambert = (t: THREE.Texture) => new THREE.MeshLambertMaterial({ map: t });

function limb(w: number, h: number, d: number, m: THREE.Material | THREE.Material[]) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.y = -h / 2;
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

export class Worker {
  readonly group = new THREE.Group();
  private body: THREE.Group;
  private head: THREE.Group;
  private armL: THREE.Group;
  private armR: THREE.Group;
  private legL: THREE.Group;
  private legR: THREE.Group;
  private carried: THREE.Mesh;
  private carriedMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  readonly pos: THREE.Vector3;
  private path: Cell[] = [];
  private tasks: Task[] = [];
  private current: Task | null = null;
  private actEnd = 0;
  private phase = 0;
  private yaw = 0;
  label = "on call";
  /** Height of the floor it stands on — the Overseer stands on its dais. */
  baseY = 0;
  asleep = false;
  offline = false;

  constructor(readonly id: string, private grid: Grid, start: Cell, shirt: RGB, pants: RGB, opts: { scale?: number; visor?: number } = {}) {
    // A space suit: white shell, the agent's colour on the chest and limbs, a glowing visor.
    const suitM = lambert(S.suit());
    const shirtM = lambert(T.wool(shirt, shirt.join()));
    const pantsM = lambert(T.wool(pants, pants.join()));
    const visorM = new THREE.MeshLambertMaterial({ map: S.visor(), emissive: opts.visor ?? 0x2ad8ff, emissiveIntensity: 0.55 });
    const packM = lambert(S.metal());

    this.body = new THREE.Group();
    this.body.position.y = 0.7;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.7, 0.28), [suitM, suitM, suitM, suitM, shirtM, suitM]);
    torso.position.y = 0.35;
    torso.castShadow = true;
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.18), packM);
    pack.position.set(0, 0.4, -0.22);
    pack.castShadow = true;
    this.body.add(torso, pack);

    this.head = new THREE.Group();
    this.head.position.y = 0.7;
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.5, 0.52), [suitM, suitM, suitM, suitM, visorM, suitM]);
    headMesh.position.y = 0.25;
    headMesh.castShadow = true;
    const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), packM);
    antenna.position.set(0.18, 0.62, -0.1);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: opts.visor ?? 0x2ad8ff }));
    tip.position.set(0.18, 0.8, -0.1);
    this.head.add(headMesh, antenna, tip);
    const skinM = shirtM;
    this.body.add(this.head);

    this.armL = limb(0.2, 0.66, 0.2, [suitM, suitM, suitM, skinM, suitM, suitM]);
    this.armL.position.set(-0.35, 0.68, 0);
    this.armR = limb(0.2, 0.66, 0.2, [suitM, suitM, suitM, skinM, suitM, suitM]);
    this.armR.position.set(0.35, 0.68, 0);
    this.body.add(this.armL, this.armR);

    this.legL = limb(0.24, 0.7, 0.24, pantsM);
    this.legL.position.set(-0.13, 0.7, 0);
    this.legR = limb(0.24, 0.7, 0.24, pantsM);
    this.legR.position.set(0.13, 0.7, 0);

    this.carried = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), this.carriedMat);
    this.carried.position.set(0, 0.42, 0.36);
    this.carried.castShadow = true;
    this.carried.visible = false;
    this.body.add(this.carried);

    this.group.add(this.body, this.legL, this.legR);
    this.group.scale.setScalar(0.92 * (opts.scale ?? 1));
    this.group.traverse((o) => (o.userData = { kind: "worker", id }));
    this.pos = new THREE.Vector3(start.x + 0.5, 0, start.z + 0.5);
    this.group.position.copy(this.pos);
  }

  get busy() {
    return this.current !== null || this.tasks.length > 0;
  }
  /** Jobs still waiting, not steps — a job is several stations. */
  get backlog() {
    return this.tasks.filter((t) => t.start).length;
  }

  /** Queue a job. A pending walk home is dropped, so back-to-back jobs flow on. */
  push(job: Task[]) {
    while (this.tasks.length && this.tasks[this.tasks.length - 1].home) this.tasks.pop();
    if (job[0]) job[0].start = true;
    this.tasks.push(...job);
  }

  private cell(): Cell {
    return { x: Math.floor(this.pos.x), z: Math.floor(this.pos.z) };
  }

  private turnTo(dx: number, dz: number, dt: number) {
    if (Math.abs(dx) + Math.abs(dz) < 1e-4) return;
    const want = Math.atan2(dx, dz);
    let d = want - this.yaw;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    this.yaw += d * Math.min(1, dt * 12);
  }

  update(dt: number, now: number, t: number) {
    // A backlog walks faster, so a burst of work is caught up rather than queued forever.
    const hurry = 1 + Math.min(2.5, this.tasks.length / 4);
    let walking = false;
    let working = false;

    if (!this.current && this.tasks.length) {
      this.current = this.tasks.shift()!;
      this.path = pathTo(this.grid, this.cell(), this.current.target);
      this.actEnd = 0;
      this.label = this.current.label;
    }
    const cur = this.current;
    if (cur) {
      if (this.path.length) {
        const next = this.path[0];
        const tx = next.x + 0.5, tz = next.z + 0.5;
        const dx = tx - this.pos.x, dz = tz - this.pos.z;
        const dist = Math.hypot(dx, dz);
        const step = 3.1 * hurry * dt;
        if (dist <= step) {
          this.pos.x = tx;
          this.pos.z = tz;
          this.path.shift();
        } else {
          this.pos.x += (dx / dist) * step;
          this.pos.z += (dz / dist) * step;
        }
        this.turnTo(dx, dz, dt);
        walking = true;
      } else {
        if (!this.actEnd) {
          this.actEnd = now + cur.act / hurry;
          if (cur.carry !== undefined) this.hold(cur.carry);
          cur.onArrive?.(now);
        }
        const look = cur.look ?? new THREE.Vector3(cur.target.x + 0.5, 0, cur.target.z + 0.5);
        this.turnTo(look.x - this.pos.x, look.z - this.pos.z, dt);
        working = !cur.home;
        if (now >= this.actEnd) {
          this.current = null;
          if (!this.tasks.length) this.label = this.asleep ? "asleep — overdue" : "waiting for the next scan";
        }
      }
    }

    // Pose
    this.phase += dt * (walking ? 10 * Math.min(hurry, 2) : 0);
    const swing = walking ? Math.sin(this.phase) * 0.7 : 0;
    const sit = this.asleep && !walking && !working;
    this.legL.rotation.x = sit ? -1.45 : swing;
    this.legR.rotation.x = sit ? -1.45 : -swing;
    // Low gravity: a walk is a series of small floating hops.
    const hop = walking ? Math.abs(Math.sin(this.phase * 0.5)) * 0.16 : Math.sin(t * 1.3 + this.id.length) * 0.02;
    this.body.position.y = sit ? 0.36 : 0.7 + hop;
    this.legL.position.y = this.legR.position.y = sit ? 0.36 : 0.7 + hop;
    const holding = this.carried.visible;
    if (working) {
      this.armR.rotation.x = -1.3 + Math.sin(t * 16) * 0.6;
      this.armL.rotation.x = holding ? -1.2 : -0.4;
    } else if (holding) {
      this.armR.rotation.x = this.armL.rotation.x = -1.15;
    } else {
      this.armR.rotation.x = -swing * 0.9;
      this.armL.rotation.x = swing * 0.9;
    }
    this.head.rotation.x = sit ? 0.35 + Math.sin(t * 1.2) * 0.05 : working ? 0.25 : 0;
    this.head.rotation.y = !walking && !working && !sit ? Math.sin(t * 0.7 + this.id.length) * 0.4 : 0;
    this.carried.rotation.y += dt * 1.5;

    this.group.position.set(this.pos.x, this.baseY, this.pos.z);
    this.group.rotation.y = this.yaw;
  }

  hold(color: number | null) {
    this.carried.visible = color !== null;
    if (color !== null) this.carriedMat.color.setHex(color);
  }

  /** Where the name tag sits. */
  tagPoint() {
    return new THREE.Vector3(this.pos.x, this.baseY + (this.asleep && !this.busy ? 1.6 : 2.15) * this.group.scale.y / 0.92, this.pos.z);
  }
}
