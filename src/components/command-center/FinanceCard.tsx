"use client";

import { Wallet, TrendingUp } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface FinanceCardProps {
  balance?: number;
  budgetUsed?: number;
  topCategory?: string;
  topCategoryAmount?: number;
}

function BudgetBar({ percent }: { percent: number }) {
  const color = percent > 100 ? "#C46B6B" : percent > 80 ? "#D4915A" : "#7A9E7E";
  return (
    <div className="w-full bg-[#E8E4DE] rounded-full h-2 overflow-hidden">
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
}: FinanceCardProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(balance);

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Finance</p>
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={16} className="text-[#C4A882]" />
        <span className="text-xl font-bold font-mono text-[#1A1A1A]">{formatted}</span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-[#6B6560] mb-1">
          <span>Budget used</span>
          <span>{Math.round(budgetUsed)}%</span>
        </div>
        <BudgetBar percent={budgetUsed} />
      </div>
      {topCategory && (
        <div className="flex items-center gap-1 text-xs text-[#6B6560]">
          <TrendingUp size={12} />
          <span>{topCategory} — {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(topCategoryAmount)}</span>
        </div>
      )}
    </div>
  );
}

export function FinanceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-14 mb-3" />
      <SkeletonCard className="h-8 w-28 mb-3" />
      <SkeletonCard className="h-2 w-full mb-2" />
      <SkeletonCard className="h-3 w-32" />
    </div>
  );
}