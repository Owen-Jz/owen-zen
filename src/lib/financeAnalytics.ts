// Finance Analytics Library
// Reusable calculation functions for financial analysis

export interface Expense {
  _id: string;
  amount: number;
  categoryId: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  };
  date: Date | string;
  note?: string;
  createdAt: Date | string;
}

export interface MonthlyData {
  month: string;
  label: string;
  expenses: number;
  income: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  previousAmount?: number;
  change?: number;
}

export interface BudgetVariance {
  budget: number;
  actual: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isWarning: boolean;
}

export interface SpendingSpike {
  index: number;
  amount: number;
  isSpike: boolean;
  percentageAboveAverage?: number;
}

export interface Projection {
  estimatedTotal: number;
  basedOnDays: number;
  totalDays: number;
  confidenceLevel: "high" | "medium" | "low";
  trend: "increasing" | "decreasing" | "stable";
}

// Currency formatting
export function formatCurrency(amount: number, currency: string = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyFull(amount: number, currency: string = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
}

// Calculate percentage change between two values
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Calculate daily average spending
export function calculateDailyAverage(totalSpending: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return totalSpending / daysElapsed;
}

// Calculate weekly average from daily average
export function calculateWeeklyAverage(dailyAverage: number): number {
  return dailyAverage * 7;
}

// Calculate monthly average from daily average
export function calculateMonthlyAverage(dailyAverage: number, daysInMonth: number): number {
  return dailyAverage * daysInMonth;
}

// Calculate 3-month rolling average
export function calculateRollingAverage(values: number[], windowSize: number = 3): number {
  if (values.length === 0) return 0;
  if (values.length < windowSize) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  const result: number[] = [];
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
    result.push(avg);
  }

  return result[result.length - 1] || 0;
}

// Project month-end spending based on current trajectory
export function projectMonthEnd(
  currentTotal: number,
  daysElapsed: number,
  totalDays: number
): Projection {
  if (daysElapsed === 0) {
    return {
      estimatedTotal: currentTotal,
      basedOnDays: daysElapsed,
      totalDays,
      confidenceLevel: "low",
      trend: "stable",
    };
  }

  const dailyAverage = currentTotal / daysElapsed;
  const estimatedTotal = dailyAverage * totalDays;

  // Determine confidence level
  let confidenceLevel: "high" | "medium" | "low";
  if (daysElapsed >= 15) {
    confidenceLevel = "high";
  } else if (daysElapsed >= 7) {
    confidenceLevel = "medium";
  } else {
    confidenceLevel = "low";
  }

  // Determine trend (simplified - compares last 3 days to average if available)
  let trend: "increasing" | "decreasing" | "stable" = "stable";

  return {
    estimatedTotal,
    basedOnDays: daysElapsed,
    totalDays,
    confidenceLevel,
    trend,
  };
}

// Detect unusual spending spikes
export function detectSpendingSpikes(
  expenses: number[],
  threshold: number = 1.5
): SpendingSpike[] {
  if (expenses.length === 0) return [];

  const avg = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;

  return expenses.map((amount, index) => {
    const isSpike = avg > 0 && amount > avg * threshold;
    const percentageAboveAverage = avg > 0 ? ((amount - avg) / avg) * 100 : 0;

    return {
      index,
      amount,
      isSpike,
      percentageAboveAverage: isSpike ? percentageAboveAverage : undefined,
    };
  });
}

// Calculate budget variance
export function calculateBudgetVariance(actual: number, budget: number): BudgetVariance {
  const percentageUsed = budget > 0 ? (actual / budget) * 100 : 0;

  return {
    budget,
    actual,
    remaining: budget - actual,
    percentageUsed,
    isOverBudget: actual > budget,
    isWarning: budget > 0 && percentageUsed >= 80,
  };
}

// Get top spending categories
export function getTopCategories(
  expenses: Expense[],
  limit: number = 5,
  previousExpenses?: Expense[]
): CategoryBreakdown[] {
  const categoryMap = new Map<string, CategoryBreakdown>();

  // Current month categories
  expenses.forEach((exp) => {
    const catId = (exp.categoryId as any)?._id?.toString() || "uncategorized";
    const catName = (exp.categoryId as any)?.name || "Uncategorized";
    const catColor = (exp.categoryId as any)?.color || "#6b7280";
    const catIcon = (exp.categoryId as any)?.icon || "📦";

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        categoryId: catId,
        name: catName,
        color: catColor,
        icon: catIcon,
        amount: 0,
        percentage: 0,
      });
    }
    categoryMap.get(catId)!.amount += exp.amount;
  });

  // Previous month data for comparison
  const prevCategoryMap = new Map<string, number>();
  if (previousExpenses) {
    previousExpenses.forEach((exp) => {
      const catId = (exp.categoryId as any)?._id?.toString() || "uncategorized";
      prevCategoryMap.set(catId, (prevCategoryMap.get(catId) || 0) + exp.amount);
    });
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate percentages and changes
  const result: CategoryBreakdown[] = Array.from(categoryMap.values())
    .map((cat) => ({
      ...cat,
      percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
      previousAmount: prevCategoryMap.get(cat.categoryId) || 0,
      change: prevCategoryMap.get(cat.categoryId)
        ? calculatePercentageChange(cat.amount, prevCategoryMap.get(cat.categoryId)!)
        : undefined,
    }))
    .sort((a, b) => b.amount - a.amount);

  return result.slice(0, limit);
}

// Calculate spending trends over multiple months
export function calculateSpendingTrends(
  monthlyData: MonthlyData[],
  currentMonthIndex: number
): {
  currentTotal: number;
  previousTotal: number;
  percentageChange: number;
  trend: "increasing" | "decreasing" | "stable";
} {
  if (monthlyData.length === 0) {
    return {
      currentTotal: 0,
      previousTotal: 0,
      percentageChange: 0,
      trend: "stable",
    };
  }

  const currentTotal = monthlyData[currentMonthIndex]?.expenses || 0;
  const previousTotal = monthlyData[currentMonthIndex - 1]?.expenses || 0;
  const percentageChange = calculatePercentageChange(currentTotal, previousTotal);

  let trend: "increasing" | "decreasing" | "stable";
  if (percentageChange > 5) {
    trend = "increasing";
  } else if (percentageChange < -5) {
    trend = "decreasing";
  } else {
    trend = "stable";
  }

  return {
    currentTotal,
    previousTotal,
    percentageChange,
    trend,
  };
}

// Calculate average transaction size
export function calculateAverageTransactionSize(expenses: Expense[]): number {
  if (expenses.length === 0) return 0;
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return total / expenses.length;
}

// Group expenses by day
export function groupExpensesByDay(expenses: Expense[]): Map<string, number> {
  const dailyMap = new Map<string, number>();

  expenses.forEach((exp) => {
    const dateKey = new Date(exp.date).toISOString().split("T")[0];
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + exp.amount);
  });

  return dailyMap;
}

// Group expenses by week
export function groupExpensesByWeek(expenses: Expense[]): Map<string, number> {
  const weeklyMap = new Map<string, number>();

  expenses.forEach((exp) => {
    const date = new Date(exp.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + exp.amount);
  });

  return weeklyMap;
}

// Export data to CSV format
export function exportToCSV(expenses: Expense[]): string {
  const headers = ["Date", "Amount", "Category", "Note"];
  const rows = expenses.map((exp) => [
    new Date(exp.date).toLocaleDateString(),
    exp.amount.toString(),
    (exp.categoryId as any)?.name || "Uncategorized",
    exp.note || "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
