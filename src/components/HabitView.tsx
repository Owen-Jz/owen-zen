"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Check, Flame, Trophy, Activity, Trash2, Calendar, TrendingUp, Zap, Target, Circle, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Loading } from "@/components/Loading";
import { HabitDetailModal } from "./habit/HabitDetailModal";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSoundContext } from "@/components/SoundEffects";
import { getCurrentWeekKey, toLocalString } from "@/lib/dateUtils";
import { isPerfectDay, isPerfectWeek } from "@/lib/perfectDetection";
import { useCelebration } from "@/hooks/useCelebration";

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
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

    // Weekly habits state
    const [weeklyHabits, setWeeklyHabits] = useState<any[]>([]);
    const [newWeeklyHabit, setNewWeeklyHabit] = useState("");

    // Daily habits week navigation (0 = current week, -1 = previous week)
    const [dailyWeekOffset, setDailyWeekOffset] = useState(0);

    // Sound effects
    const { playSound } = useSoundContext();

    // Celebration trigger
    const { triggerCelebration, overlay } = useCelebration();
    const prevPerfectDaysRef = useRef<Set<string>>(new Set());

    // --- Fetch Weekly Habits ---
    const fetchWeeklyHabits = async () => {
        try {
            const res = await fetch("/api/weekly-habits");
            const json = await res.json();
            if (json.success) {
                setWeeklyHabits(json.data);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Weekly Defaults ---
    const weeklyDefaults = [
        { title: "Full Body Work Out", category: "health", description: "Train hard, track reps and sets" },
        { title: "Weekly Review", category: "work", description: "Review the week's wins, losses, and next actions" },
        { title: "Clear Inbox to Zero", category: "work", description: "Process all outstanding emails and messages" },
    ];

    const seedWeeklyDefaults = async () => {
        for (const d of weeklyDefaults) {
            await fetch("/api/weekly-habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(d)
            });
        }
        fetchWeeklyHabits();
    };

    // --- Toggle Weekly Habit ---
    const toggleWeeklyHabit = async (id: string, weekKey?: string) => {
        const targetWeek = weekKey || getCurrentWeekKey();
        const isPastWeek = targetWeek !== getCurrentWeekKey();

        // Optimistic update (skip for past weeks to avoid double-updating the chart)
        if (!isPastWeek) {
            setWeeklyHabits(weeklyHabits.map(h => {
                const hasDone = h.completedWeeks?.includes(targetWeek);
                return {
                    ...h,
                    completedWeeks: hasDone
                        ? h.completedWeeks.filter((w: string) => w !== targetWeek)
                        : [...(h.completedWeeks || []), targetWeek]
                };
            }));
        }

        const res = await fetch(`/api/weekly-habits/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle", date: targetWeek }),
        });
        if (!res.ok) {
            console.error("Failed to toggle habit:", await res.text());
        }
        fetchWeeklyHabits();
    };

    // --- Toggle All Weekly Habits for a Specific Week (from bar chart) ---
    const toggleAllWeeklyHabitsForWeek = async (weekKey: string) => {
        const isCurrentWeek = weekKey === getCurrentWeekKey();
        const allCompleted = weeklyHabits.every(h => h.completedWeeks?.includes(weekKey));
        const newState = !allCompleted;

        // Optimistic update (skip for past weeks to avoid confusion)
        if (isCurrentWeek) {
            setWeeklyHabits(weeklyHabits.map(h => ({
                ...h,
                completedWeeks: newState
                    ? [...(h.completedWeeks || []), weekKey]
                    : (h.completedWeeks || []).filter((w: string) => w !== weekKey)
            })));
        }

        // Toggle each habit individually via API
        await Promise.all(weeklyHabits.map(h => {
            const hasDone = h.completedWeeks?.includes(weekKey);
            if (hasDone === newState) return Promise.resolve();
            return fetch(`/api/weekly-habits/${h._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle", date: weekKey }),
            });
        }));
        fetchWeeklyHabits();
    };

    // --- Add Weekly Habit ---
    const addWeeklyHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWeeklyHabit.trim()) return;
        await fetch("/api/weekly-habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newWeeklyHabit }),
        });
        setNewWeeklyHabit("");
        fetchWeeklyHabits();
    };

    // --- Delete Weekly Habit ---
    const deleteWeeklyHabit = async (id: string) => {
        if (!confirm("Delete this weekly habit?")) return;
        setWeeklyHabits(weeklyHabits.filter(h => h._id !== id));
        await fetch(`/api/weekly-habits/${id}`, { method: "DELETE" });
    };

    // Check and seed weekly habits on mount
    useEffect(() => {
        fetchWeeklyHabits();
        const checkAndSeedWeekly = async () => {
            const res = await fetch("/api/weekly-habits");
            const json = await res.json();
            if (json.data && json.data.length === 0) {
                seedWeeklyDefaults();
            } else {
                setWeeklyHabits(json.data);
            }
        };
        checkAndSeedWeekly();
    }, []);

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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        if (openDropdownId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openDropdownId]);

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
        const targetDayStr = toLocalString(targetDate);

        // Determine if this is a completion (not un-checking) before state changes
        const habit = habits.find(h => h._id === id);
        const isCompleting = habit
            ? !habit.completedDates.some(d => toLocalString(d) === targetDayStr)
            : false;

        setHabits(habits.map(h => {
            if (h._id === id) {
                const hasDone = h.completedDates.some(d => toLocalString(d) === targetDayStr);
                const newDates = hasDone
                    ? h.completedDates.filter(d => toLocalString(d) !== targetDayStr)
                    : [...h.completedDates, targetDate.toISOString()];
                return { ...h, completedDates: newDates };
            }
            return h;
        }));

        // Play sound when marking a habit as complete
        if (isCompleting) {
            playSound('HABIT_COMPLETED');
        }

        await fetch(`/api/habits/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle", date: targetDate.toISOString() }),
        });

        fetchHabits(); // Refresh for accurate streaks
    };

    // --- Toggle All Daily Habits for a Specific Day (from heatmap) ---
    const toggleAllHabitsForDay = async (date: Date) => {
        const dateStr = date.toISOString();
        const allDone = habits.every(h =>
            h.completedDates.some(d => toLocalString(d) === toLocalString(date))
        );
        const newState = !allDone;

        // Optimistic update (current day only to avoid confusion)
        if (toLocalString(date) === toLocalString(new Date())) {
            setHabits(habits.map(h => {
                const dayStr = toLocalString(date);
                const hasDone = h.completedDates.some(d => toLocalString(d) === dayStr);
                return {
                    ...h,
                    completedDates: newState
                        ? [...h.completedDates, dateStr]
                        : h.completedDates.filter(d => toLocalString(d) !== dayStr)
                };
            }));
        }

        // Toggle each habit individually via API
        await Promise.all(habits.map(h => {
            const dayStr = toLocalString(date);
            const hasDone = h.completedDates.some(d => toLocalString(d) === dayStr);
            if (hasDone === newState) return Promise.resolve();
            return fetch(`/api/habits/${h._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle", date: dateStr }),
            });
        }));
        fetchHabits();
    };

    // Complete habit via dropdown (explicit intention)
    const completeWithIntention = async (id: string) => {
        const targetDate = new Date();
        const targetDayStr = toLocalString(targetDate);

        // Check if already completed
        const habit = habits.find(h => h._id === id);
        if (!habit) return;

        const hasDone = habit.completedDates.some(d => toLocalString(d) === targetDayStr);
        if (hasDone) return; // Already completed

        // Optimistic update
        setHabits(habits.map(h => {
            if (h._id === id) {
                return { ...h, completedDates: [...h.completedDates, targetDate.toISOString()] };
            }
            return h;
        }));

        await fetch(`/api/habits/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle", date: targetDate.toISOString() }),
        });

        setOpenDropdownId(null);
        fetchHabits();
    };

    const deleteHabit = async (id: string) => {
        if (!confirm("Delete this habit protocol?")) return;
        setHabits(habits.filter(h => h._id !== id));
        await fetch(`/api/habits/${id}`, { method: "DELETE" });
    };

    const markAllCompletedToday = async () => {
        const targetDate = new Date();
        const targetDayStr = toLocalString(targetDate);

        // Optimistic UI update
        const toUpdateIds: string[] = [];
        setHabits(habits.map(h => {
            const hasDone = h.completedDates.some(d => toLocalString(d) === targetDayStr);
            if (!hasDone) {
                toUpdateIds.push(h._id);
                return { ...h, completedDates: [...h.completedDates, targetDate.toISOString()] };
            }
            return h;
        }));

        // Fire off parallel updates
        if (toUpdateIds.length > 0) {
            await Promise.all(toUpdateIds.map(id =>
                fetch(`/api/habits/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "toggle", date: targetDate.toISOString() }),
                })
            ));
            fetchHabits();
        }
    };

    const isCompleted = (h: Habit, date: Date | string) => {
        // Compare by YYYY-MM-DD
        const targetStr = toLocalString(date);
        return h.completedDates.some(cd => toLocalString(cd) === targetStr);
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

    const heatmapGrid = useMemo(() => {
        const yearDays = getYearGridData();
        // Pre-compute a flat set of all completed date strings — O(H * avg completions)
        const allCompleted = new Set<string>();
        for (const h of habits) {
            for (const d of h.completedDates) {
                // Fast path: ISO string "2026-05-03T..." → "2026-05-03"
                allCompleted.add(typeof d === 'string' ? d.substring(0, 10) : toLocalString(d));
            }
        }
        // Pre-compute perfect days set once — O(365 * H * 1 Date creation)
        const perfectDays = new Set<string>();
        for (const date of yearDays) {
            if (!date) continue;
            const dateKey = toLocalString(date);
            let dayComplete = true;
            for (const h of habits) {
                if (!h.completedDates.some(cd => {
                    const key = typeof cd === 'string' ? cd.substring(0, 10) : toLocalString(cd);
                    return key === dateKey;
                })) { dayComplete = false; break; }
            }
            if (dayComplete) perfectDays.add(dateKey);
        }
        return yearDays.map(date => {
            if (!date) return null;
            const dateKey = toLocalString(date);
            const count = habits.reduce((acc, h) => {
                return acc + (h.completedDates.some(d => {
                    const key = typeof d === 'string' ? d.substring(0, 10) : toLocalString(d);
                    return key === dateKey;
                }) ? 1 : 0);
            }, 0);
            const dateObj = new Date(date);
            const isPDay = perfectDays.has(dateKey);
            const isPSat = dateObj.getDay() === 6;
            const isPWeek = isPSat
                ? (() => {
                    for (let i = 0; i < 7; i++) {
                        const dow = new Date(dateObj);
                        dow.setDate(dateObj.getDate() - (6 - i));
                        if (!perfectDays.has(toLocalString(dow))) return false;
                    }
                    return true;
                })()
                : false;
            return { date: dateObj, count, isPerfectDay: isPDay, isPerfectWeek: isPWeek };
        });
    }, [habits]); // Only recompute when habits change

    // Detect newly perfect days/weeks and trigger celebration
    useEffect(() => {
      const currentPerfectDays = new Set(
        (heatmapGrid as Array<NonNullable<typeof heatmapGrid[number]>>)
          .filter(d => d && d.isPerfectDay)
          .map(d => toLocalString(d.date))
      );

      const newlyPerfectDay = heatmapGrid.find(d => {
        if (!d || !d.isPerfectDay) return false;
        const key = toLocalString(d.date);
        return !prevPerfectDaysRef.current.has(key);
      });

      const newlyPerfectWeek = heatmapGrid.find(d => {
        if (!d || !d.isPerfectWeek) return false;
        const key = toLocalString(d.date);
        return !prevPerfectDaysRef.current.has(key);
      });

      if (newlyPerfectWeek) {
        triggerCelebration('week');
      } else if (newlyPerfectDay) {
        triggerCelebration('day');
      }

      prevPerfectDaysRef.current = currentPerfectDays;
    }, [heatmapGrid, triggerCelebration]);

    // Calculate intensity (0-4) based on real max
    const maxCount = Math.max(...heatmapGrid.filter((d: { date: Date, count: number } | null) => d).map((d: any) => d.count), 1);
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

    // --- Current Week (Mon-Sun) — derived from dailyWeekOffset ---
    const weekDays = useMemo(() => {
        const today = new Date();
        const todayStr = toLocalString(today); // e.g. "2026-05-03"
        const [yr, mo, da] = todayStr.split('-').map(Number);
        const localToday = new Date(yr, mo - 1, da, 12, 0, 0); // Use noon to avoid DST edge cases
        const day = localToday.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = localToday.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(localToday);
        monday.setDate(diff);

        // Apply week offset (negative = past weeks)
        monday.setDate(monday.getDate() + (dailyWeekOffset * 7));

        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            week.push(d);
        }
        return week;
    }, [dailyWeekOffset]);

    // --- Advanced Stats Compute ---
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => isCompleted(h, new Date())).length;
    const todayRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    const getCompletionsInWindow = (days: number) => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - days);
        // We set to start of day for comparison
        start.setHours(0, 0, 0, 0);

        let count = 0;
        habits.forEach(h => {
            count += h.completedDates.filter(d => new Date(d) >= start).length;
        });
        return count;
    };

    const last7Completions = getCompletionsInWindow(7);
    const last7Rate = totalHabits > 0 ? Math.round((last7Completions / (totalHabits * 7)) * 100) : 0;

    const last30Completions = getCompletionsInWindow(30);
    const last30Rate = totalHabits > 0 ? Math.round((last30Completions / (totalHabits * 30)) * 100) : 0;

    const maxCurrentStreak = habits.length > 0 ? Math.max(0, ...habits.map(h => h.streak)) : 0;
    const totalLifetimeReps = habits.reduce((acc, h) => acc + h.completedDates.length, 0);

    if (loading) return <Loading text="Loading Protocols..." />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            {/* --- Advanced Stats --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Progress */}
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <div>
                            <div className="text-sm text-gray-400 font-light mb-1">Today's Progress</div>
                            <div className="text-2xl font-bold text-white">
                                {completedToday} <span className="text-gray-500 text-base font-medium">/ {totalHabits}</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Target size={20} className="text-primary" />
                        </div>
                    </div>
                    <div className="relative z-10 w-full bg-black/40 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${todayRate}%` }} />
                    </div>
                    <div className="relative z-10 text-right mt-2 text-xs text-primary font-bold">{todayRate}% Complete</div>
                </div>

                {/* 7-Day Consistency */}
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <div>
                            <div className="text-sm text-gray-400 font-light mb-1">Weekly Consistency</div>
                            <div className="text-2xl font-bold text-white">
                                {last7Rate}%
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-500" />
                        </div>
                    </div>
                    <div className="relative z-10 w-full bg-black/40 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${last7Rate}%` }} />
                    </div>
                    <div className="relative z-10 text-right mt-2 text-xs text-blue-500 font-bold">{last7Completions} Reps this week</div>
                </div>

                {/* 30-Day Consistency */}
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-purple-500/30 transition-all relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <div>
                            <div className="text-sm text-gray-400 font-light mb-1">Monthly Focus</div>
                            <div className="text-2xl font-bold text-white">
                                {last30Rate}%
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Activity size={20} className="text-purple-500" />
                        </div>
                    </div>
                    <div className="relative z-10 w-full bg-black/40 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${last30Rate}%` }} />
                    </div>
                    <div className="relative z-10 text-right mt-2 text-xs text-purple-500 font-bold">{last30Completions} Reps this month</div>
                </div>

                {/* Best Streak & Total Reps */}
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-orange-500/30 transition-all relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex justify-between items-center bg-white/5 p-3 rounded-xl mb-3 border border-white/5">
                        <div>
                            <div className="text-xs text-gray-400 font-medium">Active Streak</div>
                            <div className="text-lg font-bold text-white">{maxCurrentStreak} <span className="text-xs text-gray-500 font-normal">days</span></div>
                        </div>
                        <Flame size={24} className="text-orange-500" />
                    </div>

                    <div className="relative z-10 flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <div>
                            <div className="text-xs text-gray-400 font-medium">All-Time Reps</div>
                            <div className="text-lg font-bold text-white">{totalLifetimeReps}</div>
                        </div>
                        <Trophy size={20} className="text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* --- Weekly Stats Cards --- */}
            {(() => {
                const totalWeekly = weeklyHabits.length;
                const currentWeekKey = getCurrentWeekKey();
                const completedThisWeek = weeklyHabits.filter(h => h.completedWeeks?.includes(currentWeekKey)).length;
                const thisWeekRate = totalWeekly > 0 ? Math.round((completedThisWeek / totalWeekly) * 100) : 0;

                // Weekly consistency over last 8 weeks
                const last8Weeks = Array.from({ length: 8 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (7 * i));
                    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                    const day = t.getUTCDay() || 7;
                    t.setUTCDate(t.getUTCDate() + 4 - day);
                    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
                    const weekNum = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                    return `${t.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
                }).reverse();

                const weeklyConsistencyRate = last8Weeks.length > 0
                    ? Math.round(last8Weeks.reduce((acc, wk) => {
                        const completedAll = weeklyHabits.every(h => h.completedWeeks?.includes(wk));
                        return acc + (completedAll ? 1 : 0);
                    }, 0) / last8Weeks.length * 100)
                    : 0;

                // Max streak across all weekly habits
                const weeklyMaxStreak = weeklyHabits.length > 0 ? Math.max(0, ...weeklyHabits.map(h => h.streak)) : 0;

                // Total weeks completed across all habits
                const totalWeeksCompleted = weeklyHabits.reduce((acc, h) => acc + (h.completedWeeks?.length || 0), 0);

                return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* This Week */}
                        <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-green-500/30 transition-all relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-sm text-gray-400 font-light mb-1">This Week</div>
                                    <div className="text-2xl font-bold text-white">
                                        {completedThisWeek} <span className="text-gray-500 text-base font-medium">/ {totalWeekly}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Calendar size={20} className="text-green-500" />
                                </div>
                            </div>
                            <div className="relative z-10 w-full bg-black/40 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${thisWeekRate}%` }} />
                            </div>
                            <div className="relative z-10 text-right mt-2 text-xs text-green-500 font-bold">{thisWeekRate}% Complete</div>
                        </div>

                        {/* Weekly Consistency */}
                        <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 transition-all relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-sm text-gray-400 font-light mb-1">Weekly Consistency</div>
                                    <div className="text-2xl font-bold text-white">
                                        {weeklyConsistencyRate}%
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                    <TrendingUp size={20} className="text-cyan-500" />
                                </div>
                            </div>
                            <div className="relative z-10 w-full bg-black/40 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${weeklyConsistencyRate}%` }} />
                            </div>
                            <div className="relative z-10 text-right mt-2 text-xs text-cyan-500 font-bold">Last 8 weeks</div>
                        </div>

                        {/* Current Streak */}
                        <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-orange-500/30 transition-all relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-sm text-gray-400 font-light mb-1">Current Streak</div>
                                    <div className="text-2xl font-bold text-white">
                                        {weeklyMaxStreak} <span className="text-gray-500 text-base font-medium">wks</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Flame size={20} className="text-orange-500" />
                                </div>
                            </div>
                            <div className="relative z-10 text-right mt-2 text-xs text-orange-500 font-bold">Max streak</div>
                        </div>

                        {/* Total Weeks */}
                        <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-yellow-500/30 transition-all relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-sm text-gray-400 font-light mb-1">Total Weeks</div>
                                    <div className="text-2xl font-bold text-white">
                                        {totalWeeksCompleted}
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <Trophy size={20} className="text-yellow-500" />
                                </div>
                            </div>
                            <div className="relative z-10 text-right mt-2 text-xs text-yellow-500 font-bold">All-time weeks</div>
                        </div>
                    </div>
                );
            })()}

            {/* --- Main List --- */}
            <div className="bg-surface/20 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-black/20 gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Target className="text-primary shrink-0" size={24} />
                        {/* Week Navigation */}
                        <div className="flex items-center gap-2">
                            {dailyWeekOffset !== 0 && (
                                <button
                                    onClick={() => setDailyWeekOffset(0)}
                                    className="text-xs text-gray-500 hover:text-gray-300 underline"
                                    title="Back to current week"
                                >
                                    {dailyWeekOffset > 0 ? "Today" : `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                </button>
                            )}
                            {dailyWeekOffset === 0 && (
                                <span className="text-xs text-gray-600 hidden sm:inline">
                                    Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                            <button
                                onClick={() => setDailyWeekOffset(dailyWeekOffset - 1)}
                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                title="Previous week"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setDailyWeekOffset(dailyWeekOffset + 1)}
                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                title="Next week"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-white whitespace-nowrap">Daily Non-Negotiables</h2>
                        {totalHabits > 0 && completedToday === totalHabits && dailyWeekOffset === 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-2 flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/50 rounded-md text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] shrink-0"
                            >
                                <Trophy size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Perfect Day</span>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {totalHabits > 0 && completedToday < totalHabits && (
                            <button
                                onClick={markAllCompletedToday}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold uppercase tracking-wider shrink-0 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]"
                                title="Fast Track: Complete entirely"
                            >
                                <Zap size={14} /> Fast Track
                            </button>
                        )}
                        {/* Week Days Header (Desktop) */}
                        <div className="hidden md:flex gap-1 ml-auto">
                            {weekDays.map((d: Date, i: number) => {
                                const isToday = toLocalString(d) === toLocalString(new Date());
                                return (
                                    <div key={i} className={cn("w-6 text-center text-[10px] font-mono uppercase", isToday ? "text-primary font-bold" : "text-gray-600")}>
                                        {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* List Items */}
                <div className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                        {habits.map(habit => {
                            const isDoneToday = dailyWeekOffset === 0 && isCompleted(habit, new Date());
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
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.closest('button') || target.closest('[data-no-modal]')) return;
                                        setSelectedHabit(habit);
                                    }}
                                >
                                    {/* Major Checkbox */}
                                    <button
                                        data-no-modal="true"
                                        onClick={() => toggleHabit(habit._id)}
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 z-10",
                                            isDoneToday
                                                ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(220,38,38,0.4)] scale-110"
                                                : "border-gray-600 text-transparent hover:border-primary hover:scale-105"
                                        )}
                                        aria-label={isDoneToday ? `Mark ${habit.title} as incomplete` : `Mark ${habit.title} as complete`}
                                    >
                                        <Check size={14} strokeWidth={4} />
                                    </button>

                                    {/* Dropdown for Intention */}
                                    <div className="relative">
                                        <button
                                            data-no-modal="true"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(openDropdownId === habit._id ? null : habit._id);
                                            }}
                                            className={cn(
                                                "w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0 z-10",
                                                isDoneToday
                                                    ? "text-gray-500 hover:text-gray-400"
                                                    : "text-gray-600 hover:text-primary"
                                            )}
                                            title="View habit details"
                                        >
                                            <ChevronDown size={16} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openDropdownId === habit._id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                                className="absolute left-0 top-full mt-2 w-72 bg-surface border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Habit Details Header */}
                                                <div className="p-4 bg-gradient-to-br from-white/5 to-transparent border-b border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                            habit.category === 'health' && "bg-green-500/20 text-green-400",
                                                            habit.category === 'mindset' && "bg-purple-500/20 text-purple-400",
                                                            habit.category === 'work' && "bg-blue-500/20 text-blue-400"
                                                        )}>
                                                            {habit.category}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-orange-500">
                                                            <Flame size={12} />
                                                            <span className="font-mono font-bold">{habit.streak} day streak</span>
                                                        </span>
                                                    </div>
                                                    <h3 className="text-white font-semibold text-base leading-tight">{habit.title}</h3>
                                                </div>

                                                {/* Description */}
                                                {habit.description && (
                                                    <div className="px-4 py-3 border-b border-white/5">
                                                        <p className="text-xs text-gray-400 leading-relaxed">{habit.description}</p>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                <div className="p-3">
                                                    <button
                                                        onClick={() => completeWithIntention(habit._id)}
                                                        disabled={isDoneToday}
                                                        className={cn(
                                                            "w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3",
                                                            isDoneToday
                                                                ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                                                                : "bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30 hover:border-primary"
                                                        )}
                                                    >
                                                        {isDoneToday ? (
                                                            <>
                                                                <Check size={16} />
                                                                <span className="font-medium">Completed for today</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check size={16} />
                                                                <span className="font-medium">I should live to carry this out</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

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
                                            {weekDays.map((date: Date, i: number) => {
                                                const completed = isCompleted(habit, date);
                                                const isToday = dailyWeekOffset === 0 && toLocalString(date) === toLocalString(new Date());

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
                                            data-no-modal="true"
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

            {/* --- Weekly Habits List --- */}
            <div className="bg-surface/20 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-black/20 gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Calendar className="text-green-500 shrink-0" size={24} />
                        <h2 className="text-xl font-bold text-white whitespace-nowrap">Weekly Non-Negotiables</h2>
                    </div>
                </div>

                {/* List Items */}
                <div className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                        {weeklyHabits.map(habit => {
                            const weekKey = getCurrentWeekKey();
                            const isDoneThisWeek = habit.completedWeeks?.includes(weekKey);
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    key={habit._id}
                                    className={cn(
                                        "group flex items-center gap-4 p-4 hover:bg-white/5 transition-all relative",
                                        isDoneThisWeek ? "bg-green-500/5" : ""
                                    )}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleWeeklyHabit(habit._id)}
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 z-10",
                                            isDoneThisWeek
                                                ? "bg-green-500 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)] scale-110"
                                                : "border-gray-600 text-transparent hover:border-green-500 hover:scale-105"
                                        )}
                                        aria-label={isDoneThisWeek ? `Mark ${habit.title} as incomplete` : `Mark ${habit.title} as complete`}
                                    >
                                        <Check size={14} strokeWidth={4} />
                                    </button>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className={cn(
                                            "font-medium truncate transition-all text-base",
                                            isDoneThisWeek ? "text-gray-400 line-through decoration-gray-600 decoration-2" : "text-gray-100 group-hover:text-white"
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
                                            <span className="text-xs font-mono font-bold">{habit.streak} wk</span>
                                        </div>

                                        {/* Delete Action */}
                                        <button
                                            onClick={() => deleteWeeklyHabit(habit._id)}
                                            className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-2"
                                            title="Delete weekly habit"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Add New Weekly Habit Input Row */}
                    <form onSubmit={addWeeklyHabit} className="group flex items-center gap-4 p-4 hover:bg-white/5 transition-all border-t border-white/5 bg-black/20">
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center shrink-0 group-hover:border-gray-500">
                            <Plus size={14} className="text-gray-700 group-hover:text-gray-500" />
                        </div>
                        <input
                            type="text"
                            value={newWeeklyHabit}
                            onChange={(e) => setNewWeeklyHabit(e.target.value)}
                            placeholder="Add a new weekly habit..."
                            className="bg-transparent border-none outline-none text-gray-400 placeholder-gray-600 w-full font-medium h-full focus:text-white"
                        />
                        <button type="submit" disabled={!newWeeklyHabit.trim()} className="text-xs font-bold uppercase tracking-wider text-green-500 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-all">
                            Add
                        </button>
                    </form>
                </div>
            </div>

            {/* --- Weekly Consistency Bar Chart --- */}
            {(() => {
                const last16Weeks = Array.from({ length: 16 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (7 * i));
                    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                    const day = t.getUTCDay() || 7;
                    t.setUTCDate(t.getUTCDate() + 4 - day);
                    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
                    const weekNum = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                    return {
                        weekKey: `${t.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`,
                        date: new Date(t)
                    };
                }).reverse();

                return (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} />
                            16-Week Consistency
                        </h3>
                        <div className="flex flex-col gap-2">
                            {last16Weeks.map(({ weekKey, date }) => {
                                const totalWeekly = weeklyHabits.length;
                                const completedCount = weeklyHabits.filter(h => h.completedWeeks?.includes(weekKey)).length;
                                const rate = totalWeekly > 0 ? completedCount / totalWeekly : 0;
                                const isComplete = rate === 1;
                                const isPartial = rate > 0 && rate < 1;

                                const isCurrentWeek = weekKey === getCurrentWeekKey();
                                return (
                                    <div
                                        key={weekKey}
                                        onClick={() => toggleAllWeeklyHabitsForWeek(weekKey)}
                                        className={cn(
                                            "flex items-center gap-3 cursor-pointer group",
                                            isCurrentWeek ? "" : "opacity-80 hover:opacity-100"
                                        )}
                                        title={isCurrentWeek ? "Click to toggle all habits for this week" : `Click to edit ${weekKey}`}
                                    >
                                        <div className={cn(
                                            "text-[10px] font-mono w-16 shrink-0",
                                            isCurrentWeek ? "text-gray-400" : "text-gray-500 group-hover:text-gray-300"
                                        )}>
                                            {weekKey.split('-')[1]}
                                        </div>
                                        <div className="flex-1 h-5 bg-black/40 rounded overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded transition-all duration-500",
                                                    isComplete ? "bg-green-500" : isPartial ? "bg-green-500/50" : "bg-gray-800"
                                                )}
                                                style={{ width: `${Math.max(rate * 100, 2)}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-500 w-20 text-right">
                                            {completedCount}/{totalWeekly}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

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
                                    const isPerfectDay = data.isPerfectDay;
                                    const isPerfectWeekCell = data.isPerfectWeek;

                                    return (
                                        <div
                                            key={dayIndex}
                                            onClick={() => !isFuture && toggleAllHabitsForDay(data.date)}
                                            title={`${data.date.toDateString()}: ${data.count} completions${isFuture ? '' : ' (click to toggle)'}`}
                                            className={cn(
                                                "w-2.5 h-2.5 rounded-[2px] transition-all duration-300",
                                                isFuture ? "bg-white/5 opacity-50 cursor-default" : "cursor-pointer hover:ring-1 hover:ring-white/40",
                                                isPerfectWeekCell
                                                    ? "bg-primary ring-2 ring-purple-400/60"
                                                    : isPerfectDay
                                                    ? "bg-primary shadow-[0_0_12px_var(--primary)]"
                                                    : intensityColors[getIntensity(data.count)]
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Habit Detail Modal */}
            {selectedHabit && (
                <HabitDetailModal
                    habit={selectedHabit}
                    open={!!selectedHabit}
                    onClose={() => setSelectedHabit(null)}
                />
            )}

            {overlay}

        </div>
    );
};
