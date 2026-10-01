import * as THREE from "three";

/** Procedural 16×16 pixel textures, so the world has the blocky look with no image assets. */

type RGB = [number, number, number];
type Px = (x: number, y: number, r: () => number) => RGB | null;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const cache = new Map<string, THREE.CanvasTexture>();

export function tex(key: string, px: Px, seed = 7): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(16, 16);
  const r = rng(seed);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const v = px(x, y, r);
      const i = (y * 16 + x) * 4;
      if (!v) { img.data[i + 3] = 0; continue; }
      img.data[i] = v[0]; img.data[i + 1] = v[1]; img.data[i + 2] = v[2]; img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

const jit = (c: RGB, r: () => number, amt: number): RGB => {
  const k = 1 + (r() - 0.5) * amt;
  return [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
};

export const T = {
  stoneBrick: () => tex("stoneBrick", (x, y, r) => {
    const mortar = y % 8 === 7 || (x + (y < 8 ? 0 : 8)) % 16 === 15;
    return mortar ? [74, 76, 82] : jit([122, 124, 130], r, 0.18);
  }),
  cobble: () => tex("cobble", (x, y, r) => {
    const edge = ((x * 7 + y * 13) % 11 === 0) || ((x + y * 3) % 9 === 0);
    return edge ? [70, 70, 74] : jit([118, 118, 122], r, 0.3);
  }, 3),
  gravel: () => tex("gravel", (_x, _y, r) => jit(r() > 0.7 ? [96, 90, 84] : [128, 120, 110], r, 0.25), 11),
  planks: () => tex("planks", (x, y, r) => {
    if (y % 4 === 3) return [96, 70, 40];
    if (y % 8 < 4 ? x === 5 : x === 12) return [104, 76, 44];
    return jit([164, 124, 74], r, 0.12);
  }, 5),
  log: () => tex("log", (x, _y, r) => jit(x % 4 === 0 ? [70, 52, 32] : [102, 78, 48], r, 0.2), 9),
  ore: (specks: RGB, key: string) => tex(`ore:${key}`, (x, y, r) => {
    const sp = ((x * 5 + y * 3) % 7 === 0 && (x + y) % 3 !== 0) || ((x * 11 + y * 7) % 13 === 0);
    return sp ? jit(specks, r, 0.25) : jit([122, 124, 130], r, 0.2);
  }, 13),
  glow: () => tex("glow", (_x, _y, r) => jit(r() > 0.6 ? [255, 236, 150] : [214, 160, 74], r, 0.2), 17),
  craftTop: () => tex("craftTop", (x, y, r) => {
    if (x === 0 || y === 0 || x === 15 || y === 15 || x === 8 || y === 8) return [88, 60, 34];
    return jit([170, 128, 78], r, 0.12);
  }),
  craftSide: () => tex("craftSide", (x, y, r) => {
    if (y < 3) return [88, 60, 34];
    if ((x === 3 || x === 4) && y > 4 && y < 13) return [150, 150, 156]; // saw blade
    if (x > 9 && x < 13 && y > 5 && y < 9) return [110, 110, 116]; // hammer head
    if (x === 11 && y >= 9 && y < 14) return [96, 70, 40];
    return jit([164, 124, 74], r, 0.12);
  }),
  furnace: (lit: boolean) => tex(`furnace:${lit}`, (x, y, r) => {
    if (x > 3 && x < 12 && y > 7 && y < 13) return lit ? jit([255, 150, 40], r, 0.4) : [36, 36, 38];
    if (x > 3 && x < 12 && y > 2 && y < 5) return [52, 52, 56];
    return jit([112, 112, 116], r, 0.25);
  }, 21),
  chest: (lidLine = true) => tex(`chest:${lidLine}`, (x, y, r) => {
    if (x === 0 || x === 15 || y === 15 || y === 0) return [70, 44, 20];
    if (lidLine && y === 5) return [70, 44, 20];
    if (x > 6 && x < 9 && y > 3 && y < 8) return [200, 200, 206];
    return jit([170, 110, 44], r, 0.14);
  }),
  smithTop: () => tex("smithTop", (x, y, r) => (x < 2 || x > 13 || y < 2 || y > 13 ? [40, 40, 46] : jit([66, 66, 76], r, 0.2))),
  smithSide: () => tex("smithSide", (_x, y, r) => (y < 4 ? jit([60, 60, 70], r, 0.2) : jit([150, 104, 64], r, 0.14))),
  lecternTop: () => tex("lecternTop", (x, y, r) => {
    if (x > 2 && x < 13 && y > 3 && y < 12) return x === 7 || x === 8 ? [120, 30, 30] : jit([236, 226, 196], r, 0.06);
    return jit([150, 104, 64], r, 0.14);
  }),
  gold: () => tex("gold", (x, y, r) => (x === 0 || y === 0 ? [255, 242, 140] : jit([226, 176, 50], r, 0.2)), 23),
  iron: () => tex("iron", (_x, _y, r) => jit([206, 208, 214], r, 0.08), 25),
  wool: (c: RGB, key: string) => tex(`wool:${key}`, (_x, _y, r) => jit(c, r, 0.12), 27),
  face: (skin: RGB, eye: RGB) => tex(`face:${skin.join()}:${eye.join()}`, (x, y, r) => {
    if (y >= 7 && y <= 8 && (x === 4 || x === 5 || x === 10 || x === 11)) return x === 4 || x === 11 ? [250, 250, 250] : eye;
    if (y === 11 && x > 5 && x < 10) return [skin[0] * 0.6, skin[1] * 0.5, skin[2] * 0.5];
    return jit(skin, r, 0.06);
  }),
  skin: (skin: RGB) => tex(`skin:${skin.join()}`, (_x, _y, r) => jit(skin, r, 0.06)),
};

const matCache = new Map<string, THREE.MeshLambertMaterial>();
export function mat(t: THREE.Texture, key: string, extra: THREE.MeshLambertMaterialParameters = {}) {
  const k = key + JSON.stringify(Object.keys(extra));
  const hit = matCache.get(k);
  if (hit && !Object.keys(extra).length) return hit;
  const m = new THREE.MeshLambertMaterial({ map: t, ...extra });
  if (!Object.keys(extra).length) matCache.set(k, m);
  return m;
}

/** Box face order is +x, −x, +y, −y, +z, −z. */
export function sided(top: THREE.Material, side: THREE.Material, front?: THREE.Material, bottom?: THREE.Material) {
  return [side, side, top, bottom ?? side, front ?? side, side];
}

/** The space-station set: deck, hull, grates, crystals and consoles. */
export const S = {
  deck: () => tex("deck", (x, y, r) => {
    if (x % 8 === 0 || y % 8 === 0) return [30, 34, 44];
    if ((x % 8 === 1 || x % 8 === 6) && (y % 8 === 1 || y % 8 === 6)) return [128, 140, 160];
    return jit([62, 68, 82], r, 0.1);
  }, 41),
  grate: () => tex("grate", (x, y, r) => (x % 3 === 0 || y % 3 === 0 ? jit([76, 84, 100], r, 0.12) : [10, 12, 18]), 43),
  hull: () => tex("hull", (x, y, r) => {
    if (y === 7 || x === 0) return [24, 28, 38];
    if (y >= 3 && y <= 4 && x > 1 && x < 15) return [70, 210, 255];
    return jit([46, 52, 68], r, 0.12);
  }, 45),
  window: () => tex("window", (x, y, r) => {
    if (x < 2 || x > 13 || y < 3 || y > 12) return jit([46, 52, 68], r, 0.12);
    return r() > 0.93 ? [230, 236, 255] : [6, 8, 22];
  }, 47),
  crystal: (c: RGB, key: string) => tex(`crystal:${key}`, (x, y, r) => {
    if ((x - y + 32) % 7 === 0) return [Math.min(255, c[0] + 110), Math.min(255, c[1] + 110), Math.min(255, c[2] + 110)];
    if ((x + y) % 5 < 2) return jit(c, r, 0.25);
    return jit([c[0] * 0.35, c[1] * 0.35, c[2] * 0.35], r, 0.3);
  }, 49),
  screen: () => tex("screen", (x, y, r) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [40, 46, 60];
    if (y % 3 === 1 && x > 1 && x < 3 + Math.floor(r() * 12)) return [60, 225, 255];
    return [8, 12, 24];
  }, 51),
  metal: () => tex("metal", (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15 ? [28, 32, 42] : jit([84, 92, 108], r, 0.1)), 53),
  reactor: (lit: boolean) => tex(`reactor:${lit}`, (x, y, r) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 4.5) return lit ? jit([255, 120, 240], r, 0.3) : [60, 20, 70];
    if (d < 5.5) return [20, 22, 30];
    return jit([70, 76, 92], r, 0.12);
  }, 55),
  cargo: () => tex("cargo", (x, y, r) => {
    if (y >= 6 && y <= 9) return (x + y) % 4 < 2 ? [20, 20, 20] : [250, 200, 40];
    if (x === 0 || x === 15 || y === 0 || y === 15) return [60, 50, 30];
    return jit([210, 120, 40], r, 0.12);
  }, 57),
  pad: () => tex("pad", (x, y) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    return d > 6.5 ? [30, 34, 44] : Math.round(d) % 3 === 0 ? [60, 225, 255] : [12, 20, 34];
  }),
  visor: () => tex("visor", (x, y) => {
    if (x < 2 || x > 13 || y < 4 || y > 11) return [235, 240, 248];
    const k = 1 - (y - 4) / 12;
    return x + y < 12 ? [190, 250, 255] : [30 * k + 20, 170 * k + 50, 230 * k + 25];
  }),
  suit: () => tex("suit", (_x, _y, r) => jit([232, 236, 244], r, 0.05), 59),
};
