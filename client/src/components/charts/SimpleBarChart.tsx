interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: ChartData[];
  title?: string;
  className?: string;
}

export default function SimpleBarChart({ data, title, className = '' }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

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
      <div className="flex items-end gap-2 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
              <div
                className="w-full max-w-[40px] rounded-t-lg transition-all duration-300"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  background: item.color || 'var(--color-primary, #6366f1)',
                  minHeight: item.value > 0 ? '4px' : '0px',
                }}
              />
            </div>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
