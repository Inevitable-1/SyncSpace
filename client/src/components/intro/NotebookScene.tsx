import { motion } from 'framer-motion';
import { TIMELINE, windowOpacity, windowProgress } from './timeline';
import { clamp01 } from './geometry';

const LETTERS = ['I', 'D', 'E', 'A'];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.16, delayChildren: 0.2 },
  },
};

const letter = {
  hidden: { opacity: 0, y: 18, filter: 'blur(10px)', scale: 0.6 },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function NotebookScene({ t }: { t: number }) {
  const op = windowOpacity(t, TIMELINE.noteStart, TIMELINE.glowEnd, 0.25, 0.4);
  if (op <= 0) return null;

  const writeP = windowProgress(t, TIMELINE.noteStart, TIMELINE.noteEnd);
  const glowP = clamp01((t - 1.15) / 0.9);

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: op }}>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: glowP,
          background:
            'radial-gradient(circle at 50% 55%, rgba(129,140,248,0.4), rgba(168,85,247,0.15) 45%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative"
        animate={{
          scale: 1 + glowP * 0.18,
          filter: glowP > 0 ? `blur(${(1 - glowP) * 3}px)` : 'blur(0px)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* notebook */}
        <div className="relative w-[340px] sm:w-[400px] rounded-2xl border border-indigo-300/20 bg-slate-900/60 p-6 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" />

          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-indigo-200/50">
            <span>SyncSpace</span>
            <span>Notes</span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-[6px] w-3/4 rounded-full bg-white/8" />
            <div className="h-[6px] w-5/6 rounded-full bg-white/8" />
            <div className="h-[6px] w-2/3 rounded-full bg-white/8" />
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <motion.div
              className="flex items-end gap-2"
              variants={container}
              initial="hidden"
              animate={writeP > 0 ? 'show' : 'hidden'}
            >
              {LETTERS.map((l) => (
                <motion.span
                  key={l}
                  variants={letter}
                  className="bg-gradient-to-br from-indigo-300 via-indigo-200 to-purple-300 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-[0_0_18px_rgba(129,140,248,0.55)]"
                >
                  {l}
                </motion.span>
              ))}
              <motion.span
                className="mb-1 ml-1 h-10 w-[3px] rounded-full bg-indigo-300"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              />
            </motion.div>
          </div>
        </div>

        <motion.p
          className="mt-6 text-center text-sm font-medium tracking-wide text-indigo-100/60"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: writeP > 0.6 ? 1 : 0, y: writeP > 0.6 ? 0 : 8 }}
          transition={{ duration: 0.5 }}
        >
          every big thing starts with a single thought
        </motion.p>
      </motion.div>
    </div>
  );
}
