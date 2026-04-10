import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import Income from "@/models/Income";
import Budget from "@/models/Budget";
import { financeRateLimiter } from "@/lib/rateLimit";

interface MonthlyData {
  month: string;
  label: string;
  expenses: number;
  income: number;
  transactionCount: number;
}

interface CategoryData {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  previousAmount?: number;
  change?: number;
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getMonthRange(monthStr: string): { start: Date; end: Date } {
  const [year, monthNum] = monthStr.split("-").map(Number);
  return {
    start: new Date(year, monthNum - 1, 1),
    end: new Date(year, monthNum, 0, 23, 59, 59),
  };
}

function calculateDailyAverage(total: number, daysInMonth: number, daysElapsed: number): number {
  return daysElapsed > 0 ? total / daysElapsed : 0;
}

function calculateWeeklyAverage(dailyAvg: number): number {
  return dailyAvg * 7;
}

function detectSpikes(expenses: number[], threshold: number = 1.5): { index: number; amount: number; isSpike: boolean }[] {
  if (expenses.length < 2) return [];

  const avg = expenses.reduce((a, b) => a + b, 0) / expenses.length;
  return expenses.map((amount, index) => ({
    index,
    amount,
    isSpike: avg > 0 && amount > avg * threshold,
  }));
}

function calculateRollingAverage(values: number[], windowSize: number = 3): number[] {
  if (values.length < windowSize) return values;

  const result: number[] = [];
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    const avg = window.reduce((a, b) => a + b, 0) / windowSize;
    result.push(avg);
  }
  return result;
}

function projectMonthEnd(currentTotal: number, daysElapsed: number, totalDays: number): number {
  if (daysElapsed === 0) return currentTotal;
  const dailyAvg = currentTotal / daysElapsed;
  return dailyAvg * totalDays;
}

