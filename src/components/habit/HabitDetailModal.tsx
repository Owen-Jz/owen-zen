"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  X, Flame, Award, Zap, Calendar, TrendingUp, BarChart2,
  Activity, Target, Clock
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Habit,
  getHabitCompletionRate,
  getHabitTrendData,
  getHabitDayOfWeekData,
  getHabitStreakTimeline,
  getHabitBestWorstPeriods,
  getHabitLongestStreak,
  toLocalString
} from "@/lib/habitAnalytics";
import {
  chartColors, CustomTooltip, cardGlassClass, sectionTitleClass,
  heatmapColors, getHeatmapColor
} from "@/lib/chartConfigs";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface HabitDetailModalProps {
  habit: Habit;
  open: boolean;
  onClose: () => void;
}

const PeriodSelector = ({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const periods = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' }
  ];

  return (
    <div className="flex gap-1 bg-black/20 rounded-lg p-1">
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
            value === p.value
              ? "bg-primary text-white"
              : "text-gray-400 hover:text-white"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

const OverviewTab = ({ habit, period }: { habit: Habit; period: string }) => {
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const daysBack = daysMap[period] || 30;

  const rate = getHabitCompletionRate(habit, daysBack);
  const longestStreak = getHabitLongestStreak(habit);

  const heatmapData = useMemo(() => {
    const now = new Date();
    const weeks: { date: string; week: number; dayOfWeek: number; completed: boolean }[][] = [];
    const start = new Date(now);
    start.setDate(now.getDate() - daysBack + 1);

    const startDay = start.getDay();
    start.setDate(start.getDate() - startDay);

    let currentWeek: typeof weeks[0] = [];
    let weekIndex = 0;
    let current = new Date(start);

    while (current <= now) {
      const dateStr = toLocalString(current);
      const completed = habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr);
      currentWeek.push({
        date: dateStr,
        week: weekIndex,
        dayOfWeek: current.getDay(),
        completed
      });

      if (current.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }
      current.setDate(current.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [habit.completedDates, daysBack]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.streak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-yellow-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Longest</span>
          </div>
          <div className="text-2xl font-black text-white">{longestStreak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-purple-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.completedDates.length}</div>
          <div className="text-xs text-gray-500">all time</div>
        </div>

        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-primary" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rate</span>
          </div>
          <div className="text-2xl font-black text-white">{rate}%</div>
          <div className="text-xs text-gray-500">last {daysBack}d</div>
        </div>
      </div>

      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <Calendar size={18} className="text-blue-400" />
          Consistency Heatmap
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="flex gap-1 mb-1">
              <div className="w-8" />
              {Array.from({ length: Math.ceil(daysBack / 7) }, (_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-500">
                  W{i + 1}
                </div>
              ))}
            </div>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => (
              <div key={day} className="flex gap-1 mb-1">
                <div className="w-8 text-xs text-gray-500 flex items-center">{day}</div>
                {heatmapData.map((week, weekIdx) => {
                  const cell = week.find(d => d.dayOfWeek === dayIdx);
                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className="flex-1 h-6 rounded-sm transition-all hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: cell?.completed
                          ? getHeatmapColor(1, 1)
                          : 'rgba(255,255,255,0.05)'
                      }}
                      title={cell?.date ? `${cell.date} — ${cell.completed ? 'Completed' : 'Missed'}` : ''}
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

const ChartsTab = ({ habit, period }: { habit: Habit; period: string }) => {
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const daysBack = daysMap[period] || 30;

  const trendData = useMemo(() => getHabitTrendData(habit, period as '7d' | '30d' | '90d' | '1y'), [habit, period]);
  const dayOfWeekData = useMemo(() => getHabitDayOfWeekData(habit, daysBack), [habit, daysBack]);

  return (
    <div className="space-y-6">
      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <TrendingUp size={18} className="text-primary" />
          Completion Rate Over Time
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="habitRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
              <XAxis
                dataKey="date"
                stroke={chartColors.gray[500]}
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke={chartColors.gray[500]}
                fontSize={10}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={chartColors.primary}
                strokeWidth={2}
                fill="url(#habitRateGradient)"
                name="Completion Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <BarChart2 size={18} className="text-purple-400" />
          Completions by Day of Week
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
              <XAxis dataKey="dayName" stroke={chartColors.gray[500]} fontSize={10} />
              <YAxis stroke={chartColors.gray[500]} fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill={chartColors.primary}
                radius={[4, 4, 0, 0]}
                name="Completions"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StreaksTab = ({ habit, period }: { habit: Habit; period: string }) => {
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const daysBack = daysMap[period] || 30;

  const timeline = useMemo(() => getHabitStreakTimeline(habit), [habit]);
  const bestWorst = useMemo(() => getHabitBestWorstPeriods(habit, daysBack), [habit, daysBack]);
  const longestStreak = useMemo(() => getHabitLongestStreak(habit), [habit]);

  const avgStreak = useMemo(() => {
    if (timeline.length === 0) return 0;
    const total = timeline.reduce((sum, s) => sum + s.length, 0);
    return Math.round(total / timeline.length);
  }, [timeline]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.streak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-yellow-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Longest</span>
          </div>
          <div className="text-2xl font-black text-white">{longestStreak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Average</span>
          </div>
          <div className="text-2xl font-black text-white">{avgStreak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-purple-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.completedDates.length}</div>
          <div className="text-xs text-gray-500">all time</div>
        </div>
      </div>

      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <Clock size={18} className="text-primary" />
          Streak Timeline
        </h3>
        {timeline.length === 0 ? (
          <p className="text-gray-400 text-sm">No streaks yet</p>
        ) : (
          <div className="space-y-2">
            {timeline.map((streak, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 w-32">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (streak.length / longestStreak) * 100)}%` }}
                  />
                  <span className="text-sm font-bold text-primary">{streak.length}d</span>
                </div>
                <div className="text-xs text-gray-400">
                  {streak.start} → {streak.end}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className={cardGlassClass}>
          <h3 className={sectionTitleClass}>
            <TrendingUp size={18} className="text-green-400" />
            Best 7-Day Period
          </h3>
          <div className="text-3xl font-black text-green-400">{bestWorst.best.rate}%</div>
          <div className="text-xs text-gray-500 mt-1">{bestWorst.best.start} → {bestWorst.best.end}</div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${bestWorst.best.rate}%` }}
            />
          </div>
        </div>

        <div className={cardGlassClass}>
          <h3 className={sectionTitleClass}>
            <Activity size={18} className="text-red-400" />
            Lowest 7-Day Period
          </h3>
          <div className="text-3xl font-black text-red-400">{bestWorst.worst.rate}%</div>
          <div className="text-xs text-gray-500 mt-1">{bestWorst.worst.start} → {bestWorst.worst.end}</div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${bestWorst.worst.rate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const HabitDetailModal = ({ habit, open, onClose }: HabitDetailModalProps) => {
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'charts', label: 'Charts', icon: BarChart2 },
    { id: 'streaks', label: 'Streaks', icon: Flame }
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900 border border-white/10 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-black text-white">{habit.title}</h2>
                <p className="text-xs text-gray-400 capitalize">{habit.category}</p>
              </div>
              <div className="flex items-center gap-4">
                <PeriodSelector value={period} onChange={setPeriod} />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 px-6 py-3 border-b border-white/5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && <OverviewTab habit={habit} period={period} />}
              {activeTab === 'charts' && <ChartsTab habit={habit} period={period} />}
              {activeTab === 'streaks' && <StreaksTab habit={habit} period={period} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
