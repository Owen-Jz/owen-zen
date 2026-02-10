
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Board from "@/models/Board";

export async function GET() {
    await dbConnect();
    try {
        const boards = await Board.find({});
        return NextResponse.json({ success: true, data: boards });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch boards' }, { status: 400 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { title } = await req.json();
        const board = await Board.create({ title });
        return NextResponse.json({ success: true, data: board }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create board' }, { status: 400 });
    }
}
