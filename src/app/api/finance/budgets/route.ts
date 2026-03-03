import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Budget from "@/models/Budget";

// GET - Fetch budgets (optionally filter by month, with rollover support)
export async function GET(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");

        if (!month) {
            const budgets = await Budget.find()
                .populate("categoryId", "name color icon")
                .sort({ month: -1, categoryId: 1 });
            return NextResponse.json({ success: true, budgets });
        }

        let budgets = await Budget.find({ month })
            .populate("categoryId", "name color icon")
            .sort({ categoryId: 1 });

        // Rollover from previous month if none set
        if (budgets.length === 0) {
            const previousBudget = await Budget.findOne({
                month: { $lt: month },
            }).sort({ month: -1 });

            if (previousBudget) {
                const previousBudgets = await Budget.find({ month: previousBudget.month });
                const newBudgets = previousBudgets.map((b) => ({
                    categoryId: b.categoryId,
                    amount: b.amount,
                    month,
                }));

                if (newBudgets.length > 0) {
                    await Budget.insertMany(newBudgets);
                    budgets = await Budget.find({ month })
                        .populate("categoryId", "name color icon")
                        .sort({ categoryId: 1 });
                }
            }
        }

        return NextResponse.json({ success: true, budgets });
    } catch (error: any) {
        console.error("Error fetching budgets:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create or update a budget (upsert)
export async function POST(req: Request) {
    try {
        await dbConnect();

        const { amount, categoryId, month } = await req.json();

        if (!amount || !month) {
            return NextResponse.json(
                { success: false, message: "Amount and month are required" },
                { status: 400 }
            );
        }

        const budget = await Budget.findOneAndUpdate(
            { categoryId: categoryId || null, month },
            { categoryId: categoryId || null, amount, month },
            { upsert: true, new: true }
        ).populate("categoryId", "name color icon");

        return NextResponse.json(
            { success: true, message: "Budget saved", budget },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error saving budget:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
