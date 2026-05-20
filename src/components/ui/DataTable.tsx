"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DataTableProps<T> {
  columns: {
    key: string
    header: string
    render?: (row: T) => React.ReactNode
    className?: string
  }[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  onSort?: (column: string) => void
  emptyState?: React.ReactNode
  className?: string
}

function SortIcon({ direction }: { direction?: "asc" | "desc" }) {
  if (!direction) {
    return (
      <svg className="w-3 h-3 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    )
  }
  return (
    <svg className={cn("w-3 h-3", direction === "asc" ? "text-[var(--color-primary)]" : "text-[var(--color-primary)] rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 15l5 5 5-5" />
    </svg>
  )
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  emptyState,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--card-bg)]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort?.(col.key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider",
                    onSort && "cursor-pointer hover:text-[var(--color-text-primary)] transition-colors",
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {onSort && <SortIcon direction={sortColumn === col.key ? sortDirection : undefined} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  {emptyState || (
                    <span className="text-sm text-[var(--color-text-muted)]">No data available</span>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface-hover)] transition-all border-b border-[var(--color-border)]/50 last:border-b-0",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-sm text-[var(--color-text-primary)]", col.className)}>
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { DataTable }