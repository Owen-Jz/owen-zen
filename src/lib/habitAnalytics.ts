"use client";

export interface Habit {
  _id: string;
  title: string;
  description?: string;
  category: string;
  streak: number;
  completedDates: string[];
  createdAt?: string;
}

export interface StreakMetrics {
  current: number;
  longest: number;
  average: number;
  total: number;
}

export interface CompletionPattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  completionRate: number;
  totalCompletions: number;
}

export interface HourlyPattern {
  hour: number; // 0-23
  completionRate: number;
  totalCompletions: number;
}

export interface FailurePattern {
  dayOfWeek: number;
  dayName: string;
  failureRate: number;
  occurrences: number;
  description: string;
}

export interface HabitComparison {
  habitId: string;
  habitTitle: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

export interface CorrelationData {
  habit1: string;
  habit2: string;
  coefficient: number;
}

export interface Prediction {
  date: string;
  expectedCompletions: number;
  confidenceLow: number;
  confidenceHigh: number;
  trend: "up" | "down" | "stable";
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  icon: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface CategoryMetrics {
  category: string;
  totalCompletions: number;
  averageStreak: number;
  completionRate: number;
  habitCount: number;
}

export interface Recommendation {
  id: string;
  type: "warning" | "tip" | "achievement" | "insight";
  title: string;
  description: string;
  action?: string;
  priority: number;
}

export interface DeviationData {
  date: string;
  expected: number;
  actual: number;
  deviation: number;
  isAnomaly: boolean;
}

// Date formatting helper
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export const toLocalString = (d: Date | string): string => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const parts = formatter.formatToParts(dateObj);
  const yr = parts.find(p => p.type === 'year')?.value;
  const mo = parts.find(p => p.type === 'month')?.value;
  const da = parts.find(p => p.type === 'day')?.value;
  return `${yr}-${mo}-${da}`;
};

const getDayName = (day: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

// Calculate streak metrics for all habits
export const calculateStreaks = (habits: Habit[]): StreakMetrics => {
  let currentStreak = 0;
  let longestStreak = 0;
  let totalCompletions = 0;
  const streakDays: number[] = [];

  habits.forEach(habit => {
    totalCompletions += habit.completedDates.length;

    // Calculate current streak
    if (habit.streak > currentStreak) {
      currentStreak = habit.streak;
    }

    // Track longest streak
    if (habit.streak > longestStreak) {
      longestStreak = habit.streak;
    }

    // Add to streak days for average calculation
    if (habit.streak > 0) {
      streakDays.push(habit.streak);
    }
  });

  const average = streakDays.length > 0
    ? Math.round(streakDays.reduce((a, b) => a + b, 0) / streakDays.length)
    : 0;

  return {
    current: currentStreak,
    longest: longestStreak,
    average,
    total: totalCompletions
  };
};

// Get completion rate for a single habit over a period
export const getHabitCompletionRate = (
  habit: Habit,
  daysBack: number
): number => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - daysBack);

  const completionsInPeriod = habit.completedDates.filter(d => {
    const date = new Date(d);
    return date >= cutoff && date <= now;
  }).length;

  const rate = Math.round((completionsInPeriod / daysBack) * 100);
  return Math.min(100, rate);
};

// Get per-habit trend data for line chart
export const getHabitTrendData = (
  habit: Habit,
  period: '7d' | '30d' | '90d' | '1y'
): { date: string; rate: number }[] => {
  const daysMap: Record<typeof period, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  const daysBack = daysMap[period];
  const data: { date: string; rate: number }[] = [];
  const now = new Date();

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = toLocalString(date);

    const completed = habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: completed ? 100 : 0
    });
  }

  return data;
};

// Get day-of-week breakdown for a single habit
export const getHabitDayOfWeekData = (
  habit: Habit,
  daysBack: number
): { dayName: string; count: number }[] => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = new Array(7).fill(0);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - daysBack);

  habit.completedDates.forEach(dateStr => {
    const date = new Date(dateStr);
    if (date >= cutoff && date <= now) {
      counts[date.getDay()]++;
    }
  });

  return dayNames.map((name, i) => ({ dayName: name, count: counts[i] }));
};

