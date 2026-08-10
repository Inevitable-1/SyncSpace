import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BrainCanvas, EnergyBeam } from './canvas';
import { brainCloud, connectionEdges, clamp01 } from './geometry';
import { TIMELINE, windowOpacity, windowProgress } from './timeline';

const POSITIONS = [
  { left: '20%', top: '22%' },
  { left: '80%', top: '22%' },
  { left: '20%', top: '74%' },
  { left: '80%', top: '74%' },
] as const;

export default function MindLinkScene({ t }: { t: number }) {
  const op = windowOpacity(t, TIMELINE.mindStart, TIMELINE.mindEnd, 0.3, 0.35);
  if (op <= 0) return null;

  const p = windowProgress(t, TIMELINE.mindStart, TIMELINE.mindEnd);
  const flyIn = clamp01(p / 0.35);
  const blinkW = clamp01((p - 0.35) / 0.25);
  const blink = blinkW * (0.45 + 0.55 * Math.sin(t * 7.5));
  const brainsOp = 1 - clamp01((p - 0.62) / 0.18);
  const beamP = clamp01((p - 0.6) / 0.4);

  const cloud = useMemo(() => brainCloud(80, 7), []);
  const edges = useMemo(() => connectionEdges(cloud, 0.5, 3), [cloud]);

  return (
    <div className="absolute inset-0" style={{ opacity: op }}>
      {/* connection lines between the four minds */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <g stroke="url(#mindlink-grad)" strokeWidth="0.18" fill="none" opacity={blinkW * 0.7}>
          <line x1="20" y1="22" x2="80" y2="22" />
          <line x1="20" y1="22" x2="80" y2="74" />
          <line x1="80" y1="22" x2="80" y2="74" />
          <line x1="20" y1="74" x2="80" y2="74" />
        </g>
        <defs>
          <linearGradient id="mindlink-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>

      {POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={pos}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{
            scale: 0.55 + flyIn * 0.45,
            opacity: flyIn * brainsOp,
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <BrainCanvas
            className="h-[150px] w-[150px] sm:h-[180px] sm:w-[180px]"
            cloud={cloud}
            edges={edges}
            assembled={1}
            neural={blink}
            pulse={blinkW}
            spin={0.5}
            sizeScale={1.15}
          />
        </motion.div>
      ))}

      {beamP > 0 && <EnergyBeam className="absolute inset-0" progress={beamP} />}
    </div>
  );
}
