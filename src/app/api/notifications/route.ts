import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({})
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const notification = await Notification.create(body);
    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  await dbConnect();
  try {
    const { id, isRead } = await req.json();
    if (id === 'all') {
        await Notification.updateMany({}, { isRead: true });
        return NextResponse.json({ success: true });
    }
    const notification = await Notification.findByIdAndUpdate(id, { isRead }, { new: true });
    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
