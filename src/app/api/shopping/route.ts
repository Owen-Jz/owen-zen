import dbConnect from "@/lib/db";
import ShoppingItem from "@/models/ShoppingItem";
import { NextResponse } from "next/server";

export async function GET() {
    await dbConnect();
    try {
        const items = await ShoppingItem.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const item = await ShoppingItem.create(body);
        return NextResponse.json({ success: true, data: item }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}
