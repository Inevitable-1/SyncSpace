import { useEffect, useRef } from 'react';
import type { PointCloud, Edge } from './geometry';
import { clamp01, easeInOut } from './geometry';

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgbCss(c: [number, number, number], a: number): string {
  const A = clamp01(a);
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${A.toFixed(3)})`;
}

/* ------------------------------------------------------------------ */
/* BrainCanvas — neural particle cloud with orbit, pulse, morph        */
/* ------------------------------------------------------------------ */

export interface BrainCanvasProps {
  cloud: PointCloud;
  edges: Edge[];
  morphTo?: PointCloud;
  assembled?: number;
  morphT?: number;
  neural?: number;
  pulse?: number;
  spin?: number;
  baseSpin?: number;
  sizeScale?: number;
  enabled?: boolean;
  className?: string;
  colorA?: string;
  colorB?: string;
  colorC?: string;
}

interface BrainState {
  sx: Float32Array;
  sy: Float32Array;
  px: Float32Array;
  py: Float32Array;
  pr: Float32Array;
  depth: Float32Array;
  unit: number;
  w: number;
  h: number;
  dpr: number;
  tt: number;
  last: number;
}

export function BrainCanvas({
  cloud,
  edges,
  morphTo,
  assembled = 1,
  morphT = 0,
  neural = 0,
  pulse = 0,
  spin = 1,
  baseSpin = 0,
  sizeScale = 1,
  enabled = true,
  className,
  colorA = '#6366f1',
  colorB = '#a855f7',
  colorC = '#e0e7ff',
}: BrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BrainState | null>(null);
  const propsRef = useRef({
    cloud,
    edges,
    morphTo,
    assembled,
    morphT,
    neural,
    pulse,
    spin,
    baseSpin,
    sizeScale,
    colorA,
    colorB,
    colorC,
    enabled,
  });
  propsRef.current = {
    cloud,
    edges,
    morphTo,
    assembled,
    morphT,
    neural,
    pulse,
    spin,
    baseSpin,
    sizeScale,
    colorA,
    colorB,
    colorC,
    enabled,
  };

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ensureState = (): BrainState => {
      let s = stateRef.current;
      if (s) return s;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const w = rect.width;
      const h = rect.height;
      const n = cloud.length;
      s = {
        sx: new Float32Array(n),
        sy: new Float32Array(n),
        px: new Float32Array(n),
        py: new Float32Array(n),
        pr: new Float32Array(n),
        depth: new Float32Array(n),
        unit: Math.min(w, h) * 0.36 * sizeScale,
        w,
        h,
        dpr,
        tt: 0,
        last: performance.now(),
      };
      for (let i = 0; i < n; i++) {
        s.sx[i] =
          cloud[i].x +
          (Math.sin(i * 127.1) * 43758.5453 - Math.floor(Math.sin(i * 127.1) * 43758.5453) - 0.5) *
            6.4;
        s.sy[i] =
          cloud[i].y +
          (Math.sin(i * 311.7 + 13) * 43758.5453 -
            Math.floor(Math.sin(i * 311.7 + 13) * 43758.5453) -
            0.5) *
            6.4;
      }
      stateRef.current = s;
      return s;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const s = stateRef.current;
      if (!s) return;
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      s.w = rect.width;
      s.h = rect.height;
      s.dpr = dpr;
      s.unit = Math.min(rect.width, rect.height) * 0.36 * propsRef.current.sizeScale;
    };
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    const [ra, rb, rc] = [hexToRgb(colorA), hexToRgb(colorB), hexToRgb(colorC)];

    let raf = 0;
    const draw = (now: number) => {
      const s = ensureState();
      const p = propsRef.current;
      const dt = Math.min((now - s.last) / 1000, 0.05);
      s.last = now;
      s.tt += dt;
      const t = s.tt;

      const { w, h, dpr } = s;
      const unit = Math.min(w, h) * 0.36 * p.sizeScale;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx0 = w / 2;
      const cy0 = h / 2;
      const n = p.cloud.length;
      const e = easeInOut(p.assembled);
      const me = easeInOut(p.morphT);

      const yaw = p.baseSpin + t * 0.28 * p.spin;
      const pitch = 0.16 + Math.sin(t * 0.5 * p.spin) * 0.22;
      const cosy = Math.cos(yaw);
      const siny = Math.sin(yaw);
      const cosp = Math.cos(pitch);
      const sinp = Math.sin(pitch);
      const fov = 3.1;

      for (let i = 0; i < n; i++) {
        let x = p.cloud[i].x;
        let y = p.cloud[i].y;
        let z = p.cloud[i].z;
        if (e < 1) {
          x = s.sx[i] + (x - s.sx[i]) * e;
          y = s.sy[i] + (y - s.sy[i]) * e;
        }
        if (p.morphTo && me > 0) {
          const mb = p.morphTo[i % p.morphTo.length];
          x += (mb.x - x) * me;
          y += (mb.y - y) * me;
          z += (mb.z - z) * me;
        }
        const breathe = Math.sin(t * 1.5 + i * 0.05) * 0.013;
        x += breathe;
        y += breathe;

        const rx = x * cosy - z * siny;
        const rz = x * siny + z * cosy;
        const ry = y * cosp - rz * sinp;
        const rz2 = y * sinp + rz * cosp;
        const persp = fov / (fov - rz2);
        s.px[i] = cx0 + rx * persp * unit;
        s.py[i] = cy0 - ry * persp * unit;
        s.pr[i] = persp;
        s.depth[i] = clamp01((rz2 + 1) / 2);
      }

      /* edges */
      if (e > 0.15) {
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        const nWave = p.neural;
        for (let k = 0; k < p.edges.length; k++) {
          const [ia, ib] = p.edges[k];
          const ax = s.px[ia];
          const ay = s.py[ia];
          const bx = s.px[ib];
          const by = s.py[ib];
          const mx = (ax + bx) / 2 - cx0;
          const my = (ay + by) / 2 - cy0;
          const dist = Math.hypot(mx, my);
          const wave = 0.5 + 0.5 * Math.sin(t * 2.4 - dist * 0.035);
          const depth = (s.depth[ia] + s.depth[ib]) / 2;
          const alpha = e * (0.12 + 0.5 * depth) * (0.25 + 0.75 * nWave) * (0.25 + 0.75 * wave);
          if (alpha < 0.02) continue;
          ctx.strokeStyle = rgbCss(mixRgb(ra, rb, 0.35), alpha);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        /* travelling neural impulses */
        if (nWave > 0.25) {
          ctx.fillStyle = rgbCss(rc, 0.9 * Math.min(1, nWave));
          for (let k = 0; k < p.edges.length; k += 3) {
            const [ia, ib] = p.edges[k];
            const ph = (Math.sin(k * 12.9898) * 43758.5453) % 1;
            const f = (ph + t * 0.45) % 1;
            const x = s.px[ia] + (s.px[ib] - s.px[ia]) * f;
            const y = s.py[ia] + (s.py[ib] - s.py[ia]) * f;
            ctx.beginPath();
            ctx.arc(x, y, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      /* points */
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const d = s.depth[i];
        const seed = Math.sin(i * 12.9898) * 43758.5453;
        const flicker = 0.5 + 0.5 * Math.sin(t * 2.1 + seed * 6.283);
        const radius = unit * 0.011 * (0.55 + 0.45 * flicker) * (1 + p.pulse * 0.4) * s.pr[i];
        if (radius <= 0.3) continue;
        const colorMix = d * 0.6 + flicker * 0.25;
        const col = mixRgb(ra, rb, colorMix);
        const alpha = 0.28 + 0.55 * d * (0.5 + 0.5 * flicker) + p.neural * 0.25;
        ctx.fillStyle = rgbCss(col, alpha);
        ctx.beginPath();
        ctx.arc(s.px[i], s.py[i], radius, 0, Math.PI * 2);
        ctx.fill();
        if (i % 11 === 0) {
          const g = ctx.createRadialGradient(s.px[i], s.py[i], 0, s.px[i], s.py[i], radius * 4.2);
          g.addColorStop(0, rgbCss(rc, 0.55 * alpha));
          g.addColorStop(1, rgbCss(rc, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(s.px[i], s.py[i], radius * 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return <canvas ref={canvasRef} className={className} />;
}

/* ------------------------------------------------------------------ */
/* AmbientField — drifting starfield with soft bokeh                   */
/* ------------------------------------------------------------------ */

export interface AmbientFieldProps {
  density?: number;
  drift?: number;
  className?: string;
  opacity?: number;
}

interface AmbientState {
  xs: Float32Array;
  ys: Float32Array;
  rs: Float32Array;
  ph: Float32Array;
  speed: Float32Array;
  w: number;
  h: number;
  dpr: number;
  tt: number;
  last: number;
}

export function AmbientField({
  density = 0.5,
  drift = 1,
  className,
  opacity = 1,
}: AmbientFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ density, drift, opacity });
  propsRef.current = { density, drift, opacity };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ensureState = (): AmbientState => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const w = rect.width;
      const h = rect.height;
      const count = Math.floor(((w * h) / 14000) * propsRef.current.density);
      const s: AmbientState = {
        xs: new Float32Array(count),
        ys: new Float32Array(count),
        rs: new Float32Array(count),
        ph: new Float32Array(count),
        speed: new Float32Array(count),
        w,
        h,
        dpr,
        tt: 0,
        last: performance.now(),
      };
      for (let i = 0; i < count; i++) {
        s.xs[i] = Math.random() * w;
        s.ys[i] = Math.random() * h;
        s.rs[i] = Math.random() * 1.6 + 0.4;
        s.ph[i] = Math.random() * Math.PI * 2;
        s.speed[i] = Math.random() * 0.4 + 0.1;
      }
      return s;
    };

    let s: AmbientState | null = null;
    const ro = new ResizeObserver(() => {
      s = null;
      ensureState();
    });
    ro.observe(canvas);

    let raf = 0;
    const draw = (now: number) => {
      if (!s) s = ensureState();
      const p = propsRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dt = Math.min((now - s.last) / 1000, 0.05);
      s.last = now;
      s.tt += dt;
      const t = s.tt;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < s.xs.length; i++) {
        let x = s.xs[i] + t * 6 * s.speed[i] * p.drift;
        let y = s.ys[i] - t * 3 * s.speed[i] * p.drift;
        if (x > w + 4) x = -4;
        if (y < -4) y = h + 4;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(s.ph[i] + t * (0.4 + s.speed[i])));
        ctx.fillStyle = `rgba(148,163,255,${(0.25 * tw * p.opacity).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, s.rs[i] * tw, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ opacity }} />;
}

