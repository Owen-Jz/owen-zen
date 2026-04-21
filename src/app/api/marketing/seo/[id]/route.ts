import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SEOEntry from "@/models/SEOEntry";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const entry = await SEOEntry.findById(id);
  if (!entry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: entry });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  const entry = await SEOEntry.findByIdAndUpdate(id, body, { new: true });
  if (!entry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: entry });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  await SEOEntry.findByIdAndUpdate(id, { isDeleted: true });
  return NextResponse.json({ success: true });
}
