"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Flame, Trophy, Activity, Trash2, Calendar, TrendingUp, Zap, Target, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Loading } from "@/components/Loading";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface Habit {
    _id: string;
    title: string;
    description?: string;
    category: string;
    streak: number;
    completedDates: string[];
}

export const HabitView = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [newHabit, setNewHabit] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchHabits = async () => {
        try {
            const res = await fetch("/api/habits");
            const json = await res.json();
            if (json.success) {
                setHabits(json.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const seedDefaults = async () => {
        const defaults = [
            {
                title: "Wake Up at Fixed Time",
                category: "mindset",
                description: "Pick a time (e.g. 6:00am). No snoozing. Brain loves predictability. Control wake-up = control life."
            },
            {
                title: "Move Your Body (Daily)",
                category: "health",
                description: "Gym, walk, or jog. Gym days: train hard. Non-gym days: 7–10k steps. Stagnant body = lazy mind."
            },
            {
                title: "Eat Simple Meals",
                category: "health",
                description: "High protein, simple carbs, controlled fats. No emotional eating. If food is chaotic, focus is chaotic."
            },
            {
                title: "3–4 Hours Deep Work",
                category: "work",
                description: "Phone on DND. One task, one outcome. Focus for 3 hours or forget scaling."
            },
            {
                title: "One Money-Moving Action",
                category: "work",
                description: "Lead outreach, improve sales page, send proposal, ship feature, or close follow-up."
            },
            {
                title: "Track Inputs (Truth)",
                category: "work",
                description: "Did I train? Eat properly? Deep work? Move money forward? Just truth on paper, no fluff."
            },
            {
                title: "Control Dopamine",
                category: "mindset",
                description: "No porn, no scrolling, no 'rewarding' for nothing. Earn motivation through effort."
            },
            {
                title: "Sleep at Fixed Time",
                category: "health",
                description: "Same bedtime. Screens off 60m before. Sleep is discipline, not laziness. Tired = stupid decisions."
            }
        ];
        for (const d of defaults) {
            await fetch("/api/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(d)
            });
        }
        fetchHabits();
    };

    useEffect(() => {
        fetchHabits();
        // Check if we need to seed (simple check for empty array on mount)
        // Note: In a real app, we'd check server side count, but this works for client-init
        const checkAndSeed = async () => {
            const res = await fetch("/api/habits");
            const json = await res.json();
            if (json.data && json.data.length === 0) {
                seedDefaults();
            } else {
                setHabits(json.data);
            }
            setLoading(false);
        }
        checkAndSeed();
    }, []);

    const addHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabit.trim()) return;
        await fetch("/api/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newHabit }),
        });
        setNewHabit("");
        fetchHabits();
    };

    const toggleHabit = async (id: string, dateStr?: string) => {
        // Default to today if no date provided
        // IMPORTANT: Working with local dates, we need to be careful not to shift to yesterday in UTC
        // We send the FULL ISO string of the specific moment the user clicked (or the date they selected)
        // The backend will handle the "Day" comparison logic.
        let targetDate = new Date();
        if (dateStr) {
            targetDate = new Date(dateStr);
        }

        // For optimistic update, we also use YYYY-MM-DD comparison
        const toDateString = (d: Date) => d.toISOString().split('T')[0];
        const targetDayStr = toDateString(targetDate);

        setHabits(habits.map(h => {
            if (h._id === id) {
                const hasDone = h.completedDates.some(d => toDateString(new Date(d)) === targetDayStr);
                const newDates = hasDone
                    ? h.completedDates.filter(d => toDateString(new Date(d)) !== targetDayStr)
                    : [...h.completedDates, targetDate.toISOString()];
                return { ...h, completedDates: newDates };
            }
            return h;
        }));

        await fetch(`/api/habits/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle", date: targetDate.toISOString() }),
        });

        fetchHabits(); // Refresh for accurate streaks
    };

    const deleteHabit = async (id: string) => {
        if (!confirm("Delete this habit protocol?")) return;
        setHabits(habits.filter(h => h._id !== id));
        await fetch(`/api/habits/${id}`, { method: "DELETE" });
    };

    const isCompleted = (h: Habit, date: Date) => {
        // Compare by YYYY-MM-DD
        const toDateString = (d: Date) => d.toISOString().split('T')[0];
        const targetStr = toDateString(new Date(date));
        return h.completedDates.some(cd => toDateString(new Date(cd)) === targetStr);
    };

    // --- Heatmap Logic ---
    const getYearGridData = () => {
        const year = 2026; // Force 2026 per requirements
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);

        const days: (Date | null)[] = [];

        // Add padding for days before Jan 1st (align to Sunday start)
        const startDay = start.getDay(); // 0=Sun, 1=Mon, etc.
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Add all days of the year
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }

        return days;
    };

    const heatmapGrid = getYearGridData().map(date => {
        if (!date) return null;
        // Compare by YYYY-MM-DD
        const toDateString = (d: Date) => d.toISOString().split('T')[0];
        const iso = toDateString(date);
        const count = habits.reduce((acc, h) => {
            return acc + (h.completedDates.some(d => toDateString(new Date(d)) === iso) ? 1 : 0);
        }, 0);
        return { date: new Date(date), count };
    });

    // Calculate intensity (0-4) based on real max
    const maxCount = Math.max(...heatmapGrid.filter(d => d).map(d => d!.count), 1);
    const getIntensity = (count: number) => {
        if (count === 0) return 0;
        return Math.ceil((count / maxCount) * 4);
    };

    const intensityColors = [
        "bg-white/5",       // 0 (Empty but visible)
        "bg-primary/30",    // 1
        "bg-primary/50",    // 2
        "bg-primary/80",    // 3
        "bg-primary"        // 4
    ];

    // --- Current Week (Mon-Sun) ---
    const getCurrentWeekDays = () => {
        const today = new Date();
        const day = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(today.setDate(diff));

        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            week.push(d);
        }
        return week;
    };


    const weekDays = getCurrentWeekDays();

    if (loading) return <Loading text="Loading Protocols..." />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            {/* --- Top Stats (Compact) --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-primary/20 transition-all">
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Today</div>
                        <div className="text-xl font-bold text-white mt-1">
                            {habits.filter(h => isCompleted(h, new Date())).length} <span className="text-gray-600 text-sm">/ {habits.length}</span>
                        </div>
                    </div>
                    <Trophy size={20} className="text-primary opacity-80" />
                </div>
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-orange-500/20 transition-all">
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Best Streak</div>
                        <div className="text-xl font-bold text-white mt-1">
                            {Math.max(0, ...habits.map(h => h.streak))} <span className="text-xs text-gray-600">days</span>
                        </div>
                    </div>
                    <Flame size={20} className="text-orange-500 opacity-80" />
                </div>
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-blue-500/20 transition-all">
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Total Reps</div>
                        <div className="text-xl font-bold text-white mt-1">
                            {habits.reduce((acc, h) => acc + h.completedDates.length, 0)}
                        </div>
                    </div>
                    <Activity size={20} className="text-blue-500 opacity-80" />
                </div>
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-purple-500/20 transition-all">
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Rate</div>
                        <div className="text-xl font-bold text-white mt-1">
                            {habits.length > 0 ? Math.round((habits.filter(h => isCompleted(h, new Date())).length / habits.length) * 100) : 0}%
                        </div>
                    </div>
                    <Zap size={20} className="text-purple-500 opacity-80" />
                </div>
            </div>

            {/* --- Main List --- */}
            <div className="bg-surface/20 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-3">
                        <Target className="text-primary" size={24} />
                        <h2 className="text-xl font-bold text-white">Daily Non-Negotiables</h2>
                    </div>

                    {/* Week Days Header (Desktop) */}
                    <div className="hidden md:flex gap-1 ml-auto mr-12">
                        {weekDays.map((d, i) => {
                            const toDateString = (date: Date) => date.toISOString().split('T')[0];
                            const isToday = toDateString(d) === toDateString(new Date());
                            return (
                                <div key={i} className={cn("w-6 text-center text-[10px] font-mono uppercase", isToday ? "text-primary font-bold" : "text-gray-600")}>
                                    {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* List Items */}
                <div className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                        {habits.map(habit => {
                            const isDoneToday = isCompleted(habit, new Date());
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    key={habit._id}
                                    className={cn(
                                        "group flex items-center gap-4 p-4 hover:bg-white/5 transition-all relative",
                                        isDoneToday ? "bg-primary/5" : ""
                                    )}
                                >
                                    {/* Major Checkbox */}
                                    <button
                                        onClick={() => toggleHabit(habit._id)}
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 z-10",
                                            isDoneToday
                                                ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(220,38,38,0.4)] scale-110"
                                                : "border-gray-600 text-transparent hover:border-primary hover:scale-105"
                                        )}
                                    >
                                        <Check size={14} strokeWidth={4} />
                                    </button>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className={cn(
                                            "font-medium  truncate transition-all text-base",
                                            isDoneToday ? "text-gray-400 line-through decoration-gray-600 decoration-2" : "text-gray-100 group-hover:text-white"
                                        )}>
                                            {habit.title}
                                        </div>
                                        {habit.description && (
                                            <div className="text-xs text-gray-500 truncate mt-0.5 group-hover:text-gray-400">
                                                {habit.description}
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata & Actions */}
                                    <div className="flex items-center gap-6">
                                        {/* Streak Badge */}
                                        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded bg-black/20 border border-white/5", habit.streak > 3 ? "text-orange-500 border-orange-500/20 bg-orange-500/10" : "text-gray-500")}>
                                            <Flame size={12} />
                                            <span className="text-xs font-mono font-bold">{habit.streak}</span>
                                        </div>

                                        {/* Week History (Mini Dots) */}
                                        <div className="hidden md:flex gap-1">
                                            {weekDays.map((date, i) => {
                                                const completed = isCompleted(habit, date);
                                                const toDateString = (d: Date) => d.toISOString().split('T')[0];
                                                const isToday = toDateString(date) === toDateString(new Date());

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => toggleHabit(habit._id, date.toISOString())}
                                                        title={date.toDateString()}
                                                        className={cn(
                                                            "w-6 h-6 rounded flex items-center justify-center transition-all",
                                                            isToday ? "bg-white/5 ring-1 ring-inset ring-white/10" : ""
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                            completed ? "bg-primary shadow-[0_0_5px_rgba(220,38,38,0.5)] scale-125" : "bg-gray-800 hover:bg-gray-600"
                                                        )} />
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Delete Action */}
                                        <button
                                            onClick={() => deleteHabit(habit._id)}
                                            className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-2"
                                            title="Delete protocol"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Add New Input Row */}
                    <form onSubmit={addHabit} className="group flex items-center gap-4 p-4 hover:bg-white/5 transition-all border-t border-white/5 bg-black/20">
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center shrink-0 group-hover:border-gray-500">
                            <Plus size={14} className="text-gray-700 group-hover:text-gray-500" />
                        </div>
                        <input
                            type="text"
                            value={newHabit}
                            onChange={(e) => setNewHabit(e.target.value)}
                            placeholder="Add a new non-negotiable..."
                            className="bg-transparent border-none outline-none text-gray-400 placeholder-gray-600 w-full font-medium h-full focus:text-white"
                        />
                        <button type="submit" disabled={!newHabit.trim()} className="text-xs font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-all">
                            Add
                        </button>
                    </form>
                </div>
            </div>

            {/* --- Heatmap Footer (Collapsible/Subtle) --- */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Consistency Graph
                    </h3>
                    <button
                        onClick={async () => {
                            if (confirm("Reset to default 2026 protocols? This will clear current habits but keep history.")) {
                                for (const h of habits) await fetch(`/api/habits/${h._id}`, { method: "DELETE" });
                                setHabits([]);
                                await seedDefaults();
                            }
                        }}
                        className="text-[10px] text-gray-600 hover:text-red-500 transition-colors uppercase font-bold tracking-wider"
                    >
                        Reset Defaults
                    </button>
                </div>

                <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex gap-1 min-w-max">
                        {Array.from({ length: Math.ceil(heatmapGrid.length / 7) }).map((_, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {Array.from({ length: 7 }).map((_, dayIndex) => {
                                    const flatIndex = weekIndex * 7 + dayIndex;
                                    const data = heatmapGrid[flatIndex];
                                    if (!data) return <div key={dayIndex} className="w-2.5 h-2.5" />; // Empty placeholder

                                    const isFuture = data.date > new Date();
                                    return (
                                        <div
                                            key={dayIndex}
                                            title={`${data.date.toDateString()}: ${data.count} completions`}
                                            className={cn(
                                                "w-2.5 h-2.5 rounded-[2px] transition-all duration-300",
                                                isFuture ? "bg-white/5 opacity-50" : intensityColors[getIntensity(data.count)]
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
