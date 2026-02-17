import dbConnect from "@/lib/db";
import Goal from "@/models/Goal";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        await dbConnect();
        // Fetch all goals for the year 2026 or unspecified
        const goals = await Goal.find({ year: 2026 }).sort({ order: 1, createdAt: 1 }).lean();
        return NextResponse.json({ success: true, data: goals });
    } catch (error) {
        console.error("GET /api/goals error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const goal = await Goal.create(body);
        return NextResponse.json({ success: true, data: goal }, { status: 201 });
    } catch (error) {
        console.error("POST /api/goals error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}

export async function PUT(req: Request) {
    try {
        // Allow batch reordering if needed
        await dbConnect();
        const body = await req.json();
        const { goals } = body;

        if (Array.isArray(goals)) {
            // Batch update for ordering
            const bulkOps = goals.map((goal: any) => ({
                updateOne: {
                    filter: { _id: goal._id },
                    update: { $set: { order: goal.order } }
                }
            }));
            await Goal.bulkWrite(bulkOps);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "Invalid payload for batch update" }, { status: 400 });

    } catch (error) {
        console.error("PUT /api/goals error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}
