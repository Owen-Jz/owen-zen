import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await req.json();
    const client = await Client.findByIdAndUpdate(id, body, { new: true });
    if (!client) return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const client = await Client.findByIdAndDelete(id);
    if (!client) return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}