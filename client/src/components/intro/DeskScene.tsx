import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TIMELINE, windowOpacity, windowProgress } from './timeline';
import { clamp01 } from './geometry';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.35 },
  },
};

const line = {
  hidden: { opacity: 0, scaleX: 0.4 },
  show: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.22, ease: 'easeOut' as const },
  },
};

function CodeLine({ children, width }: { children: React.ReactNode; width: string }) {
  return (
    <motion.div
      variants={line}
      className="flex items-center gap-2 font-mono text-[10px] sm:text-xs leading-relaxed"
    >
      <span className="select-none text-slate-600 w-4 shrink-0">{'>'}</span>
      <span style={{ width }} className="block whitespace-nowrap">
        {children}
      </span>
    </motion.div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  hue: number;
}

function CodeBurst({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parts: Particle[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      w = rect.width;
      h = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const colors = ['#818cf8', '#c084fc', '#e0e7ff', '#a78bfa'];

    let raf = 0;
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (activeRef.current) {
        const spawn = Math.floor(dt * 220);
        for (let i = 0; i < spawn; i++) {
          parts.push({
            x: w * (0.32 + Math.random() * 0.36),
            y: h * (0.34 + Math.random() * 0.14),
            vx: (Math.random() - 0.5) * 70,
            vy: -(40 + Math.random() * 120),
            r: 0.6 + Math.random() * 1.8,
            life: 0,
            maxLife: 0.7 + Math.random() * 0.9,
            hue: Math.floor(Math.random() * colors.length),
          });
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          parts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - dt * 0.6;
        const a = 1 - p.life / p.maxLife;
        ctx.fillStyle =
          colors[p.hue] +
          Math.round(a * 200)
            .toString(16)
            .padStart(2, '0');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.5 + a * 0.5), 0, Math.PI * 2);
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

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

export default function DeskScene({ t }: { t: number }) {
  const op = windowOpacity(t, TIMELINE.deskStart, TIMELINE.deskEnd, 0.3, 0.35);
  if (op <= 0) return null;

  const p = windowProgress(t, TIMELINE.deskStart, TIMELINE.deskEnd);
  const powerOn = clamp01(p / 0.5);
  const zoom = clamp01((p - 0.5) / 0.25);
  const burstP = clamp01((p - 0.72) / 0.28);
  const scale = 1 + zoom * 0.85;

  const screenOn = powerOn < 0.45 ? (Math.sin(t * 36) > -0.15 ? 1 : 0.25) : 1;
  const screenBrightness = powerOn * screenOn;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="relative w-[88vw] max-w-[820px]"
        style={{
          opacity: op,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {/* desk surface */}
        <div className="absolute inset-x-[-6%] bottom-[-4%] top-[68%] rounded-[28px] bg-gradient-to-b from-slate-800/70 to-slate-900/90 shadow-2xl shadow-black/60 backdrop-blur-md" />

        {/* monitor */}
        <div className="relative mx-auto w-[74%]">
          <div className="relative rounded-xl rounded-b-md bg-slate-900 p-2 pb-5 shadow-2xl shadow-indigo-900/40 ring-1 ring-white/10">
            <div
              className="relative h-[30vh] min-h-[200px] rounded-md bg-[#0b1020] overflow-hidden ring-1 ring-white/5"
              style={{ opacity: screenBrightness }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-indigo-600/25 via-transparent to-purple-600/25"
                style={{ opacity: powerOn }}
              />
              <motion.div
                className="absolute inset-0 p-4 sm:p-6 pt-6"
                variants={container}
                initial="hidden"
                animate={powerOn > 0 ? 'show' : 'hidden'}
              >
                <CodeLine width="14ch">
                  <span className="text-fuchsia-300">const</span>{' '}
                  <span className="text-sky-300">brains</span>{' '}
                  <span className="text-slate-400">=</span>{' '}
                  <span className="text-emerald-300">new</span>{' '}
                  <span className="text-amber-200">NeuralLink</span>
                  <span className="text-slate-400">()</span>
                </CodeLine>
                <CodeLine width="16ch">
                  <span className="text-slate-300">brains</span>
                  <span className="text-slate-400">.</span>
                  <span className="text-sky-300">connect</span>
                  <span className="text-slate-400">(</span>
                  <span className="text-emerald-300">minds</span>
                  <span className="text-slate-400">)</span>
                </CodeLine>
                <CodeLine width="12ch">
                  <span className="text-fuchsia-300">await</span>{' '}
                  <span className="text-slate-300">brains</span>
                  <span className="text-slate-400">.</span>
                  <span className="text-sky-300">sync</span>
                  <span className="text-slate-400">()</span>
                </CodeLine>
                <CodeLine width="20ch">
                  <span className="text-slate-500">// thinking. connecting.</span>
                </CodeLine>
              </motion.div>
              {burstP > 0 && <CodeBurst active={burstP > 0.12} />}
            </div>
          </div>
          {/* monitor stand */}
          <div className="mx-auto h-5 w-16 bg-slate-800" />
          <div className="mx-auto h-1.5 w-32 rounded-full bg-slate-700" />
        </div>

        {/* keyboard */}
        <div
          className="mx-auto mt-5 w-[62%] rounded-lg bg-slate-800/80 p-3 shadow-xl ring-1 ring-white/10 backdrop-blur"
          style={{ opacity: powerOn }}
        >
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-sm bg-slate-600/60"
                style={{
                  opacity: powerOn > 0.2 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i)) : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* mug */}
        <div
          className="absolute right-[2%] bottom-[6%] h-10 w-8 rounded-md bg-gradient-to-b from-indigo-500/60 to-purple-600/40 ring-1 ring-white/10"
          style={{ opacity: powerOn }}
        />

        <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-indigo-200/40">
          build · connect · ship
        </div>
      </div>
    </div>
  );
}
