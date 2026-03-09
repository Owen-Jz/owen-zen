import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ success: false, error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await req.json();
    const note = await Note.findByIdAndUpdate(id, body, { new: true });
    if (!note) {
      return NextResponse.json({ success: false, error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const note = await Note.findByIdAndDelete(id);
    if (!note) {
      return NextResponse.json({ success: false, error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
