import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ success: true, data: notifications });
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
