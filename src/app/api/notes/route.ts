import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const notes = await Note.find({}).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const note = await Note.create(body);
    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
