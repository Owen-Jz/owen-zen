import dbConnect from "@/lib/db";
import PomodoroState from "@/models/PomodoroState";
import { NextResponse } from "next/server";

const DEFAULT_ID = "default";

export async function GET() {
  await dbConnect();
  try {
    let state = await PomodoroState.findById(DEFAULT_ID);
    if (!state) {
      state = await PomodoroState.create({ _id: DEFAULT_ID });
    }
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();

    // If dailyTrack is being updated, merge it properly
    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };

    // For dailyTrack, we need to merge individual fields rather than replace the whole object
    if (body.dailyTrack) {
      const current = await PomodoroState.findById(DEFAULT_ID);
      updateData.dailyTrack = {
        ...(current?.dailyTrack || {}),
        ...body.dailyTrack,
      };
    }

    const state = await PomodoroState.findByIdAndUpdate(
      DEFAULT_ID,
      updateData,
      { new: true, upsert: true }
    );
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
