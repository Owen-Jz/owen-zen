"use client";

import { clsx } from "clsx";

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

interface CreateNotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

/**
 * Create a notification via the Notifications API.
 * Call this from any client or server component after a notable event.
 */
export async function createNotification(options: CreateNotificationOptions): Promise<void> {
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: options.title,
        message: options.message,
        type: options.type ?? 'info',
        link: options.link ?? null,
      }),
    });
  } catch (error) {
    console.error("[NotificationService] Failed to create notification:", error);
  }
}

// ─── Habit Notifications ───────────────────────────────────────────────────

/**
 * Call after a habit is toggled. Detects:
 * - Perfect day achieved
 * - Streak milestones hit
 */
export async function notifyOnHabitCompletion(
  habitTitle: string,
  habitId: string,
  allHabitsCompletedToday: boolean,
  newStreak: number,
  totalCompletions: number
): Promise<void> {
  if (allHabitsCompletedToday) {
    await createNotification({
      title: "Perfect Day",
      message: "All daily habits completed — exceptional discipline today.",
      type: "success",
      link: "/?tab=habits",
    });
  }

  const milestones = [
    { days: 3, name: "3-Day Streak", msg: `${habitTitle} hit a 3-day streak.` },
    { days: 7, name: "Week Warrior", msg: `${habitTitle} reached a 7-day streak.` },
    { days: 21, name: "21-Day Streak", msg: `${habitTitle} hit 21 days — habit officially formed.` },
    { days: 30, name: "30-Day Streak", msg: `${habitTitle} hit 30 days — unstoppable.` },
  ];

  const streakMilestone = milestones.find(m => newStreak === m.days);
  if (streakMilestone) {
    await createNotification({
      title: streakMilestone.name,
      message: streakMilestone.msg,
      type: "success",
      link: "/?tab=habits",
    });
  }

  const completionMilestones = [
    { count: 10, name: "Getting Started", msg: "10 habit completions recorded." },
    { count: 50, name: "Building Momentum", msg: "50 habit completions recorded." },
    { count: 100, name: "Century Club", msg: "100 habit completions — incredible." },
  ];

  const completionMilestone = completionMilestones.find(m => totalCompletions === m.count);
  if (completionMilestone) {
    await createNotification({
      title: completionMilestone.name,
      message: completionMilestone.msg,
      type: "success",
      link: "/?tab=habits",
    });
  }
}

/**
 * Call when a habit streak is at risk (streak > 0 but not yet completed today).
 */
export async function notifyHabitStreakAtRisk(habitTitle: string, streak: number): Promise<void> {
  await createNotification({
    title: "Streak at Risk",
    message: `${habitTitle} has a ${streak}-day streak. Complete it today to keep it alive.`,
    type: "warning",
    link: "/?tab=habits",
  });
}

/**
 * Call when a habit streak breaks.
 */
export async function notifyHabitStreakBroken(habitTitle: string, formerStreak: number): Promise<void> {
  await createNotification({
    title: "Streak Lost",
    message: `${habitTitle} lost a ${formerStreak}-day streak. Start fresh today.`,
    type: "error",
    link: "/?tab=habits",
  });
}

// ─── Weekly Goals Notifications ──────────────────────────────────────────────

/**
 * Call when all weekly goals are completed for the week.
 */
export async function notifyWeeklyGoalsComplete(weekKey: string): Promise<void> {
  await createNotification({
    title: "Perfect Week",
    message: "All weekly goals completed this week. Week well spent.",
    type: "success",
    link: "/?tab=weekly",
  });
}

/**
 * Call when all weekly goals streak is at risk (not all complete, week ending soon).
 */
export async function notifyWeeklyStreakAtRisk(
  completedCount: number,
  totalCount: number,
  hoursRemaining: number
): Promise<void> {
  await createNotification({
    title: "Weekly Goals at Risk",
    message: `${completedCount}/${totalCount} weekly goals done. Week ends in ~${hoursRemaining}h.`,
    type: "warning",
    link: "/?tab=weekly",
  });
}

// ─── Gym Notifications ─────────────────────────────────────────────────────

/**
 * Call when a gym session is logged.
 */
export async function notifyGymSessionLogged(sessionCount: number, streak: number): Promise<void> {
  if (streak === 7 || streak === 14 || streak === 30 || streak === 60 || streak === 90) {
    await createNotification({
      title: "Gym Streak Milestone",
      message: `${streak}-day gym streak! Consistency is your superpower.`,
      type: "success",
      link: "/?tab=gym",
    });
  }
}

/**
 * Call when gym streak is at risk (streak > 0 but no session today).
 */
export async function notifyGymStreakAtRisk(streak: number): Promise<void> {
  await createNotification({
    title: "Gym Streak at Risk",
    message: `You have a ${streak}-day gym streak. Log a session today to keep it alive.`,
    type: "warning",
    link: "/?tab=gym",
  });
}

/**
 * Call when gym streak is broken.
 */
export async function notifyGymStreakBroken(formerStreak: number): Promise<void> {
  await createNotification({
    title: "Gym Streak Lost",
    message: `Your ${formerStreak}-day gym streak ended. Rebuild it starting today.`,
    type: "error",
    link: "/?tab=gym",
  });
}

// ─── Finance Notifications ──────────────────────────────────────────────────

/**
 * Call when spending spikes or budget issues are detected.
 */
