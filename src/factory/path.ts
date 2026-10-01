/** Grid pathfinding for the workers: A* over walkable floor cells, 8 neighbours, no corner cutting. */

export interface Cell { x: number; z: number }

export class Grid {
  readonly blocked: Uint8Array;
  constructor(readonly w: number, readonly h: number) {
    this.blocked = new Uint8Array(w * h);
  }
  block(x: number, z: number) {
    if (this.inside(x, z)) this.blocked[z * this.w + x] = 1;
  }
  inside(x: number, z: number) {
    return x >= 0 && z >= 0 && x < this.w && z < this.h;
  }
  free(x: number, z: number) {
    return this.inside(x, z) && !this.blocked[z * this.w + x];
  }
}

const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/**
 * Cells from `start` to the nearest free cell orthogonally beside `target`
 * (the spot a worker stands to use a block). Empty when unreachable or already there.
 */
export function pathTo(g: Grid, start: Cell, target: Cell): Cell[] {
  const goals = new Set<number>();
  for (const [dx, dz] of DIRS.slice(0, 4)) {
    const x = target.x + dx, z = target.z + dz;
    if (g.free(x, z)) goals.add(z * g.w + x);
  }
  if (g.free(target.x, target.z)) goals.add(target.z * g.w + target.x);
  const s = start.z * g.w + start.x;
  if (goals.has(s) || !goals.size) return [];

  const h = (i: number) => {
    const x = i % g.w, z = (i - x) / g.w;
    return Math.max(0, Math.hypot(x - target.x, z - target.z) - 1);
  };
  const gScore = new Map<number, number>([[s, 0]]);
  const came = new Map<number, number>();
  const open: { i: number; f: number }[] = [{ i: s, f: h(s) }];
  const closed = new Set<number>();
  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k].f < open[best].f) best = k;
    const { i } = open.splice(best, 1)[0];
    if (closed.has(i)) continue;
    if (goals.has(i)) {
      const out: Cell[] = [];
      for (let c: number | undefined = i; c !== undefined && c !== s; c = came.get(c)) out.push({ x: c % g.w, z: Math.floor(c / g.w) });
      return out.reverse();
    }
    closed.add(i);
    const x = i % g.w, z = (i - x) / g.w;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!g.free(nx, nz)) continue;
      // Diagonals only through two free orthogonals, so nobody clips a corner.
      if (dx && dz && (!g.free(x + dx, z) || !g.free(x, z + dz))) continue;
      const n = nz * g.w + nx;
      if (closed.has(n)) continue;
      const cost = (gScore.get(i) ?? 0) + (dx && dz ? Math.SQRT2 : 1);
      if (cost < (gScore.get(n) ?? Infinity)) {
        gScore.set(n, cost);
        came.set(n, i);
        open.push({ i: n, f: cost + h(n) });
      }
    }
  }
  return [];
}
