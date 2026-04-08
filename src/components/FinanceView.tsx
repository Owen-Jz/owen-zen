"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, X, TrendingUp, TrendingDown, DollarSign, PiggyBank,
    ChevronLeft, ChevronRight, Trash2, BarChart3, List, Target,
    AlertCircle, CheckCircle2, AlertTriangle, Wallet, ArrowDownCircle,
    ArrowUpCircle, Tag, Calendar, FileText, Sparkles, Search, Filter
} from "lucide-react";

// Import new components
import { ExpenseSearch, SearchParams } from "./finance/SearchComponents";
import { ExpenseTable } from "./finance/ExpenseTable";
import {
    BudgetVarianceCard,
    SpendingTrendCard,
    TopCategoriesCard,
    PredictionCard,
    AlertsCard,
} from "./finance/AnalysisComponents";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
    _id: string;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
    isSystem: boolean;
}

interface Expense {
    _id: string;
    amount: number;
    categoryId: Category;
    date: string;
    note?: string;
    createdAt: string;
}

interface Income {
    _id: string;
    amount: number;
    source: string;
    date: string;
    createdAt: string;
}

interface CategoryBreakdown {
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    amount: number;
    budget: number;
    budgetProgress: number;
    percentage: number;
    change?: number;
}

interface MonthlyComparison {
    month: string;
    label: string;
    expenses: number;
    income: number;
}

interface DailyTrend {
    date: string;
    day: number;
    amount: number;
}

interface Summary {
    totalExpenses: number;
    totalIncome: number;
    balance: number;
    budget: number;
    budgetRemaining: number;
    transactionCount: number;
}

interface Insight {
    type: string;
    title: string;
    description: string;
    value: number;
    color: string;
}

interface StatsData {
    month: string;
    summary: Summary;
    categoryBreakdown: CategoryBreakdown[];
    dailyTrend: DailyTrend[];
    monthlyComparison: MonthlyComparison[];
    insights: Insight[];
}

// Analytics types
interface AnalyticsData {
    summary: {
        totalExpenses: number;
        totalIncome: number;
        balance: number;
        monthOverMonthChange: number;
        transactionCount: number;
    };
    averages: {
        daily: number;
        weekly: number;
        threeMonthRolling: number;
    };
    projections: {
        monthEndEstimate: number;
        basedOnDays: number;
        totalDaysInMonth: number;
        confidenceLevel: string;
    };
    topCategories: CategoryBreakdown[];
    allCategories: CategoryBreakdown[];
    monthlyTrend: MonthlyComparison[];
    budgetVariance: {
        budget: number;
        actual: number;
        remaining: number;
        percentageUsed: number;
        isOverBudget: boolean;
        isWarning: boolean;
    } | null;
    categoryBudgets: {
        categoryId: string;
        name: string;
        color: string;
        icon: string;
        budget: number;
        actual: number;
        percentageUsed: number;
        isOverBudget: boolean;
        isWarning: boolean;
    }[];
    alerts: {
        unusualSpikes: number;
        isOverBudget: boolean;
        budgetWarning: boolean;
        spendingIncreased: boolean;
        increasePercentage: number;
    };
}

