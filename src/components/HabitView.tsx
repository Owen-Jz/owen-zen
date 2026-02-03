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
      if(!confirm("Delete this habit protocol?")) return;
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
              {/* Render Weeks (Columns) */}
              {Array.from({ length: Math.ceil(heatmapGrid.length / 7) }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                          const flatIndex = weekIndex * 7 + dayIndex;
                          const data = heatmapGrid[flatIndex];
                          
                          // If no data (end of year padding) or null (start padding), render empty cell
                          if (!data) return <div key={dayIndex} className="w-3 h-3" />;
                          
                          const isFuture = data.date > new Date();
                          return (
                              <div 
                                  key={dayIndex}
                                  title={`${data.date.toDateString()}: ${data.count} completions`}
                                  className={cn(
                                      "w-3 h-3 rounded-sm transition-all duration-300",
                                      isFuture 
                                        ? "bg-transparent border border-white/10 opacity-50" 
                                        : intensityColors[getIntensity(data.count)]
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
            <div className="flex items-center gap-3">
                <button 
                    onClick={async () => {
                        if (confirm("Reset to default 2026 protocols? This will clear current habits but keep history.")) {
                            // Clear existing
                            for (const h of habits) {
                                await fetch(`/api/habits/${h._id}`, { method: "DELETE" });
                            }
                            setHabits([]);
                            // Seed new
                            await seedDefaults();
                        }
                    }}
                    className="text-xs text-gray-500 hover:text-primary underline"
                >
                    Reset Protocols
                </button>
                <div className="flex gap-1">
                    {weekDays.map((d, i) => {
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className={cn("w-8 text-center text-xs font-mono uppercase", isToday ? "text-primary font-bold" : "text-gray-500")}>
                                {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                            </div>
                        );
                    })}
                </div>
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

                    {/* History Dots (Week Days) */}
                    <div className="flex items-center gap-1">
                        {weekDays.map((date, i) => {
                            const completed = isCompleted(habit, date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                                <button
                                    key={i}
                                    onClick={() => toggleHabit(habit._id, date.toISOString())}
                                    title={date.toDateString()}
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
                                        completed 
                                            ? "bg-primary text-white border-primary" 
                                            : "bg-surface-hover text-transparent hover:bg-surface-hover/80",
                                        isToday && !completed ? "border-primary/50" : "border-transparent"
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
