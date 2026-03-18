import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const searchParams = request.nextUrl.searchParams;
    const scheduled = searchParams.get('scheduled');

    let query = {};
    if (scheduled === 'true') {
      query = { scheduledFor: { $exists: true, $ne: null } };
    }

    const posts = await Post.find(query).sort({ scheduledFor: 1, createdAt: -1 });
    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const post = await Post.create(body);
    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
