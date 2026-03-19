import dbConnect from "@/lib/db";
import WeeklyHabit from "@/models/WeeklyHabit";
import { NextResponse } from "next/server";

// Helper: get ISO week string "YYYY-Www" from a date (Monday = first day of week)
const toISOWeek = (d: Date): string => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

// Parse "2026-W12" -> { year: 2026, week: 12 }
const parseWeek = (w: string) => {
  const [year, week] = w.split('-W').map(Number);
  return { year, week };
};

// Get the week string N weeks before a given week string
const weekMinus = (w: string, n: number): string => {
  const { year, week } = parseWeek(w);
  const jan1 = new Date(Date.UTC(year, 0, 1));
  // Find the Monday of week 1
  const week1Monday = new Date(jan1);
  week1Monday.setDate(jan1.getDate() + (jan1.getDay() <= 4 ? 1 - jan1.getDay() : 8 - jan1.getDay()));
  // Target Monday
  const target = new Date(week1Monday);
  target.setDate(week1Monday.getDate() + (week - 1) * 7 + n * 7);
  return toISOWeek(target);
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();
    const habit = await WeeklyHabit.findById(id);
    if (!habit) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    if (body.action === "toggle") {
      const targetDate = body.date ? new Date(body.date) : new Date();
      const currentWeek = toISOWeek(targetDate);

      const weekIdx = habit.completedWeeks.indexOf(currentWeek);
      if (weekIdx >= 0) {
        // Uncomplete: remove this week
        habit.completedWeeks.splice(weekIdx, 1);
      } else {
        // Complete: add week
        habit.completedWeeks.push(currentWeek);
      }
      habit.completedWeeks.sort();

      // Recalculate streak
      const sorted = [...habit.completedWeeks].sort();
      let streak = 0;

      if (sorted.length > 0) {
        const todayWeekStr = toISOWeek(new Date());
        const { year: tYear, week: tWeek } = parseWeek(todayWeekStr);
        const { year: rYear, week: rWeek } = parseWeek(sorted[sorted.length - 1]);

        // How many weeks ago was the most recent completion?
        const weeksAgo = (tYear - rYear) * 52 + (tWeek - rWeek);

        if (weeksAgo <= 1) {
          // Streak is alive
          streak = 1;
          for (let i = sorted.length - 2; i >= 0; i--) {
            const { year: currYear, week: currWeek } = parseWeek(sorted[i + 1]);
            const { year: prevYear, week: prevWeek } = parseWeek(sorted[i]);
            const expectedWeek = prevWeek + 1 > 52 ? 1 : prevWeek + 1;
            const expectedYear = prevWeek + 1 > 52 ? prevYear + 1 : prevYear;
            if (currWeek === expectedWeek && currYear === expectedYear) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      habit.streak = streak;
      await habit.save();
      return NextResponse.json({ success: true, data: habit });
    }

    // Normal update
    const updated = await WeeklyHabit.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    await WeeklyHabit.deleteOne({ _id: id });
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
