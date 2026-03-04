import dbConnect from "@/lib/db";
import WeeklyGoal from "@/models/WeeklyGoal";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const weeklyGoals = await WeeklyGoal.find({}).sort({ order: 1, createdAt: 1 }).lean();
        return NextResponse.json({ success: true, data: weeklyGoals });
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
