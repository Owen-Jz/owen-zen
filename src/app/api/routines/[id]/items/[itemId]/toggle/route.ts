import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import { NextRequest, NextResponse } from "next/server";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toLocalString = (d: Date | string) => {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  const parts = formatter.formatToParts(dateObj);
  const yr = parts.find((p) => p.type === "year")?.value;
  const mo = parts.find((p) => p.type === "month")?.value;
  const da = parts.find((p) => p.type === "day")?.value;
  return `${yr}-${mo}-${da}`;
};

const toDateString = (d: Date) => d.toISOString().split("T")[0];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  await dbConnect();
  try {
    const { id, itemId } = await params;
    const today = new Date();

    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ success: false, error: "Routine not found" }, { status: 404 });
    }

    const item = routine.items.id(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    const todayStr = toLocalString(today);
    const alreadyCompleted = item.completedDates.some(
      (d: Date) => toLocalString(d) === todayStr
    );

    if (alreadyCompleted) {
      item.completedDates = item.completedDates.filter(
        (d: Date) => toLocalString(d) !== todayStr
      );
    } else {
      item.completedDates.push(today);
    }

    await routine.save();

    // Sync to linked habit via its toggle endpoint (with syncToRoutines=false to avoid loop)
    if (item.habitId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/habits/${item.habitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          date: today.toISOString(),
          syncToRoutines: false,
        }),
      });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
