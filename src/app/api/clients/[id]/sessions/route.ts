import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, summary, followUps, nextSteps } = body;
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    client.sessions.push({ date: date || new Date(), summary, followUps: followUps || [], nextSteps });
    await client.save();
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}