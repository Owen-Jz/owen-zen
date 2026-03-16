import dbConnect from "@/lib/db";
import Calendar from "@/models/Calendar";
import { NextResponse } from "next/server";

// GET /api/content-calendar/calendar - Get or create user's calendar
export async function GET(req: Request) {
  try {
    await dbConnect();

    // For now, we'll use a default userId
    // In production, this would come from the session
    const userId = "default";

    let calendar = await Calendar.findOne({ userId, isDeleted: false });

    if (!calendar) {
      // Create new calendar
      calendar = await Calendar.create({
        userId,
        name: "Content Calendar",
      });
    }

    return NextResponse.json({ success: true, data: calendar });
  } catch (error) {
    console.error("GET /api/content-calendar/calendar error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

// POST /api/content-calendar/calendar - Create new calendar
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const userId = body.userId || "default";

    // Check if calendar already exists
    const existing = await Calendar.findOne({ userId, isDeleted: false });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const calendar = await Calendar.create({
      userId,
      name: body.name || "Content Calendar",
    });

    return NextResponse.json({ success: true, data: calendar }, { status: 201 });
  } catch (error) {
    console.error("POST /api/content-calendar/calendar error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
