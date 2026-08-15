import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GOLD,
  ACCENT_RED,
  OUTER_NODES,
  HEXAGON_PATH,
  SPOKES_PATH,
  CENTER,
  LINE_WIDTH,
  NODE_RADIUS,
  CENTER_RADIUS,
} from './Logo';

export const LOGO_ANIM_DURATION = 3.4;

let idCounter = 0;

const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + i * 0.4;
  const radius = 24 + (i % 4) * 6;
  return {
    id: i,
    x0: CENTER.x + Math.cos(angle) * radius,
    y0: CENTER.y + Math.sin(angle) * radius,
    size: 1.3 + (i % 3) * 0.7,
    delay: 0.05 + (i % 6) * 0.07,
  };
});

interface AnimatedLogoProps {
  size?: number;
  className?: string;
  play?: boolean;
  onComplete?: () => void;
}

export default function AnimatedLogo({
  size = 220,
  className,
  play = true,
  onComplete,
}: AnimatedLogoProps) {
  const gradientId = `ss-net-halo-${++idCounter}`;
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!play) return;
    const t = setTimeout(() => setRunning(true), 50);
    return () => clearTimeout(t);
  }, [play]);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => onComplete?.(), LOGO_ANIM_DURATION * 1000);
    return () => clearTimeout(t);
  }, [running, onComplete]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: running ? 1 : 0 }}
        transition={{ delay: 1.4, duration: 1.2, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.35), transparent 65%)',
        }}
      />
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.45" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft gold halo behind the network */}
        <motion.circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="27"
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: running ? 1 : 0, scale: running ? 1 : 0.85 }}
          transition={{ delay: 1.3, duration: 1.4, ease: 'easeOut' }}
        />

        {/* small gold particles converge toward the center hub */}
        {PARTICLES.map((p) => (
          <motion.circle
            key={p.id}
            cx={CENTER.x}
            cy={CENTER.y}
            r={p.size}
            fill={GOLD}
            initial={{ x: p.x0 - CENTER.x, y: p.y0 - CENTER.y, opacity: 0, scale: 0 }}
            animate={
              running
                ? {
                    x: [p.x0 - CENTER.x, p.x0 - CENTER.x, 0],
                    y: [p.y0 - CENTER.y, p.y0 - CENTER.y, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.3, 0],
                  }
                : {}
            }
            transition={{
              delay: p.delay,
              duration: 1.15,
              times: [0, 0.35, 1],
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* gold spokes draw from the hub toward each outer node */}
        <motion.path
          d={SPOKES_PATH}
          stroke={GOLD}
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: running ? 1 : 0, opacity: running ? 1 : 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
        />

        {/* outer hexagon ring draws */}
        <motion.path
          d={HEXAGON_PATH}
          stroke={GOLD}
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: running ? 1 : 0, opacity: running ? 1 : 0 }}
          transition={{ delay: 0.9, duration: 0.8, ease: 'easeInOut' }}
        />

        {/* outer nodes pop in with a subtle stagger */}
        {OUTER_NODES.map((n, i) => (
          <motion.circle
            key={`${n.x}-${n.y}`}
            cx={n.x}
            cy={n.y}
            r={NODE_RADIUS}
            fill={GOLD}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: running ? 1 : 0, opacity: running ? 1 : 0 }}
            transition={{ delay: 1.35 + i * 0.06, duration: 0.3, ease: 'backOut' }}
          />
        ))}

        {/* red center hub pops in and keeps a gentle pulse */}
        <motion.circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={CENTER_RADIUS}
          fill={ACCENT_RED}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: running ? 1 : 0, opacity: running ? 1 : 0 }}
          transition={{ delay: 1.6, duration: 0.35, ease: 'backOut' }}
          style={{ filter: 'drop-shadow(0 0 5px rgba(220,20,60,0.65))' }}
        />
        <motion.circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={CENTER_RADIUS}
          fill="none"
          stroke={ACCENT_RED}
          strokeWidth="1.4"
          initial={{ opacity: 0, scale: 1 }}
          animate={running ? { opacity: [0, 0.5, 0], scale: [1, 1.7] } : {}}
          transition={{ delay: 1.7, duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}
