// Pure client-safe — no mongoose, no DB access

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  domain: 'habits' | 'tasks' | 'gym' | 'finance' | 'leads' | 'social' | 'weekly' | 'content' | 'system';
}

export interface UserStats {
  completedTasks: number;
  totalHabitReps: number;
  currentHighestStreak: number;
  level: number;
  totalXP: number;
  gymStreak: number;
  gymSessions: number;
  financeStreak: number;
  weeklyPerfectWeeks: number;
  leadsConverted: number;
  postsPublished: number;
  routinesCompleted: number;
  contentIdeas: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Habits
  { id: "habit_first_completion",   title: "First Step",           description: "Complete your first habit",                    icon: "🎯", domain: "habits" },
  { id: "habit_ten_reps",           title: "Getting Started",      description: "Complete 10 habit repetitions",                icon: "🌟", domain: "habits" },
  { id: "habit_fifty_reps",         title: "Building Momentum",    description: "Complete 50 habit repetitions",                icon: "🚀", domain: "habits" },
  { id: "habit_hundred_reps",       title: "Century Club",         description: "Complete 100 habit repetitions",               icon: "💯", domain: "habits" },
  { id: "habit_five_hundred_reps",  title: "Legendary Consistency",description: "Complete 500 habit repetitions",               icon: "👑", domain: "habits" },
  { id: "habit_streak_3",           title: "Consistent",           description: "Maintain a 3-day habit streak",               icon: "🔥", domain: "habits" },
  { id: "habit_streak_7",           title: "Week Warrior",          description: "Maintain a 7-day habit streak",                icon: "⚡", domain: "habits" },
  { id: "habit_streak_21",         title: "Habit Formed",          description: "Maintain a 21-day habit streak",               icon: "🏆", domain: "habits" },
  { id: "habit_streak_30",         title: "Unstoppable",           description: "Maintain a 30-day habit streak",               icon: "💪", domain: "habits" },
  { id: "habit_streak_60",         title: "Iron Will",             description: "Maintain a 60-day habit streak",               icon: "🗿", domain: "habits" },
  { id: "habit_streak_100",        title: "Flawless",             description: "Maintain a 100-day habit streak",             icon: "✨", domain: "habits" },
  { id: "habit_perfect_day",        title: "Perfect Day",          description: "Complete all habits in a single day",         icon: "🌅", domain: "habits" },
  { id: "habit_perfect_week",       title: "Perfect Week",         description: "Complete all habits every day for a week",     icon: "📅", domain: "habits" },
  { id: "habit_all_health",         title: "Health Master",         description: "Complete all health-category habits",          icon: "❤️‍🔥", domain: "habits" },
  { id: "habit_all_work",           title: "Work Master",           description: "Complete all work-category habits",             icon: "⚙️", domain: "habits" },
  { id: "habit_all_mindset",        title: "Mindset Master",        description: "Complete all mindset-category habits",         icon: "🧠", domain: "habits" },

  // Tasks
  { id: "task_first",             title: "First Blood",           description: "Complete your first task",                      icon: "⚔️", domain: "tasks" },
  { id: "task_ten",               title: "Task Initiate",          description: "Complete 10 tasks",                            icon: "📝", domain: "tasks" },
  { id: "task_fifty",             title: "Task Master",            description: "Complete 50 tasks",                           icon: "📋", domain: "tasks" },
  { id: "task_hundred",           title: "Task Commander",         description: "Complete 100 tasks",                         icon: "🗂️", domain: "tasks" },
  { id: "task_five_hundred",      title: "Task Legend",            description: "Complete 500 tasks",                         icon: "🏅", domain: "tasks" },
  { id: "task_no_overdue",         title: "Deadline Keeper",        description: "Go a full week with no overdue tasks",        icon: "⏰", domain: "tasks" },

