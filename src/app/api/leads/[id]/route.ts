import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  try {
    const body = await req.json();
    const lead = await Lead.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!lead) return NextResponse.json({ success: false }, { status: 404 });
    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  try {
    await Lead.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
