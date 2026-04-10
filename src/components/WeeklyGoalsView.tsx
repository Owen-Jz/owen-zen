"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Flame, Trophy, Target, Trash2, Calendar, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Loading } from "@/components/Loading";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface WeeklyGoal {
    _id: string;
    title: string;
    description?: string;
    type: 'goal' | 'habit';
    target: number;
    completedWeeks: string[];
    order: number;
}

// Get week identifier (e.g., "2026-W10")
const getWeekIdentifier = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber}`;
};

// Get current week range string
const getCurrentWeekRange = (): string => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
};

// Get week dates for display
const getWeekDates = (weekOffset: number = 0): Date[] => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d);
    }
    return week;
};

export const WeeklyGoalsView = () => {
    const [goals, setGoals] = useState<WeeklyGoal[]>([]);
    const [newGoal, setNewGoal] = useState("");
    const [newType, setNewType] = useState<'goal' | 'habit'>('goal');
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    
    const currentWeekId = getWeekIdentifier(new Date());
    const currentWeekRange = getCurrentWeekRange();
    const weekDates = getWeekDates(weekOffset);

    const fetchGoals = async () => {
        try {
            const res = await fetch("/api/weekly-goals");
            const json = await res.json();
            if (json.success) {
                setGoals(json.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const seedDefaults = async () => {
        const defaults = [
            {
                title: "Worship Session",
                description: "Dedicate time for spiritual growth and reflection",
                type: "habit" as const,
                target: 1,
                order: 1
            },
            {
                title: "60% Win",
                description: "Achieve 60% of your weekly targets",
                type: "goal" as const,
                target: 1,
                order: 2
            },
            {
                title: "3 Deep Work Sessions",
                description: "Complete at least 3 focused deep work blocks",
                type: "habit" as const,
                target: 3,
                order: 3
            },
            {
                title: "Fitness Training",
                description: "Hit the gym or do home workouts",
                type: "habit" as const,
                target: 4,
                order: 4
            },
            {
                title: "Financial Review",
                description: "Review finances and make one money-moving action",
                type: "goal" as const,
                target: 1,
                order: 5
            },
            {
                title: "Content Creation",
                description: "Publish at least one piece of content",
                type: "goal" as const,
                target: 1,
                order: 6
            }
        ];
        for (const d of defaults) {
            await fetch("/api/weekly-goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(d)
            });
        }
        fetchGoals();
    };

    useEffect(() => {
        const checkAndSeed = async () => {
            const res = await fetch("/api/weekly-goals");
            const json = await res.json();
            if (json.data && json.data.length === 0) {
                seedDefaults();
            } else {
                setGoals(json.data);
            }
            setLoading(false);
        };
        checkAndSeed();
    }, []);

    const addGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim()) return;
        await fetch("/api/weekly-goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newGoal, type: newType, target: 1 }),
        });
        setNewGoal("");
        fetchGoals();
    };

    const toggleGoal = async (id: string) => {
        const goal = goals.find(g => g._id === id);
        if (!goal) return;

        const hasCompleted = goal.completedWeeks.includes(currentWeekId);
        const newCompletedWeeks = hasCompleted
            ? goal.completedWeeks.filter(w => w !== currentWeekId)
            : [...goal.completedWeeks, currentWeekId];

        // Optimistic update
        setGoals(goals.map(g => 
            g._id === id ? { ...g, completedWeeks: newCompletedWeeks } : g
        ));

        await fetch("/api/weekly-goals", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: id, completedWeeks: newCompletedWeeks }),
        });
    };

    const deleteGoal = async (id: string) => {
        if (!confirm("Delete this weekly goal?")) return;
        setGoals(goals.filter(g => g._id !== id));
        await fetch(`/api/weekly-goals/${id}`, { method: "DELETE" });
    };

    const isCompleted = (goal: WeeklyGoal) => {
        return goal.completedWeeks.includes(currentWeekId);
    };

    // Stats
    const totalGoals = goals.length;
    const completedThisWeek = goals.filter(g => isCompleted(g)).length;
    const completionRate = totalGoals > 0 ? Math.round((completedThisWeek / totalGoals) * 100) : 0;

    // Calculate streak (consecutive weeks with all goals completed)
    const calculateStreak = () => {
        let streak = 0;
        let checkOffset = 0;
        while (true) {
            const checkWeekId = getWeekIdentifier(new Date(Date.now() - checkOffset * 7 * 24 * 60 * 60 * 1000));
            const allCompleted = goals.every(g => g.completedWeeks.includes(checkWeekId));
            if (allCompleted && goals.length > 0) {
                streak++;
                checkOffset++;
            } else {
                break;
            }
        }
        return streak;
    };

    const streak = calculateStreak();

    if (loading) return <Loading text="Loading Weekly Goals..." />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Weekly Goals
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Track your weekly wins and habits</p>
                </div>
                
                {/* Week Navigator */}
                <div className="flex items-center gap-3 bg-surface/50 rounded-xl p-2 border border-white/5">
                    <button 
                        onClick={() => setWeekOffset(w => w - 1)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="text-center min-w-[120px]">
                        <div className="text-white font-light text-sm">
                            {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${Math.abs(weekOffset)} weeks ago`}
                        </div>
                        <div className="text-gray-500 text-xs">{currentWeekRange}</div>
                    </div>
                    <button 
                        onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
                        disabled={weekOffset === 0}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface/30 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                        <Target className="w-3 h-3" />
                        This Week
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {completedThisWeek}/{totalGoals}
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>

                <div className="bg-surface/30 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                        <Flame className="w-3 h-3 text-orange-500" />
                        Streak
                    </div>
                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                        {streak}
                        <span className="text-xs font-normal text-gray-500">weeks</span>
                    </div>
                </div>

                <div className="bg-surface/30 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                        <Check className="w-3 h-3 text-green-500" />
                        Rate
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {completionRate}%
                    </div>
                </div>
            </div>

            {/* Add New Goal */}
            <form onSubmit={addGoal} className="flex gap-3">
                <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a new weekly goal..."
                    className="flex-1 bg-surface/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'goal' | 'habit')}
                    className="bg-surface/30 border border-white/10 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:border-primary/50"
                >
                    <option value="goal">Goal</option>
                    <option value="habit">Habit</option>
                </select>
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add
                </button>
            </form>

            {/* Goals List */}
            <div className="space-y-3">
                {goals.map((goal) => (
                    <motion.div
                        key={goal._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "group relative bg-surface/20 border rounded-xl p-4 transition-all duration-200",
                            isCompleted(goal) 
                                ? "border-green-500/30 bg-green-500/5" 
                                : "border-white/5 hover:border-white/10"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => toggleGoal(goal._id)}
                                className={cn(
                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                                    isCompleted(goal)
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-600 hover:border-primary"
                                )}
                            >
                                {isCompleted(goal) && <Check className="w-4 h-4 text-white" />}
                            </button>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className={cn(
                                        "font-medium",
                                        isCompleted(goal) ? "text-green-400 line-through" : "text-white"
                                    )}>
                                        {goal.title}
                                    </h3>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        goal.type === 'goal' 
                                            ? "bg-blue-500/20 text-blue-400" 
                                            : "bg-purple-500/20 text-purple-400"
                                    )}>
                                        {goal.type}
                                    </span>
                                </div>
                                {goal.description && (
                                    <p className="text-gray-500 text-sm mt-1">{goal.description}</p>
                                )}
                            </div>

                            <button
                                onClick={() => deleteGoal(goal._id)}
                                className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {goals.length === 0 && (
                <div className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No weekly goals yet</p>
                    <p className="text-gray-600 text-sm">Add your first weekly goal above</p>
                </div>
            )}
        </div>
    );
};
