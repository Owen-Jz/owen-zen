import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Campaign from "@/models/Campaign";

export async function GET() {
  await dbConnect();
  const campaigns = await Campaign.find({ isDeleted: false }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: campaigns });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const campaign = await Campaign.create(body);
  return NextResponse.json({ success: true, data: campaign }, { status: 201 });
}
