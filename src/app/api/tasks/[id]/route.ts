import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const task = await Task.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Attributes: PUT /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedTask = await Task.deleteOne({ _id: id });
    if (!deletedTask) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("Attributes: DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
