"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

interface BarChartProps {
  data: ChartData[];
  height?: number;
  showValues?: boolean;
  colors?: { primary: string; secondary: string };
  onBarClick?: (index: number) => void;
}

// Bar Chart Component
export function FinanceBarChart({
  data,
  height = 200,
  showValues = true,
  colors = { primary: "#ef4444", secondary: "#22c55e" },
  onBarClick,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0)), 1);

  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full flex items-end justify-between gap-2">
        {data.map((item, i) => {
          const barHeight = (item.value / max) * 100;
          const secondaryHeight = item.secondaryValue ? (item.secondaryValue / max) * 100 : 0;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end gap-1 group relative h-full"
              onClick={() => onBarClick?.(i)}
            >
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold text-white shadow-xl pointer-events-none">
                {item.label}: {item.value.toLocaleString()}
              </div>

              {/* Secondary bar (e.g., income) */}
              {secondaryHeight > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${secondaryHeight}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={cn(
                    "w-full rounded-t-md transition-all group-hover:brightness-125",
                    "bg-gradient-to-t from-green-600/50 to-green-500/80"
                  )}
                  style={{ minHeight: "4px" }}
                />
              )}

              {/* Primary bar (e.g., expenses) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                className={cn(
                  "w-full rounded-t-md transition-all group-hover:brightness-125 relative overflow-hidden",
                  "bg-gradient-to-t from-red-600/50 to-red-500/80"
                )}
                style={{
                  minHeight: item.value > 0 ? "4px" : "0",
                  backgroundColor: item.color || colors.primary,
                }}
              >
                {item.value > 0 && (
                  <div className="absolute inset-0 bg-white/10" />
                )}
              </motion.div>

              {/* Label */}
              <div className="text-xs text-gray-400 text-center truncate">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: ChartData[];
  height?: number;
  showArea?: boolean;
  color?: string;
  projectionData?: ChartData[];
  onPointClick?: (index: number) => void;
}

// Line Chart Component
export function FinanceLineChart({
  data,
  height = 200,
  showArea = true,
  color = "#ef4444",
  projectionData,
  onPointClick,
}: LineChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const width = 100;
  const heightPx = height - 40;
  const padding = 10;

  const getX = (index: number) => padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
  const getY = (value: number) => heightPx - padding - ((value - min) / range) * (heightPx - padding * 2);

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.value),
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Projection line
  const projectionPoints = projectionData?.map((d, i) => ({
    x: getX(data.length + i),
    y: getY(d.value),
    ...d,
  }));
  const projectionPathD = projectionPoints
    ? points[points.length - 1]
      ? `M ${points[points.length - 1].x} ${points[points.length - 1].y} ${projectionPoints.map((p, i) => `L ${p.x} ${p.y}`).join(" ")}`
      : ""
    : "";

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${heightPx}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padding}
            y1={padding + tick * (heightPx - padding * 2)}
            x2={width - padding}
            y2={padding + tick * (heightPx - padding * 2)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
        ))}

        {/* Area fill */}
        {showArea && (
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
        )}

        {/* Area path */}
        {showArea && (
          <path
            d={`${pathD} L ${getX(data.length - 1)} ${heightPx - padding} L ${getX(0)} ${heightPx - padding} Z`}
            fill="url(#areaGradient)"
          />
        )}

        {/* Projection line (dashed) */}
        {projectionPathD && (
          <path
            d={projectionPathD}
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4,4"
            strokeOpacity="0.5"
          />
        )}

        {/* Main line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, i) => (
          <g key={i} onClick={() => onPointClick?.(i)} className="cursor-pointer">
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="#1a1a1a"
              stroke={color}
              strokeWidth="2"
              className="group-hover:r-4 transition-all"
            />
          </g>
        ))}

        {/* Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={heightPx - 2}
            textAnchor="middle"
            fontSize="3"
            fill="#6b7280"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

interface PieChartProps {
  data: ChartData[];
  size?: number;
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  onSliceClick?: (index: number) => void;
}

// Pie Chart Component
export function FinancePieChart({
  data,
  size = 200,
  innerRadius = 0.6,
  showLabels = true,
  showLegend = true,
  onSliceClick,
}: PieChartProps) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 10;
  const innerR = radius * innerRadius;

  let currentAngle = -90; // Start from top

  const slices = data.map((item, i) => {
    const percentage = total > 0 ? item.value / total : 0;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage: percentage * 100,
      startAngle,
      endAngle,
      color: item.color || `hsl(${(i * 360) / data.length}, 70%, 60%)`,
    };
  });

  const describeArc = (startAngle: number, endAngle: number, r: number) => {
    const start = polarToCartesian(radius, radius, r, endAngle);
    const end = polarToCartesian(radius, radius, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {slices.map((slice, i) => {
            const pathD = innerRadius > 0
              ? `${describeArc(slice.startAngle, slice.endAngle, radius)} L ${polarToCartesian(radius, radius, innerR, slice.endAngle).x} ${polarToCartesian(radius, radius, innerR, slice.endAngle).y} A ${innerR} ${innerR} 0 0 0 ${polarToCartesian(radius, radius, innerR, slice.startAngle).x} ${polarToCartesian(radius, radius, innerR, slice.startAngle).y} Z`
              : describeArc(slice.startAngle, slice.endAngle, radius);

            return (
              <motion.g key={i} onClick={() => onSliceClick?.(i)} className="cursor-pointer">
                <motion.path
                  d={pathD}
                  fill={slice.color}
                  className="transition-all hover:brightness-110"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                />
              </motion.g>
            );
          })}
        </svg>

        {/* Center label */}
        {innerRadius > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-bold text-white">
              {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3">
          {slices.map((slice, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80"
              onClick={() => onSliceClick?.(i)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-300">
                {slice.label} ({slice.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Progress bar component
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function FinanceProgressBar({
  value,
  max = 100,
  color,
  showLabel = true,
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const isOverBudget = value > max;
  const defaultColor = isOverBudget
    ? "#ef4444"
    : percentage >= 80
      ? "#f59e0b"
      : "#22c55e";

  const heights = { sm: "4px", md: "8px", lg: "12px" };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: color || defaultColor }}
          />
        ) : (
          <div
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: color || defaultColor,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default {
  FinanceBarChart,
  FinanceLineChart,
  FinancePieChart,
  FinanceProgressBar,
};
