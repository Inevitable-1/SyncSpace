export interface Pt {
  x: number;
  y: number;
  z: number;
}

export type PointCloud = Pt[];
export type Edge = [number, number];

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeInOut = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};

export const easeOutCubic = (t: number): number => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function catmullRomClosed(control: Pt[], samplesPer: number): PointCloud {
  const n = control.length;
  const out: PointCloud = [];
  const at = (i: number): Pt => control[((i % n) + n) % n];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < samplesPer; s++) {
      const t = s / samplesPer;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        z: 0,
      });
    }
  }
  return out;
}

const BRAIN_CONTROL: Pt[] = [
  { x: 0.95, y: 0.05, z: 0 },
  { x: 0.62, y: 0.78, z: 0 },
  { x: 0.22, y: 0.99, z: 0 },
  { x: -0.16, y: 0.82, z: 0 },
  { x: -0.55, y: 0.99, z: 0 },
  { x: -0.95, y: 0.45, z: 0 },
  { x: -0.82, y: -0.12, z: 0 },
  { x: -0.6, y: -0.55, z: 0 },
  { x: -0.25, y: -0.82, z: 0 },
  { x: 0.18, y: -0.72, z: 0 },
  { x: 0.62, y: -0.62, z: 0 },
  { x: 0.92, y: -0.28, z: 0 },
];

const LOGO_CONTROL: Pt[] = [
  { x: 0.92, y: 0.0, z: 0 },
  { x: 0.62, y: 0.58, z: 0 },
  { x: 0.28, y: 0.86, z: 0 },
  { x: 0.0, y: 0.74, z: 0 },
  { x: -0.28, y: 0.86, z: 0 },
  { x: -0.62, y: 0.58, z: 0 },
  { x: -0.92, y: 0.0, z: 0 },
  { x: -0.68, y: -0.52, z: 0 },
  { x: -0.24, y: -0.84, z: 0 },
  { x: 0.24, y: -0.84, z: 0 },
  { x: 0.68, y: -0.52, z: 0 },
];

export function brainOutline(samplesPer = 14): PointCloud {
  return catmullRomClosed(BRAIN_CONTROL, samplesPer);
}

export function logoOutline(samplesPer = 14): PointCloud {
  return catmullRomClosed(LOGO_CONTROL, samplesPer);
}

const seededRandom = (seed: number) => mulberry32(seed);

export function brainCloud(count = 260, seed = 1): PointCloud {
  const rnd = seededRandom(seed);
  const outline = brainOutline(16);
  const out: PointCloud = [];
  const outlinePts = outline.map((p) => ({ ...p }));
  const cx = outline.reduce((a, p) => a + p.x, 0) / outline.length;
  const cy = outline.reduce((a, p) => a + p.y, 0) / outline.length;
  const half = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    if (i < half) {
      const s = outlinePts[Math.floor(rnd() * outlinePts.length)];
      const k = Math.pow(rnd(), 1.35);
      out.push({
        x: cx + (s.x - cx) * k + (rnd() - 0.5) * 0.06,
        y: cy + (s.y - cy) * k + (rnd() - 0.5) * 0.06,
        z: (rnd() - 0.5) * 0.7,
      });
    } else {
      out.push({
        x: (rnd() - 0.5) * 1.9,
        y: (rnd() - 0.5) * 1.9,
        z: (rnd() - 0.5) * 0.7,
      });
    }
  }
  return out;
}

export function logoCloud(count = 260, seed = 2): PointCloud {
  const rnd = seededRandom(seed);
  const outline = logoOutline(16);
  const cx = outline.reduce((a, p) => a + p.x, 0) / outline.length;
  const cy = outline.reduce((a, p) => a + p.y, 0) / outline.length;
  const out: PointCloud = [];
  for (let i = 0; i < count; i++) {
    const s = outline[Math.floor(rnd() * outline.length)];
    const k = Math.pow(rnd(), 1.3);
    out.push({
      x: cx + (s.x - cx) * k + (rnd() - 0.5) * 0.05,
      y: cy + (s.y - cy) * k + (rnd() - 0.5) * 0.05,
      z: (rnd() - 0.5) * 0.6,
    });
  }
  return out;
}

export function scatterCloud(cloud: PointCloud, spread = 0.9, seed = 3): PointCloud {
  const rnd = seededRandom(seed);
  return cloud.map((p) => ({
    x: p.x + (rnd() - 0.5) * spread * 2,
    y: p.y + (rnd() - 0.5) * spread * 2,
    z: p.z,
  }));
}

export function connectionEdges(points: PointCloud, maxDist: number, maxNeighbors = 3): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < points.length; i++) {
    const dists: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dz = points[i].z - points[j].z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < maxDist * maxDist) dists.push({ j, d });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let k = 0; k < Math.min(maxNeighbors, dists.length); k++) {
      const a = i;
      const b = dists[k].j;
      if (a < b && !edges.some((e) => e[0] === a && e[1] === b)) {
        edges.push([a, b]);
      }
    }
  }
  return edges;
}

export interface MorphState {
  cloud: PointCloud;
  edges: Edge[];
}

export function morphCloud(from: PointCloud, to: PointCloud, t: number): PointCloud {
  const e = easeInOut(t);
  const out: PointCloud = [];
  for (let i = 0; i < from.length; i++) {
    const a = from[i];
    const b = to[i % to.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const amp = Math.sin(Math.PI * e) * 0.22;
    const wob = a.z;
    out.push({
      x: a.x + dx * e + nx * amp * Math.sin(wob * 6.283 + e * 6),
      y: a.y + dy * e + ny * amp * Math.sin(wob * 6.283 + e * 6),
      z: lerp(a.z, b.z, e),
    });
  }
  return out;
}
