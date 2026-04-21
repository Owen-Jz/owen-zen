import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Campaign from "@/models/Campaign";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const campaign = await Campaign.findById(id);
  if (!campaign) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: campaign });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  const campaign = await Campaign.findByIdAndUpdate(id, body, { new: true });
  if (!campaign) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: campaign });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  await Campaign.findByIdAndUpdate(id, { isDeleted: true });
  return NextResponse.json({ success: true });
}
