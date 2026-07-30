export default function Spinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-6 w-6 border-[2.5px]',
    lg: 'h-10 w-10 border-[3px]',
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-[var(--border-color)] border-t-[var(--accent)] ${className}`}
    />
  );
}
