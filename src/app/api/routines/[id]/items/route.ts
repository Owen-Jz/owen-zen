import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await req.json();
    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ success: false, error: "Routine not found" }, { status: 404 });
    }
    routine.items.push(body);
    await routine.save();
    return NextResponse.json({ success: true, data: routine }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