// Get streak timeline for a single habit
export const getHabitStreakTimeline = (
  habit: Habit
): { start: string; end: string; length: number }[] => {
  if (habit.completedDates.length === 0) return [];

  const sorted = [...habit.completedDates]
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  const streaks: { start: string; end: string; length: number }[] = [];
  let streakStart = sorted[0];
  let streakEnd = sorted[0];
  let streakLength = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streakEnd = curr;
      streakLength++;
    } else {
      streaks.push({
        start: toLocalString(streakStart),
        end: toLocalString(streakEnd),
        length: streakLength
      });
      streakStart = curr;
      streakEnd = curr;
      streakLength = 1;
    }
  }

  // Push final streak
  streaks.push({
    start: toLocalString(streakStart),
    end: toLocalString(streakEnd),
    length: streakLength
  });

  return streaks;
};

// Get best and worst periods for a single habit
export const getHabitBestWorstPeriods = (
  habit: Habit,
  daysBack: number
): {
  best: { start: string; end: string; rate: number };
  worst: { start: string; end: string; rate: number };
} => {
  const now = new Date();
  const data: { date: string; completed: boolean }[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = toLocalString(date);
    const completed = habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr);
    data.push({ date: dateStr, completed });
  }

  // Sliding window of 7 days for period analysis
  let best = { start: data[0].date, end: data[6].date, rate: 0 };
  let worst = { start: data[0].date, end: data[6].date, rate: 100 };

  for (let i = 0; i <= data.length - 7; i++) {
    const window = data.slice(i, i + 7);
    const completed = window.filter(d => d.completed).length;
    const rate = Math.round((completed / 7) * 100);
    const start = window[0].date;
    const end = window[window.length - 1].date;

    if (rate > best.rate) best = { start, end, rate };
    if (rate < worst.rate) worst = { start, end, rate };
  }

  return { best, worst };
};

// Get the longest streak for a single habit
export const getHabitLongestStreak = (habit: Habit): number => {
  const timeline = getHabitStreakTimeline(habit);
  if (timeline.length === 0) return 0;
  return Math.max(...timeline.map(s => s.length));
};

// Analyze completion patterns by day of week
export const analyzeCompletionPatterns = (habits: Habit[], daysBack: number = 30): CompletionPattern[] => {
  const patterns: CompletionPattern[] = [];
  const now = new Date();

  // Initialize patterns for last 7 days
  for (let day = 0; day < 7; day++) {
    patterns.push({
      dayOfWeek: day,
      dayName: getDayName(day),
      completionRate: 0,
      totalCompletions: 0
    });
  }

  // Count completions by day of week
  let totalPossible = 0;

  habits.forEach(habit => {
    habit.completedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= daysBack) {
        patterns[dayOfWeek].totalCompletions++;
      }
    });

    // Calculate possible completions in the time window
    totalPossible += habits.length * Math.min(daysBack, 30);
  });

  // Calculate rates
  patterns.forEach(pattern => {
    const maxPossible = habits.length * daysBack;
    pattern.completionRate = maxPossible > 0
      ? Math.round((pattern.totalCompletions / maxPossible) * 100)
      : 0;
  });

  return patterns;
};

// Analyze hourly patterns (if time data available)
export const analyzeHourlyPatterns = (habits: Habit[]): HourlyPattern[] => {
  const patterns: HourlyPattern[] = [];

  for (let hour = 0; hour < 24; hour++) {
    patterns.push({
      hour,
      completionRate: 0,
      totalCompletions: 0
    });
  }

  // Note: Since dates are stored without specific times,
  // we'll distribute completions across typical active hours
  // This is a simplified version - real implementation would need timestamp data

  habits.forEach(habit => {
    habit.completedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const hour = date.getHours();
      patterns[hour].totalCompletions++;
    });
  });

  const total = patterns.reduce((sum, p) => sum + p.totalCompletions, 0);

  patterns.forEach(pattern => {
    pattern.completionRate = total > 0
      ? Math.round((pattern.totalCompletions / total) * 100)
      : 0;
  });

  return patterns;
};

