"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Flame, Trophy, Activity, Trash2, Calendar, TrendingUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Habit {
  _id: string;
  title: string;
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
          { title: "Morning Devotion & Prayer", category: "mindset" }, // Faith
          { title: "Gym (Push/Pull/Legs)", category: "health" },       // Cut Phase
          { title: "Track Macros (2000kcal)", category: "health" },    // Cut Phase
          { title: "Deep Work (4h)", category: "work" },               // Coding/Agency
          { title: "Ship Code (GitHub)", category: "learning" },       // Consistency Gap
          { title: "No Porn/Junk", category: "mindset" },              // Purity/Discipline
          { title: "Outreach/Content (1h)", category: "work" }         // Agency/Growth
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
    let targetDate = new Date();
    if (dateStr) {
        targetDate = new Date(dateStr);
    }
    targetDate.setHours(0,0,0,0);
    const isoDate = targetDate.toISOString();

    // Optimistic Update
    setHabits(habits.map(h => {
        if (h._id === id) {
            const hasDone = h.completedDates.some(d => new Date(d).toISOString() === isoDate);
            const newDates = hasDone 
                ? h.completedDates.filter(d => new Date(d).toISOString() !== isoDate)
                : [...h.completedDates, isoDate];
            return { ...h, completedDates: newDates };
        }
        return h;
    }));

    await fetch(`/api/habits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", date: isoDate }),
    });
    
    fetchHabits(); // Refresh for accurate streaks
  };

  const deleteHabit = async (id: string) => {
      if(!confirm("Delete this habit protocol?")) return;
      setHabits(habits.filter(h => h._id !== id));
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
  };

  const isCompleted = (h: Habit, date: Date) => {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      return h.completedDates.some(cd => new Date(cd).toISOString() === d.toISOString());
  };

  // --- Heatmap Logic ---
  const getThisYearDays = () => {
      const days = [];
      const start = new Date(new Date().getFullYear(), 0, 1); // Jan 1
      const end = new Date(new Date().getFullYear(), 11, 31); // Dec 31
      
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          days.push(new Date(d));
      }
      return days;
  };

  const heatmapData = getThisYearDays().map(date => {
      date.setHours(0,0,0,0);
      const iso = date.toISOString();
      const count = habits.reduce((acc, h) => {
          return acc + (h.completedDates.some(d => new Date(d).toISOString() === iso) ? 1 : 0);
      }, 0);
      return { date: new Date(date), count }; // Clone date to avoid ref issues
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Calculate intensity (0-4)
  const maxCount = Math.max(...heatmapData.map(d => d.count), 1);
  const getIntensity = (count: number) => {
      if (count === 0) return 0;
      return Math.ceil((count / maxCount) * 4);
  };

  const intensityColors = [
      "bg-surface-hover", // 0
      "bg-primary/20",    // 1
      "bg-primary/40",    // 2
      "bg-primary/70",    // 3
      "bg-primary"        // 4
  ];

  // --- Last 7 Days for List ---
  const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* --- Top Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary"><Trophy size={24} /></div>
            <div>
                <div className="text-2xl font-bold">{habits.filter(h => isCompleted(h, new Date())).length} / {habits.length}</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Today's Protocol</div>
            </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500"><Flame size={24} /></div>
            <div>
                <div className="text-2xl font-bold">{Math.max(0, ...habits.map(h => h.streak))}</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Best Streak</div>
            </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Activity size={24} /></div>
            <div>
                <div className="text-2xl font-bold">{habits.reduce((acc, h) => acc + h.completedDates.length, 0)}</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Reps</div>
            </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><Zap size={24} /></div>
            <div>
                <div className="text-2xl font-bold">{habits.length > 0 ? Math.round((habits.filter(h => isCompleted(h, new Date())).length / habits.length) * 100) : 0}%</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Daily Rate</div>
            </div>
        </div>
      </div>

      {/* --- Heatmap --- */}
      <div className="bg-surface border border-border rounded-xl p-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} /> 2026 Consistency Graph
              </h3>
              <div className="flex gap-2 text-xs text-gray-500">
                  <span>Less</span>
                  <div className="flex gap-1">
                      {intensityColors.map(c => <div key={c} className={cn("w-3 h-3 rounded-sm", c)} />)}
                  </div>
                  <span>More</span>
              </div>
          </div>
          <div className="flex gap-1 min-w-max pb-2">
              {/* Labels for Months could go here if we had space logic, keeping simple for now */}
              {Array.from({ length: 53 }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                          const dayOfYearIndex = weekIndex * 7 + dayIndex;
                          // Handle edge case where year might not have perfect 53*7 days mapped
                          if (dayOfYearIndex >= heatmapData.length) return null;
                          
                          const data = heatmapData[dayOfYearIndex];
                          const isFuture = data.date > new Date();
                          
                          return (
                              <div 
                                  key={dayIndex}
                                  title={`${data.date.toDateString()}: ${data.count} completions`}
                                  className={cn(
                                      "w-3 h-3 rounded-sm transition-colors",
                                      isFuture ? "bg-surface border border-dashed border-white/5 opacity-30" : intensityColors[getIntensity(data.count)]
                                  )}
                              />
                          );
                      })}
                  </div>
              ))}
          </div>
      </div>

      {/* --- Main List --- */}
      <div className="bg-surface/50 border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Active Protocols
            </h2>
            <div className="flex gap-1">
                {last7Days.map((d, i) => (
                    <div key={i} className="w-8 text-center text-xs text-gray-500 font-mono uppercase">
                        {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                ))}
            </div>
        </div>

        <div className="space-y-2">
            {habits.map(habit => (
                <motion.div 
                    layout
                    key={habit._id}
                    className="group flex items-center justify-between p-4 bg-surface border border-border hover:border-primary/50 rounded-xl transition-all"
                >
                    <div className="flex items-center gap-4 flex-1">
                        <button 
                            onClick={() => toggleHabit(habit._id)}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95",
                                isCompleted(habit, new Date()) 
                                    ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
                                    : "border-border hover:border-gray-500 text-transparent"
                            )}
                        >
                            <Check size={20} strokeWidth={3} />
                        </button>
                        <div>
                            <div className="font-bold text-lg">{habit.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className={cn("flex items-center gap-1", habit.streak > 3 ? "text-orange-500" : "")}>
                                    <Flame size={12} /> {habit.streak} Day Streak
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* History Dots (Last 7 Days) */}
                    <div className="flex items-center gap-1">
                        {last7Days.map((date, i) => {
                            const completed = isCompleted(habit, date);
                            return (
                                <button
                                    key={i}
                                    onClick={() => toggleHabit(habit._id, date.toISOString())}
                                    title={date.toDateString()}
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                        completed 
                                            ? "bg-primary text-white" 
                                            : "bg-surface-hover text-transparent hover:bg-surface-hover/80"
                                    )}
                                >
                                    <div className={cn("w-1.5 h-1.5 rounded-full", completed ? "bg-white" : "bg-gray-700")} />
                                </button>
                            );
                        })}
                        
                        <button 
                            onClick={() => deleteHabit(habit._id)}
                            className="ml-4 p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Add Input */}
        <form onSubmit={addHabit} className="mt-6 relative">
            <input 
                type="text" 
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                placeholder="Initialize new protocol..."
                className="w-full bg-background border border-border rounded-xl px-5 py-4 pl-12 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
            />
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        </form>
      </div>
    </div>
  );
};
