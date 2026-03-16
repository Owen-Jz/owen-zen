"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Target, DollarSign, Percent, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { clsx } from "clsx";
import { FinanceBarChart, FinanceLineChart, FinanceProgressBar, FinancePieChart, ChartData } from "@/components/charts/FinanceCharts";

interface BudgetVarianceCardProps {
  budget: number;
  actual: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isWarning: boolean;
  categoryBudgets?: CategoryBudget[];
  onCategoryClick?: (categoryId: string) => void;
}

interface CategoryBudget {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  budget: number;
  actual: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isWarning: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetVarianceCard({
  budget,
  actual,
  remaining,
  percentageUsed,
  isOverBudget,
  isWarning,
  categoryBudgets = [],
  onCategoryClick,
}: BudgetVarianceCardProps) {
  const statusColor = isOverBudget ? "#ef4444" : isWarning ? "#f59e0b" : "#22c55e";
  const statusIcon = isOverBudget ? AlertTriangle : isWarning ? AlertTriangle : CheckCircle;
  const StatusIcon = statusIcon;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Budget Overview
        </h3>
        <div
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: statusColor }}
        >
          <StatusIcon size={16} />
          {isOverBudget ? "Over Budget" : isWarning ? "Warning" : "On Track"}
        </div>
      </div>

      {/* Main Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Monthly Budget</span>
          <span className="text-white font-medium">{formatCurrency(budget)}</span>
        </div>
        <FinanceProgressBar value={actual} max={budget} />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Spent: {formatCurrency(actual)}</span>
          <span>{percentageUsed.toFixed(0)}% used</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-background/50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">Remaining</div>
          <div
            className={clsx(
              "text-lg font-bold",
              remaining >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {formatCurrency(Math.abs(remaining))}
          </div>
        </div>
        <div className="bg-background/50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">Variance</div>
          <div
            className={clsx(
              "text-lg font-bold flex items-center gap-1",
              remaining >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {remaining >= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
            {Math.abs(percentageUsed - 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      {categoryBudgets.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs text-gray-500 mb-3">Category Breakdown</div>
          <div className="space-y-3">
            {categoryBudgets.slice(0, 4).map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => onCategoryClick?.(cat.categoryId)}
                className="w-full text-left space-y-1.5 hover:bg-white/5 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-300">{cat.icon} {cat.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {cat.percentageUsed.toFixed(0)}%
                  </span>
                </div>
                <FinanceProgressBar
                  value={cat.actual}
                  max={cat.budget}
                  showLabel={false}
                  size="sm"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Spending Trend Card
interface SpendingTrendCardProps {
  data: ChartData[];
  currentMonth: string;
  previousMonth: string;
  percentageChange: number;
  onBarClick?: (index: number) => void;
}

export function SpendingTrendCard({
  data,
  currentMonth,
  previousMonth,
  percentageChange,
  onBarClick,
}: SpendingTrendCardProps) {
  const isIncrease = percentageChange > 0;
  const trendColor = isIncrease ? "#ef4444" : "#22c55e";

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Spending Trend
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "flex items-center gap-1 text-sm font-medium",
              isIncrease ? "text-red-400" : "text-green-400"
            )}
          >
            {isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(percentageChange).toFixed(1)}%
          </span>
          <span className="text-gray-500 text-xs">vs last month</span>
        </div>
      </div>

      <div className="h-48">
        <FinanceBarChart
          data={data}
          height={180}
          colors={{ primary: "#ef4444", secondary: "#22c55e" }}
          onBarClick={onBarClick}
        />
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/80" />
          <span>Expenses</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/80" />
          <span>Income</span>
        </div>
      </div>
    </div>
  );
}

// Top Categories Card
interface TopCategoriesCardProps {
  categories: {
    name: string;
    icon: string;
    color: string;
    amount: number;
    percentage: number;
    change?: number;
  }[];
  onCategoryClick?: (index: number) => void;
}

export function TopCategoriesCard({ categories, onCategoryClick }: TopCategoriesCardProps) {
  if (categories.length === 0) return null;

  const chartData: ChartData[] = categories.map((c) => ({
    label: c.name,
    value: c.amount,
    color: c.color,
  }));

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Top Spending Categories
      </h3>

      {/* Pie Chart */}
      <div className="flex justify-center">
        <FinancePieChart
          data={chartData}
          size={180}
          innerRadius={0.6}
          onSliceClick={onCategoryClick}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {categories.map((cat, index) => (
          <button
            key={cat.name}
            onClick={() => onCategoryClick?.(index)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <div>
                <div className="text-sm text-gray-200">
                  {cat.icon} {cat.name}
                </div>
                <div className="text-xs text-gray-500">
                  {cat.percentage.toFixed(0)}% of total
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {formatCurrency(cat.amount)}
              </div>
              {cat.change !== undefined && (
                <div
                  className={clsx(
                    "text-xs flex items-center justify-end gap-0.5",
                    cat.change > 0 ? "text-red-400" : "text-green-400"
                  )}
                >
                  {cat.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(cat.change).toFixed(0)}%
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Prediction Card
interface PredictionCardProps {
  estimatedTotal: number;
  currentTotal: number;
  dailyAverage: number;
  weeklyAverage: number;
  daysElapsed: number;
  totalDays: number;
  confidenceLevel: "high" | "medium" | "low";
  trend: "increasing" | "decreasing" | "stable";
}

export function PredictionCard({
  estimatedTotal,
  currentTotal,
  dailyAverage,
  weeklyAverage,
  daysElapsed,
  totalDays,
  confidenceLevel,
  trend,
}: PredictionCardProps) {
  const trendIcon = trend === "increasing" ? TrendingUp : trend === "decreasing" ? TrendingDown : Target;
  const TrendIcon = trendIcon;
  const trendColor = trend === "increasing" ? "#ef4444" : trend === "decreasing" ? "#22c55e" : "#f59e0b";

  const confidenceColors = {
    high: "#22c55e",
    medium: "#f59e0b",
    low: "#6b7280",
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Month-End Projection
        </h3>
        <div
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: trendColor }}
        >
          <TrendIcon size={14} />
          {trend === "increasing" ? "Increasing" : trend === "decreasing" ? "Decreasing" : "Stable"}
        </div>
      </div>

      {/* Main Projection */}
      <div className="text-center py-4">
        <div className="text-xs text-gray-500 mb-1">Projected Total</div>
        <div className="text-3xl font-bold text-white">
          {formatCurrency(estimatedTotal)}
        </div>
        <div
          className="text-sm mt-1 flex items-center justify-center gap-1"
          style={{ color: confidenceColors[confidenceLevel] }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: confidenceColors[confidenceLevel] }}
          />
          {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} confidence
        </div>
      </div>

      {/* Progress to projection */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Current: {formatCurrency(currentTotal)}</span>
          <span>{daysElapsed} / {totalDays} days</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(daysElapsed / totalDays) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
          />
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-background/50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Daily Average</div>
          <div className="text-lg font-bold text-white">{formatCurrency(dailyAverage)}</div>
        </div>
        <div className="bg-background/50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Weekly Average</div>
          <div className="text-lg font-bold text-white">{formatCurrency(weeklyAverage)}</div>
        </div>
      </div>
    </div>
  );
}

// Alerts Card
interface AlertsCardProps {
  unusualSpikes: number;
  isOverBudget: boolean;
  budgetWarning: boolean;
  spendingIncreased: boolean;
  increasePercentage: number;
  onDismiss?: () => void;
}

export function AlertsCard({
  unusualSpikes,
  isOverBudget,
  budgetWarning,
  spendingIncreased,
  increasePercentage,
  onDismiss,
}: AlertsCardProps) {
  const alerts = [];

  if (isOverBudget) {
    alerts.push({
      type: "error",
      title: "Over Budget",
      message: "You've exceeded your monthly budget",
      icon: AlertTriangle,
      color: "#ef4444",
    });
  } else if (budgetWarning) {
    alerts.push({
      type: "warning",
      title: "Budget Warning",
      message: "You've used over 80% of your budget",
      icon: AlertTriangle,
      color: "#f59e0b",
    });
  }

  if (unusualSpikes > 0) {
    alerts.push({
      type: "info",
      title: "Unusual Spending",
      message: `${unusualSpikes} unusual spending spike${unusualSpikes > 1 ? "s" : ""} detected`,
      icon: TrendingUp,
      color: "#3b82f6",
    });
  }

  if (spendingIncreased && !isOverBudget && !budgetWarning) {
    alerts.push({
      type: "info",
      title: "Spending Up",
      message: `Spending increased by ${increasePercentage.toFixed(0)}% vs last month`,
      icon: TrendingUp,
      color: "#6b7280",
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle size={18} />
          <span className="font-medium">All Clear</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">No alerts at this time. Great job!</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Alerts & Insights
      </h3>
      {alerts.map((alert, index) => {
        const AlertIcon = alert.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ backgroundColor: `${alert.color}10`, border: `1px solid ${alert.color}20` }}
          >
            <AlertIcon size={18} style={{ color: alert.color }} />
            <div>
              <div className="text-sm font-medium text-white">{alert.title}</div>
              <div className="text-xs text-gray-400">{alert.message}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default {
  BudgetVarianceCard,
  SpendingTrendCard,
  TopCategoriesCard,
  PredictionCard,
  AlertsCard,
};
