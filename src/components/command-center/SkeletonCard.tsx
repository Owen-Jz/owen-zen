import { cn } from "@/lib/utils";

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
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    />
  );
}
