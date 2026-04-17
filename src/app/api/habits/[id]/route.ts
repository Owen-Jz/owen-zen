import dbConnect from "@/lib/db";
import Habit from "@/models/Habit";
import Routine from "@/models/Routine";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();

    // Logic to toggle today's completion
    if (body.action === 'toggle') {
      const habit = await Habit.findById(id);
      if (!habit) return NextResponse.json({ success: false }, { status: 404 });

      // Use provided date or default to today
      let targetDate = new Date();
      if (body.date) {
        targetDate = new Date(body.date);
      }

      // Normalize to YYYY-MM-DD string for comparison to avoid Timezone/UTC shifts
      // We assume the date passed in is the correct "Day" intended by the user
      const toDateString = (d: Date) => d.toISOString().split('T')[0];
      const targetDateStr = toDateString(targetDate);

      const hasCompletedTarget = habit.completedDates.some((d: Date) =>
        toDateString(new Date(d)) === targetDateStr
      );

      let newDates = [...habit.completedDates];

      if (hasCompletedTarget) {
        // Uncheck - remove all entries matching that day
        newDates = newDates.filter((d: Date) => toDateString(new Date(d)) !== targetDateStr);
      } else {
        // Check - add the specific date passed (or new Date if none)
        // We save the full timestamp to preserve time info if needed later, but comparison is by day
        newDates.push(targetDate);
      }

      // Recalculate streak — compare by YYYY-MM-DD strings to avoid timestamp drift
      // Deduplicate by date string, sort descending
      const uniqueDateStrs = [...new Set(newDates.map((d: Date) => toDateString(new Date(d))))].sort().reverse();

      let streak = 0;
      if (uniqueDateStrs.length > 0) {
          const todayStr = toDateString(new Date());
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterdayStr = toDateString(yesterdayDate);

          // Streak is alive only if latest completion is today or yesterday
          if (uniqueDateStrs[0] === todayStr || uniqueDateStrs[0] === yesterdayStr) {
              streak = 1;
              for (let i = 0; i < uniqueDateStrs.length - 1; i++) {
                  const curr = new Date(uniqueDateStrs[i]);
                  const prev = new Date(uniqueDateStrs[i + 1]);
                  // Consecutive days differ by exactly 1 day when compared as date strings
                  const dayDiff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
                  if (dayDiff === 1) {
                      streak++;
                  } else {
                      break;
                  }
              }
          }
      }

      const updated = await Habit.findByIdAndUpdate(id, {
          completedDates: newDates,
          streak: streak
      }, { new: true });

      // Sync to all linked routine items (unless syncToRoutines is explicitly false to avoid loops)
      if (body.syncToRoutines !== false) {
        const routines = await Routine.find({ "items.habitId": id });
        for (const routine of routines) {
          let changed = false;
          routine.items = routine.items.map((item: any) => {
            if (String(item.habitId) === String(id)) {
              changed = true;
              return { ...item.toObject(), completedDates: newDates };
            }
            return item;
          });
          if (changed) await routine.save();
        }
      }

      return NextResponse.json({ success: true, data: updated });
    }

    // Normal update
    const task = await Habit.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  try {
    const deleted = await Habit.deleteOne({ _id: id });
    if (!deleted) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
