import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BrandAsset from "@/models/BrandAsset";

export async function GET() {
  await dbConnect();
  const assets = await BrandAsset.find({ isDeleted: false }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: assets });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const asset = await BrandAsset.create(body);
  return NextResponse.json({ success: true, data: asset }, { status: 201 });
}
