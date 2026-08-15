import Logo from './Logo';

export { GOLD, DARK_GOLD, ACCENT_RED, TEXT_BLACK } from './Logo';

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
  showTile = false,
}: LogoMarkProps) {
  return <Logo size={size} className={className} showGlow={showGlow} showTile={showTile} />;
}
