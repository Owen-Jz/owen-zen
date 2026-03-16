import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import FinanceCategory from "@/models/FinanceCategory";
import { financeRateLimiter, strictRateLimiter } from "@/lib/rateLimit";

// GET - Fetch expenses
export async function GET(req: NextRequest) {
    // Apply rate limiting
    const rateLimitResult = financeRateLimiter.check(req);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { success: false, message: "Rate limit exceeded. Please try again later." },
            { status: 429, headers: { 'Retry-After': '60' } }
        );
    }
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // Format: YYYY-MM
        const categoryId = searchParams.get("categoryId");

        const query: any = {};

        if (month) {
            const [year, monthNum] = month.split("-");
            const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (categoryId) {
            query.categoryId = categoryId;
        }

        const expenses = await Expense.find(query)
            .populate("categoryId", "name color icon")
            .sort({ date: -1, createdAt: -1 });

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        return NextResponse.json({ success: true, expenses, total });
    } catch (error: any) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create new expense
export async function POST(req: NextRequest) {
    // Apply stricter rate limiting for write operations
    const rateLimitResult = strictRateLimiter.check(req);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { success: false, message: "Rate limit exceeded. Please try again later." },
            { status: 429, headers: { 'Retry-After': '60' } }
        );
    }
    try {
        await dbConnect();

        const { amount, categoryId, date, note } = await req.json();

        if (!amount || !categoryId) {
            return NextResponse.json(
                { success: false, message: "Amount and category are required" },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json(
                { success: false, message: "Amount must be greater than 0" },
                { status: 400 }
            );
        }

        const category = await FinanceCategory.findById(categoryId);
        if (!category) {
            return NextResponse.json(
                { success: false, message: "Invalid category" },
                { status: 400 }
            );
        }

        const expense = await Expense.create({
            amount,
            categoryId,
            date: date ? new Date(date) : new Date(),
            note: note || "",
        });

        const populatedExpense = await Expense.findById(expense._id)
            .populate("categoryId", "name color icon");

        return NextResponse.json(
            { success: true, message: "Expense created", expense: populatedExpense },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
