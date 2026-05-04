"use client";

import { useEffect, useState } from "react";
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
  const [mitCount, setMitCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [balance, setBalance] = useState(0);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [topCategory, setTopCategory] = useState("");
  const [topCategoryAmount, setTopCategoryAmount] = useState(0);
  const [gymSessions, setGymSessions] = useState(0);
  const [gymGoal, setGymGoal] = useState(4);
  const [gymStreak, setGymStreak] = useState(0);
  const [nextWorkout, setNextWorkout] = useState("");
  const [mealsLogged, setMealsLogged] = useState(0);
  const [mealsGoal, setMealsGoal] = useState(3);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [courses, setCourses] = useState<{ title: string; progress: number }[]>([]);
  const [latestAchievement, setLatestAchievement] = useState("");
  const [postsThisWeek, setPostsThisWeek] = useState(0);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [leadsStages, setLeadsStages] = useState<{ stage: string; count: number }[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [bucketItems, setBucketItems] = useState<string[]>([]);
  const [journalStreak, setJournalStreak] = useState(0);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          taskRes, habitRes, financeRes, gymRes, foodRes,
          courseRes, achRes, contentRes, leadRes, inboxRes,
          bucketRes, journalRes, weeklyRes,
        ] = await Promise.all([
          fetch("/api/tasks").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/habits").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/finance/stats").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/gym-sessions").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/food").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/courses").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/achievements").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/content-calendar").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/leads").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/inbox").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/bucket-list").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/journal").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/weekly-goals").then(r => r.json()).catch(() => ({ success: false })),
        ]);

        // Tasks
        if (taskRes.success) {
          const tasks = taskRes.data || [];
          setMitCount(tasks.filter((t: any) => t.isMIT && !t.completed).length);
          setOverdueCount(tasks.filter((t: any) => t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length);
          setTotalTasks(tasks.length);
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
        }

        // Gym
        if (gymRes.success) {
          const sessions = gymRes.data || [];
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const thisWeek = sessions.filter((s: any) => new Date(s.date) >= startOfWeek);
          setGymSessions(thisWeek.length);
          setGymStreak(gymRes.streak || 0);
        }

        // Food
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
        }

        // Courses
        if (courseRes.success) {
          const coursesData = courseRes.data || [];
          setCourses(coursesData.slice(0, 3).map((c: any) => ({
            title: c.title,
            progress: c.progress || 0,
          })));
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
          const days = thisWeek.map((p: any) => new Date(p.scheduledDate || p.date).getDay());
          setScheduledDays([...new Set(days)]);
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
        }

        // Inbox
        if (inboxRes.success) {
          setInboxCount(inboxRes.data?.length || 0);
        }

        // Bucket list
        if (bucketRes.success) {
          setBucketItems(bucketRes.data?.slice(0, 2).map((b: any) => b.title) || []);
        }

        // Journal
        if (journalRes.success) {
          const entries = journalRes.data || [];
          if (entries.length > 0) {
            let maxStreak = 0;
            let current = 0;
            const sorted = entries.map((e: any) => new Date(e.date)).sort((a, b) => b.getTime() - a.getTime());
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
  }, []);

  const goTo = (tab: string) => {
    router.push(`/?tab=${tab}`);
  };

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
          <TaskCard mitCount={mitCount} overdueCount={overdueCount} totalCount={totalTasks} />
        </motion.div>,
        <motion.div key="finance" {...fadeUp} transition={{ delay: 0.12 }} onClick={() => goTo("finance")}>
          <FinanceCard balance={balance} budgetUsed={budgetUsed} topCategory={topCategory} topCategoryAmount={topCategoryAmount} />
        </motion.div>,
        <motion.div key="gym" {...fadeUp} transition={{ delay: 0.16 }} onClick={() => goTo("gym")}>
          <GymCard sessionsThisWeek={gymSessions} sessionsGoal={gymGoal} streak={gymStreak} nextWorkout={nextWorkout} />
        </motion.div>,
        <motion.div key="nutrition" {...fadeUp} transition={{ delay: 0.20 }} onClick={() => goTo("food")}>
          <NutritionCard mealsLogged={mealsLogged} mealsGoal={mealsGoal} protein={protein} carbs={carbs} fat={fat} />
        </motion.div>,
        <motion.div key="growth" {...fadeUp} transition={{ delay: 0.24 }} onClick={() => goTo("courses")}>
          <GrowthCard courses={courses} latestAchievement={latestAchievement} />
        </motion.div>,
        <motion.div key="content" {...fadeUp} transition={{ delay: 0.28 }} onClick={() => goTo("calendar")}>
          <ContentCard postsThisWeek={postsThisWeek} scheduledDays={scheduledDays} />
        </motion.div>,
        <motion.div key="leads" {...fadeUp} transition={{ delay: 0.32 }} onClick={() => goTo("leads")}>
          <LeadsCard stages={leadsStages} />
        </motion.div>,
        <motion.div key="life" {...fadeUp} transition={{ delay: 0.36 }} onClick={() => goTo("inbox")}>
          <LifeCard inboxCount={inboxCount} bucketItems={bucketItems} journalStreak={journalStreak} />
        </motion.div>,
      ];

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "#F8F6F3" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-heading font-semibold text-[#1A1A1A] mb-2"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Life Command Center
          </h1>
          <p className="text-sm text-[#6B6560]">Everything at a glance</p>
        </div>

        {/* Bento Grid — col spans match spec: Today(2) Habit(3) Task(4) Finance(3) / Gym(4) Nutrition(4) Growth(4) / Content(6) Leads(3) Life(3) */}
        <BentoGrid>
          <div className="col-span-2">{cards[0]}</div>
          <div className="col-span-3">{cards[1]}</div>
          <div className="col-span-4">{cards[2]}</div>
          <div className="col-span-3">{cards[3]}</div>
          <div className="col-span-4">{cards[4]}</div>
          <div className="col-span-4">{cards[5]}</div>
          <div className="col-span-4">{cards[6]}</div>
          <div className="col-span-6">{cards[7]}</div>
          <div className="col-span-3">{cards[8]}</div>
          <div className="col-span-3">{cards[9]}</div>
        </BentoGrid>
      </div>
    </div>
  );
}