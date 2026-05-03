import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WeeklyReview from '@/models/WeeklyReview';

export async function GET() {
    await dbConnect();
    const reviews = await WeeklyReview.find({}).sort({ weekKey: -1 }).select('weekKey createdAt');
    return NextResponse.json({ success: true, data: reviews });
}

export async function POST(request: Request) {
    await dbConnect();
    const body = await request.json();
    const { weekKey, wins, challenges, lessonsLearned, nextWeekActions, mood, energy, focus, notableDays } = body;

    if (!weekKey) {
        return NextResponse.json({ success: false, error: 'weekKey is required' }, { status: 400 });
    }

    const autoStats = await computeAutoStats(weekKey);

    const update = {
        weekKey,
        autoStats,
        wins: wins ?? '',
        challenges: challenges ?? '',
        lessonsLearned: lessonsLearned ?? '',
        nextWeekActions: nextWeekActions ?? '',
        mood: mood ?? null,
        energy: energy ?? null,
        focus: focus ?? null,
        notableDays: notableDays ?? [],
    };

    const review = await WeeklyReview.findOneAndUpdate(
        { weekKey },
        { $set: update },
        { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: review });
}

async function computeAutoStats(weekKey: string) {
    const { getWeekDates, toLocalString } = await import('@/lib/dateUtils');
    const { start, end } = getWeekDates(weekKey);

    const Task = (await import('@/models/Task')).default;
    const tasksInWeek = await Task.find({
        dueDate: { $gte: start.toISOString(), $lte: end.toISOString() }
    });
    const tasksTotal = tasksInWeek.length;
    const tasksCompleted = tasksInWeek.filter((t: any) => t.completed || t.status === 'done').length;

    const Habit = (await import('@/models/Habit')).default;
    const allHabits = await Habit.find({});
    let totalPossible = 0;
    let totalDone = 0;
    for (const habit of allHabits) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            totalPossible++;
            const dayStr = toLocalString(d);
            if (habit.completedDates?.some((cd: string) => toLocalString(cd) === dayStr)) {
                totalDone++;
            }
        }
    }
    const dailyHabitCompliance = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    const WeeklyHabit = (await import('@/models/WeeklyHabit')).default;
    const allWeeklyHabits = await WeeklyHabit.find({});
    const weeklyHabitsDone = allWeeklyHabits.filter((h: any) => h.completedWeeks?.includes(weekKey)).length;
    const weeklyHabitCompliance = allWeeklyHabits.length > 0
        ? Math.round((weeklyHabitsDone / allWeeklyHabits.length) * 100)
        : 0;

    const GymSession = (await import('@/models/GymSession')).default;
    const gymSessions = await GymSession.find({
        date: { $gte: start.toISOString(), $lte: end.toISOString() }
    });
    const gymCount = gymSessions.length;
    const totalWorkoutMinutes = gymSessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);

    const Expense = (await import('@/models/Expense')).default;
    const Income = (await import('@/models/Income')).default;
    const expensesDocs = await Expense.find({
        date: { $gte: start.toISOString(), $lte: end.toISOString() }
    });
    const expensesTotal = expensesDocs.reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
    const incomeDocs = await Income.find({
        date: { $gte: start.toISOString(), $lte: end.toISOString() }
    });
    const incomeTotal = incomeDocs.reduce((acc: number, i: any) => acc + (i.amount || 0), 0);

    return {
        tasksCompleted,
        tasksTotal,
        dailyHabitCompliance,
        weeklyHabitCompliance,
        gymSessions: gymCount,
        totalWorkoutMinutes,
        expensesTotal,
        incomeTotal,
        netCashflow: incomeTotal - expensesTotal,
    };
}