/* ------------------------------------------------------------------ */
/* EnergyBeam — four streams merging into a vertical beam              */
/* ------------------------------------------------------------------ */

export interface EnergyBeamProps {
  progress?: number;
  className?: string;
}

interface BeamState {
  w: number;
  h: number;
  dpr: number;
  tt: number;
  last: number;
}

export function EnergyBeam({ progress = 0, className }: EnergyBeamProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ progress });
  propsRef.current = { progress };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let s: BeamState = {
      w: 0,
      h: 0,
      dpr: 1,
      tt: 0,
      last: performance.now(),
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      s.w = rect.width;
      s.h = rect.height;
      s.dpr = dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const sources: Array<[number, number]> = [
      [-0.16, -0.16],
      [1.16, -0.16],
      [-0.16, 1.16],
      [1.16, 1.16],
    ];

    let raf = 0;
    const draw = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 0.05);
      s.last = now;
      s.tt += dt;
      const t = s.tt;
      const p = propsRef.current.progress;
      const { w, h, dpr } = s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx0 = w / 2;
      const cy0 = h / 2;

      const streamP = easeInOut(clamp01(p / 0.55));
      ctx.globalCompositeOperation = 'lighter';

      /* four converging streams */
      for (let k = 0; k < sources.length; k++) {
        const [sxr, syr] = sources[k];
        const ex = cx0 + (sxr - 0.5) * w * 1.15;
        const ey = cy0 + (syr - 0.5) * h * 1.15;
        const mx = (ex + cx0) / 2 + (ex < cx0 ? 1 : -1) * w * 0.18;
        const my = (ey + cy0) / 2 + (ey < cy0 ? 1 : -1) * h * 0.18;
        const curLen = streamP;
        const segments = 26;
        for (let q = 0; q < segments; q++) {
          const t1 = (q / segments) * curLen;
          const t2 = ((q + 1) / segments) * curLen;
          const p1 = quadPoint(ex, ey, mx, my, cx0, cy0, t1);
          const p2 = quadPoint(ex, ey, mx, my, cx0, cy0, t2);
          const fade = Math.min(1, (1 - t1) * 2.2);
          const width = 1 + 7 * (1 - q / segments);
          ctx.strokeStyle = `rgba(139,122,255,${(0.5 * fade * streamP).toFixed(3)})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        /* travelling particles along each stream */
        for (let q = 0; q < 6; q++) {
          const f = (((q / 6 + t * 0.28 * (k % 2 === 0 ? 1 : -1)) % 1) + 1) % 1;
          const pos = quadPoint(ex, ey, mx, my, cx0, cy0, f * curLen);
          const gl = 0.7 * Math.abs(Math.sin(f * Math.PI));
          ctx.fillStyle = `rgba(255,255,255,${gl.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* central core orb + vertical beam after streams meet */
      const core = clamp01((p - 0.5) / 0.3);
      if (core > 0) {
        const pulseR = (1 + Math.sin(t * 9) * 0.12) * (0.18 + core * 0.14) * Math.min(w, h);
        const g = ctx.createRadialGradient(cx0, cy0, 0, cx0, cy0, pulseR);
        g.addColorStop(0, `rgba(199,210,254,${(0.85 * core).toFixed(3)})`);
        g.addColorStop(0.4, `rgba(139,92,246,${(0.5 * core).toFixed(3)})`);
        g.addColorStop(1, `rgba(139,92,246,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx0, cy0, pulseR, 0, Math.PI * 2);
        ctx.fill();

        const beamH = h * (0.9 - 0.3 * Math.abs(Math.sin(t * 2.6)));
        const beamW = Math.max(3, Math.min(w, h) * 0.035 * (1 + Math.sin(t * 7) * 0.15));
        const bg = ctx.createLinearGradient(cx0, cy0 - beamH / 2, cx0, cy0 + beamH / 2);
        bg.addColorStop(0, `rgba(139,92,246,${(0.9 * core).toFixed(3)})`);
        bg.addColorStop(0.5, `rgba(224,231,255,${(0.95 * core).toFixed(3)})`);
        bg.addColorStop(1, `rgba(139,92,246,${(0.9 * core).toFixed(3)})`);
        ctx.fillStyle = bg;
        ctx.fillRect(cx0 - beamW / 2, cy0 - beamH / 2, beamW, beamH);

        const bg2 = ctx.createLinearGradient(cx0, cy0 - beamH / 2, cx0, cy0 + beamH / 2);
        bg2.addColorStop(0, `rgba(99,102,241,${(0.55 * core).toFixed(3)})`);
        bg2.addColorStop(0.5, `rgba(196,181,253,${(0.6 * core).toFixed(3)})`);
        bg2.addColorStop(1, `rgba(99,102,241,${(0.55 * core).toFixed(3)})`);
        ctx.fillStyle = bg2;
        ctx.fillRect(cx0 - beamW * 2.2, cy0 - beamH / 2, beamW * 4.4, beamH);
      }

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}

function quadPoint(
  ax: number,
  ay: number,
  mx: number,
  my: number,
  bx: number,
  by: number,
  t: number,
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * ax + 2 * u * t * mx + t * t * bx,
    y: u * u * ay + 2 * u * t * my + t * t * by,
  };
}
