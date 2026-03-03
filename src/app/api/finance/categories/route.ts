import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FinanceCategory from "@/models/FinanceCategory";

const DEFAULT_CATEGORIES = [
    { name: "Food & Dining", color: "#f97316", icon: "🍔", type: "expense", isSystem: true },
    { name: "Transportation", color: "#3b82f6", icon: "🚗", type: "expense", isSystem: true },
    { name: "Housing", color: "#8b5cf6", icon: "🏠", type: "expense", isSystem: true },
    { name: "Entertainment", color: "#ec4899", icon: "🎬", type: "expense", isSystem: true },
    { name: "Shopping", color: "#f59e0b", icon: "🛍️", type: "expense", isSystem: true },
    { name: "Health", color: "#10b981", icon: "💊", type: "expense", isSystem: true },
    { name: "Utilities", color: "#6b7280", icon: "💡", type: "expense", isSystem: true },
    { name: "Education", color: "#0ea5e9", icon: "📚", type: "expense", isSystem: true },
    { name: "Travel", color: "#14b8a6", icon: "✈️", type: "expense", isSystem: true },
    { name: "Other", color: "#64748b", icon: "📦", type: "expense", isSystem: true },
    { name: "Salary", color: "#22c55e", icon: "💼", type: "income", isSystem: true },
    { name: "Freelance", color: "#a855f7", icon: "💻", type: "income", isSystem: true },
    { name: "Investment", color: "#eab308", icon: "📈", type: "income", isSystem: true },
    { name: "Gift", color: "#f43f5e", icon: "🎁", type: "income", isSystem: true },
    { name: "Other Income", color: "#06b6d4", icon: "💵", type: "income", isSystem: true },
];

async function seedDefaultCategories() {
    const existing = await FinanceCategory.countDocuments({ isSystem: true });
    if (existing === 0) {
        await FinanceCategory.insertMany(DEFAULT_CATEGORIES);
    }
}

// GET - Fetch all categories
export async function GET() {
    try {
        await dbConnect();
        await seedDefaultCategories();
        const categories = await FinanceCategory.find().sort({ type: 1, name: 1 });
        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        console.error("Error fetching finance categories:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create custom category
export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name, color, icon, type } = await req.json();

        if (!name) {
            return NextResponse.json(
                { success: false, message: "Category name is required" },
                { status: 400 }
            );
        }

        const category = await FinanceCategory.create({
            name,
            color: color || "#6b7280",
            icon: icon || "📦",
            type: type || "expense",
            isSystem: false,
        });

        return NextResponse.json(
            { success: true, message: "Category created", category },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating finance category:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
