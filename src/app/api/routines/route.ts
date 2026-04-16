import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import { NextResponse } from "next/server";

const DEFAULT_ROUTINES = [
  {
    title: "Morning Routine",
    icon: "☀️",
    color: "#f59e0b",
    order: 0,
    items: [
      { title: "Brush", completedDates: [] },
      { title: "Pray / Devotion / Bible Reading", completedDates: [] },
      { title: "Clean Room / Make Bed / Pushups", completedDates: [] },
      { title: "Morning Jog Exercise", completedDates: [] },
      { title: "Food Prep", completedDates: [] },
      { title: "Journal", completedDates: [] },
      { title: "Reply Messages", completedDates: [] },
    ],
  },
  {
    title: "Work Sprint",
    icon: "💼",
    color: "#3b82f6",
    order: 1,
    items: [
      { title: "Find something inspiring / Study business/technology", completedDates: [] },
      { title: "Build a product feature", completedDates: [] },
      { title: "Deep Work", completedDates: [] },
      { title: "Ship Code", completedDates: [] },
    ],
  },
  {
    title: "Social Sprint",
    icon: "🌱",
    color: "#22c55e",
    order: 2,
    items: [
      { title: "Improve a skill / Get inspired", completedDates: [] },
      { title: "Create Content", completedDates: [] },
      { title: "Publish something online", completedDates: [] },
      { title: "Reach out to someone", completedDates: [] },
    ],
  },
  {
    title: "Evening Routine",
    icon: "🌙",
    color: "#8b5cf6",
    order: 3,
    items: [
      { title: "Shower", completedDates: [] },
      { title: "Plan the next day", completedDates: [] },
      { title: "Track expenses", completedDates: [] },
      { title: "Dance", completedDates: [] },
    ],
  },
];

export async function GET() {
  await dbConnect();
  try {
    let routines = await Routine.find({}).sort({ order: 1 });

    // Seed default routines if none exist
    if (routines.length === 0) {
      routines = await Routine.insertMany(DEFAULT_ROUTINES);
    }

    return NextResponse.json({ success: true, data: routines });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const routine = await Routine.create(body);
    return NextResponse.json({ success: true, data: routine }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