// Detect failure patterns
export const detectFailurePatterns = (habits: Habit[], daysBack: number = 30): FailurePattern[] => {
  const failures: FailurePattern[] = [];
  const now = new Date();

  // Initialize for all days
  for (let day = 0; day < 7; day++) {
    failures.push({
      dayOfWeek: day,
      dayName: getDayName(day),
      failureRate: 0,
      occurrences: 0,
      description: ''
    });
  }

  // Calculate failure patterns by checking which days have fewer completions
  const completionsByDay = new Array(7).fill(0);
  const daysWithData = new Array(7).fill(0);

  habits.forEach(habit => {
    habit.completedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= daysBack) {
        const dayOfWeek = date.getDay();
        completionsByDay[dayOfWeek]++;
        daysWithData[dayOfWeek]++;
      }
    });
  });

  const avgCompletions = completionsByDay.reduce((a, b) => a + b, 0) / 7;

  failures.forEach((failure, index) => {
    failure.occurrences = daysWithData[index];
    // If completions are below average, it's a potential failure pattern
    if (completionsByDay[index] < avgCompletions * 0.7) {
      failure.failureRate = Math.round((1 - completionsByDay[index] / avgCompletions) * 100);

      // Generate description
      if (index === 0 || index === 6) {
        failure.description = "Weekend pattern detected - harder to maintain habits";
      } else if (index === 2 || index === 3) {
        failure.description = "Mid-week slump - energy typically dips";
      } else {
        failure.description = "Below average performance on this day";
      }
    } else {
      failure.failureRate = 0;
    }
  });

  return failures.filter(f => f.failureRate > 0);
};

// Compare habits with each other
export const compareHabits = (habits: Habit[]): HabitComparison[] => {
  const comparisons: HabitComparison[] = [];
  const now = new Date();

  habits.forEach(habit => {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentCompletions = habit.completedDates.filter(d => new Date(d) >= thirtyDaysAgo).length;

    comparisons.push({
      habitId: habit._id,
      habitTitle: habit.title,
      completionRate: Math.round((recentCompletions / 30) * 100),
      currentStreak: habit.streak,
      longestStreak: habit.streak, // Would need historical data for true longest
      totalCompletions: habit.completedDates.length
    });
  });

  // Sort by completion rate
  return comparisons.sort((a, b) => b.completionRate - a.completionRate);
};

// Calculate correlation between habits
export const calculateCorrelations = (habits: Habit[]): CorrelationData[] => {
  const correlations: CorrelationData[] = [];

  // Create date sets for each habit
  const habitDates = new Map<string, Set<string>>();

  habits.forEach(habit => {
    const dates = new Set<string>();
    habit.completedDates.forEach(dateStr => {
      dates.add(toLocalString(new Date(dateStr)));
    });
    habitDates.set(habit._id, dates);
  });

  // Calculate pairwise correlations
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const dates1 = habitDates.get(habits[i]._id) || new Set();
      const dates2 = habitDates.get(habits[j]._id) || new Set();

      // Find intersection and union
      let intersection = 0;
      dates1.forEach(date => {
        if (dates2.has(date)) intersection++;
      });

      // Jaccard similarity as correlation proxy
      const union = dates1.size + dates2.size - intersection;
      const coefficient = union > 0 ? Math.round((intersection / union) * 100) / 100 : 0;

      correlations.push({
        habit1: habits[i].title,
        habit2: habits[j].title,
        coefficient
      });
    }
  }

  return correlations.sort((a, b) => b.coefficient - a.coefficient);
};

