import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Grid, type Cell } from "./path";
import { mat, S, sided } from "./textures";
import { Worker, type Task } from "./worker";

/**
 * GC HUB's deck of the orbital sim. Five bays round a central dais: each
 * crew agent walks the records in its own bay, carries what it finds to its
 * station, and posts it to the action board beside the dais. The Overseer
 * stands on the dais and turns each agent to the most important thing in its
 * area. Everything it shows comes from the sweeps in src/agents/sweeps.js,
 * run on the local data; drafting goes to Claude only when someone asks.
 */

export const W = 35;
export const H = 25;

type Severity = "act" | "watch" | "ok";
export interface Finding { agent: string; record: string; severity: Severity; title: string; detail: string }
export interface Directive { agent: string; severity: Severity; directive: string; why: string }
export interface OverseerOrders { source: "fable" | "rules"; model: string | null; summary: string; directives: Directive[] }
export interface CrewAgent { id: string; name: string; bay: string }
export interface AreaRecord { id: string; label: string }

export type Pick = { kind: "agent"; id: string } | { kind: "record"; agent: string; id: string } | { kind: "overseer" } | { kind: "board" };

interface Bay {
  agent: string;
  zone: { x0: number; z0: number; x1: number; z1: number };
  slots: Cell[];
  station: Cell;
  home: Cell;
  shirt: [number, number, number];
  tex: () => THREE.Texture;
}

const slots = (x0: number, z0: number, cols: number, rows: number): Cell[] =>
  Array.from({ length: cols * rows }, (_, i) => ({ x: x0 + 2 * (i % cols), z: z0 + 2 * Math.floor(i / cols) }));

const BAYS: Bay[] = [
  { agent: "documents", zone: { x0: 2, z0: 2, x1: 10, z1: 8 }, slots: slots(3, 3, 4, 3), station: { x: 12, z: 5 }, home: { x: 13, z: 7 }, shirt: [60, 140, 240], tex: () => S.screen() },
  { agent: "regulation", zone: { x0: 24, z0: 2, x1: 32, z1: 8 }, slots: slots(25, 3, 4, 3), station: { x: 22, z: 5 }, home: { x: 21, z: 7 }, shirt: [150, 90, 255], tex: () => S.crystal([150, 110, 255], "reg") },
  { agent: "permitting", zone: { x0: 2, z0: 15, x1: 10, z1: 22 }, slots: slots(3, 16, 4, 3), station: { x: 12, z: 18 }, home: { x: 13, z: 16 }, shirt: [240, 140, 40], tex: () => S.cargo() },
  { agent: "vendor", zone: { x0: 24, z0: 15, x1: 32, z1: 22 }, slots: slots(25, 16, 4, 3), station: { x: 22, z: 18 }, home: { x: 21, z: 16 }, shirt: [60, 200, 140], tex: () => S.metal() },
  { agent: "scope", zone: { x0: 13, z0: 19, x1: 21, z1: 23 }, slots: slots(13, 20, 5, 2), station: { x: 17, z: 17 }, home: { x: 19, z: 17 }, shirt: [240, 200, 60], tex: () => S.pad() },
];
const DAIS = { x: 16, z: 10, size: 3 };
const DAIS_C = new THREE.Vector3(DAIS.x + 1.5, 0, DAIS.z + 1.5);
const BOARD: Cell = { x: 20, z: 11 };
const SEV_HEX: Record<Severity, number> = { act: 0xff4d5e, watch: 0xffb547, ok: 0x3ddc84 };
const SEV_CSS: Record<Severity, string> = { act: "#ff4d5e", watch: "#ffb547", ok: "#3ddc84" };

