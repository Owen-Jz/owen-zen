import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  await dbConnect();
  try {
    const { id, itemId } = await params;
    const body = await req.json();
    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ success: false, error: "Routine not found" }, { status: 404 });
    }
    const item = routine.items.id(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    item.set(body);
    await routine.save();
    return NextResponse.json({ success: true, data: routine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  await dbConnect();
  try {
    const { id, itemId } = await params;
    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ success: false, error: "Routine not found" }, { status: 404 });
    }
    routine.items.pull({ _id: itemId });
    await routine.save();
    return NextResponse.json({ success: true, data: routine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
