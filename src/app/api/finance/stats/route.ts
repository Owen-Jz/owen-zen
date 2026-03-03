import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import Income from "@/models/Income";
import Budget from "@/models/Budget";

export async function GET(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");

        const now = new Date();
        const targetMonth =
            month ||
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const [year, monthNum] = targetMonth.split("-").map(Number);

        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        // Fetch all data in parallel
        const [expenses, incomes, rawBudgets] = await Promise.all([
            Expense.find({ date: { $gte: startDate, $lte: endDate } }).populate(
                "categoryId",
                "name color icon"
            ),
            Income.find({ date: { $gte: startDate, $lte: endDate } }),
            Budget.find({ month: targetMonth }).populate("categoryId", "name color icon"),
        ]);

        let budgets = rawBudgets;

        // Budget rollover if none exist for this month
        if (budgets.length === 0) {
            const previousBudget = await Budget.findOne({
                month: { $lt: targetMonth },
            }).sort({ month: -1 });

            if (previousBudget) {
                const previousBudgets = await Budget.find({ month: previousBudget.month });
                const newBudgets = previousBudgets.map((b) => ({
                    categoryId: b.categoryId,
                    amount: b.amount,
                    month: targetMonth,
                }));

                if (newBudgets.length > 0) {
                    await Budget.insertMany(newBudgets);
                    budgets = await Budget.find({ month: targetMonth }).populate(
                        "categoryId",
                        "name color icon"
                    );
                }
            }
        }

        const globalBudget = budgets.find((b) => !b.categoryId);

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

        // Build category breakdown
        const categoryMap: {
            [key: string]: { name: string; color: string; icon: string; amount: number; budget: number };
        } = {};

        expenses.forEach((exp: any) => {
            const catId = exp.categoryId?._id?.toString() || "uncategorized";
            const catName = exp.categoryId?.name || "Uncategorized";
            const catColor = exp.categoryId?.color || "#6b7280";
            const catIcon = exp.categoryId?.icon || "📦";

            if (!categoryMap[catId]) {
                categoryMap[catId] = { name: catName, color: catColor, icon: catIcon, amount: 0, budget: 0 };
            }
            categoryMap[catId].amount += exp.amount;
        });

        budgets.forEach((b: any) => {
            if (b.categoryId) {
                const catId = b.categoryId._id.toString();
                if (!categoryMap[catId]) {
                    categoryMap[catId] = {
                        name: b.categoryId.name,
                        color: b.categoryId.color,
                        icon: b.categoryId.icon,
                        amount: 0,
                        budget: 0,
                    };
                }
                categoryMap[catId].budget = b.amount;
            }
        });

        const categoryBreakdown = Object.entries(categoryMap)
            .map(([id, data]) => ({
                categoryId: id,
                name: data.name,
                color: data.color,
                icon: data.icon,
                amount: data.amount,
                budget: data.budget,
                budgetProgress: data.budget > 0 ? (data.amount / data.budget) * 100 : 0,
                percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        // Daily spending trend
        const dailySpending: { [key: string]: number } = {};
        expenses.forEach((exp: any) => {
            const dateKey = new Date(exp.date).toISOString().split("T")[0];
            dailySpending[dateKey] = (dailySpending[dateKey] || 0) + exp.amount;
        });

        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const dailyTrend = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            dailyTrend.push({ date: dateStr, day, amount: dailySpending[dateStr] || 0 });
        }

        // Last 6 months comparison
        const monthlyComparison = [];
        for (let i = 5; i >= 0; i--) {
            const compareDate = new Date(year, monthNum - 1 - i, 1);
            const compareStart = new Date(compareDate.getFullYear(), compareDate.getMonth(), 1);
            const compareEnd = new Date(compareDate.getFullYear(), compareDate.getMonth() + 1, 0, 23, 59, 59);

            const [mExpenses, mIncomes] = await Promise.all([
                Expense.find({ date: { $gte: compareStart, $lte: compareEnd } }),
                Income.find({ date: { $gte: compareStart, $lte: compareEnd } }),
            ]);

            monthlyComparison.push({
                month: `${compareDate.getFullYear()}-${String(compareDate.getMonth() + 1).padStart(2, "0")}`,
                label: compareDate.toLocaleDateString("en-US", { month: "short" }),
                expenses: mExpenses.reduce((sum, e) => sum + e.amount, 0),
                income: mIncomes.reduce((sum, i) => sum + i.amount, 0),
            });
        }

        // Smart insights
        const insights = [];

        if (categoryBreakdown.length > 0) {
            const top = categoryBreakdown[0];
            insights.push({
                type: "top_category",
                title: "Top Spending",
                description: `${top.icon} ${top.name} accounts for ${top.percentage.toFixed(0)}% of spending`,
                value: top.amount,
                color: top.color,
            });
        }

        if (globalBudget) {
            const budgetUsed = (totalExpenses / globalBudget.amount) * 100;
            if (budgetUsed > 100) {
                insights.push({
                    type: "over_budget",
                    title: "Over Budget! 🚨",
                    description: `You've exceeded your budget by ${(budgetUsed - 100).toFixed(0)}%`,
                    value: totalExpenses - globalBudget.amount,
                    color: "#ef4444",
                });
            } else if (budgetUsed > 80) {
                insights.push({
                    type: "budget_warning",
                    title: "Budget Alert ⚠️",
                    description: `You've used ${budgetUsed.toFixed(0)}% of your monthly budget`,
                    value: globalBudget.amount - totalExpenses,
                    color: "#f59e0b",
                });
            } else {
                insights.push({
                    type: "budget_ok",
                    title: "On Track ✅",
                    description: `You've used ${budgetUsed.toFixed(0)}% of your monthly budget`,
                    value: globalBudget.amount - totalExpenses,
                    color: "#22c55e",
                });
            }
        }

        if (totalIncome > 0) {
            const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
            insights.push({
                type: "savings_rate",
                title: savingsRate >= 0 ? "Savings Rate 💰" : "Overspending ⚠️",
                description:
                    savingsRate >= 0
                        ? `You're saving ${savingsRate.toFixed(0)}% of your income`
                        : `You're spending ${Math.abs(savingsRate).toFixed(0)}% more than you earn`,
                value: savingsRate,
                color: savingsRate >= 20 ? "#22c55e" : savingsRate >= 0 ? "#f59e0b" : "#ef4444",
            });
        }

        return NextResponse.json({
            success: true,
            month: targetMonth,
            summary: {
                totalExpenses,
                totalIncome,
                balance: totalIncome - totalExpenses,
                budget: globalBudget?.amount || 0,
                budgetRemaining: globalBudget ? globalBudget.amount - totalExpenses : 0,
                transactionCount: expenses.length + incomes.length,
            },
            categoryBreakdown,
            dailyTrend,
            monthlyComparison,
            insights,
        });
    } catch (error: any) {
        console.error("Error fetching finance stats:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