const CSS = `
.gf-overlay{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:3}
.gf-overlay>*{position:absolute;left:0;top:0;white-space:nowrap;will-change:transform}
.gf-sign{font:10px "JetBrains Mono",ui-monospace,monospace;letter-spacing:1px;color:#39e1ff;background:rgba(4,20,36,.78);border:1px solid rgba(57,225,255,.55);padding:3px 6px;border-radius:2px;pointer-events:auto;cursor:pointer}
.gf-sign.on{color:#fff;border-color:#ff3df2;box-shadow:0 0 14px rgba(255,61,242,.6)}
.gf-bay{font:700 12px "JetBrains Mono",ui-monospace,monospace;letter-spacing:3px;color:rgba(57,225,255,.55);text-transform:uppercase}
.gf-tag{pointer-events:auto;cursor:pointer;text-align:center;background:rgba(4,8,20,.84);border:1px solid rgba(57,225,255,.35);border-radius:3px;padding:3px 7px 4px;max-width:250px}
.gf-tag b{display:block;font:700 9px "JetBrains Mono",ui-monospace,monospace;letter-spacing:1px;color:#39e1ff}
.gf-tag span{display:block;font:11px/1.3 "JetBrains Mono",ui-monospace,monospace;color:#d6e6f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}
.gf-tag[data-state=busy] b{color:#ff3df2}
.gf-boss span{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;max-width:300px}
.gf-boss{max-width:320px;border-color:#ffd479;box-shadow:0 0 16px rgba(255,212,121,.35)}
.gf-boss b{color:#ffd479;font-size:10px}
.gf-boss[data-state=alarm]{border-color:#ff4d5e;box-shadow:0 0 18px rgba(255,77,94,.5)}
.gf-rec{font:9px "JetBrains Mono",ui-monospace,monospace;color:#fff;padding:2px 4px;border-radius:2px}
.gf-float{font:700 13px "JetBrains Mono",ui-monospace,monospace;text-shadow:0 1px 0 #000,0 0 6px rgba(0,0,0,.8)}
.gf-scan{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55) 100%)}
@media (max-width:640px){.gf-rec{display:none}.gf-tag span{font-size:10px}.gf-bay{font-size:9px}}
`;

export interface FloorHooks { pick(p: Pick): void }

class RecordBlock {
  readonly mesh: THREE.Mesh;
  private mat: THREE.MeshLambertMaterial;
  severity: Severity = "ok";
  flashUntil = 0;
  constructor(readonly agent: string, public rec: AreaRecord, readonly cell: Cell, tex: THREE.Texture, geo: THREE.BoxGeometry) {
    this.mat = new THREE.MeshLambertMaterial({ map: tex, emissive: SEV_HEX.ok, emissiveIntensity: 0.15 });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    this.mesh.userData = { kind: "record", agent, id: rec.id };
    this.mesh.position.set(cell.x + 0.5, 0.45, cell.z + 0.5);
    this.mesh.scale.set(0.8, 0.9, 0.8);
  }
  top() { return new THREE.Vector3(this.cell.x + 0.5, 1, this.cell.z + 0.5); }
  update(t: number, now: number) {
    this.mat.emissive.setHex(SEV_HEX[this.severity]);
    const base = this.severity === "act" ? 0.45 + 0.25 * Math.sin(t * 4) : this.severity === "watch" ? 0.3 : 0.12;
    this.mat.emissiveIntensity = this.flashUntil > now ? 1 : base;
    this.mesh.position.y = 0.45 + (this.severity === "act" ? Math.abs(Math.sin(t * 2 + this.cell.x)) * 0.08 : 0);
  }
}

export class GcFloor {
  private scene = new THREE.Scene();
  private grid = new Grid(W, H);
  private geo = new THREE.BoxGeometry(1, 1, 1);
  private renderer: THREE.WebGLRenderer;
  private camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  private controls: OrbitControls;
  private overlay: HTMLDivElement;
  private ro: ResizeObserver;
  private running = true;
  private prev = performance.now();
  private fitted = false;
  private extent: { minX: number; maxX: number; minY: number; maxY: number } | null = null;
  private ray = new THREE.Raycaster();

  private crew = new Map<string, Worker>();
  private crewTags = new Map<string, HTMLElement>();
  private names = new Map<string, string>();
  private records = new Map<string, RecordBlock[]>();
  private recTags = new Map<string, HTMLElement>();
  private stationAt = new Map<string, { anchor: THREE.Vector3; group: THREE.Group; activeUntil: number }>();
  private signs = new Map<string, HTMLElement>();
  private bayTags: { el: HTMLElement; at: THREE.Vector3 }[] = [];
  private boardSign!: HTMLElement;
  private board!: THREE.Mesh;
  private boardUntil = 0;
  private floaters: { el: HTMLElement; at: THREE.Vector3; born: number }[] = [];
  private findings: Finding[] = [];
  private cursor = new Map<string, number>();
  private restUntil = new Map<string, number>();
  private checking = new Map<string, string>();
  private drafting = new Map<string, string>();

