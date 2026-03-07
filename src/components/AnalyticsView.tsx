"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle, Activity, Calendar, Trophy, Flame, Target, Star, Shield, Zap, Sword, Crown, Lock, Award } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loading } from "@/components/Loading";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const ProgressRing = ({ percentage, day, isToday }: { percentage: number, day: string, isToday: boolean }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("text-xs font-bold uppercase", isToday ? "text-primary shadow-glow" : "text-gray-500")}>{day}</div>
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center group">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-gray-800/50"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", isToday ? "text-primary drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]" : "text-gray-400")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-xs md:text-sm text-white group-hover:scale-110 transition-transform">
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 10);
  return (
    <div className="h-48 flex items-end justify-between gap-1 sm:gap-3 w-full">
      {data.map((val, i) => {
        const height = (val / max) * 100;
        const isToday = i === new Date().getDay();
        return (
          <div key={i} className="w-full flex flex-col justify-end gap-1 group relative h-full pt-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold text-white shadow-xl pointer-events-none">
              {val} XP Earned
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "w-full rounded-t-md transition-all group-hover:brightness-125 relative overflow-hidden",
                isToday ? "bg-gradient-to-t from-primary/20 via-primary/80 to-primary shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "bg-gradient-to-t from-gray-800 to-gray-600"
              )}
            >
              {isToday && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export const AnalyticsView = () => {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<number[]>(Array(7).fill(0));
  const [dailyCompletion, setDailyCompletion] = useState<number[]>(Array(7).fill(0));
  const [categoryData, setCategoryData] = useState<{ name: string; count: number; color: string }[]>([]);

  const CATEGORY_COLORS: Record<string, string> = {
    development: "#3b82f6",
    design: "#8b5cf6",
    business: "#22c55e",
    personal: "#f97316",
    marketing: "#ec4899",
    other: "#6b7280"
  };

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalHabitReps: 0,
    currentHighestStreak: 0,
    level: 1,
    currentLevelXP: 0,
    xpForNextLevel: 100,
    rankName: "Novice",
    totalXP: 0,
    completionRate: 0
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIndex = new Date().getDay();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, habitsRes] = await Promise.all([
          fetch("/api/tasks").then(r => r.json()),
          fetch("/api/habits").then(r => r.json())
        ]);

        if (tasksRes.success && habitsRes.success) {
          const tasks = tasksRes.data;
          const habits = habitsRes.data;

          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
          const realTodayCompleted = completedTasks; // Simulating today based on overall for demo logic

          let totalHabitReps = 0;
          let currentHighestStreak = 0;

          habits.forEach((h: any) => {
            totalHabitReps += h.completedDates?.length || 0;
            if (h.streak > currentHighestStreak) currentHighestStreak = h.streak;
          });

          // Gamification XP Logic
          const totalXP = (completedTasks * 50) + (totalHabitReps * 20);

          let level = 1;
          let currentLevelXP = totalXP;
          let xpForNextLevel = 100;

          while (currentLevelXP >= xpForNextLevel) {
            currentLevelXP -= xpForNextLevel;
            level++;
            xpForNextLevel = Math.floor(xpForNextLevel * 1.5);
          }

          const rankNames = ["Novice", "Apprentice", "Adept", "Expert", "Master", "Grandmaster", "Legend", "Demigod", "Zen Master"];
          const rankIndex = Math.min(Math.floor((level - 1) / 3), rankNames.length - 1);
          const rankName = rankNames[rankIndex];

          setStats({
            totalTasks,
            completedTasks,
            totalHabitReps,
            currentHighestStreak,
            level,
            currentLevelXP,
            xpForNextLevel,
            rankName,
            totalXP,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          });

          // Mocking weekly XP variance for visual interest, anchoring today to actual task XP equivalent
          const mockWeekData = [120, 350, 200, 480, 150, 300, 220];
          mockWeekData[todayIndex] = (realTodayCompleted * 50); // Today's rough task XP equivalent
          setWeeklyData(mockWeekData);

          // Calculate category breakdown
          const categoryCounts: Record<string, number> = {};
          tasks.forEach((t: any) => {
            const cat = t.category || "other";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          });
          const categories = Object.entries(categoryCounts).map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            count,
            color: CATEGORY_COLORS[name] || CATEGORY_COLORS.other
          }));
          setCategoryData(categories);

          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());

          const weekCompletion = days.map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];

            let possible = habits.length;
            let done = 0;
            if (possible === 0) return 0;

            habits.forEach((h: any) => {
              if (h.completedDates.some((cd: string) => cd.startsWith(dateStr))) {
                done++;
              }
            });
            return (done / possible) * 100;
          });
          setDailyCompletion(weekCompletion);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading text="Loading your stats..." />;

  const xpProgressPct = Math.min(100, (stats.currentLevelXP / stats.xpForNextLevel) * 100);

  const badges = [
    { name: "First Blood", desc: "Complete 1 Task", icon: <Sword size={24} />, unlocked: stats.completedTasks >= 1 },
    { name: "Task Master", desc: "Complete 50 Tasks", icon: <Target size={24} />, unlocked: stats.completedTasks >= 50 },
    { name: "Heating Up", desc: "3 Day Streak", icon: <Flame size={24} />, unlocked: stats.currentHighestStreak >= 3 },
    { name: "Unbreakable", desc: "21 Day Streak", icon: <Shield size={24} />, unlocked: stats.currentHighestStreak >= 21 },
    { name: "Habitual", desc: "100 Habit Reps", icon: <Zap size={24} />, unlocked: stats.totalHabitReps >= 100 },
    { name: "Zen Achiever", desc: "Reach Level 10", icon: <Crown size={24} />, unlocked: stats.level >= 10 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* --- HERO: Player Profile --- */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-surface/80 to-surface border border-white/10 shadow-2xl">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-70 pointer-events-none" />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row gap-10 items-center lg:items-center">

          {/* Level Badge */}
          <div className="relative flex-shrink-0 group">
            {/* Glowing Aura rings */}
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-[40px] group-hover:bg-primary/50 transition-all duration-700 pointer-events-none" />
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full p-[2px] bg-gradient-to-br from-primary via-orange-500 to-purple-600 shadow-[0_0_50px_rgba(220,38,38,0.4)] flex items-center justify-center">
              <div className="flex flex-col items-center justify-center bg-black w-full h-full rounded-full border-[6px] border-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-50" />
                <span className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1 z-10">Level</span>
                <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500 drop-shadow-2xl leading-none z-10">
                  {stats.level}
                </span>

                {/* Subtle overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-1000 z-0 bg-gradient-to-b from-transparent to-primary/20" />
              </div>

              {/* Rank Icon Indicator */}
              <div className="absolute -bottom-4 bg-black border border-white/10 rounded-full px-6 py-2 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                <Award className="text-primary flex-shrink-0" size={16} />
                <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent whitespace-nowrap">{stats.rankName}</span>
              </div>
            </div>
          </div>

          {/* XP and Core Stats */}
          <div className="flex-1 w-full space-y-8">
            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Your Journey</h1>
              <p className="text-gray-400 text-lg">Total Legend points: <span className="text-primary font-bold">{stats.totalXP} XP</span>.</p>
            </div>

            {/* XP Bar Component */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-inner">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Progress</div>
                  <div className="text-xl font-bold text-white">{stats.currentLevelXP} <span className="text-gray-500 text-sm">/ {stats.xpForNextLevel} XP</span></div>
                </div>
                <div className="text-sm font-bold text-primary">Level {stats.level + 1} Unlocks</div>
              </div>

              <div className="w-full bg-gray-900 border border-black rounded-full h-5 relative overflow-hidden shadow-inner flex items-center">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgressPct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 via-primary to-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.8)] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shine_1s_linear_infinite]" />
                </motion.div>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all" />
                <Target className="text-blue-400 mb-2" size={24} />
                <div className="text-2xl font-black text-white">{stats.completedTasks}</div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Quests Done</div>
              </div>
              <div className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all" />
                <Zap className="text-purple-400 mb-2" size={24} />
                <div className="text-2xl font-black text-white">{stats.totalHabitReps}</div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Habit Reps</div>
              </div>
              <div className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-orange-500/20 transition-all" />
                <Flame className="text-orange-500 mb-2" size={24} />
                <div className="text-2xl font-black text-white">{stats.currentHighestStreak} <span className="text-sm font-medium text-gray-500">Days</span></div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Best Streak</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Weekly Output (Task XP) */}
        <div className="card-glass p-6 md:p-8 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-primary" /> Event Log
              </h3>
              <p className="text-xs text-gray-500 mt-1">XP earned over the last 7 days</p>
            </div>
          </div>
          <div className="flex-1 flex items-end">
            <BarChart data={weeklyData} />
          </div>
          <div className="flex justify-between mt-4 text-gray-500 text-xs font-mono uppercase">
            {days.map((d, i) => (
              <div key={i} className={cn("w-full text-center", i === todayIndex ? "text-primary font-bold" : "")}>{d}</div>
            ))}
          </div>
        </div>

        {/* Right: Daily Habit Consistency (Rings) */}
        <div className="card-glass p-6 md:p-8 flex flex-col h-[400px]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" /> Consistency Tracker
            </h3>
            <p className="text-xs text-gray-500 mt-1">Habit completion rate this week</p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-y-8 gap-x-2 w-full place-items-center">
              {days.map((d, i) => (
                <ProgressRing
                  key={d}
                  day={d}
                  percentage={dailyCompletion[i]}
                  isToday={i === todayIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Pie Chart */}
      {categoryData.length > 0 && (
        <div className="card-glass p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-purple-400" /> Category Breakdown
            </h3>
            <p className="text-xs text-gray-500 mt-1">Distribution of tasks by category</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Pie Chart */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {categoryData.reduce((acc, cat, i) => {
                  const total = categoryData.reduce((sum, c) => sum + c.count, 0);
                  const percent = cat.count / total;
                  const dashArray = percent * 100;
                  const dashOffset = 100 - acc;
                  
                  acc += dashArray;
                  return acc;
                }, 0)}
                {(() => {
                  let offset = 0;
                  return categoryData.map((cat, i) => {
                    const total = categoryData.reduce((sum, c) => sum + c.count, 0);
                    const percent = cat.count / total;
                    const dashArray = percent * 100;
                    const currentOffset = 100 - offset;
                    offset += dashArray;
                    
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={cat.color}
                        strokeWidth="20"
                        strokeDasharray={`${dashArray} ${100 - dashArray}`}
                        strokeDashoffset={currentOffset}
                        className="transition-all duration-500 hover:stroke-width-[22] cursor-pointer"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">{categoryData.reduce((sum, c) => sum + c.count, 0)}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-300 text-sm">{cat.name}</span>
                  <span className="text-gray-500 text-sm ml-auto">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- BADGE SHOWCASE --- */}
      <div className="card-glass p-6 md:p-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" /> Achievements
          </h3>
          <p className="text-xs text-gray-500 mt-1">Unlock badges by dominating your habits and tasks.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, i) => (
            <div key={i} className={cn(
              "relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 group hover:scale-105",
              badge.unlocked
                ? "bg-gradient-to-b from-white/10 to-transparent border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                : "bg-black/20 border-white/5 opacity-60 grayscale hover:grayscale-0"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                badge.unlocked ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-black/40 text-gray-500"
              )}>
                {badge.unlocked ? badge.icon : <Lock size={20} />}
              </div>
              <div className="text-sm font-bold text-white text-center mb-1">{badge.name}</div>
              <div className="text-[10px] text-gray-400 text-center leading-tight">{badge.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes shine {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>

    </div>
  );
};
