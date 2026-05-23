import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const clients = await Client.find({}).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, email, phone, company, role, communicationPrefs, personalNotes, tags, status } = body;
    const client = await Client.create({ name, email, phone, company, role, communicationPrefs, personalNotes, tags, status });
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}