interface SearchResult {
    data: Expense[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
    performance: {
        queryTimeMs: number;
        meetsTarget: boolean;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const fmtFull = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

function getMonthLabel(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function navigateMonth(ym: string, delta: number) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function today() {
    return new Date().toISOString().split("T")[0];
}

function currentMonth() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({
    label, value, sub, icon: Icon, color, trend
}: {
    label: string; value: string; sub?: string;
    icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral"
}) => (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 font-medium">{label}</span>
            <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
            </div>
        </div>
        <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
        {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-[var(--status-positive)]" : trend === "down" ? "text-[var(--status-negative)]" : "text-gray-400"}`}>
                {trend === "up" ? <TrendingUp size={12} /> : trend === "down" ? <TrendingDown size={12} /> : null}
            </div>
        )}
    </div>
);

const BudgetBar = ({ cat, totalBudget }: { cat: CategoryBreakdown; totalBudget: number }) => {
    const pct = Math.min(cat.budgetProgress, 100);
    const overBudget = cat.budgetProgress > 100;
    const barColor = overBudget ? "#ef4444" : cat.budgetProgress > 75 ? "#f59e0b" : cat.color;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-gray-300 font-medium">{cat.name}</span>
                    {overBudget && <span className="text-[var(--status-negative)] text-xs font-bold">OVER</span>}
                </div>
                <div className="text-right">
                    <span className="text-white font-semibold">{fmt(cat.amount)}</span>
                    {cat.budget > 0 && (
                        <span className="text-gray-500 text-xs"> / {fmt(cat.budget)}</span>
                    )}
                </div>
            </div>
            {cat.budget > 0 && (
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                    />
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

type ModalType = "expense" | "income" | "budget" | "category" | null;
type ViewMode = "overview" | "transactions" | "budget" | "analytics";

export function FinanceView() {
    const [month, setMonth] = useState(currentMonth());
    const [stats, setStats] = useState<StatsData | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [modal, setModal] = useState<ModalType>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("overview");
    const [txFilter, setTxFilter] = useState<"all" | "expense" | "income">("all");

    // Form states
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseCat, setExpenseCat] = useState("");
    const [expenseDate, setExpenseDate] = useState(today());
    const [expenseNote, setExpenseNote] = useState("");
    const [incomeAmount, setIncomeAmount] = useState("");
    const [incomeSource, setIncomeSource] = useState("");
    const [incomeDate, setIncomeDate] = useState(today());
    const [budgetAmount, setBudgetAmount] = useState("");
    const [budgetCat, setBudgetCat] = useState("");
    const [catName, setCatName] = useState("");
    const [catColor, setCatColor] = useState("#6b7280");
    const [catIcon, setCatIcon] = useState("📦");
    const [catType, setCatType] = useState<"expense" | "income">("expense");
    const [saving, setSaving] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, expRes, incRes, catRes] = await Promise.all([
                fetch(`/api/finance/stats?month=${month}`),
                fetch(`/api/finance/expenses?month=${month}`),
                fetch(`/api/finance/income?month=${month}`),
                fetch(`/api/finance/categories`),
            ]);
            const [statsJson, expJson, incJson, catJson] = await Promise.all([
                statsRes.json(), expRes.json(), incRes.json(), catRes.json(),
            ]);
            if (statsJson.success) setStats(statsJson);
            if (expJson.success) setExpenses(expJson.expenses);
            if (incJson.success) setIncomes(incJson.incomes);
            if (catJson.success) setCategories(catJson.categories);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Fetch analytics data
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/analytics?month=${month}`);
            const json = await res.json();
            if (json.success) setAnalytics(json.analytics);
        } catch (e) {
            console.error("Error fetching analytics:", e);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        if (viewMode === "analytics") {
            fetchAnalytics();
        }
    }, [viewMode, fetchAnalytics]);

    // Search handler
    const handleSearch = useCallback(async (params: SearchParams) => {
        if (viewMode !== "transactions") {
            setViewMode("transactions");
        }

        setSearching(true);
        try {
            const queryParams = new URLSearchParams();
            if (params.q) queryParams.set("q", params.q);
            if (params.categoryId) queryParams.set("categoryId", params.categoryId);
            if (params.dateFrom) queryParams.set("dateFrom", params.dateFrom);
            if (params.dateTo) queryParams.set("dateTo", params.dateTo);
            if (params.amountMin) queryParams.set("amountMin", params.amountMin);
            if (params.amountMax) queryParams.set("amountMax", params.amountMax);
            if (params.booleanOperator) queryParams.set("booleanOperator", params.booleanOperator);

            const res = await fetch(`/api/finance/search?${queryParams.toString()}`);
            const json = await res.json();
            if (json.success) {
                setSearchResults(json);
            }
        } catch (e) {
            console.error("Error searching:", e);
        } finally {
            setSearching(false);
        }
    }, [viewMode]);

    const closeModal = () => {
        setModal(null);
        setExpenseAmount(""); setExpenseCat(""); setExpenseDate(today()); setExpenseNote("");
        setIncomeAmount(""); setIncomeSource(""); setIncomeDate(today());
        setBudgetAmount(""); setBudgetCat("");
        setCatName(""); setCatColor("#6b7280"); setCatIcon("📦"); setCatType("expense");
    };

    const addExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseAmount || !expenseCat) return;
        setSaving(true);
        try {
            const res = await fetch("/api/finance/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(expenseAmount), categoryId: expenseCat, date: expenseDate, note: expenseNote }),
            });
            if (res.ok) { closeModal(); fetchAll(); }
        } finally { setSaving(false); }
    };

    const addIncome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!incomeAmount || !incomeSource) return;
        setSaving(true);
        try {
            const res = await fetch("/api/finance/income", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(incomeAmount), source: incomeSource, date: incomeDate }),
            });
            if (res.ok) { closeModal(); fetchAll(); }
        } finally { setSaving(false); }
    };

    const saveBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!budgetAmount) return;
        setSaving(true);
        try {
            const res = await fetch("/api/finance/budgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(budgetAmount), categoryId: budgetCat || null, month }),
            });
            if (res.ok) { closeModal(); fetchAll(); }
        } finally { setSaving(false); }
    };

    const addCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName) return;
        setSaving(true);
        try {
            const res = await fetch("/api/finance/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: catName, color: catColor, icon: catIcon, type: catType }),
            });
            if (res.ok) { closeModal(); fetchAll(); }
        } finally { setSaving(false); }
    };

    const deleteExpense = async (id: string) => {
        await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
        fetchAll();
    };

    const deleteIncome = async (id: string) => {
        await fetch(`/api/finance/income/${id}`, { method: "DELETE" });
        fetchAll();
    };

    const expenseCats = categories.filter((c) => c.type === "expense");

    // Transactions merged and sorted
    const allTransactions = [
        ...expenses.map((e) => ({ ...e, kind: "expense" as const, displayDate: e.date })),
        ...incomes.map((i) => ({ ...i, kind: "income" as const, displayDate: i.date })),
    ].sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

    const filteredTx = allTransactions.filter((t) =>
        txFilter === "all" ? true : t.kind === txFilter
    );

    const s = stats?.summary;
    const maxBar = stats?.monthlyComparison
        ? Math.max(...stats.monthlyComparison.flatMap((m) => [m.expenses, m.income]), 1)
        : 1;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="text-primary" size={24} /> Finance Tracker
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track spending, income &amp; budgets</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Month Navigator */}
                    <div className="flex items-center gap-1 bg-surface border border-border rounded-xl px-3 py-2">
                        <button onClick={() => setMonth(navigateMonth(month, -1))}
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold text-white px-2 whitespace-nowrap">
                            {getMonthLabel(month)}
                        </span>
                        <button onClick={() => setMonth(navigateMonth(month, 1))}
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                            disabled={month >= currentMonth()}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <button onClick={() => setModal("income")}
                        className="flex items-center gap-1.5 bg-[var(--status-income)]/20 border border-[var(--status-income)]/30 text-[var(--status-income)] hover:bg-[var(--status-income)]/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <ArrowUpCircle size={15} /> Add Income
                    </button>
                    <button onClick={() => setModal("expense")}
                        className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <ArrowDownCircle size={15} /> Add Expense
                    </button>
                </div>
            </div>

            {/* ── View Tabs ── */}
            <div className="flex gap-2 border-b border-border pb-0 overflow-x-auto">
                {(["overview", "transactions", "analytics", "budget"] as ViewMode[]).map((v) => (
                    <button key={v} onClick={() => setViewMode(v)}
                        className={`px-4 py-2.5 text-sm font-semibold capitalize rounded-t-lg border-b-2 transition-all whitespace-nowrap ${viewMode === v
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-400 hover:text-white"
                            }`}>
                        {v === "overview" ? "Overview" : v === "transactions" ? "Transactions" : v === "analytics" ? "Analytics" : "Budget"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* ══ OVERVIEW ══ */}
                        {viewMode === "overview" && (
                            <div className="space-y-6">
                                {/* Stat Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Total Income" value={fmt(s?.totalIncome || 0)}
                                        sub={`${s?.transactionCount || 0} transactions`}
                                        icon={TrendingUp} color="#22c55e" />
                                    <StatCard label="Total Spent" value={fmt(s?.totalExpenses || 0)}
                                        sub={`${expenses.length} expense(s)`}
                                        icon={TrendingDown} color="#ef4444" />
                                    <StatCard
                                        label={s && s.balance >= 0 ? "Savings" : "Deficit"}
                                        value={fmt(Math.abs(s?.balance || 0))}
                                        sub={s && s.totalIncome > 0 ? `${(((s.totalIncome - s.totalExpenses) / s.totalIncome) * 100).toFixed(0)}% savings rate` : undefined}
                                        icon={PiggyBank}
                                        color={s && s.balance >= 0 ? "#22c55e" : "#ef4444"} />
                                    <StatCard
                                        label="Budget Remaining"
                                        value={s?.budget ? fmt(s.budgetRemaining) : "Not set"}
                                        sub={s?.budget ? `of ${fmt(s.budget)} budget` : "Set a monthly budget"}
                                        icon={Target}
                                        color={s?.budget && s.budgetRemaining < 0 ? "#ef4444" : "#f59e0b"} />
                                </div>

                                {/* Insights */}
                                {stats?.insights && stats.insights.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {stats.insights.map((ins, i) => (
                                            <div key={i} className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
                                                <div className="p-2 rounded-xl shrink-0" style={{ background: `${ins.color}15` }}>
                                                    <Sparkles size={14} style={{ color: ins.color }} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{ins.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{ins.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Category Breakdown + Donut */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Category list */}
                                    <div className="bg-surface border border-border rounded-2xl p-6">
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                                            Spending by Category
                                        </h3>
                                        {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                                            <div className="space-y-4">
                                                {stats.categoryBreakdown.map((cat) => (
                                                    <div key={cat.categoryId} className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">{cat.icon}</span>
                                                                <span className="text-gray-300 font-medium">{cat.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-500 text-xs">{cat.percentage.toFixed(0)}%</span>
                                                                <span className="text-white font-semibold">{fmt(cat.amount)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${cat.percentage}%` }}
                                                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                                                className="h-full rounded-full"
                                                                style={{ background: cat.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-600 py-8">
                                                No expenses yet this month
                                            </div>
                                        )}
                                    </div>

                                    {/* 6-month bar chart */}
                                    <div className="bg-surface border border-border rounded-2xl p-6">
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                                            6-Month Overview
                                        </h3>
                                        {stats?.monthlyComparison && (
                                            <div className="flex items-end gap-3 h-40">
                                                {stats.monthlyComparison.map((m) => (
                                                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                                        <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                                                            <div
                                                                className="flex-1 rounded-t-md transition-all"
                                                                style={{
                                                                    height: `${(m.income / maxBar) * 100}%`,
                                                                    background: "rgba(34,197,94,0.5)",
                                                                    minHeight: m.income > 0 ? "4px" : "0",
                                                                }}
                                                                title={`Income: ${fmt(m.income)}`}
                                                            />
                                                            <div
                                                                className="flex-1 rounded-t-md transition-all"
                                                                style={{
                                                                    height: `${(m.expenses / maxBar) * 100}%`,
                                                                    background: "rgba(239,68,68,0.5)",
                                                                    minHeight: m.expenses > 0 ? "4px" : "0",
                                                                }}
                                                                title={`Expenses: ${fmt(m.expenses)}`}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500">{m.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-[var(--status-income)]/50" />
                                                <span className="text-xs text-gray-400">Income</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-[var(--status-expense)]/50" />
                                                <span className="text-xs text-gray-400">Expenses</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Trend */}
                                {stats?.dailyTrend && stats.dailyTrend.some((d) => d.amount > 0) && (
                                    <div className="bg-surface border border-border rounded-2xl p-6">
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                                            Daily Spending — {getMonthLabel(month)}
                                        </h3>
                                        <div className="flex items-end gap-0.5 h-20">
                                            {(() => {
                                                const maxDay = Math.max(...stats.dailyTrend.map((d) => d.amount), 1);
                                                return stats.dailyTrend.map((d) => (
                                                    <div
                                                        key={d.day}
                                                        title={`Day ${d.day}: ${fmtFull(d.amount)}`}
                                                        className="flex-1 rounded-t transition-all hover:opacity-80 cursor-default"
                                                        style={{
                                                            height: `${(d.amount / maxDay) * 100}%`,
                                                            background: d.amount > 0 ? "rgba(220,38,38,0.7)" : "rgba(255,255,255,0.05)",
                                                            minHeight: "2px",
                                                        }}
                                                    />
                                                ));
                                            })()}
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                                            <span>1</span>
                                            <span>{Math.ceil(stats.dailyTrend.length / 2)}</span>
                                            <span>{stats.dailyTrend.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ TRANSACTIONS ══ */}
                        {viewMode === "transactions" && (
                            <div className="space-y-4">
                                {/* Search */}
                                <ExpenseSearch
                                    onSearch={handleSearch}
                                    categories={categories.filter(c => c.type === "expense")}
                                />

                                {/* Show search results or regular list */}
                                {searchResults ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm text-gray-400">
                                            <span>Search results: {searchResults.pagination.total} found</span>
                                            <span className="text-xs">
                                                Query time: {searchResults.performance.queryTimeMs}ms
                                                {searchResults.performance.meetsTarget && (
                                                    <span className="text-[var(--status-income)] ml-1">✓</span>
                                                )}
                                            </span>
                                        </div>
                                        <ExpenseTable
                                            expenses={searchResults.data as any}
                                            loading={searching}
                                            pagination={searchResults.pagination}
                                            onDelete={(exp) => deleteExpense(exp._id)}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {/* Filter */}
                                        <div className="flex items-center gap-2">
                                            {(["all", "expense", "income"] as const).map((f) => (
                                                <button key={f} onClick={() => setTxFilter(f)}
                                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${txFilter === f
                                                        ? "bg-primary/20 text-primary border border-primary/40"
                                                        : "bg-surface border border-border text-gray-400 hover:text-white"
                                                        }`}>
                                                    {f === "all" ? "All" : f === "expense" ? "Expenses" : "Income"}
                                                </button>
                                            ))}
                                            <span className="text-xs text-gray-600 ml-auto">{filteredTx.length} records</span>
                                        </div>

                                        {/* List */}
                                        {filteredTx.length === 0 ? (
                                            <div className="text-center text-gray-600 py-16 border border-dashed border-border rounded-2xl">
                                                No transactions yet — add your first one!
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {filteredTx.map((tx) => {
                                                    const isExpense = tx.kind === "expense";
                                                    const expTx = tx as typeof expenses[0] & { kind: "expense"; displayDate: string };
                                                    const incTx = tx as typeof incomes[0] & { kind: "income"; displayDate: string };

                                                    return (
                                                        <motion.div
                                                            key={tx._id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between group hover:border-white/10 transition-all"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="text-xl shrink-0">
                                                                    {isExpense ? (expTx.categoryId?.icon || "💸") : "💰"}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-medium text-white truncate">
                                                                        {isExpense
                                                                            ? (expTx.categoryId?.name || "Uncategorized")
                                                                            : incTx.source}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                                        <span>{new Date(tx.displayDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                                                        {isExpense && expTx.note && (
                                                                            <><span>·</span><span className="truncate max-w-[120px]">{expTx.note}</span></>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <span className={`font-bold text-lg ${isExpense ? "text-[var(--status-expense)]" : "text-[var(--status-income)]"}`}>
                                                                    {isExpense ? "-" : "+"}{fmt(tx.amount)}
                                                                </span>
                                                                <button
                                                                    onClick={() => isExpense ? deleteExpense(tx._id) : deleteIncome(tx._id)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-[var(--status-expense)] hover:bg-[var(--status-expense)]/10 rounded-lg transition-all"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ══ ANALYTICS ══ */}
                        {viewMode === "analytics" && (
                            <div className="space-y-6">
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : analytics ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Alerts */}
                                        <AlertsCard
                                            unusualSpikes={analytics.alerts.unusualSpikes}
                                            isOverBudget={analytics.alerts.isOverBudget}
                                            budgetWarning={analytics.alerts.budgetWarning}
                                            spendingIncreased={analytics.alerts.spendingIncreased}
                                            increasePercentage={analytics.alerts.increasePercentage}
                                        />

                                        {/* Budget Variance */}
                                        {analytics.budgetVariance && (
                                            <BudgetVarianceCard
                                                budget={analytics.budgetVariance.budget}
                                                actual={analytics.budgetVariance.actual}
                                                remaining={analytics.budgetVariance.remaining}
                                                percentageUsed={analytics.budgetVariance.percentageUsed}
                                                isOverBudget={analytics.budgetVariance.isOverBudget}
                                                isWarning={analytics.budgetVariance.isWarning}
                                                categoryBudgets={analytics.categoryBudgets}
                                            />
                                        )}

                                        {/* Spending Trend */}
                                        <SpendingTrendCard
                                            data={analytics.monthlyTrend.map((m) => ({
                                                label: m.label,
                                                value: m.expenses,
                                                secondaryValue: m.income,
                                            }))}
                                            currentMonth={month}
                                            previousMonth={String(parseInt(month.split("-")[1]) - 1)}
                                            percentageChange={analytics.summary.monthOverMonthChange}
                                        />

                                        {/* Top Categories */}
                                        <TopCategoriesCard
                                            categories={analytics.topCategories.map((c) => ({
                                                name: c.name,
                                                icon: c.icon,
                                                color: c.color,
                                                amount: c.amount,
                                                percentage: c.percentage,
                                                change: c.change,
                                            }))}
                                        />

                                        {/* Predictions */}
                                        <PredictionCard
                                            estimatedTotal={analytics.projections.monthEndEstimate}
                                            currentTotal={analytics.summary.totalExpenses}
                                            dailyAverage={analytics.averages.daily}
                                            weeklyAverage={analytics.averages.weekly}
                                            daysElapsed={analytics.projections.basedOnDays}
                                            totalDays={analytics.projections.totalDaysInMonth}
                                            confidenceLevel={analytics.projections.confidenceLevel as "high" | "medium" | "low"}
                                            trend={
                                                analytics.summary.monthOverMonthChange > 5
                                                    ? "increasing"
                                                    : analytics.summary.monthOverMonthChange < -5
                                                        ? "decreasing"
                                                        : "stable"
                                            }
                                        />

                                        {/* Summary Stats */}
                                        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                                Key Metrics
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-background/50 rounded-xl p-4">
                                                    <div className="text-xs text-gray-500 mb-1">3-Month Average</div>
                                                    <div className="text-xl font-bold text-white">
                                                        {fmt(analytics.averages.threeMonthRolling)}
                                                    </div>
                                                </div>
                                                <div className="bg-background/50 rounded-xl p-4">
                                                    <div className="text-xs text-gray-500 mb-1">Daily Average</div>
                                                    <div className="text-xl font-bold text-white">
                                                        {fmt(analytics.averages.daily)}
                                                    </div>
                                                </div>
                                                <div className="bg-background/50 rounded-xl p-4">
                                                    <div className="text-xs text-gray-500 mb-1">Transactions</div>
                                                    <div className="text-xl font-bold text-white">
                                                        {analytics.summary.transactionCount}
                                                    </div>
                                                </div>
                                                <div className="bg-background/50 rounded-xl p-4">
                                                    <div className="text-xs text-gray-500 mb-1">Balance</div>
                                                    <div className={`text-xl font-bold ${analytics.summary.balance >= 0 ? "text-[var(--status-positive)]" : "text-[var(--status-negative)]"}`}>
                                                        {fmt(Math.abs(analytics.summary.balance))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-600 py-16">
                                        No analytics data available
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ BUDGET ══ */}
                        {viewMode === "budget" && (
                            <div className="space-y-6">
                                {/* Global budget card */}
                                <div className="bg-surface border border-border rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                <Target size={16} className="text-primary" /> Monthly Budget
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Global spending limit for {getMonthLabel(month)}</p>
                                        </div>
                                        <button onClick={() => { setBudgetCat(""); setModal("budget"); }}
                                            className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-semibold hover:bg-primary/30 transition-all">
                                            {s?.budget ? "Edit" : "Set Budget"}
                                        </button>
                                    </div>

                                    {s?.budget ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Spent</span>
                                                <span className="text-white font-semibold">{fmt(s.totalExpenses)} / {fmt(s.budget)}</span>
                                            </div>
                                            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((s.totalExpenses / s.budget) * 100, 100)}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full rounded-full"
                                                    style={{
                                                        background:
                                                            s.totalExpenses > s.budget
                                                                ? "#ef4444"
                                                                : s.totalExpenses > s.budget * 0.8
                                                                    ? "#f59e0b"
                                                                    : "var(--color-primary, #dc2626)",
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>{((s.totalExpenses / s.budget) * 100).toFixed(0)}% used</span>
                                                <span className={s.budgetRemaining < 0 ? "text-[var(--status-negative)]" : "text-[var(--status-positive)]"}>
                                                    {s.budgetRemaining < 0 ? "Over by " : "Remaining: "}{fmt(Math.abs(s.budgetRemaining))}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 text-sm">No global budget set for this month.</p>
                                    )}
                                </div>

                                {/* Per-category budgets */}
                                <div className="bg-surface border border-border rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-white flex items-center gap-2">
                                            <Tag size={16} className="text-primary" /> Category Budgets
                                        </h3>
                                        <button
                                            onClick={() => setModal("budget")}
                                            className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-semibold hover:bg-primary/30 transition-all flex items-center gap-1">
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>

                                    {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                                        <div className="space-y-4">
                                            {stats.categoryBreakdown.map((cat) => (
                                                <BudgetBar key={cat.categoryId} cat={cat} totalBudget={s?.budget || 0} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 text-sm">No expenses or category budgets yet.</p>
                                    )}
                                </div>

                                {/* Category management */}
                                <div className="bg-surface border border-border rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-white flex items-center gap-2">
                                            <Tag size={16} className="text-primary" /> Manage Categories
                                        </h3>
                                        <button
                                            onClick={() => setModal("category")}
                                            className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-semibold hover:bg-primary/30 transition-all flex items-center gap-1">
                                            <Plus size={12} /> New Category
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {categories.map((cat) => (
                                            <div key={cat._id}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/2">
                                                <span>{cat.icon}</span>
                                                <span className="text-sm text-gray-300 truncate">{cat.name}</span>
                                                <div className="w-2 h-2 rounded-full shrink-0 ml-auto" style={{ background: cat.color }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* ── Modals ── */}
            <AnimatePresence>
                {modal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && closeModal()}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            style={{ background: 'var(--surface)' }} className="border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            {/* ── Add Expense ── */}
                            {modal === "expense" && (
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="font-bold text-lg flex items-center gap-2">
                                            <ArrowDownCircle size={18} className="text-primary" /> Add Expense
                                        </h2>
                                        <button onClick={closeModal} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <form onSubmit={addExpense} className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Amount (₦) *</label>
                                            <input
                                                autoFocus type="number" step="0.01" min="0.01"
                                                value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                                                required />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Category *</label>
                                            <select value={expenseCat} onChange={(e) => setExpenseCat(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                                required>
                                                <option value="" disabled>Select a category</option>
                                                {expenseCats.map((c) => (
                                                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Date</label>
                                            <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Note (optional)</label>
                                            <input value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)}
                                                placeholder="What was this for?"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors" />
                                        </div>
                                        <button type="submit" disabled={saving}
                                            className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                                            {saving ? "Saving…" : "Add Expense"}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── Add Income ── */}
                            {modal === "income" && (
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="font-bold text-lg flex items-center gap-2">
                                            <ArrowUpCircle size={18} className="text-[var(--status-income)]" /> Add Income
                                        </h2>
                                        <button onClick={closeModal} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <form onSubmit={addIncome} className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Amount (₦) *</label>
                                            <input
                                                autoFocus type="number" step="0.01" min="0.01"
                                                value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                                                required />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Source *</label>
                                            <input value={incomeSource} onChange={(e) => setIncomeSource(e.target.value)}
                                                placeholder="e.g. Salary, Freelance, Client payment…"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                                                required />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Date</label>
                                            <input type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors" />
                                        </div>
                                        <button type="submit" disabled={saving}
                                            className="w-full bg-[var(--status-income)] text-white rounded-xl py-3 font-bold hover:bg-[var(--status-income)]/90 transition-colors disabled:opacity-50">
                                            {saving ? "Saving…" : "Add Income"}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── Set Budget ── */}
                            {modal === "budget" && (
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="font-bold text-lg flex items-center gap-2">
                                            <Target size={18} className="text-[var(--status-warning)]" /> Set Budget
                                        </h2>
                                        <button onClick={closeModal} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <form onSubmit={saveBudget} className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">
                                                Category (leave blank for global budget)
                                            </label>
                                            <select value={budgetCat} onChange={(e) => setBudgetCat(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors">
                                                <option value="">— Global Monthly Budget —</option>
                                                {expenseCats.map((c) => (
                                                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Budget Amount (₦) *</label>
                                            <input
                                                autoFocus type="number" step="0.01" min="1"
                                                value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                                                required />
                                        </div>
                                        <p className="text-xs text-gray-500">For month: <strong className="text-gray-300">{getMonthLabel(month)}</strong></p>
                                        <button type="submit" disabled={saving}
                                            className="w-full bg-[var(--status-warning)] text-white rounded-xl py-3 font-bold hover:bg-[var(--status-warning)] transition-colors disabled:opacity-50">
                                            {saving ? "Saving…" : "Save Budget"}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── New Category ── */}
                            {modal === "category" && (
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="font-bold text-lg flex items-center gap-2">
                                            <Tag size={18} className="text-primary" /> New Category
                                        </h2>
                                        <button onClick={closeModal} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <form onSubmit={addCategory} className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-20">
                                                <label className="text-xs text-gray-400 mb-1.5 block">Icon</label>
                                                <input value={catIcon} onChange={(e) => setCatIcon(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-center text-xl focus:outline-none focus:border-primary/50"
                                                    maxLength={4} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-400 mb-1.5 block">Name *</label>
                                                <input autoFocus value={catName} onChange={(e) => setCatName(e.target.value)}
                                                    placeholder="Category name"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                                                    required />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-400 mb-1.5 block">Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                                                    <span className="text-sm text-gray-400 font-mono">{catColor}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-400 mb-1.5 block">Type</label>
                                                <div className="flex gap-2">
                                                    {(["expense", "income"] as const).map((t) => (
                                                        <button key={t} type="button" onClick={() => setCatType(t)}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${catType === t
                                                                ? t === "expense" ? "bg-[var(--status-expense)]/20 border border-[var(--status-expense)]/40 text-[var(--status-expense)]" : "bg-[var(--status-income)]/20 border border-[var(--status-income)]/40 text-[var(--status-income)]"
                                                                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                                                                }`}>
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={saving}
                                            className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                                            {saving ? "Saving…" : "Create Category"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
