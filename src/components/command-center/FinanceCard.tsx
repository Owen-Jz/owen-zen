"use client";

import { Wallet, TrendingUp } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface FinanceCardProps {
  balance?: number;
  budgetUsed?: number;
  topCategory?: string;
  topCategoryAmount?: number;
  recentTransactions?: Array<{ description: string; amount: number; date: string }>;
}

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "upcoming";
  if (diffDays === 0) return "today";
  return `${diffDays}d ago`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function truncateText(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

function BudgetBar({ percent }: { percent: number }) {
  const color = percent > 100 ? "var(--cc-error)" : percent > 80 ? "var(--cc-warning)" : "var(--cc-success)";
  return (
    <div className="w-full rounded-full h-2 overflow-hidden bg-[var(--cc-border)]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function FinanceCard({
  balance = 0,
  budgetUsed = 0,
  topCategory = "",
  topCategoryAmount = 0,
  recentTransactions = [],
}: FinanceCardProps) {
  const formatted = formatCurrency(balance);

  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Finance</p>
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={16} style={{ color: "var(--cc-accent)" }} />
        <span className="text-xl font-bold font-mono" style={{ color: "var(--cc-text)" }}>{formatted}</span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--cc-text-secondary)" }}>
          <span>Budget used</span>
          <span>{Math.round(budgetUsed)}%</span>
        </div>
        <BudgetBar percent={budgetUsed} />
      </div>
      {topCategory && (
        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: "var(--cc-text-secondary)" }}>
          <TrendingUp size={12} />
          <span>{topCategory} — {formatCurrency(topCategoryAmount)}</span>
        </div>
      )}
      {recentTransactions.length > 0 && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--cc-border)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--cc-text-secondary)" }}>Recent</p>
          {recentTransactions.slice(0, 3).map((tx, i) => (
            <div key={i} className="flex justify-between items-center text-xs py-0.5">
              <span style={{ color: "var(--cc-text)" }}>{truncateText(tx.description, 20)}</span>
              <span className="font-mono" style={{ color: "var(--cc-text-secondary)" }}>
                {formatCurrency(tx.amount)}
              </span>
              <span className="text-[10px]" style={{ color: "var(--cc-text-secondary)" }}>
                {getRelativeDate(tx.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FinanceCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <SkeletonCard className="h-3 w-14 mb-3" />
      <SkeletonCard className="h-8 w-28 mb-3" />
      <SkeletonCard className="h-2 w-full mb-2" />
      <SkeletonCard className="h-3 w-32" />
    </div>
  );
}
