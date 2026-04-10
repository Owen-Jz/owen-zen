import dbConnect from "@/lib/db";
import WeeklyGoal from "@/models/WeeklyGoal";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const skip = (page - 1) * limit;

        const [weeklyGoals, total] = await Promise.all([
            WeeklyGoal.find({}).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit).lean(),
            WeeklyGoal.countDocuments({})
        ]);

        return NextResponse.json({
            success: true,
            data: weeklyGoals,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error("GET /api/weekly-goals error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const weeklyGoal = await WeeklyGoal.create(body);
        return NextResponse.json({ success: true, data: weeklyGoal }, { status: 201 });
    } catch (error) {
        console.error("POST /api/weekly-goals error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}

export async function PUT(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { _id, ...updateData } = body;

        if (_id) {
            const updated = await WeeklyGoal.findByIdAndUpdate(_id, updateData, { new: true });
            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    } catch (error) {
        console.error("PUT /api/weekly-goals error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}
