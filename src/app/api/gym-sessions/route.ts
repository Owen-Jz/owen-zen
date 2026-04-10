import dbConnect from "@/lib/db";
import GymSession from "@/models/GymSession";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      GymSession.find({}).sort({ date: -1 }).skip(skip).limit(limit),
      GymSession.countDocuments({})
    ]);

    return NextResponse.json({
      success: true,
      data: sessions,
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
    const existingSession = await GymSession.findOne({ date: body.date });
    
    if (existingSession) {
      existingSession.exercises = body.exercises;
      existingSession.notes = body.notes;
      await existingSession.save();
      return NextResponse.json({ success: true, data: existingSession });
    }
    
    const session = await GymSession.create(body);
    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