  // Gym
  { id: "gym_first_session",       title: "First Rep",             description: "Log your first gym session",                   icon: "🏋️", domain: "gym" },
  { id: "gym_streak_7",           title: "Week Strong",            description: "Maintain a 7-day gym streak",                 icon: "💪", domain: "gym" },
  { id: "gym_streak_14",          title: "Two Week Warrior",       description: "Maintain a 14-day gym streak",                icon: "🦾", domain: "gym" },
  { id: "gym_streak_30",          title: "Monthly Iron",           description: "Maintain a 30-day gym streak",                 icon: "🔱", domain: "gym" },
  { id: "gym_streak_60",          title: "Unbreakable Body",       description: "Maintain a 60-day gym streak",                icon: "🛡️", domain: "gym" },
  { id: "gym_streak_100",         title: "Gym Legend",             description: "Maintain a 100-day gym streak",                icon: "🏆", domain: "gym" },
  { id: "gym_ten_sessions",       title: "Getting Serious",         description: "Log 10 gym sessions",                        icon: "🎯", domain: "gym" },
  { id: "gym_fifty_sessions",     title: "Gym Rat",               description: "Log 50 gym sessions",                        icon: "🐀", domain: "gym" },
  { id: "gym_hundred_sessions",   title: "Gym Devotion",          description: "Log 100 gym sessions",                        icon: "🗿", domain: "gym" },

  // Finance
  { id: "finance_first_entry",    title: "Money Tracker",          description: "Log your first expense",                     icon: "💰", domain: "finance" },
  { id: "finance_streak_7",      title: "Budget Watch",           description: "7 days under budget",                        icon: "📊", domain: "finance" },
  { id: "finance_streak_30",      title: "Financial Discipline",   description: "30 days under budget",                      icon: "🧾", domain: "finance" },
  { id: "finance_first_save",     title: "Saver",                  description: "Log your first savings entry",               icon: "🐷", domain: "finance" },
  { id: "finance_no_spend_day",   title: "Minimalist Day",         description: "Go an entire day with no expenses",          icon: "🌿", domain: "finance" },

  // Weekly Goals
  { id: "weekly_first_complete",  title: "Week One",             description: "Complete all weekly goals for the first time", icon: "📆", domain: "weekly" },
  { id: "weekly_streak_4",       title: "Monthly Focus",          description: "4 consecutive perfect weeks",                 icon: "🎯", domain: "weekly" },
  { id: "weekly_streak_8",       title: "Quarterly Command",      description: "8 consecutive perfect weeks",                icon: "🏅", domain: "weekly" },
  { id: "weekly_streak_12",      title: "Yearly Momentum",        description: "12 consecutive perfect weeks",                icon: "🏆", domain: "weekly" },

  // Leads / CRM
  { id: "lead_first",            title: "Lead Scout",             description: "Add your first lead",                         icon: "🎯", domain: "leads" },
  { id: "lead_first_reply",       title: "First Response",          description: "Receive your first lead reply",               icon: "💬", domain: "leads" },
  { id: "lead_converted",        title: "First Conversion",       description: "Convert a lead to a customer",               icon: "💰", domain: "leads" },
  { id: "lead_ten",              title: "Lead Machine",            description: "Add 10 leads to your pipeline",              icon: "🔟", domain: "leads" },

  // Content / Social
  { id: "content_first_post",    title: "Publisher",              description: "Publish your first piece of content",           icon: "📢", domain: "content" },
  { id: "content_ten_posts",     title: "Content Machine",       description: "Publish 10 pieces of content",                 icon: "📝", domain: "content" },
  { id: "content_idea",          title: "Creative Spark",         description: "Save your first AI content idea",             icon: "💡", domain: "content" },

  // Routines
  { id: "routine_first",         title: "Routine Builder",      description: "Complete your first routine",                 icon: "🗓️", domain: "habits" },
  { id: "routine_streak_7",       title: "Routine Week",           description: "Complete a routine 7 days in a row",         icon: "🔁", domain: "habits" },