export async function notifyBudgetAlert(
  category: string,
  alertType: 'warning' | 'over_budget' | 'spike',
  percentage?: number
): Promise<void> {
  const messages = {
    warning: `${category} is at ${percentage ?? 80}% of budget. Consider slowing spend.`,
    over_budget: `${category} has exceeded its budget. Review your spending.`,
    spike: `Unusual spending spike detected in ${category}. Verify this was intentional.`,
  };

  await createNotification({
    title: alertType === 'over_budget' ? "Budget Exceeded" : alertType === 'spike' ? "Spending Spike" : "Budget Warning",
    message: messages[alertType],
    type: alertType === 'over_budget' || alertType === 'spike' ? 'error' : 'warning',
    link: "/?tab=finance",
  });
}

// ─── Gamification Notifications ─────────────────────────────────────────────

/**
 * Call when user levels up. Pass previous and new level numbers.
 */
export async function notifyLevelUp(previousLevel: number, newLevel: number): Promise<void> {
  const rankNames: Record<number, string> = {
    2: "Apprentice",
    5: "Adept",
    10: "Expert",
    20: "Master",
    50: "Grandmaster",
    100: "Legend",
    200: "Demigod",
    500: "Zen Master",
  };

  const rank = rankNames[newLevel];
  await createNotification({
    title: rank ? `Rank Up: ${rank}` : "Level Up",
    message: rank
      ? `You've been promoted to ${rank}. Level ${newLevel} reached.`
      : `Level up to ${newLevel}. Keep pushing.`,
    type: "success",
    link: "/?tab=analytics",
  });
}

/**
 * Call when a badge is earned.
 */
export async function notifyBadgeEarned(badgeName: string, badgeMessage: string): Promise<void> {
  await createNotification({
    title: `Badge Earned: ${badgeName}`,
    message: badgeMessage,
    type: "success",
    link: "/?tab=analytics",
  });
}

/**
 * Call when an achievement is unlocked.
 */
export async function notifyAchievement(
  icon: string,
  title: string,
  description: string
): Promise<void> {
  await createNotification({
    title: `${icon} Achievement Unlocked`,
    message: `${title}: ${description}`,
    type: "success",
    link: "/?tab=analytics",
  });
}

// ─── Lead Notifications ─────────────────────────────────────────────────────

/**
 * Call when a lead reply is received.
 */
export async function notifyLeadReply(leadName: string, snippet: string): Promise<void> {
  await createNotification({
    title: "Lead Reply",
    message: `${leadName}: "${snippet.slice(0, 60)}${snippet.length > 60 ? '…' : ''}"`,
    type: "success",
    link: "/?tab=leads",
  });
}

/**
 * Call when a lead needs follow-up.
 */
export async function notifyLeadFollowUp(leadName: string, daysSinceContact: number): Promise<void> {
  await createNotification({
    title: "Lead Follow-up Needed",
    message: `No reply from ${leadName} in ${daysSinceContact} days. Time to follow up.`,
    type: "warning",
    link: "/?tab=leads",
  });
}

// ─── Content Calendar Notifications ────────────────────────────────────────

/**
 * Call when a post fails to publish.
 */
export async function notifyPostFailed(caption: string, network: string, error: string): Promise<void> {
  await createNotification({
    title: "Post Failed",
    message: `Your ${network} post "${caption.slice(0, 40)}…" failed: ${error.slice(0, 60)}`,
    type: "error",
    link: "/?tab=socials",
  });
}

/**
 * Call when a post is published successfully.
 */
export async function notifyPostPublished(caption: string, network: string): Promise<void> {
  await createNotification({
    title: "Post Published",
    message: `Your ${network} post "${caption.slice(0, 50)}…" is live.`,
    type: "success",
    link: "/?tab=socials",
  });
}

// ─── Task Notifications ─────────────────────────────────────────────────────

/**
 * Call when a task is overdue.
 */
export async function notifyTaskOverdue(taskTitle: string): Promise<void> {
  await createNotification({
    title: "Task Overdue",
    message: `"${taskTitle}" is past its due date. Mark it complete or reschedule.`,
    type: "error",
    link: "/?tab=projects",
  });
}

/**
 * Call when a task due date is approaching (within 24h).
 */
export async function notifyTaskDueSoon(taskTitle: string, hoursRemaining: number): Promise<void> {
  await createNotification({
    title: "Task Due Soon",
    message: `"${taskTitle}" is due in ${hoursRemaining}h. Complete or extend the deadline.`,
    type: "warning",
    link: "/?tab=projects",
  });
}

// ─── Routine Notifications ───────────────────────────────────────────────────

/**
 * Call when all items in a routine are completed.
 */
export async function notifyRoutineComplete(routineName: string): Promise<void> {
  await createNotification({
    title: "Routine Complete",
    message: `"${routineName}" fully completed. Well done.`,
    type: "success",
    link: "/?tab=routines",
  });
}

// ─── Food Tracker Notifications ─────────────────────────────────────────────

/**
 * Call when daily calorie limit is exceeded.
 */
export async function notifyCalorieLimit(consumed: number, limit: number): Promise<void> {
  await createNotification({
    title: "Calorie Limit Exceeded",
    message: `${consumed}cal consumed — over your ${limit}cal daily target.`,
    type: "warning",
    link: "/?tab=food",
  });
}
