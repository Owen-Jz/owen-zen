import dbConnect from "@/lib/db";
import WeeklyHabit from "@/models/WeeklyHabit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [habits, total] = await Promise.all([
      WeeklyHabit.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WeeklyHabit.countDocuments({})
    ]);

    return NextResponse.json({
      success: true,
      data: habits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const habit = await WeeklyHabit.create(body);
    return NextResponse.json({ success: true, data: habit }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