  // XP / Level
  { id: "xp_thousand",           title: "XP Hunter",             description: "Earn 1,000 total XP",                        icon: "⭐", domain: "system" },
  { id: "xp_five_thousand",      title: "XP Crusher",             description: "Earn 5,000 total XP",                        icon: "🌟", domain: "system" },
  { id: "xp_ten_thousand",       title: "XP Legend",              description: "Earn 10,000 total XP",                       icon: "💫", domain: "system" },
  { id: "level_5",               title: "Apprentice",             description: "Reach Level 5",                              icon: "📿", domain: "system" },
  { id: "level_10",              title: "Adept",                  description: "Reach Level 10",                             icon: "🎖️", domain: "system" },
  { id: "level_25",              title: "Expert",                description: "Reach Level 25",                             icon: "🏅", domain: "system" },
  { id: "level_50",              title: "Master",                 description: "Reach Level 50",                             icon: "👑", domain: "system" },
  { id: "level_100",             title: "Grandmaster",            description: "Reach Level 100",                            icon: "🦄", domain: "system" },
];

// ─── Condition Matcher ───────────────────────────────────────────────────────

function matches(stats: UserStats, condition: string): boolean {
  const parts = condition.match(/(\w+)(>=|<=|>|==)(\d+)/)?.slice(1);
  if (!parts) return false;
  const [, domain, op, value] = parts;
  const num = parseInt(value, 10);
  const val = (stats[domain as keyof UserStats] as number) ?? 0;
  if (op === ">=") return val >= num;
  if (op === ">")  return val > num;
  if (op === "==") return val === num;
  if (op === "<=") return val <= num;
  return false;
}

/**
 * Returns all earned achievement IDs based on current stats.
 */
export function getEarnedIdsFromStats(stats: UserStats): string[] {
  const earned: string[] = [];

  const conditions: Record<string, string> = {
    "habit_first_completion":  "totalHabitReps>=1",
    "habit_ten_reps":          "totalHabitReps>=10",
    "habit_fifty_reps":        "totalHabitReps>=50",
    "habit_hundred_reps":      "totalHabitReps>=100",
    "habit_five_hundred_reps": "totalHabitReps>=500",
    "habit_streak_3":          "currentHighestStreak>=3",
    "habit_streak_7":          "currentHighestStreak>=7",
    "habit_streak_21":         "currentHighestStreak>=21",
    "habit_streak_30":         "currentHighestStreak>=30",
    "habit_streak_60":         "currentHighestStreak>=60",
    "habit_streak_100":        "currentHighestStreak>=100",
    "task_first":             "completedTasks>=1",
    "task_ten":              "completedTasks>=10",
    "task_fifty":            "completedTasks>=50",
    "task_hundred":          "completedTasks>=100",
    "task_five_hundred":     "completedTasks>=500",
    "gym_first_session":     "gymSessions>=1",
    "gym_ten_sessions":      "gymSessions>=10",
    "gym_fifty_sessions":    "gymSessions>=50",
    "gym_hundred_sessions":   "gymSessions>=100",
    "gym_streak_7":          "gymStreak>=7",
    "gym_streak_14":         "gymStreak>=14",
    "gym_streak_30":         "gymStreak>=30",
    "gym_streak_60":         "gymStreak>=60",
    "gym_streak_100":        "gymStreak>=100",
    "weekly_first_complete":  "weeklyPerfectWeeks>=1",
    "weekly_streak_4":       "weeklyPerfectWeeks>=4",
    "weekly_streak_8":       "weeklyPerfectWeeks>=8",
    "weekly_streak_12":      "weeklyPerfectWeeks>=12",
    "xp_thousand":           "totalXP>=1000",
    "xp_five_thousand":      "totalXP>=5000",
    "xp_ten_thousand":       "totalXP>=10000",
    "level_5":               "level>=5",
    "level_10":              "level>=10",
    "level_25":              "level>=25",
    "level_50":              "level>=50",
    "level_100":             "level>=100",
  };

  for (const [id, condition] of Object.entries(conditions)) {
    if (matches(stats, condition)) earned.push(id);
  }

  return earned;
}

/**
 * Given current stats and previously earned IDs, return newly earned achievements.
 */
export function getNewAchievements(
  stats: UserStats,
  previouslyEarned: string[]
): AchievementDef[] {
  const now = getEarnedIdsFromStats(stats);
  return ACHIEVEMENTS.filter(a => now.includes(a.id) && !previouslyEarned.includes(a.id));
}
