import dbConnect from "@/lib/db";
import Habit from "@/models/Habit";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const habits = await Habit.find({}).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: habits });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const habit = await Habit.create(body);
    return NextResponse.json({ success: true, data: habit }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