// Predict future performance using simple linear regression
export const predictPerformance = (habits: Habit[], daysAhead: number = 7): Prediction[] => {
  const predictions: Prediction[] = [];
  const now = new Date();

  // Get daily completions for the last 30 days
  const dailyCompletions: number[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = toLocalString(date);

    let count = 0;
    habits.forEach(habit => {
      if (habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr)) {
        count++;
      }
    });
    dailyCompletions.push(count);
  }

  // Simple linear regression
  const n = dailyCompletions.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = dailyCompletions.reduce((a, b) => a + b, 0);
  const xySum = dailyCompletions.reduce((sum, y, x) => sum + x * y, 0);
  const xxSum = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = n > 1 ? (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum) : 0;
  const intercept = (ySum - slope * xSum) / n;

  // Calculate standard error
  const residuals = dailyCompletions.map((y, x) => y - (slope * x + intercept));
  const standardError = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2)
  );

  // Generate predictions
  for (let i = 1; i <= daysAhead; i++) {
    const predDate = new Date(now);
    predDate.setDate(now.getDate() + i);

    const predicted = Math.max(0, slope * (n + i) + intercept);

    predictions.push({
      date: toLocalString(predDate),
      expectedCompletions: Math.round(predicted),
      confidenceLow: Math.max(0, Math.round(predicted - 2 * standardError)),
      confidenceHigh: Math.round(predicted + 2 * standardError),
      trend: slope > 0.1 ? "up" : slope < -0.1 ? "down" : "stable"
    });
  }

  return predictions;
};

// Generate milestones
export const generateMilestones = (habits: Habit[]): Milestone[] => {
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const maxStreak = Math.max(...habits.map(h => h.streak), 0);

  const milestones: Milestone[] = [
    {
      id: 'first_completion',
      name: 'First Step',
      description: 'Complete your first habit',
      target: 1,
      current: Math.min(1, totalCompletions),
      icon: '🎯',
      achieved: totalCompletions >= 1
    },
    {
      id: 'ten_completions',
      name: 'Getting Started',
      description: 'Complete 10 habit reps',
      target: 10,
      current: Math.min(10, totalCompletions),
      icon: '🌟',
      achieved: totalCompletions >= 10
    },
    {
      id: 'fifty_completions',
      name: 'Building Momentum',
      description: 'Complete 50 habit reps',
      target: 50,
      current: Math.min(50, totalCompletions),
      icon: '🚀',
      achieved: totalCompletions >= 50
    },
    {
      id: 'hundred_completions',
      name: 'Century Club',
      description: 'Complete 100 habit reps',
      target: 100,
      current: Math.min(100, totalCompletions),
      icon: '💯',
      achieved: totalCompletions >= 100
    },
    {
      id: 'three_day_streak',
      name: 'Consistent',
      description: 'Maintain a 3-day streak',
      target: 3,
      current: Math.min(3, maxStreak),
      icon: '🔥',
      achieved: maxStreak >= 3
    },
    {
      id: 'seven_day_streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      target: 7,
      current: Math.min(7, maxStreak),
      icon: '⚡',
      achieved: maxStreak >= 7
    },
    {
      id: 'twenty_one_day_streak',
      name: 'Habit Formed',
      description: 'Maintain a 21-day streak',
      target: 21,
      current: Math.min(21, maxStreak),
      icon: '🏆',
      achieved: maxStreak >= 21
    },
    {
      id: 'thirty_day_streak',
      name: 'Unstoppable',
      description: 'Maintain a 30-day streak',
      target: 30,
      current: Math.min(30, maxStreak),
      icon: '👑',
      achieved: maxStreak >= 30
    },
    {
      id: 'all_habits_daily',
      name: 'Perfect Day',
      description: 'Complete all habits in one day',
      target: habits.length,
      current: 0,
      icon: '✨',
      achieved: false
    },
    {
      id: 'category_master',
      name: 'Category Master',
      description: 'Master a habit category',
      target: 100,
      current: 0,
      icon: '🎖️',
      achieved: false
    }
  ];

  return milestones;
};

// Calculate category metrics
export const calculateCategoryMetrics = (habits: Habit[]): CategoryMetrics[] => {
  const categories = new Map<string, { completions: number; streaks: number; count: number }>();

  habits.forEach(habit => {
    const cat = habit.category || 'other';
    const existing = categories.get(cat) || { completions: 0, streaks: 0, count: 0 };

    categories.set(cat, {
      completions: existing.completions + habit.completedDates.length,
      streaks: existing.streaks + habit.streak,
      count: existing.count + 1
    });
  });

  const metrics: CategoryMetrics[] = [];
  const now = new Date();

  categories.forEach((data, category) => {
    // Calculate 30-day completion rate
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let recentCompletions = 0;
    habits.filter(h => (h.category || 'other') === category).forEach(habit => {
      habit.completedDates.forEach(dateStr => {
        if (new Date(dateStr) >= thirtyDaysAgo) {
          recentCompletions++;
        }
      });
    });

    const possibleCompletions = data.count * 30;

    metrics.push({
      category,
      totalCompletions: data.completions,
      averageStreak: data.count > 0 ? Math.round(data.streaks / data.count) : 0,
      completionRate: possibleCompletions > 0 ? Math.round((recentCompletions / possibleCompletions) * 100) : 0,
      habitCount: data.count
    });
  });

  return metrics.sort((a, b) => b.totalCompletions - a.totalCompletions);
};

