"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Calendar, Flame,
  Target, Zap, Award, Download, Printer, Filter,
  ChevronDown, ChevronUp, Info, AlertTriangle,
  CheckCircle, Lightbulb, RefreshCw, Star, Trophy,
  Clock, BarChart2, Activity, Users, X
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loading } from "@/components/Loading";
import {
  Habit, StreakMetrics, CompletionPattern, FailurePattern,
  HabitComparison, CorrelationData, Prediction, Milestone,
  CategoryMetrics, Recommendation, DeviationData,
  calculateStreaks, analyzeCompletionPatterns, analyzeHourlyPatterns,
  detectFailurePatterns, compareHabits, calculateCorrelations,
  predictPerformance, generateMilestones, calculateCategoryMetrics,
  generateRecommendations, calculateDeviations, getTrendData, exportToCSV
} from "@/lib/habitAnalytics";
import {
  chartColors, categoryColors, CustomTooltip, downloadCSV, printReport,
  heatmapColors, getHeatmapColor, trendColors, cardGlassClass, sectionTitleClass
} from "@/lib/chartConfigs";
import { abTesting, analyticsTests } from "@/lib/abTesting";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Period selector component
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
    { value: '1y', label: '1Y' },
    { value: 'all', label: 'All' }
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

// Overview stat card
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "primary"
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  color?: 'primary' | 'blue' | 'purple' | 'green' | 'orange';
}) => {
  const colors = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20'
  };

  const iconColors = {
    primary: 'text-primary',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend ? trendColors[trend] : 'text-gray-500';

  return (
    <div className={cn(
      "bg-gradient-to-br rounded-xl p-4 border transition-all hover:scale-[1.02]",
      colors[color]
    )}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</span>
        <div className={cn("p-2 rounded-lg bg-black/20", iconColors[color])}>
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
        {trend && (
          <TrendIcon size={16} className={trendColor} />
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
};

// Milestone badge component
const MilestoneBadge = ({ milestone }: { milestone: Milestone }) => {
  const progress = Math.min(100, (milestone.current / milestone.target) * 100);

  return (
    <div className={cn(
      "relative p-4 rounded-xl border transition-all",
      milestone.achieved
        ? "bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30"
        : "bg-white/5 border-white/5"
    )}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{milestone.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-bold text-sm",
              milestone.achieved ? "text-yellow-400" : "text-white"
            )}>
              {milestone.name}
            </h4>
            {milestone.achieved && <CheckCircle size={14} className="text-yellow-400" />}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{milestone.description}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{milestone.current}/{milestone.target}</span>
              <span className={milestone.achieved ? "text-yellow-400" : "text-gray-400"}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn(
                  "h-full rounded-full",
                  milestone.achieved ? "bg-yellow-500" : "bg-gray-600"
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendation card
const RecommendationCard = ({ rec }: { rec: Recommendation }) => {
  const icons = {
    warning: AlertTriangle,
    tip: Lightbulb,
    achievement: Trophy,
    insight: Info
  };

  const colors = {
    warning: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
    tip: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    achievement: 'text-green-500 border-green-500/30 bg-green-500/10',
    insight: 'text-purple-500 border-purple-500/30 bg-purple-500/10'
  };

  const Icon = icons[rec.type];

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      colors[rec.type]
    )}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white text-sm">{rec.title}</h4>
          <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
          {rec.action && (
            <p className="text-xs text-primary mt-2 font-medium">{rec.action}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Heatmap component
const HeatmapGrid = ({ data, maxValue }: { data: { day: number; hour: number; value: number }[]; maxValue: number }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-1 mb-2">
          <div className="w-12" />
          {hours.filter((_, i) => i % 3 === 0).map(h => (
            <div key={h} className="flex-1 text-center text-xs text-gray-500">
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="flex gap-1 mb-1">
            <div className="w-12 text-xs text-gray-500 flex items-center">{day}</div>
            {hours.map(hour => {
              const cell = data.find(d => d.day === dayIndex && d.hour === hour);
              const value = cell?.value || 0;

              return (
                <div
                  key={hour}
                  className="flex-1 h-6 rounded-sm transition-all hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: getHeatmapColor(value, maxValue) }}
                  title={`${day} ${hour}:00 - ${value} completions`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Correlation matrix
const CorrelationMatrix = ({ correlations }: { correlations: CorrelationData[] }) => {
  // Get unique habits
  const habits = new Set<string>();
  correlations.forEach(c => {
    habits.add(c.habit1);
    habits.add(c.habit2);
  });
  const habitList = Array.from(habits);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <div className="flex gap-2 mb-2">
          <div className="w-24" />
          {habitList.slice(0, 5).map(h => (
            <div key={h} className="flex-1 text-xs text-gray-500 truncate text-center" title={h}>
              {h.slice(0, 8)}
            </div>
          ))}
        </div>
        {habitList.slice(0, 5).map((h1, i) => (
          <div key={h1} className="flex gap-2 mb-2">
            <div className="w-24 text-xs text-gray-500 truncate" title={h1}>{h1.slice(0, 12)}</div>
            {habitList.slice(0, 5).map((h2, j) => {
              const corr = correlations.find(c =>
                (c.habit1 === h1 && c.habit2 === h2) ||
                (c.habit1 === h2 && c.habit2 === h1)
              );
              const value = corr?.coefficient || 0;

              return (
                <div
                  key={j}
                  className="flex-1 h-8 rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: i === j ? chartColors.gray[700] : `rgba(220, 38, 38, ${value})`,
                    color: value > 0.5 ? 'white' : 'gray-400'
                  }}
                >
                  {i === j ? '-' : value.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const HabitAnalyticsView = () => {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [period, setPeriod] = useState('30d');
  const [activeSection, setActiveSection] = useState('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Fetch habits data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/habits');
        const json = await res.json();
        if (json.success) {
          setHabits(json.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Track A/B test view
  useEffect(() => {
    if (!loading && habits.length > 0) {
      const variant = abTesting.getVariant(
        analyticsTests.chartLayout.id,
        analyticsTests.chartLayout.variants
      );
      abTesting.trackEngagement(analyticsTests.chartLayout.id, variant, 'view');
    }
  }, [loading, habits]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (habits.length === 0) return null;

    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

    return {
      streaks: calculateStreaks(habits),
      completionPatterns: analyzeCompletionPatterns(habits, daysBack),
      hourlyPatterns: analyzeHourlyPatterns(habits),
      failurePatterns: detectFailurePatterns(habits, daysBack),
      comparisons: compareHabits(habits),
      correlations: calculateCorrelations(habits),
      predictions: predictPerformance(habits, 7),
      milestones: generateMilestones(habits),
      categoryMetrics: calculateCategoryMetrics(habits),
      recommendations: generateRecommendations(habits),
      deviations: calculateDeviations(habits, daysBack),
      trendData: getTrendData(habits, period === '7d' || period === '30d' ? 'daily' : 'weekly', 12)
    };
  }, [habits, period]);

  // Today's completion rate
  const todayRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const completed = habits.filter(h =>
      h.completedDates.some(d => d.startsWith(today))
    ).length;
    return Math.round((completed / habits.length) * 100);
  }, [habits]);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const csv = exportToCSV(habits);
    downloadCSV(csv, `habit-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  }, [habits]);

  const handleExportPDF = useCallback(() => {
    printReport('Habit Analytics Report');
    setShowExportMenu(false);
  }, []);

  if (loading) return <Loading text="Loading analytics..." />;

  if (!analytics) return (
    <div className="p-8 text-center">
      <p className="text-gray-400">No habit data available. Create some habits first!</p>
    </div>
  );

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'patterns', label: 'Patterns', icon: Calendar },
    { id: 'streaks', label: 'Streaks', icon: Flame },
    { id: 'comparison', label: 'Comparison', icon: Users },
    { id: 'predictions', label: 'Predictions', icon: Target },
    { id: 'milestones', label: 'Milestones', icon: Trophy },
    { id: 'categories', label: 'Categories', icon: Activity },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration- B20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BarChart2 className="text-primary" size={28} />
            Habit Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Comprehensive insights into your habit performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-all"
            >
              <Download size={16} />
              Export
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Printer size={14} />
                    Print Report
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeSection === section.id
                ? "bg-primary text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Today"
              value={`${todayRate}%`}
              subtitle={`${habits.filter(h => h.completedDates.some(d => d.startsWith(new Date().toISOString().split('T')[0]))).length}/${habits.length} habits`}
              icon={Target}
              color="primary"
            />
            <StatCard
              title="Current Streak"
              value={analytics.streaks.current}
              subtitle="days"
              icon={Flame}
              trend={analytics.streaks.current > 7 ? 'up' : 'stable'}
              color="orange"
            />
            <StatCard
              title="Best Streak"
              value={analytics.streaks.longest}
              subtitle="days"
              icon={Award}
              color="blue"
            />
            <StatCard
              title="Total Reps"
              value={analytics.streaks.total}
              subtitle="all time"
              icon={Zap}
              color="purple"
            />
          </div>

          {/* Main Chart */}
          <div className={cardGlassClass}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={sectionTitleClass}>
                <TrendingUp size={18} className="text-primary" />
                Completion Trend
              </h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
                  <XAxis
                    dataKey="date"
                    stroke={chartColors.gray[500]}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={chartColors.gray[500]}
                    fontSize={11}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    fill="url(#colorRate)"
                    name="Completion Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day of Week Pattern */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className={cardGlassClass}>
              <h3 className={sectionTitleClass}>
                <Calendar size={18} className="text-blue-400" />
                Completion by Day
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.completionPatterns}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
                    <XAxis dataKey="dayName" stroke={chartColors.gray[500]} fontSize={10} />
                    <YAxis stroke={chartColors.gray[500]} fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="completionRate" fill={chartColors.primary} radius={[4, 4, 0, 0]} name="Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardGlassClass}>
              <h3 className={sectionTitleClass}>
                <Activity size={18} className="text-purple-400" />
                Category Breakdown
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryMetrics}
                      dataKey="totalCompletions"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {analytics.categoryMetrics.map((entry, index) => (
                        <Cell key={index} fill={categoryColors[entry.category] || chartColors.gray[500]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recommendations Preview */}
          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Lightbulb size={18} className="text-yellow-500" />
              Recommendations
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.recommendations.slice(0, 3).map(rec => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Trends Section */}
      {activeSection === 'trends' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardGlassClass}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={sectionTitleClass}>
                <TrendingUp size={18} className="text-primary" />
                Performance Over Time
              </h3>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
                  <XAxis dataKey="date" stroke={chartColors.gray[500]} fontSize={11} />
                  <YAxis stroke={chartColors.gray[500]} fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completions"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary, r: 4 }}
                    name="Completions"
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke={chartColors.secondary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.secondary, r: 4 }}
                    name="Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deviation Analysis */}
          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Activity size={18} className="text-orange-400" />
              Deviation Analysis
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Days with unusual performance (anomalies highlighted)
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.deviations.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
                  <XAxis dataKey="date" stroke={chartColors.gray[500]} fontSize={10} />
                  <YAxis stroke={chartColors.gray[500]} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="actual" fill={chartColors.primary} name="Actual" />
                  <Bar dataKey="expected" fill={chartColors.gray[600]} name="Expected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Patterns Section */}
      {activeSection === 'patterns' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className={cardGlassClass}>
              <h3 className={sectionTitleClass}>
                <Calendar size={18} className="text-blue-400" />
                Weekly Patterns
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.completionPatterns.map(p => ({
                      ...p,
                      displayName: p.dayName.slice(0, 3)
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
                    <XAxis type="number" stroke={chartColors.gray[500]} fontSize={10} />
                    <YAxis type="category" dataKey="displayName" stroke={chartColors.gray[500]} fontSize={10} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="completionRate"
                      fill={chartColors.primary}
                      radius={[0, 4, 4, 0]}
                      name="Completion Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardGlassClass}>
              <h3 className={sectionTitleClass}>
                <AlertTriangle size={18} className="text-yellow-500" />
                Failure Patterns
              </h3>
              {analytics.failurePatterns.length > 0 ? (
                <div className="space-y-3">
                  {analytics.failurePatterns.map((pattern, i) => (
                    <div key={i} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-yellow-400">{pattern.dayName}</span>
                        <span className="text-sm text-gray-400">{pattern.failureRate}% below average</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No significant failure patterns detected</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Streaks Section */}
      {activeSection === 'streaks' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className={cardGlassClass}>
              <h3 className={sectionTitleClass}>
                <Flame size={18} className="text-orange-500" />
                Current Streak
              </h3>
              <div className="text-center py-8">
                <div className="text-6xl font-black text-orange-500">{analytics.streaks.current}</div>
                <div className="text-gray-400 mt-2">days</div>
              </div>
            </div>

            <div className={cardGlassClass}>
              <h3 className={sectionTitleClass}>
                <Award size={18} className="text-yellow-500" />
                Longest Streak
              </h3>
              <div className="text-center py-8">
                <div className="text-6xl font-black text-yellow-500">{analytics.streaks.longest}</div>
                <div className="text-gray-400 mt-2">days</div>
              </div>
            </div>

            <div className={cardGlassClass}>
              <h3 className={sectionTitleClass}>
                <Activity size={18} className="text-blue-400" />
                Average Streak
              </h3>
              <div className="text-center py-8">
                <div className="text-6xl font-black text-blue-400">{analytics.streaks.average}</div>
                <div className="text-gray-400 mt-2">days</div>
              </div>
            </div>
          </div>

          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Target size={18} className="text-primary" />
              Individual Habit Streaks
            </h3>
            <div className="space-y-3">
              {analytics.comparisons
                .sort((a, b) => b.currentStreak - a.currentStreak)
                .map((comp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white font-medium truncate flex-1 mr-4">{comp.habitTitle}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame size={14} />
                        <span className="font-bold">{comp.currentStreak}</span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {comp.completionRate}% rate
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Comparison Section */}
      {activeSection === 'comparison' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Users size={18} className="text-purple-400" />
              Habit Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Habit</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Completion Rate</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Current Streak</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.comparisons.map((comp, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-medium truncate max-w-[200px]">{comp.habitTitle}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${comp.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-300">{comp.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-orange-500 font-bold">{comp.currentStreak}</td>
                      <td className="py-3 px-4 text-right text-gray-400">{comp.totalCompletions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Activity size={18} className="text-blue-400" />
              Correlation Matrix
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              How often habits are completed together (1.0 = always together)
            </p>
            {analytics.correlations.length > 0 ? (
              <CorrelationMatrix correlations={analytics.correlations} />
            ) : (
              <p className="text-gray-400">Not enough data for correlation analysis</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Predictions Section */}
      {activeSection === 'predictions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Target size={18} className="text-primary" />
              7-Day Prediction
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Based on linear regression of your completion history
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.predictions}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
                  <XAxis dataKey="date" stroke={chartColors.gray[500]} fontSize={11} />
                  <YAxis stroke={chartColors.gray[500]} fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="confidenceHigh"
                    stroke="transparent"
                    fill="url(#colorConfidence)"
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceLow"
                    stroke="transparent"
                    fill="white"
                    name="Lower Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="expectedCompletions"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary, r: 5 }}
                    name="Expected"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {analytics.predictions.slice(0, 3).map((pred, i) => (
              <div key={i} className={cardGlassClass}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{pred.date}</span>
                  {pred.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                  {pred.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
                  {pred.trend === 'stable' && <Minus size={16} className="text-gray-500" />}
                </div>
                <div className="text-3xl font-black text-white">
                  {pred.expectedCompletions}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {pred.confidenceLow} - {pred.confidenceHigh} range
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Milestones Section */}
      {activeSection === 'milestones' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.milestones.map((milestone, i) => (
              <MilestoneBadge key={i} milestone={milestone} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Categories Section */}
      {activeSection === 'categories' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Activity size={18} className="text-blue-400" />
              Category Performance
            </h3>
            <div className="space-y-4">
              {analytics.categoryMetrics.map((cat, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColors[cat.category] || chartColors.gray[500] }}
                      />
                      <span className="font-bold text-white capitalize">{cat.category}</span>
                    </div>
                    <span className="text-sm text-gray-400">{cat.habitCount} habits</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-black text-white">{cat.totalCompletions}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-white">{cat.averageStreak}</div>
                      <div className="text-xs text-gray-500">Avg Streak</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-white">{cat.completionRate}%</div>
                      <div className="text-xs text-gray-500">Rate</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.completionRate}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: categoryColors[cat.category] || chartColors.gray[500] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Insights Section */}
      {activeSection === 'insights' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardGlassClass}>
            <h3 className={sectionTitleClass}>
              <Lightbulb size={18} className="text-yellow-500" />
              Actionable Recommendations
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {analytics.recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white; color: black; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};
