import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrendDirection = "up" | "down" | "neutral";

interface StatBadgeProps {
  value: number | string;
  suffix?: string;
  direction?: TrendDirection;
  className?: string;
}

const TrendIcon: Record<TrendDirection, React.ReactNode> = {
  up: <TrendingUp size={10} />,
  down: <TrendingDown size={10} />,
  neutral: <Minus size={10} />,
};

const colors: Record<TrendDirection, string> = {
  up: "var(--cc-success)",
  down: "var(--cc-error)",
  neutral: "var(--cc-text-secondary)",
};

const bgColors: Record<TrendDirection, string> = {
  up: "rgba(34, 197, 94, 0.1)",
  down: "rgba(239, 68, 68, 0.1)",
  neutral: "var(--cc-bg)",
};

export function StatBadge({ value, suffix = "", direction = "neutral", className }: StatBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border",
        className
      )}
      style={{ color: colors[direction], backgroundColor: bgColors[direction], borderColor: colors[direction] }}
    >
      <span>{TrendIcon[direction]}</span>
      <span>{value}{suffix}</span>
    </span>
  );
}