// Generate actionable recommendations
export const generateRecommendations = (habits: Habit[]): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const now = new Date();

  // Analyze recent performance (last 7 days)
  const recentPatterns = analyzeCompletionPatterns(habits, 7);
  const failures = detectFailurePatterns(habits, 7);
  const streaks = calculateStreaks(habits);
  const categories = calculateCategoryMetrics(habits);

  // Find worst performing day
  const worstDay = recentPatterns.sort((a, b) => a.completionRate - b.completionRate)[0];

  // Check for streak warnings
  if (streaks.current > 0 && streaks.current < 3) {
    recommendations.push({
      id: 'streak_warning',
      type: 'warning',
      title: 'Protect Your Streak',
      description: `You're on a ${streaks.current}-day streak. Don't break it!`,
      action: 'Complete your habits today to maintain momentum',
      priority: 1
    });
  }

  // Check for weekend issues
  const weekendFailures = failures.filter(f => f.dayOfWeek === 0 || f.dayOfWeek === 6);
  if (weekendFailures.length > 0) {
    recommendations.push({
      id: 'weekend_strategy',
      type: 'tip',
      title: 'Weekend Challenge',
      description: 'You tend to struggle on weekends. Consider adjusting your habit expectations.',
      action: 'Try reducing habit count or setting easier goals for Sat/Sun',
      priority: 2
    });
  }

  // Check for mid-week slump
  const midWeekFailures = failures.filter(f => f.dayOfWeek === 2 || f.dayOfWeek === 3);
  if (midWeekFailures.length > 0) {
    recommendations.push({
      id: 'midweek_energy',
      type: 'tip',
      title: 'Mid-Week Energy Boost',
      description: 'Tuesday/Wednesday showing lower completion rates.',
      action: 'Schedule important tasks for peak energy days',
      priority: 3
    });
  }

  // Check for category imbalance
  if (categories.length > 1) {
    const sorted = categories.sort((a, b) => a.completionRate - b.completionRate);
    const worstCategory = sorted[0];

    recommendations.push({
      id: 'category_focus',
      type: 'insight',
      title: `${worstCategory.category.charAt(0).toUpperCase() + worstCategory.category.slice(1)} Needs Attention`,
      description: `${worstCategory.category} habits have only ${worstCategory.completionRate}% completion rate.`,
      action: `Focus on improving your ${worstCategory.category} habits`,
      priority: 4
    });
  }

  // Check for perfect performance
  const today = toLocalString(now);
  const completedToday = habits.filter(h =>
    h.completedDates.some(d => toLocalString(new Date(d)) === today)
  ).length;

  if (completedToday === habits.length && habits.length > 0) {
    recommendations.push({
      id: 'perfect_day',
      type: 'achievement',
      title: 'Perfect Day!',
      description: 'You completed all your habits today. Keep it up!',
      priority: 0
    });
  } else if (completedToday > 0) {
    recommendations.push({
      id: 'partial_day',
      type: 'insight',
      title: `${completedToday}/${habits.length} Completed Today`,
      description: `${habits.length - completedToday} habits remaining. You can do it!`,
      action: 'Complete remaining habits to finish strong',
      priority: 5
    });
  }

  // Check for inconsistent habits
  const comparisons = compareHabits(habits);
  if (comparisons.length > 1) {
    const lowest = comparisons[comparisons.length - 1];
    if (lowest.completionRate < 50) {
      recommendations.push({
        id: 'struggling_habit',
        type: 'warning',
        title: `Struggling with "${lowest.habitTitle}"`,
        description: `Only ${lowest.completionRate}% completion rate. Consider breaking it down.`,
        action: 'Make it easier or replace with a more achievable habit',
        priority: 2
      });
    }
  }

  // Positive reinforcement
  if (streaks.longest >= 21) {
    recommendations.push({
      id: 'habit_master',
      type: 'achievement',
      title: 'Habit Master',
      description: `You've maintained a ${streaks.longest}-day streak. That's impressive!`,
      priority: 0
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
};

// Calculate deviation/anomaly detection
export const calculateDeviations = (habits: Habit[], daysBack: number = 30): DeviationData[] => {
  const data: DeviationData[] = [];
  const now = new Date();

  // Get baseline (average completions per day)
  const dailyCounts: number[] = [];

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = toLocalString(date);

    let count = 0;
    habits.forEach(habit => {
      if (habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr)) {
        count++;
      }
    });
    dailyCounts.push(count);
  }

  const mean = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
  const stdDev = Math.sqrt(
    dailyCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyCounts.length
  );

  // Check each day for anomalies
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = toLocalString(date);

    const actual = dailyCounts[i];
    const deviation = actual - mean;
    const isAnomaly = Math.abs(deviation) > 2 * stdDev;

    data.push({
      date: dateStr,
      expected: Math.round(mean),
      actual,
      deviation: Math.round(deviation * 10) / 10,
      isAnomaly
    });
  }

  return data.reverse();
};

