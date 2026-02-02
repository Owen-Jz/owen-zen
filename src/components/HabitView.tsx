"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Flame, Trophy, Activity, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

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
        // Auto-seed if empty
        if (json.data.length === 0) seedDefaults();
      }
    } finally {
      setLoading(false);
    }
  };

  const seedDefaults = async () => {
      const defaults = [
          "Deep Work (90m)",
          "Code Commit",
          "Workout (Cut Phase)",
          "Read/Learn",
          "No Sugar/Junk"
      ];
      for (const title of defaults) {
          await fetch("/api/habits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, category: 'work' })
          });
      }
      fetchHabits(); // Refresh
  };

  useEffect(() => {
    fetchHabits();
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

  const toggleHabit = async (id: string) => {
    // Optimistic update
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString();

    setHabits(habits.map(h => {
        if (h._id === id) {
            const hasDone = h.completedDates.some(d => new Date(d).toISOString() === todayStr);
            const newDates = hasDone 
                ? h.completedDates.filter(d => new Date(d).toISOString() !== todayStr)
                : [...h.completedDates, todayStr];
            return { ...h, completedDates: newDates };
        }
        return h;
    }));

    await fetch(`/api/habits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle" }),
    });
    
    // Refresh to get real streak calc from backend
    fetchHabits(); 
  };

  const deleteHabit = async (id: string) => {
      if(!confirm("Delete this habit?")) return;
      setHabits(habits.filter(h => h._id !== id));
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
  };

  const isCompletedToday = (h: Habit) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const todayStr = today.toISOString();
      return h.completedDates.some(d => new Date(d).toISOString() === todayStr);
  };

  const completionRate = habits.length > 0 
    ? Math.round((habits.filter(isCompletedToday).length / habits.length) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Daily Progress</h3>
          <p className="text-3xl font-bold text-white">{completionRate}%</p>
          <div className="w-full bg-white/10 h-1.5 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl">
           <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Longest Streak</h3>
           <div className="flex items-center gap-2">
               <Flame className="text-orange-500" />
               <p className="text-3xl font-bold text-white">
                   {Math.max(0, ...habits.map(h => h.streak))} <span className="text-sm text-gray-500 font-normal">days</span>
               </p>
           </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl">
           <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Active Habits</h3>
           <div className="flex items-center gap-2">
               <Activity className="text-blue-500" />
               <p className="text-3xl font-bold text-white">{habits.length}</p>
           </div>
        </div>
      </div>

      {/* Habit List */}
      <div className="bg-surface/30 border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} /> Daily Protocols
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map(habit => {
                const done = isCompletedToday(habit);
                return (
                    <motion.div 
                        layout
                        key={habit._id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                            done 
                            ? "bg-primary/10 border-primary" 
                            : "bg-surface border-border hover:border-gray-500"
                        }`}
                        onClick={() => toggleHabit(habit._id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                done ? "bg-primary border-primary text-white" : "border-gray-500"
                            }`}>
                                {done && <Check size={14} />}
                            </div>
                            <div>
                                <h4 className={`font-medium ${done ? "text-white" : "text-gray-300"}`}>{habit.title}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Flame size={12} className={habit.streak > 0 ? "text-orange-500" : "text-gray-600"} />
                                    {habit.streak} day streak
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteHabit(habit._id); }}
                            className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </motion.div>
                );
            })}
        </div>

        {/* Add New */}
        <form onSubmit={addHabit} className="mt-6 flex gap-2">
            <input 
                type="text" 
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                placeholder="Add a new habit..."
                className="flex-1 bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none"
            />
            <button type="submit" className="btn-primary aspect-square flex items-center justify-center p-0 w-12">
                <Plus size={20} />
            </button>
        </form>
      </div>
    </div>
  );
};
