import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ success: false, error: "Routine not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: routine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await req.json();
    const routine = await Routine.findByIdAndUpdate(id, body, { new: true });
    if (!routine) {
      return NextResponse.json({ success: false, error: "Routine not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: routine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const routine = await Routine.findByIdAndDelete(id);
    if (!routine) {
      return NextResponse.json({ success: false, error: "Routine not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: routine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
