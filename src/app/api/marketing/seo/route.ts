import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SEOEntry from "@/models/SEOEntry";

export async function GET() {
  await dbConnect();
  const entries = await SEOEntry.find({ isDeleted: false }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: entries });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const entry = await SEOEntry.create(body);
  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
