'use client';

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className }: SkeletonCardProps) => (
  <div className={cn("bg-surface/50 animate-pulse rounded-xl", className)} />
);

interface SkeletonStatsProps {
  count?: number;
}

export const SkeletonStats = ({ count = 4 }: SkeletonStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <SkeletonCard className="w-9 h-9 rounded-lg" />
          <SkeletonCard className="w-20 h-4" />
        </div>
        <SkeletonCard className="w-24 h-8" />
      </div>
    ))}
  </div>
);

interface SkeletonContentProps {
  showHeader?: boolean;
}

export const SkeletonContent = ({ showHeader = true }: SkeletonContentProps) => (
  <div className="space-y-4">
    {showHeader && <SkeletonCard className="h-12 w-48" />}
    <div className="bg-surface border border-border rounded-2xl p-6">
      <SkeletonCard className="h-48 w-full" />
    </div>
  </div>
);