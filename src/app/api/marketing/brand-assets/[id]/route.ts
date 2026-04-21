import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BrandAsset from "@/models/BrandAsset";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const asset = await BrandAsset.findById(id);
  if (!asset) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: asset });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  const asset = await BrandAsset.findByIdAndUpdate(id, body, { new: true });
  if (!asset) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: asset });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  await BrandAsset.findByIdAndUpdate(id, { isDeleted: true });
  return NextResponse.json({ success: true });
}