  private overseer: Worker;
  private overseerTag: HTMLElement;
  private orders: OverseerOrders | null = null;
  private orderIdx = 0;
  private nextOrder = 0;
  private beam: { line: THREE.Line; born: number } | null = null;
  private stars!: THREE.Points;
  private planet!: THREE.Group;
  private daisRing!: THREE.Mesh;

  constructor(private host: HTMLElement, agents: CrewAgent[], private hooks: FloorHooks) {
    if (!document.getElementById("gf-css")) {
      const st = document.createElement("style");
      st.id = "gf-css";
      st.textContent = CSS;
      document.head.append(st);
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = "block";
    host.append(this.renderer.domElement);
    const scan = document.createElement("div");
    scan.className = "gf-scan";
    host.append(scan);
    this.overlay = document.createElement("div");
    this.overlay.className = "gf-overlay";
    host.append(this.overlay);

    this.buildWorld(agents);
    for (const a of agents) this.names.set(a.id, a.name);
    for (const bay of BAYS) {
      const w = new Worker(bay.agent, this.grid, bay.home, bay.shirt, [40, 44, 60]);
      this.scene.add(w.group);
      this.crew.set(bay.agent, w);
      const tag = document.createElement("div");
      tag.className = "gf-tag";
      tag.innerHTML = "<b></b><span></span>";
      tag.onclick = () => this.hooks.pick({ kind: "agent", id: bay.agent });
      this.overlay.append(tag);
      this.crewTags.set(bay.agent, tag);
    }
    const fixed = new Grid(W, H);
    for (let x = 0; x < W; x++) for (let z = 0; z < H; z++) fixed.block(x, z);
    this.overseer = new Worker("overseer", fixed, { x: Math.floor(DAIS_C.x), z: Math.floor(DAIS_C.z) }, [230, 180, 50], [40, 40, 52], { scale: 1.8, visor: 0xffc040 });
    this.overseer.pos.set(DAIS_C.x, 0, DAIS_C.z);
    this.overseer.baseY = 0.4;
    this.scene.add(this.overseer.group);
    this.overseerTag = document.createElement("div");
    this.overseerTag.className = "gf-tag gf-boss";
    this.overseerTag.innerHTML = "<b></b><span></span>";
    this.overseerTag.onclick = () => this.hooks.pick({ kind: "overseer" });
    this.overlay.append(this.overseerTag);

    const c = new THREE.Vector3(W / 2, 0, H / 2);
    this.camera.position.set(c.x + 40, 42, c.z + 44);
    this.camera.lookAt(c);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(c);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.12, minZoom: 0.7, maxZoom: 5, maxPolarAngle: 1.25, minPolarAngle: 0.35, screenSpacePanning: true });
    this.controls.update();
    this.bindPointer();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    requestAnimationFrame(this.frame);
  }

  dispose() {
    this.running = false;
    this.ro.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.host.replaceChildren();
  }

  // ---------- world ----------

  private instanced(m: THREE.Material | THREE.Material[], cells: [number, number, number][], shadow = true) {
    const im = new THREE.InstancedMesh(this.geo, m, cells.length);
    const o = new THREE.Object3D();
    cells.forEach(([x, y, z], i) => { o.position.set(x + 0.5, y + 0.5, z + 0.5); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.receiveShadow = true;
    im.castShadow = shadow;
    this.scene.add(im);
    return im;
  }

  private buildWorld(agents: CrewAgent[]) {
    const s = this.scene;
    s.background = new THREE.Color(0x03040c);
    s.add(new THREE.HemisphereLight(0x7d8cff, 0x120c24, 1.1));
    const star = new THREE.DirectionalLight(0xdfe8ff, 1.3);
    star.position.set(W / 2 + 18, 30, H / 2 + 10);
    star.target.position.set(W / 2, 0, H / 2);
    star.castShadow = true;
    star.shadow.mapSize.set(2048, 2048);
    Object.assign(star.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 });
    star.shadow.bias = -0.0008;
    s.add(star, star.target);

    // Stars and a planet.
    const n = 2000, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, k = Math.sqrt(1 - u * u);
      pos.set([W / 2 + 160 * k * Math.cos(th), 128 * u - 20, H / 2 + 160 * k * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0xffffff }));
    s.add(this.stars);
    this.planet = new THREE.Group();
    this.planet.add(new THREE.Mesh(new THREE.SphereGeometry(8, 24, 16), new THREE.MeshLambertMaterial({ color: 0xe8731c, emissive: 0x401808, emissiveIntensity: 0.6 })));
    const ring = new THREE.Mesh(new THREE.RingGeometry(11, 14, 48), new THREE.MeshBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
    ring.rotation.x = Math.PI / 2.4;
    this.planet.add(ring);
    this.planet.position.set(-39, -24, -13);
    s.add(this.planet);

    // Deck, with each bay on its own grating.
    const deck: [number, number, number][] = [];
    const grate: [number, number, number][] = [];
    const inBay = (x: number, z: number) => BAYS.some((b) => x >= b.zone.x0 && x <= b.zone.x1 && z >= b.zone.z0 && z <= b.zone.z1);
    for (let x = 0; x < W; x++) for (let z = 0; z < H; z++) (inBay(x, z) ? grate : deck).push([x, -1, z]);
    this.instanced(mat(S.deck(), "deck"), deck, false);
    this.instanced(mat(S.grate(), "grate"), grate, false);

    // Hull.
    const low: [number, number, number][] = [], high: [number, number, number][] = [];
    for (const [y, into] of [[0, low], [1, high]] as const) {
      for (let x = 0; x < W; x++) { into.push([x, y, 0]); into.push([x, y, H - 1]); }
      for (let z = 1; z < H - 1; z++) { into.push([0, y, z]); into.push([W - 1, y, z]); }
    }
    this.instanced(mat(S.hull(), "hull", { emissive: 0x1a6080, emissiveIntensity: 0.25 }), [...low, ...high.filter((_, i) => i % 3)]);
    this.instanced(mat(S.window(), "window", { emissive: 0x101830, emissiveIntensity: 0.6 }), high.filter((_, i) => i % 3 === 0));
    for (const [x, , z] of low) this.grid.block(x, z);
    for (const [x, z] of [[14, 2], [20, 2], [14, 22], [20, 22]] as const) {
      this.grid.block(x, z);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), mat(S.metal(), "metal"));
      p.position.set(x + 0.5, 1, z + 0.5);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), new THREE.MeshBasicMaterial({ color: 0x5ff3ff }));
      cap.position.set(x + 0.5, 2.2, z + 0.5);
      const l = new THREE.PointLight(0x40d8ff, 7, 10, 1.6);
      l.position.set(x + 0.5, 3, z + 0.5);
      s.add(p, cap, l);
    }

    // Stations, one per bay.
    const metal = mat(S.metal(), "metal");
    const screen = mat(S.screen(), "screen", { emissive: 0x1a90b0, emissiveIntensity: 0.6 });
    for (const bay of BAYS) {
      const grp = new THREE.Group();
      grp.position.set(bay.station.x + 0.5, 0.5, bay.station.z + 0.5);
      const body = new THREE.Mesh(this.geo, sided(screen, metal, screen));
      body.castShadow = true;
      grp.add(body);
      const holo = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), new THREE.MeshBasicMaterial({ color: bay.shirt[0] * 65536 + bay.shirt[1] * 256 + bay.shirt[2], wireframe: true }));
      holo.position.y = 1.1;
      holo.name = "holo";
      grp.add(holo);
      grp.traverse((o) => (o.userData = { kind: "agent", id: bay.agent }));
      s.add(grp);
      this.grid.block(bay.station.x, bay.station.z);
      this.stationAt.set(bay.agent, { anchor: new THREE.Vector3(bay.station.x + 0.5, 1.8, bay.station.z + 0.5), group: grp, activeUntil: 0 });
      const a = agents.find((x) => x.id === bay.agent);
      const sign = document.createElement("div");
      sign.className = "gf-sign";
      sign.textContent = (a?.bay ?? bay.agent).toUpperCase();
      sign.onclick = () => this.hooks.pick({ kind: "agent", id: bay.agent });
      this.overlay.append(sign);
      this.signs.set(bay.agent, sign);
      const bt = document.createElement("div");
      bt.className = "gf-bay";
      bt.textContent = a?.name ?? bay.agent;
      this.overlay.append(bt);
      this.bayTags.push({ el: bt, at: new THREE.Vector3((bay.zone.x0 + bay.zone.x1) / 2 + 0.5, 0, bay.zone.z0 - 0.2) });
    }

    // The dais and the action board beside it.
    const dc: [number, number, number][] = [];
    for (let x = DAIS.x; x < DAIS.x + DAIS.size; x++) for (let z = DAIS.z; z < DAIS.z + DAIS.size; z++) { dc.push([x, 0, z]); this.grid.block(x, z); }
    const dais = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.4, 1), sided(mat(S.pad(), "pad", { emissive: 0x1a90b0, emissiveIntensity: 0.7 }), metal), dc.length);
    const o = new THREE.Object3D();
    dc.forEach(([x, , z], i) => { o.position.set(x + 0.5, 0.2, z + 0.5); o.updateMatrix(); dais.setMatrixAt(i, o.matrix); });
    dais.userData = { kind: "overseer" };
    s.add(dais);
    this.daisRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffd479, transparent: true, opacity: 0.8 }));
    this.daisRing.rotation.x = Math.PI / 2;
    this.daisRing.position.copy(DAIS_C).setY(0.55);
    s.add(this.daisRing);
    const dl = new THREE.PointLight(0xffc860, 8, 8, 1.5);
    dl.position.copy(DAIS_C).setY(3);
    s.add(dl);

    this.board = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.6), sided(metal, mat(S.screen(), "board", { emissive: 0xff3df2, emissiveIntensity: 0.4 })));
    this.board.position.set(BOARD.x + 0.5, 0.8, BOARD.z + 0.5);
    this.board.userData = { kind: "board" };
    this.board.castShadow = true;
    s.add(this.board);
    this.grid.block(BOARD.x, BOARD.z);
    this.boardSign = document.createElement("div");
    this.boardSign.className = "gf-sign";
    this.boardSign.textContent = "ACTION BOARD";
    this.boardSign.onclick = () => this.hooks.pick({ kind: "board" });
    this.overlay.append(this.boardSign);
  }

  // ---------- data ----------

  /** The records in each bay, and every finding on them. */
  setArea(agent: string, recs: AreaRecord[]) {
    const bay = BAYS.find((b) => b.agent === agent);
    if (!bay) return;
    const have = this.records.get(agent) ?? [];
    const out: RecordBlock[] = [];
    recs.slice(0, bay.slots.length).forEach((rec, i) => {
      const old = have.find((r) => r.rec.id === rec.id);
      if (old) { old.rec = rec; out.push(old); return; }
      const cell = bay.slots[i];
      const b = new RecordBlock(agent, rec, cell, bay.tex(), this.geo);
      this.scene.add(b.mesh);
      this.grid.block(cell.x, cell.z);
      out.push(b);
    });
    this.records.set(agent, out);
  }

  setFindings(fs: Finding[]) {
    this.findings = fs;
    const rank: Record<Severity, number> = { ok: 0, watch: 1, act: 2 };
    for (const blocks of this.records.values())
      for (const b of blocks) {
        const mine = fs.filter((f) => f.agent === b.agent && f.record === b.rec.id);
        b.severity = mine.reduce<Severity>((m, f) => (rank[f.severity] > rank[m] ? f.severity : m), "ok");
      }
  }

  setOrders(o: OverseerOrders) {
    this.orders = o;
    this.orderIdx = 0;
    this.nextOrder = 0;
  }

  /** Someone asked an agent to draft: it goes to the record, then works at its station until the draft is back. */
  startDraft(agent: string, recordId: string) {
    const w = this.crew.get(agent);
    const block = this.records.get(agent)?.find((b) => b.rec.id === recordId);
    if (!w) return;
    this.drafting.set(agent, recordId);
    const job: Task[] = [];
    if (block) job.push({ target: block.cell, label: `pulling ${block.rec.label} for drafting`, act: 800, look: block.top(), carry: 0xffd479 });
    job.push(this.atStation(agent, "drafting with Fable 5.1…", 2500));
    w.push(job);
  }

  finishDraft(agent: string, ok: boolean) {
    this.drafting.delete(agent);
    const w = this.crew.get(agent);
    if (!w) return;
    w.push([{
      target: BOARD, label: ok ? "draft ready — posted" : "draft failed", act: 900, carry: null,
      onArrive: (n) => { this.boardUntil = n + 1200; this.float(this.board.position.clone().setY(1.8), ok ? "DRAFT READY" : "DRAFT FAILED", ok ? SEV_CSS.ok : SEV_CSS.act, n); },
    }]);
  }

  private atStation(agent: string, label: string, act: number, extra: Partial<Task> = {}): Task {
    const bay = BAYS.find((b) => b.agent === agent)!;
    return { target: bay.station, label, act, ...extra, onArrive: (n) => { this.stationAt.get(agent)!.activeUntil = n + act + 300; extra.onArrive?.(n); } };
  }

  /** The sweep, walked: one record at a time, issues carried to the station and posted. */
  private work(now: number) {
    for (const bay of BAYS) {
      const w = this.crew.get(bay.agent)!;
      if (w.busy) continue;
      if (this.drafting.has(bay.agent)) { w.push([this.atStation(bay.agent, "still drafting with Fable 5.1…", 2500)]); continue; }
      if ((this.restUntil.get(bay.agent) ?? 0) > now) continue;
      const blocks = this.records.get(bay.agent) ?? [];
      if (!blocks.length) continue;
      const i = this.cursor.get(bay.agent) ?? 0;
      if (i >= blocks.length) {
        this.cursor.set(bay.agent, 0);
        const open = this.findings.filter((f) => f.agent === bay.agent && f.severity !== "ok").length;
        this.restUntil.set(bay.agent, now + 8000);
        this.checking.delete(bay.agent);
        w.push([{ target: bay.home, label: open ? `sweep done — ${open} open` : "sweep done — area clean", act: 400, home: true }]);
        continue;
      }
      this.cursor.set(bay.agent, i + 1);
      const b = blocks[i];
      const issues = this.findings.filter((f) => f.agent === bay.agent && f.record === b.rec.id && f.severity !== "ok");
      this.checking.set(bay.agent, b.rec.id);
      const job: Task[] = [{ target: b.cell, label: `checking ${b.rec.label}`, act: 900, look: b.top(), onArrive: (n) => (b.flashUntil = n + 500) }];
      if (issues.length) {
        const worst = issues.find((f) => f.severity === "act") ?? issues[0];
        job[0].carry = SEV_HEX[worst.severity];
        job.push(
          this.atStation(bay.agent, `logging: ${worst.title}`, 1000),
          { target: BOARD, label: "posting to the action board", act: 700, carry: null, onArrive: (n) => { this.boardUntil = n + 900; this.float(this.board.position.clone().setY(1.8), worst.severity === "act" ? "FIX NOW" : "TO WATCH", SEV_CSS[worst.severity], n); } },
        );
      }
      w.push(job);
    }
  }

  private issueOrders(now: number) {
    const r = this.orders;
    if (!r || now < this.nextOrder || this.overseer.busy) return;
    const list = r.directives.length ? r.directives : [{ agent: "", severity: "ok" as Severity, directive: r.summary, why: "" }];
    const d = list[this.orderIdx++ % list.length];
    this.nextOrder = now + 9000;
    const crew = this.crew.get(d.agent);
    const target = crew ? crew.tagPoint().clone().setY(1.2) : this.board.position.clone();
    this.overseer.push([{
      target: { x: Math.floor(DAIS_C.x), z: Math.floor(DAIS_C.z) },
      label: `${d.severity === "act" ? "⚠ " : ""}${d.directive}`,
      act: 4200,
      look: target,
      onArrive: (n) => {
        if (this.beam) this.scene.remove(this.beam.line);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([DAIS_C.clone().setY(3.9), target]), new THREE.LineBasicMaterial({ color: SEV_HEX[d.severity], transparent: true }));
        this.scene.add(line);
        this.beam = { line, born: n };
        if (crew) {
          this.float(crew.tagPoint(), d.severity === "act" ? "ORDER: FIX" : "ORDER RECEIVED", SEV_CSS[d.severity], n);
          // An order jumps the queue: the agent restarts its sweep now, not after its rest.
          this.restUntil.set(d.agent, 0);
        }
      },
    }]);
  }

  // ---------- view ----------

  private float(at: THREE.Vector3, text: string, color: string, now: number) {
    const el = document.createElement("div");
    el.className = "gf-float";
    el.textContent = text;
    el.style.color = color;
    this.overlay.append(el);
    this.floaters.push({ el, at: at.clone(), born: now });
  }

  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    if (!this.extent) {
      this.camera.updateMatrixWorld();
      const inv = this.camera.matrixWorldInverse;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const x of [0, W]) for (const y of [0, 3]) for (const z of [0, H]) {
        const p = new THREE.Vector3(x, y, z).applyMatrix4(inv);
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      this.extent = { minX, maxX, minY, maxY };
    }
    const { minX, maxX, minY, maxY } = this.extent;
    const aspect = w / h;
    const hh = Math.max((maxY - minY) / 2 + 0.5, ((maxX - minX) / 2 + 0.5) / aspect);
    const cx = (maxX + minX) / 2, cy = (maxY + minY) / 2;
    Object.assign(this.camera, { left: cx - hh * aspect, right: cx + hh * aspect, top: cy + hh, bottom: cy - hh });
    if (!this.fitted) { this.fitted = true; this.camera.zoom = w < 600 ? 1.9 : 1.1; this.controls.update(); }
    this.camera.updateProjectionMatrix();
  }

  private pickAt(e: PointerEvent): Pick | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camera);
    for (const hit of this.ray.intersectObjects(this.scene.children, true)) {
      const u = hit.object.userData as { kind?: string; id?: string; agent?: string };
      if (!u.kind) continue;
      if (u.kind === "record" && u.agent && u.id) return { kind: "record", agent: u.agent, id: u.id };
      if (u.kind === "worker" && u.id === "overseer") return { kind: "overseer" };
      if ((u.kind === "worker" || u.kind === "agent") && u.id) return { kind: "agent", id: u.id };
      if (u.kind === "overseer") return { kind: "overseer" };
      if (u.kind === "board") return { kind: "board" };
    }
    return null;
  }

  private bindPointer() {
    const el = this.renderer.domElement;
    let down: { x: number; y: number } | null = null;
    el.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
    el.addEventListener("pointerup", (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      down = null;
      const p = this.pickAt(e);
      if (p) this.hooks.pick(p);
    });
    el.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") el.style.cursor = this.pickAt(e) ? "pointer" : "grab"; });
  }

  private place(el: HTMLElement, p: THREE.Vector3, w: number, h: number, lift = 0) {
    const v = p.clone().project(this.camera);
    const x = ((v.x + 1) / 2) * w, y = ((1 - v.y) / 2) * h - lift;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    return { x, y };
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.1, (now - this.prev) / 1000);
    this.prev = now;
    const t = now / 1000;
    this.controls.update();
    this.work(now);
    this.issueOrders(now);
    for (const w of this.crew.values()) w.update(dt, now, t);
    this.overseer.update(dt, now, t);
    for (const blocks of this.records.values()) for (const b of blocks) b.update(t, now);
    this.stationAt.forEach((s) => {
      const holo = s.group.getObjectByName("holo");
      const on = s.activeUntil > now;
      if (holo) { holo.rotation.y += dt * (on ? 6 : 0.8); holo.scale.setScalar(on ? 1.4 : 1); }
    });
    ((this.board.material as THREE.MeshLambertMaterial[])[4]).emissiveIntensity = this.boardUntil > now ? 1.2 : 0.4;
    this.daisRing.rotation.z = t * 0.4;
    this.stars.rotation.y = t * 0.004;
    this.planet.rotation.y = t * 0.03;
    if (this.beam) {
      const age = (now - this.beam.born) / 1000;
      (this.beam.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, 1 - age / 2.5);
      if (age > 2.5) { this.scene.remove(this.beam.line); this.beam = null; }
    }
    this.renderer.render(this.scene, this.camera);

    const w = this.host.clientWidth, h = this.host.clientHeight;
    for (const b of this.bayTags) this.place(b.el, b.at, w, h);
    this.signs.forEach((el, id) => { el.classList.toggle("on", this.stationAt.get(id)!.activeUntil > now); this.place(el, this.stationAt.get(id)!.anchor, w, h); });
    this.boardSign.classList.toggle("on", this.boardUntil > now);
    this.place(this.boardSign, this.board.position.clone().setY(1.9), w, h);
    const o = this.orders;
    (this.overseerTag.firstChild as HTMLElement).textContent = `OVERSEER · ${o?.source === "fable" ? "FABLE 5.1" : "RULES"}`;
    (this.overseerTag.lastChild as HTMLElement).textContent = this.overseer.busy ? this.overseer.label : o?.summary ?? "taking the floor";
    this.overseerTag.dataset.state = o?.directives.some((x) => x.severity === "act") ? "alarm" : "calm";
    const boss = this.place(this.overseerTag, this.overseer.tagPoint(), w, h);
    // Crew tags, stacked so none sits on another or on the Overseer's: nearest the bottom first, each lifted clear.
    const placed: { x: number; y: number; hw: number; hh: number }[] = [{ x: boss.x, y: boss.y, hw: 160, hh: 58 }];
    const tags = Array.from(this.crew.entries()).map(([id, wk]) => {
      const p = wk.tagPoint().clone().project(this.camera);
      return { id, wk, sx: ((p.x + 1) / 2) * w, sy: ((1 - p.y) / 2) * h };
    }).sort((a, b) => b.sy - a.sy);
    for (const { id, wk, sx, sy } of tags) {
      const el = this.crewTags.get(id)!;
      (el.firstChild as HTMLElement).textContent = this.names.get(id) ?? id;
      (el.lastChild as HTMLElement).textContent = wk.label;
      el.dataset.state = wk.busy ? "busy" : "idle";
      let y = sy;
      for (let guard = 0; guard < 8; guard++) {
        const hit = placed.find((r) => Math.abs(r.x - sx) < r.hw + 120 && y > r.y - r.hh - 36 && y < r.y + 36);
        if (!hit) break;
        y = hit.y - hit.hh - 38;
      }
      placed.push({ x: sx, y, hw: 120, hh: 0 });
      this.place(el, wk.tagPoint(), w, h, sy - y);
    }
    // Record tags: the one each agent is on, and anything to fix now.
    const shown = new Set<string>();
    for (const blocks of this.records.values())
      for (const b of blocks) {
        const key = `${b.agent}:${b.rec.id}`;
        const show = b.severity === "act" || this.checking.get(b.agent) === b.rec.id;
        let el = this.recTags.get(key);
        if (!show) { if (el) el.hidden = true; continue; }
        if (!el) { el = document.createElement("div"); el.className = "gf-rec"; this.overlay.append(el); this.recTags.set(key, el); }
        el.hidden = false;
        shown.add(key);
        el.textContent = b.rec.label.length > 24 ? `${b.rec.label.slice(0, 23)}…` : b.rec.label;
        el.style.background = b.severity === "act" ? "rgba(178,30,45,.9)" : b.severity === "watch" ? "rgba(150,100,10,.9)" : "rgba(20,110,70,.9)";
        this.place(el, b.top().add(new THREE.Vector3(0, 0.2, 0)), w, h);
      }
    this.floaters = this.floaters.filter((f) => {
      const age = (now - f.born) / 1000;
      if (age > 1.8) { f.el.remove(); return false; }
      f.el.style.opacity = String(Math.min(1, 2 * (1.8 - age)));
      this.place(f.el, f.at.clone().add(new THREE.Vector3(0, 0.4 + age * 0.9, 0)), w, h);
      return true;
    });
    requestAnimationFrame(this.frame);
  };
}
