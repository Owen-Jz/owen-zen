import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    const projects = await Project.find({ _id: { $in: client.projects } }).select('name status');
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}