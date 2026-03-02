import dbConnect from "@/lib/db";
import QuickLink from "@/models/QuickLink";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const links = await QuickLink.find({}).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const link = await QuickLink.create(body);
    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
