"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BentoGrid } from "./BentoGrid";
import { TodayCard, TodayCardSkeleton } from "./TodayCard";
import { HabitCard, HabitCardSkeleton } from "./HabitCard";
import { TaskCard, TaskCardSkeleton } from "./TaskCard";
import { FinanceCard, FinanceCardSkeleton } from "./FinanceCard";
import { GymCard, GymCardSkeleton } from "./GymCard";
import { NutritionCard, NutritionCardSkeleton } from "./NutritionCard";
import { GrowthCard, GrowthCardSkeleton } from "./GrowthCard";
import { ContentCard, ContentCardSkeleton } from "./ContentCard";
import { LeadsCard, LeadsCardSkeleton } from "./LeadsCard";
import { LifeCard, LifeCardSkeleton } from "./LifeCard";

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function CommandCenter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data state
  const [streak, setStreak] = useState(0);
  const [habitToday, setHabitToday] = useState(0);
  const [habitWeekly, setHabitWeekly] = useState<number[]>([]);
  const [habitStreak, setHabitStreak] = useState(0);
  // Task card state
  const [topMits, setTopMits] = useState<string[]>([]);
  const [priorityBreakdown, setPriorityBreakdown] = useState({ high: 0, medium: 0, low: 0 });
  const [dueBreakdown, setDueBreakdown] = useState({ today: 0, thisWeek: 0, later: 0 });
  const [balance, setBalance] = useState(0);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [topCategory, setTopCategory] = useState("");
  const [topCategoryAmount, setTopCategoryAmount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<{ description: string; amount: number; date: string }[]>([]);
  // Gym card state
  const [gymSessions, setGymSessions] = useState(0);
  const [gymGoal, setGymGoal] = useState(4);
  const [gymStreak, setGymStreak] = useState(0);
  const [nextWorkout, setNextWorkout] = useState("");
  const [recentSessions, setRecentSessions] = useState<{ date: string; type?: string; sets?: number; reps?: number }[]>([]);
  // Nutrition card state
  const [mealsLogged, setMealsLogged] = useState(0);
  const [mealsGoal, setMealsGoal] = useState(3);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [recentMeals, setRecentMeals] = useState<{ name: string; time: string }[]>([]);
  // Growth card state
  const [courses, setCourses] = useState<{ title: string; progress: number; level?: number }[]>([]);
  const [latestAchievement, setLatestAchievement] = useState("");
  const [nextAchievement, setNextAchievement] = useState<{ title: string; xpNeeded: number } | undefined>(undefined);
  const [level, setLevel] = useState(1);
  const [currentLevel, setCurrentLevel] = useState<number | undefined>(undefined);
  const [xp, setXp] = useState(0);
  const [xpForNext, setXpForNext] = useState(100);
  // Content card state
  const [postsThisWeek, setPostsThisWeek] = useState(0);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<{ title: string; scheduledDate: string }[]>([]);
  // Leads card state
  const [leadsStages, setLeadsStages] = useState<{ stage: string; count: number }[]>([]);
  const [recentLead, setRecentLead] = useState<{ name: string; timestamp: string } | undefined>(undefined);
  // Life card state
  const [inboxCount, setInboxCount] = useState(0);
  const [bucketItems, setBucketItems] = useState<string[]>([]);
  const [journalStreak, setJournalStreak] = useState(0);
  const [nextBucketItem, setNextBucketItem] = useState<string | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchAll() {
      try {
        const [
          taskRes, habitRes, financeRes, gymRes, foodRes,
          courseRes, contentRes, leadRes, inboxRes,
          bucketRes, journalRes,
        ] = await Promise.all([
          fetch("/api/tasks", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/habits", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/finance/stats", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/gym-sessions", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/food", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/courses", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/content-calendar", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/leads", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/inbox", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/bucket-list", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/journal", { signal: controller.signal }).then(r => r.json()).catch(() => ({ success: false })),
        ]);

        // Tasks
        if (taskRes.success) {
          const tasks = taskRes.data || [];
          const mits = tasks.filter((t: any) => t.isMIT && !t.completed);
          setTopMits(mits.slice(0, 3).map((t: any) => t.title));
          setPriorityBreakdown({
            high: tasks.filter((t: any) => t.priority === "high").length,
            medium: tasks.filter((t: any) => t.priority === "medium").length,
            low: tasks.filter((t: any) => t.priority === "low" || !t.priority).length,
          });
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekEnd = new Date(todayStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          setDueBreakdown({
            today: tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < todayStart).length,
            thisWeek: tasks.filter((t: any) => {
              if (!t.dueDate) return false;
              const d = new Date(t.dueDate);
              return d >= todayStart && d < weekEnd;
            }).length,
            later: tasks.filter((t: any) => {
              if (!t.dueDate) return false;
              return new Date(t.dueDate) >= weekEnd;
            }).length,
          });
          setStreak(mits.length);
        }

        // Habits
        if (habitRes.success) {
          const habits = habitRes.data || [];
          const todayStr = new Date().toISOString().split("T")[0];
          const completedToday = habits.filter((h: any) =>
            h.completedDates?.includes(todayStr)
          ).length;
          setHabitToday((completedToday / Math.max(habits.length, 1)) * 100);
          const maxStreak = habits.reduce((max: number, h: any) => Math.max(max, h.streak || 0), 0);
          setHabitStreak(maxStreak);
          setStreak(maxStreak);
          const week = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().split("T")[0];
            week.push(habits.filter((h: any) => h.completedDates?.includes(dayStr)).length);
          }
          setHabitWeekly(week);
        }

        // Finance
        if (financeRes.success) {
          const s = financeRes.summary || {};
          setBalance(s.balance || 0);
          const budget = s.budget || 0;
          const expenses = s.totalExpenses || 0;
          setBudgetUsed(budget > 0 ? (expenses / budget) * 100 : 0);
          const top = financeRes.categoryBreakdown?.[0];
          if (top) {
            setTopCategory(top.name);
            setTopCategoryAmount(top.amount);
          }
          // Recent transactions from the transactions endpoint
          if (financeRes.transactions) {
            setRecentTransactions(
              financeRes.transactions.slice(0, 4).map((t: any) => ({
                description: t.description || t.category || "Transaction",
                amount: t.amount || 0,
                date: t.date || t.createdAt || new Date().toISOString(),
              }))
            );
          }
        }

        // Gym
        if (gymRes.success) {
          const sessions = gymRes.data || [];
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const thisWeek = sessions.filter((s: any) => new Date(s.date) >= startOfWeek);
          setGymSessions(thisWeek.length);
          // Recent sessions
          const sortedSessions = [...sessions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRecentSessions(sortedSessions.slice(0, 3).map((s: any) => ({
            date: s.date,
            type: s.type || s.workoutType,
            sets: s.sets,
            reps: s.reps,
          })));
          // Compute gym streak
          let gymStreakCalc = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          for (let i = 0; i < sortedSessions.length; i++) {
            const sessionDate = new Date(sortedSessions[i].date);
            sessionDate.setHours(0, 0, 0, 0);
            const diff = (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === i) gymStreakCalc++;
            else break;
          }
          setGymStreak(gymStreakCalc);
          // Next workout
          const upcoming = sessions.filter((s: any) => new Date(s.date) > now).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          if (upcoming.length > 0) {
            const nextDate = new Date(upcoming[0].date);
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            setNextWorkout(`${days[nextDate.getDay()]} ${nextDate.getMonth() + 1}/${nextDate.getDate()}`);
          }
        }

        // Food / Nutrition
        if (foodRes.success) {
          const entries = foodRes.data || [];
          const todayStr = new Date().toISOString().split("T")[0];
          const todayEntries = entries.filter((e: any) => e.date?.startsWith(todayStr));
          setMealsLogged(todayEntries.length);
          let p = 0, c = 0, f = 0;
          todayEntries.forEach((e: any) => {
            p += e.protein || 0;
            c += e.carbs || 0;
            f += e.fat || 0;
          });
          setProtein(Math.round(p));
          setCarbs(Math.round(c));
          setFat(Math.round(f));
          // Recent meals
          const sortedEntries = [...entries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRecentMeals(sortedEntries.slice(0, 3).map((e: any) => {
            const d = new Date(e.date || e.createdAt);
            const hours = d.getHours();
            const ampm = hours >= 12 ? "pm" : "am";
            const displayHour = hours % 12 || 12;
            return {
              name: e.name || e.description || "Meal",
              time: `${displayHour}${ampm}`,
            };
          }));
        }

        // Courses
        if (courseRes.success) {
          const coursesData = courseRes.data || [];
          setCourses(coursesData.slice(0, 3).map((c: any) => ({
            title: c.title,
            progress: c.progress || 0,
            level: c.level,
          })));
          if (coursesData.length > 0) {
            setLevel(coursesData[0].level || 1);
            setCurrentLevel(coursesData[0].currentLevel);
            setXp(coursesData[0].xp || 0);
            setXpForNext(coursesData[0].xpForNext || 100);
          }
          if (coursesData.length > 0 && coursesData[0].nextAchievement) {
            setNextAchievement(coursesData[0].nextAchievement);
          }
        }

        // Content Calendar
        if (contentRes.success) {
          const posts = contentRes.data || [];
          const now = new Date();
          const endOfWeek = new Date(now);
          endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
          const thisWeek = posts.filter((p: any) => {
            const d = new Date(p.scheduledDate || p.date);
            return d >= now && d <= endOfWeek;
          });
          setPostsThisWeek(thisWeek.length);
          const days: number[] = thisWeek.map((p: any) => new Date(p.scheduledDate || p.date).getDay());
          setScheduledDays([...new Set(days)]);
          // Scheduled posts for ContentCard
          const sortedPosts = [...posts].sort((a: any, b: any) =>
            new Date(a.scheduledDate || a.date).getTime() - new Date(b.scheduledDate || b.date).getTime()
          );
          setScheduledPosts(sortedPosts.slice(0, 5).map((p: any) => ({
            title: p.title || p.content || "Untitled",
            scheduledDate: p.scheduledDate || p.date,
          })));
        }

        // Leads
        if (leadRes.success) {
          const leads = leadRes.data || [];
          const stages: Record<string, number> = { open: 0, qualified: 0, closed: 0 };
          leads.forEach((l: any) => {
            const stage = (l.stage || "open").toLowerCase();
            if (stages[stage] !== undefined) stages[stage]++;
            else stages.open++;
          });
          setLeadsStages(Object.entries(stages).map(([stage, count]) => ({ stage, count })));
          // Most recent lead
          const sortedLeads = [...leads].sort((a: any, b: any) =>
            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          );
          if (sortedLeads.length > 0) {
            setRecentLead({
              name: sortedLeads[0].name || sortedLeads[0].company || "New Lead",
              timestamp: sortedLeads[0].createdAt || sortedLeads[0].date || new Date().toISOString(),
            });
          }
        }

        // Inbox
        if (inboxRes.success) {
          setInboxCount(inboxRes.data?.length || 0);
        }

        // Bucket list
        if (bucketRes.success) {
          const items = bucketRes.data || [];
          setBucketItems(items.slice(0, 2).map((b: any) => b.title || b.text || ""));
          if (items.length > 2) {
            setNextBucketItem(items[2].title || items[2].text || "");
          }
        }

        // Journal
        if (journalRes.success) {
          const entries = journalRes.data || [];
          if (entries.length > 0) {
            let maxStreak = 0;
            let current = 0;
            const sorted = entries.map((e: any) => new Date(e.date)).sort((a: Date, b: Date) => b.getTime() - a.getTime());
            for (let i = 0; i < sorted.length; i++) {
              if (i === 0) { current = 1; }
              else {
                const prev = new Date(sorted[i - 1]);
                const d = new Date(sorted[i]);
                const diff = (prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
                current = diff === 1 ? current + 1 : 1;
              }
              maxStreak = Math.max(maxStreak, current);
            }
            setJournalStreak(maxStreak);
          }
        }
      } catch (e) {
        console.error("Command center fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
    return () => controller.abort();
  }, []);

  const goTo = useCallback((tab: string) => {
    router.push(`/?tab=${tab}`);
  }, [router]);

  const cards = loading
    ? [
        <TodayCardSkeleton key="today" />,
        <HabitCardSkeleton key="habit" />,
        <TaskCardSkeleton key="task" />,
        <FinanceCardSkeleton key="finance" />,
        <GymCardSkeleton key="gym" />,
        <NutritionCardSkeleton key="nutrition" />,
        <GrowthCardSkeleton key="growth" />,
        <ContentCardSkeleton key="content" />,
        <LeadsCardSkeleton key="leads" />,
        <LifeCardSkeleton key="life" />,
      ]
    : [
        <motion.div key="today" {...fadeUp} transition={{ delay: 0 }} onClick={() => goTo("habits")}>
          <TodayCard streak={streak} />
        </motion.div>,
        <motion.div key="habit" {...fadeUp} transition={{ delay: 0.04 }} onClick={() => goTo("habits")}>
          <HabitCard todayPercent={habitToday} weeklyData={habitWeekly} streak={habitStreak} />
        </motion.div>,
        <motion.div key="task" {...fadeUp} transition={{ delay: 0.08 }} onClick={() => goTo("tasks")}>
          <TaskCard
            topMits={topMits}
            priorityBreakdown={priorityBreakdown}
            dueBreakdown={dueBreakdown}
          />
        </motion.div>,
        <motion.div key="finance" {...fadeUp} transition={{ delay: 0.12 }} onClick={() => goTo("finance")}>
          <FinanceCard
            balance={balance}
            budgetUsed={budgetUsed}
            topCategory={topCategory}
            topCategoryAmount={topCategoryAmount}
            recentTransactions={recentTransactions}
          />
        </motion.div>,
        <motion.div key="gym" {...fadeUp} transition={{ delay: 0.16 }} onClick={() => goTo("gym")}>
          <GymCard
            sessionsThisWeek={gymSessions}
            sessionsGoal={gymGoal}
            streak={gymStreak}
            nextWorkout={nextWorkout}
            recentSessions={recentSessions}
          />
        </motion.div>,
        <motion.div key="nutrition" {...fadeUp} transition={{ delay: 0.20 }} onClick={() => goTo("food")}>
          <NutritionCard
            mealsLogged={mealsLogged}
            mealsGoal={mealsGoal}
            protein={protein}
            carbs={carbs}
            fat={fat}
            recentMeals={recentMeals}
          />
        </motion.div>,
        <motion.div key="growth" {...fadeUp} transition={{ delay: 0.24 }} onClick={() => goTo("courses")}>
          <GrowthCard
            courses={courses}
            latestAchievement={latestAchievement}
            nextAchievement={nextAchievement}
            level={level}
            currentLevel={currentLevel}
            xp={xp}
            xpForNext={xpForNext}
          />
        </motion.div>,
        <motion.div key="content" {...fadeUp} transition={{ delay: 0.28 }} onClick={() => goTo("calendar")}>
          <ContentCard postsThisWeek={postsThisWeek} scheduledDays={scheduledDays} scheduledPosts={scheduledPosts} />
        </motion.div>,
        <motion.div key="leads" {...fadeUp} transition={{ delay: 0.32 }} onClick={() => goTo("leads")}>
          <LeadsCard stages={leadsStages} recentLead={recentLead} />
        </motion.div>,
        <motion.div key="life" {...fadeUp} transition={{ delay: 0.36 }} onClick={() => goTo("inbox")}>
          <LifeCard inboxCount={inboxCount} bucketItems={bucketItems} journalStreak={journalStreak} nextBucketItem={nextBucketItem} />
        </motion.div>,
      ];

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "var(--cc-bg)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-semibold mb-2"
            style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}
          >
            Life Command Center
          </h1>
          <p className="text-sm" style={{ color: "var(--cc-text-secondary)" }}>Everything at a glance</p>
        </div>

        {/* Bento Grid — 4-row layout */}
        {/* Row 1: Today(3) + Habits(5) + Tasks(4) = 12 */}
        {/* Row 2: Finance(4) + Gym(4) + Nutrition(4) = 12 */}
        {/* Row 3: Growth(6) + Content(6) = 12 */}
        {/* Row 4: Leads(4) + Life(8) = 12 */}
        <BentoGrid>
          <div className="col-span-3">{cards[0]}</div>
          <div className="col-span-5">{cards[1]}</div>
          <div className="col-span-4">{cards[2]}</div>
          <div className="col-span-4">{cards[3]}</div>
          <div className="col-span-4">{cards[4]}</div>
          <div className="col-span-4">{cards[5]}</div>
          <div className="col-span-6">{cards[6]}</div>
          <div className="col-span-6">{cards[7]}</div>
          <div className="col-span-4">{cards[8]}</div>
          <div className="col-span-8">{cards[9]}</div>
        </BentoGrid>
      </div>
    </div>
  );
}