import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EmailCampaign from "@/models/EmailCampaign";

export async function GET() {
  await dbConnect();
  const campaigns = await EmailCampaign.find({ isDeleted: false }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: campaigns });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const campaign = await EmailCampaign.create(body);
  return NextResponse.json({ success: true, data: campaign }, { status: 201 });
}
