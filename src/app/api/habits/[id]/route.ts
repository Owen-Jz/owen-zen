import dbConnect from "@/lib/db";
import Habit from "@/models/Habit";
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

      // Recalculate streak
      // Sort dates
      newDates.sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      if (newDates.length > 0) {
          const latest = new Date(newDates[0]);
          const now = new Date();
          now.setHours(0,0,0,0);
          
          // If the latest completion was today or yesterday, the streak is alive
          const diffDays = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 1) {
             streak = 1;
             // Check backwards
             for (let i = 0; i < newDates.length - 1; i++) {
                 const curr = new Date(newDates[i]);
                 const prev = new Date(newDates[i+1]);
                 const dayDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
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
