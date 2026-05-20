interface MiniChartProps {
  data: number[];
  height?: number;
  color?: string;
  showBaseline?: boolean;
  className?: string;
}

export function MiniChart({
  data,
  height = 32,
  color = "var(--cc-accent)",
  showBaseline = false,
  className,
}: MiniChartProps) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const barWidth = Math.max(4, Math.floor(100 / data.length) - 2);

  return (
    <svg
      width="100%"
      height={height}
      className={className}
      style={{ overflow: "visible" }}
    >
      {/* Baseline */}
      {showBaseline && (
        <line
          x1="0"
          y1={height - 2}
          x2="100%"
          y2={height - 2}
          stroke="var(--cc-border)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      )}

      {/* Bars */}
      {data.map((value, i) => {
        const barHeight = Math.max(2, ((value - min) / range) * (height - 4));
        const x = (i / Math.max(data.length - 1, 1)) * 100;
        const y = height - barHeight - 2;
        return (
          <rect
            key={i}
            x={`${x}%`}
            y={y}
            width={`${barWidth}%`}
            height={barHeight}
            rx="2"
            fill={color}
            opacity={0.85}
          />
        );
      })}

      {/* Current value dot */}
      {data.length > 0 && (
        <circle
          cx="100%"
          cy={height - 2 - (((data[data.length - 1] - min) / range) * (height - 4))}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "var(--cc-accent)",
  className,
}: SparklineProps) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const filledPoints = [
    `0,${height}`,
    ...points.map(p => p),
    `${(data.length - 1) * step},${height}`,
  ].join(" ");

  const lastX = (data.length - 1) * step;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;

  return (
    <svg width={width} height={height} className={className} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`spark-grad-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={filledPoints}
        fill={`url(#spark-grad-${color.replace(/[^a-z0-9]/gi, '')})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

interface WeekBarChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  className?: string;
}

export function WeekBarChart({
  data,
  labels,
  height = 40,
  color = "var(--cc-accent)",
  className,
}: WeekBarChartProps) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const barWidth = 100 / data.length;

  return (
    <div className={className} style={{ display: "flex", alignItems: "flex-end", gap: "2px", height }}>
      {data.map((value, i) => {
        const barHeight = Math.max(4, (value / max) * height);
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "2px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: barHeight,
                backgroundColor: color,
                borderRadius: "2px 2px 0 0",
                opacity: i === data.length - 1 ? 1 : 0.6,
                minHeight: 4,
              }}
            />
            {labels && labels[i] && (
              <span style={{ fontSize: "8px", color: "var(--cc-text-secondary)" }}>{labels[i]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}