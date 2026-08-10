import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BrainCanvas } from './canvas';
import { brainCloud, logoCloud, connectionEdges, clamp01 } from './geometry';
import { TIMELINE, windowOpacity, windowProgress } from './timeline';

const WORDMARK = ['Think.', 'Connect.', 'Create.'];

export default function BrainScene({ t }: { t: number }) {
  const op = windowOpacity(
    t,
    TIMELINE.brainStart,
    TIMELINE.fadeStart + TIMELINE.fadeDur,
    0.3,
    TIMELINE.fadeDur,
  );
  if (op <= 0) return null;

  const p = windowProgress(t, TIMELINE.brainStart, TIMELINE.brainEnd);
  const assembled = clamp01(p / 0.32);
  const neuralP = clamp01((p - 0.32) / 0.12);
  const morphP = clamp01((p - 0.55) / 0.25);
  const wordP = clamp01((p - 0.78) / 0.18);

  const neural = neuralP * (1 - clamp01((p - 0.55) / 0.05));
  const pulse = (0.2 + 0.6 * neuralP) * (0.5 + 0.5 * Math.sin(t * 4)) + morphP * 0.15;
  const spin = p < 0.34 ? 0.5 + p : p < 0.55 ? 1.35 : 0.35;
  const sizeScale = 1 + clamp01((p - 0.55) / 0.25) * 0.18 + wordP * 0.06;

  const cloud = useMemo(() => brainCloud(260, 1), []);
  const logo = useMemo(() => logoCloud(260, 2), []);
  const edges = useMemo(() => connectionEdges(cloud, 0.42, 3), [cloud]);

  return (
    <div className="absolute inset-0" style={{ opacity: op }}>
      {/* holographic projection cone glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: (neuralP * 0.6 + morphP * 0.4) * 0.5,
          background: 'radial-gradient(circle at 50% 42%, rgba(129,140,248,0.28), transparent 58%)',
        }}
      />

      <div className="absolute left-1/2 top-[40%] h-[50vh] max-h-[520px] w-[86vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2">
        <BrainCanvas
          className="h-full w-full"
          cloud={cloud}
          edges={edges}
          morphTo={logo}
          assembled={assembled}
          morphT={morphP}
          neural={neural}
          pulse={pulse}
          spin={spin}
          baseSpin={0.5}
          sizeScale={sizeScale}
          colorA="#818cf8"
          colorB="#c084fc"
          colorC="#e0e7ff"
        />
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-[16%] flex flex-col items-center"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        animate={{
          opacity: wordP,
          y: wordP * 0 + 26 * (1 - wordP),
          filter: `blur(${(1 - wordP) * 8}px)`,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-[0_0_28px_rgba(129,140,248,0.45)] sm:text-7xl">
          SyncSpace
        </h1>
        <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.45em] text-indigo-200/70 sm:text-sm">
          {WORDMARK.map((w, i) => (
            <span key={w} className="flex items-center gap-3">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-indigo-300/60" />}
              {w}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
