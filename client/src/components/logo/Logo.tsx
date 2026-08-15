import { motion } from 'framer-motion';

export const GOLD = '#D4AF37';
export const DARK_GOLD = '#B8860B';
export const ACCENT_RED = '#DC143C';
export const TEXT_BLACK = '#111111';

export const CENTER = { x: 32, y: 32 };

// Six outer nodes on a flat-top hexagon (ring radius 21) around the hub.
export const OUTER_NODES = [
  { x: 32, y: 53 },
  { x: 50.2, y: 42.5 },
  { x: 50.2, y: 21.5 },
  { x: 32, y: 11 },
  { x: 13.8, y: 21.5 },
  { x: 13.8, y: 42.5 },
];

// Neighboring nodes connected to form the outer hexagon.
export const HEXAGON_PATH =
  OUTER_NODES.map((n, i) => `${i === 0 ? 'M' : 'L'}${n.x} ${n.y}`).join(' ') + ' Z';

// Every outer node connected to the center hub.
export const SPOKES_PATH = OUTER_NODES.map((n) => `M${CENTER.x} ${CENTER.y} L${n.x} ${n.y}`).join(
  ' ',
);

export const LINE_WIDTH = 2.6;
export const NODE_RADIUS = 3.1;
export const CENTER_RADIUS = 4.6;

interface LogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
  showTile?: boolean;
  pulse?: boolean;
}

export default function Logo({
  size = 40,
  className,
  showGlow = true,
  showTile = false,
  pulse = false,
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {showTile && (
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="16"
          fill="#FFFFFF"
          stroke={GOLD}
          strokeOpacity="0.45"
        />
      )}

      {showGlow && <circle cx={CENTER.x} cy={CENTER.y} r="27" fill={GOLD} opacity="0.08" />}

      <path
        d={HEXAGON_PATH}
        stroke={GOLD}
        strokeWidth={LINE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />

      <path
        d={SPOKES_PATH}
        stroke={GOLD}
        strokeWidth={LINE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />

      {OUTER_NODES.map((n) => (
        <circle key={`${n.x}-${n.y}`} cx={n.x} cy={n.y} r={NODE_RADIUS} fill={GOLD} />
      ))}

      {pulse && (
        <>
          <motion.path
            d={HEXAGON_PATH}
            stroke={GOLD}
            strokeWidth={LINE_WIDTH + 0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ strokeDasharray: '16 172' }}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -188 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={CENTER_RADIUS}
            fill="none"
            stroke={ACCENT_RED}
            strokeWidth="1.4"
            initial={{ opacity: 0.55, scale: 1 }}
            animate={{ opacity: 0, scale: 1.9 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        </>
      )}

      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r={CENTER_RADIUS}
        fill={ACCENT_RED}
        style={showGlow ? { filter: 'drop-shadow(0 0 4px rgba(220,20,60,0.5))' } : undefined}
      />
    </svg>
  );
}
