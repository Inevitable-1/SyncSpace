import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GOLD, BRAND_RED, S_PATH } from './LogoMark';

export const LOGO_ANIM_DURATION = 3.4;

let idCounter = 0;

const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 + i * 0.37;
  const radius = 19 + (i % 5) * 7;
  return {
    id: i,
    x0: 32 + Math.cos(angle) * radius,
    y0: 32 + Math.sin(angle) * radius,
    size: 1.3 + (i % 3) * 0.75,
    delay: 0.05 + (i % 8) * 0.08,
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
  const gradientId = `ss-anim-glow-${++idCounter}`;
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
        transition={{ delay: 1.7, duration: 1.2, ease: 'easeOut' }}
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

        {/* soft gold halo behind the mark */}
        <motion.circle
          cx="32"
          cy="32"
          r="26"
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: running ? 1 : 0, scale: running ? 1 : 0.85 }}
          transition={{ delay: 1.55, duration: 1.4, ease: 'easeOut' }}
        />

        {/* small gold particles converge toward the center hub */}
        {PARTICLES.map((p) => (
          <motion.circle
            key={p.id}
            cx="32"
            cy="32"
            r={p.size}
            fill={GOLD}
            initial={{ x: p.x0 - 32, y: p.y0 - 32, opacity: 0, scale: 0 }}
            animate={
              running
                ? {
                    x: [p.x0 - 32, p.x0 - 32, 0],
                    y: [p.y0 - 32, p.y0 - 32, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.4, 0],
                  }
                : {}
            }
            transition={{
              delay: p.delay,
              duration: 1.25,
              times: [0, 0.35, 1],
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* red center dot appears first */}
        <motion.circle
          cx="32"
          cy="32"
          r="6.5"
          fill={BRAND_RED}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: running ? 0.15 : 0, scale: running ? 1 : 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: 'easeOut' }}
        />
        <motion.circle
          cx="32"
          cy="32"
          r="4.2"
          fill={BRAND_RED}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: running ? 1 : 0, scale: running ? 1 : 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 5px rgba(193,18,31,0.65))' }}
        />

        {/* gold lines draw themselves around the red dot */}
        <motion.path
          d={S_PATH}
          stroke={GOLD}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: running ? 1 : 0, opacity: running ? 1 : 0 }}
          transition={{ delay: 1.0, duration: 1.2, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.5))' }}
        />
      </svg>
    </div>
  );
}
