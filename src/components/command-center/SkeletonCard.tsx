import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border animate-pulse",
        className
      )}
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
      }}
    />
  );
}
