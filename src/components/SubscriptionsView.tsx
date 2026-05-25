"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Pencil, Trash2, Calendar, DollarSign, RefreshCw,
  CreditCard, TrendingUp, Clock, AlertCircle, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

interface CostHistoryEntry {
  date: string;
  amount: number;
}

interface Subscription {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  billingCycle: "monthly" | "yearly" | "quarterly";
  category: "entertainment" | "software" | "health" | "finance" | "utilities" | "other";
  startDate: string;
  nextBillingDate: string;
  website?: string;
  color?: string;
  isActive: boolean;
  notes?: string;
  costHistory?: CostHistoryEntry[];
  createdAt: string;
}

type CategoryFilter = "all" | Subscription["category"];

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "entertainment", label: "Entertainment" },
  { value: "software", label: "Software" },
  { value: "health", label: "Health" },
  { value: "finance", label: "Finance" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
];

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#06b6d4",
];

const EXCHANGE_RATE = 1370; // NGN per USD

function formatCurrency(amount: number, currency: string = "NGN"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMonthlyAmount(amount: number, billingCycle: Subscription["billingCycle"]): number {
  switch (billingCycle) {
    case "yearly": return amount / 12;
    case "quarterly": return amount / 3;
    default: return amount;
  }
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Stats Component ---
function SubscriptionStats({ subscriptions }: { subscriptions: Subscription[] }) {
  const stats = useMemo(() => {
    const active = subscriptions.filter(s => s.isActive);
    const inactive = subscriptions.filter(s => !s.isActive);

    const totalMonthly = active.reduce((sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle), 0);
    const totalYearly = totalMonthly * 12;

    const mostExpensive = active.length > 0
      ? active.reduce((prev, curr) =>
          getMonthlyAmount(prev.amount, prev.billingCycle) > getMonthlyAmount(curr.amount, curr.billingCycle)
            ? prev : curr
        )
      : null;

    const upcomingRenewals = active.filter(s => {
      const days = getDaysUntil(s.nextBillingDate);
      return days >= 0 && days <= 7;
    });

    return {
      totalCount: subscriptions.length,
      activeCount: active.length,
      inactiveCount: inactive.length,
      totalMonthly,
      totalYearly,
      mostExpensive,
      upcomingRenewals: upcomingRenewals.length,
    };
  }, [subscriptions]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <CreditCard size={16} className="text-blue-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total</span>
        </div>
        <div className="text-2xl font-bold">{stats.totalCount}</div>
        <div className="text-xs text-gray-500">{stats.activeCount} active</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <DollarSign size={16} className="text-green-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Monthly</span>
        </div>
        <div className="text-2xl font-bold">{formatNGN(stats.totalMonthly)}</div>
        <div className="text-xs text-gray-500">{formatNGN(stats.totalYearly)}/yr · ≈ {formatUSD(stats.totalMonthly / EXCHANGE_RATE)}/mo</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <TrendingUp size={16} className="text-yellow-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Top Cost</span>
        </div>
        <div className="text-lg font-bold truncate">
          {stats.mostExpensive ? stats.mostExpensive.name : "—"}
        </div>
        <div className="text-xs text-gray-500">
          {stats.mostExpensive ? formatNGN(getMonthlyAmount(stats.mostExpensive.amount, stats.mostExpensive.billingCycle)) + "/mo" : "No data"}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Clock size={16} className="text-purple-400" />
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Due Soon</span>
        </div>
        <div className="text-2xl font-bold">{stats.upcomingRenewals}</div>
        <div className="text-xs text-gray-500">Next 7 days</div>
      </motion.div>
    </div>
  );
}

// --- Subscription Card ---
function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onToggle,
}: {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const monthlyAmount = getMonthlyAmount(subscription.amount, subscription.billingCycle);
  const yearlyAmount = monthlyAmount * 12;
  const daysUntil = getDaysUntil(subscription.nextBillingDate);

  // Check if amount changed from cost history
  const hasPriceChange = subscription.costHistory && subscription.costHistory.length > 0;
  const latestHistory = hasPriceChange && subscription.costHistory
    ? subscription.costHistory[subscription.costHistory.length - 1]
    : null;

  const handleDelete = async () => {
    if (!confirm(`Delete subscription "${subscription.name}"?`)) return;
    setDeleting(true);
    await onDelete(subscription._id);
  };

  const categoryColors: Record<string, string> = {
    entertainment: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    software: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    health: "bg-green-500/10 text-green-400 border-green-500/30",
    finance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    utilities: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    other: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden transition-all duration-200",
        isHovered && "border-[var(--color-primary)]/30 shadow-lg shadow-primary/5",
        !subscription.isActive && "opacity-60",
        deleting && "opacity-40"
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: subscription.color || "#6366f1",
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{subscription.name}</h3>
            {subscription.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{subscription.description}</p>
            )}
          </div>
          <span className={cn(
            "ml-2 px-2 py-0.5 rounded-full text-xs font-medium border capitalize shrink-0",
            categoryColors[subscription.category]
          )}>
            {subscription.category}
          </span>
        </div>

        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">{formatNGN(monthlyAmount)}</span>
            <span className="text-xs text-gray-500">/mo</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span>{formatNGN(yearlyAmount)}/yr</span>
            <span className="text-gray-600">·</span>
            <span>{subscription.billingCycle}</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">≈ {formatUSD(monthlyAmount / EXCHANGE_RATE)}/mo</span>
          </div>
          {hasPriceChange && latestHistory && latestHistory.amount !== subscription.amount && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs line-through text-gray-600">
                {formatNGN(getMonthlyAmount(latestHistory.amount, subscription.billingCycle))}/mo
              </span>
              <span className="text-xs text-green-400 flex items-center gap-0.5">
                <TrendingUp size={10} /> {formatNGN(monthlyAmount - getMonthlyAmount(latestHistory.amount, subscription.billingCycle))}
              </span>
            </div>
          )}
        </div>

        {/* Next billing */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <Calendar size={12} className="text-gray-500" />
          <span className="text-gray-400">
            Next: {formatDate(subscription.nextBillingDate)}
          </span>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-xs font-medium",
            daysUntil <= 3 ? "bg-red-500/10 text-red-400" :
            daysUntil <= 7 ? "bg-yellow-500/10 text-yellow-400" :
            "bg-gray-500/10 text-gray-400"
          )}>
            {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
          </span>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={() => onToggle(subscription._id, !subscription.isActive)}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors duration-200",
                subscription.isActive ? "bg-primary" : "bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                  subscription.isActive && "translate-x-4"
                )}
              />
            </button>
            <span className="text-xs text-gray-500">
              {subscription.isActive ? "Active" : "Inactive"}
            </span>
          </label>

          <div className={cn("flex items-center gap-1 transition-opacity", isHovered ? "opacity-100" : "opacity-0")}>
            {subscription.website && (
              <a
                href={subscription.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-white"
              >
                <AlertCircle size={14} />
              </a>
            )}
            <button
              onClick={() => onEdit(subscription)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-white"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-gray-500 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Subscription Modal ---
function SubscriptionModal({
  subscription,
  onClose,
  onSave,
  onDelete,
}: {
  subscription: Subscription | null;
  onClose: () => void;
  onSave: (data: Partial<Subscription>) => Promise<void>;
  onDelete?: (id: string) => void;
}) {
  const [form, setForm] = useState({
    name: subscription?.name || "",
    description: subscription?.description || "",
    amount: subscription?.amount || 0,
    billingCycle: subscription?.billingCycle || "monthly" as Subscription["billingCycle"],
    category: subscription?.category || "other" as Subscription["category"],
    startDate: subscription?.startDate ? new Date(subscription.startDate).toISOString().split("T")[0] : "",
    nextBillingDate: subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toISOString().split("T")[0] : "",
    website: subscription?.website || "",
    color: subscription?.color || DEFAULT_COLORS[0],
    notes: subscription?.notes || "",
    isActive: subscription?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || !form.startDate || !form.nextBillingDate) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subscription || !onDelete) return;
    if (!confirm(`Delete subscription "${subscription.name}"?`)) return;
    setLoading(true);
    try {
      await onDelete(subscription._id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h3 className="font-bold text-lg">
            {subscription ? "Edit Subscription" : "Add Subscription"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Netflix, Spotify, etc."
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional short description"
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600"
            />
          </div>

          {/* Amount + Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
                Amount (NGN) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
                Billing Cycle
              </label>
              <select
                value={form.billingCycle}
                onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value as Subscription["billingCycle"] }))}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
              Category
            </label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Subscription["category"] }))}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
            >
              <option value="entertainment">Entertainment</option>
              <option value="software">Software</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="utilities">Utilities</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start Date + Next Billing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
                Next Billing <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.nextBillingDate}
                onChange={e => setForm(f => ({ ...f, nextBillingDate: e.target.value }))}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                required
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://example.com"
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform hover:scale-110",
                    form.color === color && "ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface)]"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600 resize-none"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Active Status
            </label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors duration-200",
                form.isActive ? "bg-primary" : "bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                  form.isActive && "translate-x-5"
                )}
              />
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {subscription && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2 ml-auto"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                {loading ? "Saving..." : subscription ? "Update" : "Add Subscription"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// --- Main Component ---
export const SubscriptionsView = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions");
      const json = await res.json();
      if (json.success) {
        setSubscriptions(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    if (activeCategory === "all") return subscriptions;
    return subscriptions.filter(s => s.category === activeCategory);
  }, [subscriptions, activeCategory]);

  const { totalMonthly, totalYearly } = useMemo(() => {
    const active = subscriptions.filter(s => s.isActive);
    const monthly = active.reduce((sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle), 0);
    return { totalMonthly: monthly, totalYearly: monthly * 12 };
  }, [subscriptions]);

  const handleSave = async (data: Partial<Subscription>) => {
    if (editingSubscription) {
      const res = await fetch(`/api/subscriptions/${editingSubscription._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSubscriptions(prev => prev.map(s => s._id === editingSubscription._id ? { ...s, ...json.data } : s));
    } else {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSubscriptions(prev => [json.data, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setSubscriptions(prev => prev.filter(s => s._id !== id));
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const sub = subscriptions.find(s => s._id === id);
    if (!sub) return;
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sub, isActive }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setSubscriptions(prev => prev.map(s => s._id === id ? { ...s, isActive } : s));
  };

  const openAddModal = () => {
    setEditingSubscription(null);
    setModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSubscription(sub);
    setModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-sm text-gray-400">
              <span className="font-semibold text-white">{formatNGN(totalMonthly)}</span>/month
            </span>
            <span className="text-sm text-gray-500">
              <span className="font-semibold">{formatNGN(totalYearly)}</span>/year
            </span>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={openAddModal}>
          <Plus size={16} /> Add Subscription
        </Button>
      </div>

      {/* Stats */}
      <SubscriptionStats subscriptions={subscriptions} />

      {/* Category Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeCategory === cat.value
                ? "bg-primary text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-gray-400 hover:text-white hover:border-primary/30"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-gray-500" />
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={activeCategory === "all" ? "No subscriptions yet" : `No ${activeCategory} subscriptions`}
          description={
            activeCategory === "all"
              ? "Start tracking your recurring payments to stay on top of your expenses."
              : `You don't have any ${activeCategory} subscriptions yet.`
          }
          actionLabel={activeCategory === "all" ? "Add Subscription" : undefined}
          onAction={activeCategory === "all" ? openAddModal : undefined}
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredSubscriptions.map(sub => (
              <SubscriptionCard
                key={sub._id}
                subscription={sub}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <SubscriptionModal
            subscription={editingSubscription}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            onDelete={editingSubscription ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};