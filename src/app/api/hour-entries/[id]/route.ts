import dbConnect from "@/lib/db";
import HourEntry from "@/models/HourEntry";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const entry = await HourEntry.findById(id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('GET /api/hour-entries/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch entry.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await dbConnect();

    const entry = await HourEntry.findByIdAndUpdate(
      id,
      { $set: { text: body.text, type: body.type, isPlanned: body.isPlanned } },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return NextResponse.json({ success: false, error: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('PUT /api/hour-entries/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update entry.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const entry = await HourEntry.findByIdAndDelete(id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('DELETE /api/hour-entries/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete entry.' }, { status: 500 });
  }
}