export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = financeRateLimiter.check(req);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, message: "Rate limit exceeded. Please try again later." },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, monthNum] = targetMonth.split("-").map(Number);

    // Get current month data
    const { start: currentStart, end: currentEnd } = getMonthRange(targetMonth);

    // Get previous month data
    const prevMonthDate = new Date(year, monthNum - 2, 1);
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth);

    // Get 3 months ago for rolling average
    const threeMonthsAgoDate = new Date(year, monthNum - 4, 1);
    const threeMonthsAgo = `${threeMonthsAgoDate.getFullYear()}-${String(threeMonthsAgoDate.getMonth() + 1).padStart(2, "0")}`;
    const { start: threeStart, end: threeEnd } = getMonthRange(threeMonthsAgo);

    // Fetch data in parallel
    const [
      currentExpenses,
      prevExpenses,
      threeMonthExpenses,
      currentIncomes,
      currentBudgets,
    ] = await Promise.all([
      Expense.find({ date: { $gte: currentStart, $lte: currentEnd } })
        .populate("categoryId", "name color icon"),
      Expense.find({ date: { $gte: prevStart, $lte: prevEnd } })
        .populate("categoryId", "name color icon"),
      Expense.find({ date: { $gte: threeStart, $lte: currentEnd } })
        .populate("categoryId", "name color icon"),
      Income.find({ date: { $gte: currentStart, $lte: currentEnd } }),
      Budget.find({ month: targetMonth }).populate("categoryId", "name color icon"),
    ]);

    // Calculate totals
    const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = currentIncomes.reduce((sum, i) => sum + i.amount, 0);

    // Month-over-month comparison
    const monthOverMonthChange = prevTotalExpenses > 0
      ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100
      : 0;

    // Category breakdown with comparison
    const categoryMap: Map<string, CategoryData> = new Map();

    // Current month categories
    currentExpenses.forEach((exp: any) => {
      const catId = exp.categoryId?._id?.toString() || "uncategorized";
      const catName = exp.categoryId?.name || "Uncategorized";
      const catColor = exp.categoryId?.color || "#6b7280";
      const catIcon = exp.categoryId?.icon || "📦";

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

    // Previous month categories for comparison
    const prevCategoryMap: Map<string, number> = new Map();
    prevExpenses.forEach((exp: any) => {
      const catId = exp.categoryId?._id?.toString() || "uncategorized";
      prevCategoryMap.set(catId, (prevCategoryMap.get(catId) || 0) + exp.amount);
    });

    // Calculate percentages and changes
    const categoryBreakdown: CategoryData[] = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
      previousAmount: prevCategoryMap.get(cat.categoryId) || 0,
      change: prevCategoryMap.get(cat.categoryId)
        ? ((cat.amount - prevCategoryMap.get(cat.categoryId)!) / prevCategoryMap.get(cat.categoryId)!) * 100
        : undefined,
    })).sort((a, b) => b.amount - a.amount);

    // Top 5 categories
    const top5Categories = categoryBreakdown.slice(0, 5);

    // Daily average and projections
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const today = now.getDate();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === monthNum - 1;
    const daysElapsed = isCurrentMonth ? today : daysInMonth;

    const dailyAverage = calculateDailyAverage(totalExpenses, daysInMonth, daysElapsed);
    const weeklyAverage = calculateWeeklyAverage(dailyAverage);

    // Month-end projection
    const projectedTotal = projectMonthEnd(totalExpenses, daysElapsed, daysInMonth);

    // 3-month rolling average - use already fetched threeMonthExpenses
    const rollingAverage = threeMonthExpenses.length > 0
      ? threeMonthExpenses.reduce((sum, e) => sum + e.amount, 0) / 3
      : 0;

    // Unusual spending spikes (>150% of monthly average)
    const dailyAmounts = currentExpenses.map((e: any) => e.amount);
    const spikes = detectSpikes(dailyAmounts, 1.5);
    const unusualSpikes = spikes.filter((s) => s.isSpike);

    // Budget variance analysis
    const globalBudget = currentBudgets.find((b: any) => !b.categoryId);
    const budgetVariance = globalBudget
      ? {
          budget: globalBudget.amount,
          actual: totalExpenses,
          remaining: globalBudget.amount - totalExpenses,
          percentageUsed: (totalExpenses / globalBudget.amount) * 100,
          isOverBudget: totalExpenses > globalBudget.amount,
          isWarning: totalExpenses > globalBudget.amount * 0.8,
        }
      : null;

    // Category budget variances
    const categoryBudgets = currentBudgets
      .filter((b: any) => b.categoryId)
      .map((b: any) => {
        const catId = b.categoryId._id.toString();
        const actual = categoryMap.get(catId)?.amount || 0;
        return {
          categoryId: catId,
          name: b.categoryId.name,
          color: b.categoryId.color,
          icon: b.categoryId.icon,
          budget: b.amount,
          actual,
          remaining: b.amount - actual,
          percentageUsed: b.amount > 0 ? (actual / b.amount) * 100 : 0,
          isOverBudget: actual > b.amount,
          isWarning: actual > b.amount * 0.8,
        };
      });

    // 6-month trend data - fetch all upfront
    const sixMonthsAgo = new Date(year, monthNum - 6, 1);
    const sixMonthsEnd = new Date(year, monthNum, 0, 23, 59, 59);

    const [sixMonthsExpenses, sixMonthsIncomes] = await Promise.all([
      Expense.find({ date: { $gte: sixMonthsAgo, $lte: sixMonthsEnd } }),
      Income.find({ date: { $gte: sixMonthsAgo, $lte: sixMonthsEnd } }),
    ]);

    const monthlyTrend: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(year, monthNum - 1 - i, 1);
      const mStr = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, "0")}`;
      const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59);

      const monthExpenses = sixMonthsExpenses.filter(e => {
        const d = new Date(e.date);
        return d >= mStart && d <= mEnd;
      });
      const monthIncomes = sixMonthsIncomes.filter(i => {
        const d = new Date(i.date);
        return d >= mStart && d <= mEnd;
      });

      monthlyTrend.push({
        month: mStr,
        label: getMonthLabel(mStr),
        expenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        income: monthIncomes.reduce((sum, i) => sum + i.amount, 0),
        transactionCount: monthExpenses.length + monthIncomes.length,
      });
    }

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalExpenses,
          totalIncome,
          balance: totalIncome - totalExpenses,
          monthOverMonthChange,
          transactionCount: currentExpenses.length + currentIncomes.length,
        },
        averages: {
          daily: dailyAverage,
          weekly: weeklyAverage,
          threeMonthRolling: rollingAverage,
        },
        projections: {
          monthEndEstimate: projectedTotal,
          basedOnDays: daysElapsed,
          totalDaysInMonth: daysInMonth,
          confidenceLevel: daysElapsed > 15 ? "high" : daysElapsed > 7 ? "medium" : "low",
        },
        topCategories: top5Categories,
        allCategories: categoryBreakdown,
        monthlyTrend,
        budgetVariance,
        categoryBudgets,
        alerts: {
          unusualSpikes: unusualSpikes.length,
          isOverBudget: budgetVariance?.isOverBudget || false,
          budgetWarning: budgetVariance?.isWarning || false,
          spendingIncreased: monthOverMonthChange > 0,
          increasePercentage: monthOverMonthChange,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
