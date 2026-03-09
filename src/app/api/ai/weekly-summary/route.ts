import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Task from "@/models/Task";
import Habit from "@/models/Habit";

const MONGODB_URI = process.env.MONGODB_URI;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weekNumber, year } = body;

    if (!MONGODB_URI) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetWeek = weekNumber || getWeekNumber(now);

    const { startOfWeek, endOfWeek } = getWeekDateRange(targetWeek, targetYear);

    console.log("[Weekly Summary] Generating for week", targetWeek, "of", targetYear, "from", startOfWeek, "to", endOfWeek);

    const tasks = await Task.find({}).lean();
    const habits = await Habit.find({}).lean();

    const tasksInWeek = tasks.filter((t: any) => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= startOfWeek && createdAt <= endOfWeek;
    });

    const completedTasksInWeek = tasks.filter((t: any) => {
      if (t.status !== "completed" || !t.completedAt) return false;
      const completedAt = new Date(t.completedAt);
      return completedAt >= startOfWeek && completedAt <= endOfWeek;
    });

    const habitsCompletedInWeek = habits.map((h: any) => {
      const completedCount = h.completedDates?.filter((date: Date) => {
        const d = new Date(date);
        return d >= startOfWeek && d <= endOfWeek;
      }).length || 0;
      return {
        title: h.title,
        category: h.category,
        streak: h.streak,
        completedThisWeek: completedCount,
        totalDays: 7
      };
    });

    const totalHabitsCompleted = habitsCompletedInWeek.reduce((acc: number, h: any) => acc + h.completedThisWeek, 0);
    const maxPossibleHabitCompletions = (habits.length || 1) * 7;
    const habitCompletionRate = Math.round((totalHabitsCompleted / maxPossibleHabitCompletions) * 100);

    const categoryBreakdown: Record<string, number> = {};
    completedTasksInWeek.forEach((t: any) => {
      const cat = t.category || "uncategorized";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `You are a productivity coach. Generate a comprehensive weekly summary for Week ${targetWeek} of ${targetYear}.

## WEEK OVERVIEW
- Week: ${targetWeek} of ${targetYear}
- Dates: ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}

## TASKS
- Tasks Created This Week: ${tasksInWeek.length}
- Tasks Completed This Week: ${completedTasksInWeek.length}
- Completed Task Titles: ${completedTasksInWeek.map((t: any) => t.title).join(", ") || "None"}
- Task Categories Completed: ${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join(", ") || "None"}

## HABITS
- Total Active Habits: ${habits.length}
- Habit Completion Rate: ${habitCompletionRate}%
- Total Habit Completions This Week: ${totalHabitsCompleted}/${maxPossibleHabitCompletions}
- Habit Breakdown: ${habitsCompletedInWeek.map((h: any) => `${h.title}: ${h.completedThisWeek}/7 (streak: ${h.streak})`).join(", ")}

## YOUR TASK

Generate a detailed weekly report with these sections:

### 📊 WEEKLY SUMMARY
A paragraph summarizing the week's productivity. Mention total tasks completed, key achievements, and overall performance.

### ✅ HABITS BREAKDOWN
List each habit with:
- Habit name
- Days completed out of 7
- Current streak
- Performance indicator (🔥 for 5+, ⭐ for 3-4, 💪 for 1-2)

### 🎯 KEY ACCOMPLISHMENTS
List the top 3-5 tasks completed this week. Be specific about what was achieved.

### 💡 INSIGHTS & OBSERVATIONS
Analyze patterns:
- Which days were most productive?
- Any habits that need attention?
- Category breakdown insights?

### 🎯 INTENTIONS FOR NEXT WEEK
Suggest 3-5 specific intentions/goals for the upcoming week. Make them actionable and realistic based on the data.

### 🏆 PRODUCTIVITY SCORE
Give an overall score out of 100 based on:
- Task completion rate
- Habit consistency
- Week performance trends

Format the response with clear headings using emojis and bullet points. Be encouraging, specific, and actionable.`;

    console.log("[Weekly Summary] Calling MiniMax API...");

    const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "MiniMax-M2.1",
        messages: [
          { role: "system", content: "You are a helpful AI productivity coach." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      return NextResponse.json({
        summary: data.choices[0].message.content,
        stats: {
          weekNumber: targetWeek,
          year: targetYear,
          startOfWeek: startOfWeek.toISOString(),
          endOfWeek: endOfWeek.toISOString(),
          tasksCreated: tasksInWeek.length,
          tasksCompleted: completedTasksInWeek.length,
          habitsCompleted: totalHabitsCompleted,
          habitCompletionRate,
          categoryBreakdown
        }
      });
    } else {
      console.error("[Weekly Summary] API Error:", data);
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Weekly Summary] Error:", error.message || error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDateRange(week: number, year: number): { startOfWeek: Date; endOfWeek: Date } {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const startOfWeek = new Date(ISOweekStart);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(ISOweekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
}
