
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Board from "@/models/Board";

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const skip = (page - 1) * limit;

        const [boards, total] = await Promise.all([
            Board.find({}).skip(skip).limit(limit),
            Board.countDocuments({})
        ]);

        return NextResponse.json({
            success: true,
            data: boards,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
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
