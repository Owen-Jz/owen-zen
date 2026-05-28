import dbConnect from "@/lib/db";
import Subscription from "@/models/Subscription";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const subscriptions = await Subscription.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: subscriptions });
    } catch (error) {
        console.error("GET /api/subscriptions error:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        // Initialize costHistory with the initial amount if provided
        if (body.amount !== undefined) {
            body.costHistory = [{ date: new Date(), amount: body.amount }];
        }

        const subscription = await Subscription.create(body);
        return NextResponse.json({ success: true, data: subscription }, { status: 201 });
    } catch (error) {
        console.error("POST /api/subscriptions error:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }
}