// Get trend data for line charts
export const getTrendData = (
  habits: Habit[],
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'daily',
  weeksBack: number = 12
) => {
  const data: { date: string; completions: number; rate: number }[] = [];
  const now = new Date();

  let periods: number;

  switch (period) {
    case 'daily':
      periods = weeksBack * 7;
      break;
    case 'weekly':
      periods = weeksBack;
      break;
    case 'monthly':
      periods = Math.ceil(weeksBack / 4);
      break;
    case 'quarterly':
      periods = Math.ceil(weeksBack / 12);
      break;
    default:
      periods = weeksBack * 7;
  }

  for (let i = periods - 1; i >= 0; i--) {
    const date = new Date(now);
    let label: string;

    switch (period) {
      case 'daily':
        date.setDate(now.getDate() - i);
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      case 'weekly':
        date.setDate(now.getDate() - (i * 7));
        label = `Week ${Math.ceil((now.getDate() - (i * 7)) / 7)}`;
        break;
      case 'monthly':
        date.setMonth(now.getMonth() - i);
        label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        break;
      case 'quarterly':
        const quarter = Math.ceil((now.getMonth() + 1) / 3) - i;
        label = `Q${quarter}`;
        break;
      default:
        date.setDate(now.getDate() - i);
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const dateStr = toLocalString(date);
    let completions = 0;

    habits.forEach(habit => {
      if (period === 'daily') {
        if (habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr)) {
          completions++;
        }
      } else {
        // For longer periods, count all completions in that period
        habit.completedDates.forEach(dateStr2 => {
          const d = new Date(dateStr2);
          if (period === 'weekly') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            if (d >= weekStart && d < weekEnd) completions++;
          } else if (period === 'monthly') {
            if (d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()) {
              completions++;
            }
          }
        });
      }
    });

    const maxPossible = habits.length;
    const rate = maxPossible > 0 ? Math.round((completions / maxPossible) * 100) : 0;

    data.push({
      date: label,
      completions,
      rate
    });
  }

  return data;
};

// Export data to CSV
export const exportToCSV = (habits: Habit[]): string => {
  const headers = ['Date', 'Habit', 'Category', 'Completed'];
  const rows: string[][] = [headers];

  const dates = new Set<string>();
  habits.forEach(h => {
    h.completedDates.forEach(d => dates.add(toLocalString(new Date(d))));
  });

  const sortedDates = Array.from(dates).sort();

  sortedDates.forEach(dateStr => {
    habits.forEach(habit => {
      const completed = habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr);
      rows.push([dateStr, habit.title, habit.category, completed ? 'Yes' : 'No']);
    });
  });

  return rows.map(row => row.join(',')).join('\n');
};
