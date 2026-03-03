import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Income from "@/models/Income";

// GET - Fetch income entries
export async function GET(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");

        const query: any = {};

        if (month) {
            const [year, monthNum] = month.split("-");
            const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const incomes = await Income.find(query).sort({ date: -1 });
        const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);

        return NextResponse.json({ success: true, incomes, total });
    } catch (error: any) {
        console.error("Error fetching income:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create new income entry
export async function POST(req: Request) {
    try {
        await dbConnect();

        const { amount, source, date } = await req.json();

        if (!amount || !source) {
            return NextResponse.json(
                { success: false, message: "Amount and source are required" },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json(
                { success: false, message: "Amount must be greater than 0" },
                { status: 400 }
            );
        }

        const income = await Income.create({
            amount,
            source,
            date: date ? new Date(date) : new Date(),
        });

        return NextResponse.json(
            { success: true, message: "Income created", income },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating income:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
