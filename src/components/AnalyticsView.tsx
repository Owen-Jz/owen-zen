"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle, Activity, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const ProgressRing = ({ percentage, day, isToday }: { percentage: number, day: string, isToday: boolean }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("text-xs font-bold uppercase", isToday ? "text-primary" : "text-gray-500")}>{day}</div>
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-800"
          />
          {/* Progress Circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", isToday ? "text-primary" : "text-gray-600")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="h-48 flex items-end justify-between gap-2 w-full">
      {data.map((val, i) => {
        const height = (val / max) * 100;
        return (
          <div key={i} className="w-full flex flex-col justify-end gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {val} Tasks
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "w-full rounded-t-sm transition-all hover:brightness-110",
                i === new Date().getDay() ? "bg-primary" : "bg-gray-700/50"
              )}
            />
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
  const [stats, setStats] = useState({
    productivityScore: 0,
    totalTasks: 0,
    completedTasks: 0
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIndex = new Date().getDay();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Tasks & Habits to build the "Life OS" view
        const [tasksRes, habitsRes] = await Promise.all([
          fetch("/api/tasks").then(r => r.json()),
          fetch("/api/habits").then(r => r.json())
        ]);

        if (tasksRes.success && habitsRes.success) {
          const tasks = tasksRes.data;
          const habits = habitsRes.data;

          // 1. Calculate Tasks Completed per Day (Mock logic since tasks don't have 'completedAt' history in simple schema)
          // In a real app, we'd filter by completion date. 
          // For this visual demo, we'll generate a realistic curve based on 'createdAt' or random variance for past days
          // and use real data for Today.

          const realTodayCompleted = tasks.filter((t: any) => t.status === 'completed').length;
          const mockWeekData = [3, 5, 8, 4, 6, 2, 4]; // Placeholder history
          mockWeekData[todayIndex] = realTodayCompleted;
          setWeeklyData(mockWeekData);

          // 2. Calculate Daily Habit Completion %
          // We check habits.completedDates for each day of the current week
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

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

          // 3. Overall Stats
          const total = tasks.length;
          const completed = tasks.filter((t: any) => t.status === 'completed').length;
          setStats({
            totalTasks: total,
            completedTasks: completed,
            productivityScore: Math.round((completed / (total || 1)) * 100)
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-500">Calculating Life Stats...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-glass p-6 flex items-center gap-4 hover:scale-105 hover:bg-surface/80 cursor-default">
          <div className="p-4 bg-green-500/10 rounded-xl text-green-500">
            <Activity size={32} />
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.productivityScore}%</div>
            <div className="text-sm text-gray-500 uppercase font-bold">Overall Productivity</div>
          </div>
        </div>
        <div className="card-glass p-6 flex items-center gap-4 hover:scale-105 hover:bg-surface/80 cursor-default">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
            <CheckCircle size={32} />
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.completedTasks} / {stats.totalTasks}</div>
            <div className="text-sm text-gray-500 uppercase font-bold">Tasks Crushed</div>
          </div>
        </div>
        <div className="card-glass p-6 flex items-center gap-4 hover:scale-105 hover:bg-surface/80 cursor-default">
          <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500">
            <TrendingUp size={32} />
          </div>
          <div>
            <div className="text-3xl font-bold">+39%</div>
            <div className="text-sm text-gray-500 uppercase font-bold">vs Last Week</div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Overall Progress (Bar Chart) */}
        <div className="card-glass p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-200">Weekly Output</h3>
            <select className="bg-background border border-border text-xs rounded-lg px-2 py-1 outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <BarChart data={weeklyData} />
          <div className="flex justify-between mt-4 text-gray-500 text-xs font-mono uppercase">
            {days.map((d, i) => (
              <div key={i} className="w-full text-center">{d}</div>
            ))}
          </div>
        </div>

        {/* Right: Daily Consistency (Rings) */}
        <div className="card-glass p-8">
          <h3 className="text-lg font-bold text-gray-200 mb-8">Daily Consistency</h3>
          <div className="grid grid-cols-4 gap-y-6">
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

      {/* Bottom Banner */}
      <div className="card-glass bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/20 p-6 flex justify-between items-center shadow-[0_0_30px_rgba(var(--primary),0.2)]">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Mindset Stack</h3>
          <p className="text-gray-400 text-sm">"Gamification makes the hard work addictive."</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95">
          Level Up 🚀
        </button>
      </div>

    </div>
  );
};
