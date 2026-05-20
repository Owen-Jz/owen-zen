"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

function StatCard({ label, value, sub, icon, trend, trendValue, className }: StatCardProps) {
  return (
    <div className={cn("bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-primary)]/30 transition-all relative overflow-hidden group", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-muted)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-[var(--color-text-secondary)] font-light mb-1">{label}</div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</div>
          {sub && <div className="text-xs text-[var(--color-text-muted)] mt-1">{sub}</div>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className={cn(
          "relative z-10 text-xs font-medium",
          trend === "up" ? "text-[var(--color-success)]" : trend === "down" ? "text-[var(--color-error)]" : "text-[var(--color-text-muted)]"
        )}>
          {trendValue}
        </div>
      )}
    </div>
  )
}

export { StatCard }