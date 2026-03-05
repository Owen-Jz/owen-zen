import dbConnect from "@/lib/db";
import GymSession from "@/models/GymSession";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const sessions = await GymSession.find({}).sort({ date: -1 });
    return NextResponse.json({ success: true, data: sessions });
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
