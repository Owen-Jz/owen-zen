"use client";

import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface FinanceCardProps {
  balance?: number;
  budgetUsed?: number;
  topCategory?: string;
  topCategoryAmount?: number;
  recentTransactions?: Array<{ description: string; amount: number; date: string }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function BudgetBar({ percent }: { percent: number }) {
  const color =
    percent > 100 ? "var(--cc-error)" :
    percent > 80 ? "var(--cc-warning)" :
    "var(--cc-success)";
  const isOverBudget = percent > 100;
  const displayPercent = Math.min(percent, 100);

  return (
    <div className="w-full rounded-full h-2 overflow-hidden bg-[var(--cc-border)] relative">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${displayPercent}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {isOverBudget && (
        <>
          <motion.div
            className="absolute top-0 right-0 h-full rounded-r-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent - 100, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            style={{
              backgroundColor: "var(--cc-error)",
              opacity: 0.7,
            }}
          />
          <motion.div
            className="absolute top-0 right-0 h-full rounded-r-full"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: `${Math.min(percent - 100, 100)}%`,
              backgroundColor: "var(--cc-error)",
            }}
          />
        </>
      )}
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(212,168,83,0.15)" }}
      className="rounded-2xl border p-5 h-full min-h-[200px] flex flex-col gap-3"
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
        transition: "box-shadow 200ms ease",
      }}
    >
      <div className="flex items-center justify-between">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Finance
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Wallet size={14} style={{ color: "var(--cc-accent)" }} />
        </motion.div>
      </div>

      {/* Hero: balance */}
      <motion.div
        className="flex items-baseline gap-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <span className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}>
          {formatted}
        </span>
      </motion.div>

      {/* Budget progress */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--cc-text-secondary)" }}>
          <span>Budget used</span>
          <span className="font-mono">{Math.round(budgetUsed)}%</span>
        </div>
        <BudgetBar percent={budgetUsed} />
      </motion.div>

      {/* Top spending category */}
      {topCategory && (
        <motion.div
          className="flex items-center gap-1 text-xs"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <TrendingUp size={11} />
          <span>{topCategory}</span>
          <ArrowUpRight size={10} />
          <span className="font-mono" style={{ color: "var(--cc-accent)" }}>{formatCurrency(topCategoryAmount)}</span>
        </motion.div>
      )}

      {/* Recent transactions */}
      {recentTransactions.length > 0 ? (
        <motion.div
          className="pt-2 border-t space-y-1"
          style={{ borderColor: "var(--cc-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {recentTransactions.slice(0, 2).map((tx, i) => (
            <motion.div
              key={i}
              className="flex justify-between items-center text-[11px]"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <span className="truncate max-w-[120px]" style={{ color: "var(--cc-text)" }}>
                {tx.description.length > 18 ? `${tx.description.slice(0, 18)}...` : tx.description}
              </span>
              <span className="font-mono flex-shrink-0" style={{ color: tx.amount >= 0 ? "var(--cc-success)" : "var(--cc-text-secondary)" }}>
                {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="pt-2 border-t text-[11px] italic"
          style={{ color: "var(--cc-text-secondary)", borderColor: "var(--cc-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          No transactions yet
        </motion.div>
      )}
    </motion.div>
  );
}

export function FinanceCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-14 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-8 w-32 rounded mb-3" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-2 w-full rounded mb-3" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
    </motion.div>
  );
}