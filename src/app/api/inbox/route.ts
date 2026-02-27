import dbConnect from "@/lib/db";
import InboxItem from "@/models/InboxItem";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const entryType = searchParams.get("entryType");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status) query.status = status;
    if (entryType) query.entryType = entryType;
    if (search) query.title = { $regex: search, $options: "i" };

    const items = await InboxItem.find(query).sort({ dateAdded: -1 });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const item = await InboxItem.create({
      ...body,
      dateAdded: new Date(),
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
