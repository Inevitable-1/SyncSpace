export const GOLD = '#D4AF37';
export const DARK_GOLD = '#B8860B';
export const BRAND_RED = '#C1121F';
export const TEXT_BLACK = '#111111';

export const S_PATH =
  'M43 13 C43 6,21 6,21 13 C21 20,43 22,43 32 C43 42,21 44,21 51 C21 58,43 58,43 51';

interface LogoMarkProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
  showTile?: boolean;
}

export default function LogoMark({
  size = 40,
  className,
  showGlow = true,
  showTile = true,
}: LogoMarkProps) {
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
          stroke="#D4AF37"
          strokeOpacity="0.45"
        />
      )}
      {showGlow && (
        <>
          <circle cx="32" cy="32" r="26" fill="#D4AF37" opacity="0.1" />
          <circle cx="32" cy="32" r="6.5" fill="#C1121F" opacity="0.15" />
        </>
      )}
      <path
        d={S_PATH}
        stroke={GOLD}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={showGlow ? { filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.5))' } : undefined}
      />
      <circle
        cx="32"
        cy="32"
        r="4.2"
        fill={BRAND_RED}
        style={showGlow ? { filter: 'drop-shadow(0 0 4px rgba(193,18,31,0.55))' } : undefined}
      />
    </svg>
  );
}
