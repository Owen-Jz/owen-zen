import dbConnect from "@/lib/db";
import HourEntry from "@/models/HourEntry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    await dbConnect();
    const entries = await HourEntry.find({ date }).sort({ hour: 1 });
    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('GET /api/hour-entries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hour entries.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { date, hour, text, type, isPlanned } = body;

    if (!date || hour === undefined) {
      return NextResponse.json(
        { success: false, error: 'Date and hour are required.' },
        { status: 400 }
      );
    }

    if (hour < 0 || hour > 23) {
      return NextResponse.json(
        { success: false, error: 'Hour must be between 0 and 23.' },
        { status: 400 }
      );
    }

    // Upsert: update existing entry for this date+hour, or create new
    const entry = await HourEntry.findOneAndUpdate(
      { date, hour },
      { $set: { text: text || '', type: type || 'default', isPlanned: isPlanned || false } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('POST /api/hour-entries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save hour entry.' },
      { status: 500 }
    );
  }
}