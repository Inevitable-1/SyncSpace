interface StatItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleDonutChartProps {
  data: StatItem[];
  title?: string;
  className?: string;
}

export default function SimpleDonutChart({ data, title, className = '' }: SimpleDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

  let accumulatedPercentage = 0;

  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
    >
      {title && (
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -accumulatedPercentage;
              accumulatedPercentage += percentage;

              return (
                <circle
                  key={index}
                  className="transition-all duration-300"
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={item.color || colors[index % colors.length]}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {total}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: item.color || colors[index % colors.length] }}
              />
              <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
