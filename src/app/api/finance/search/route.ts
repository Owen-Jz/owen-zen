import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import { financeRateLimiter } from "@/lib/rateLimit";

interface SearchQuery {
  q?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: string;
  limit?: string;
  booleanOperator?: "AND" | "OR";
}

function highlightMatches(text: string, query: string): string {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    const params: SearchQuery = {
      q: searchParams.get("q") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      amountMin: searchParams.get("amountMin") || undefined,
      amountMax: searchParams.get("amountMax") || undefined,
      sortBy: searchParams.get("sortBy") || "date",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      booleanOperator: (searchParams.get("booleanOperator") as "AND" | "OR") || "AND",
    };

    const page = parseInt(params.page || "1");
    const limit = Math.min(parseInt(params.limit || "20"), 100); // Cap at 100
    const skip = (page - 1) * limit;

    // Build query based on search parameters
    const query: Record<string, unknown> = {};
    const searchConditions: Record<string, unknown>[] = [];

    // Text search on note field
    if (params.q) {
      const searchTerm = escapeRegex(params.q);
      searchConditions.push({
        $or: [
          { note: { $regex: searchTerm, $options: "i" } },
          // Also search in category (will be joined via population later)
        ],
      });
    }

    // Category filter
    if (params.categoryId) {
      searchConditions.push({ categoryId: params.categoryId });
    }

    // Date range filter
    if (params.dateFrom || params.dateTo) {
      const dateCondition: Record<string, Date> = {};
      if (params.dateFrom) {
        dateCondition.$gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        dateCondition.$lte = new Date(params.dateTo);
      }
      searchConditions.push({ date: dateCondition });
    }

    // Amount range filter
    if (params.amountMin || params.amountMax) {
      const amountCondition: Record<string, number> = {};
      if (params.amountMin) {
        amountCondition.$gte = parseFloat(params.amountMin);
      }
      if (params.amountMax) {
        amountCondition.$lte = parseFloat(params.amountMax);
      }
      searchConditions.push({ amount: amountCondition });
    }

    // Apply conditions based on boolean operator
    if (searchConditions.length > 0) {
      if (params.booleanOperator === "OR") {
        query.$or = searchConditions;
      } else {
        Object.assign(query, ...searchConditions);
      }
    }

    // Sorting
    const sortOptions: Record<string, 1 | -1> = {};
    const sortField = params.sortBy || "date";
    sortOptions[sortField] = params.sortOrder === "asc" ? 1 : -1;

    // Execute query with timing for performance monitoring
    const startTime = Date.now();

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate("categoryId", "name color icon")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(query),
    ]);

    const queryTime = Date.now() - startTime;

    // Highlight matches in results
    const highlightedExpenses = expenses.map((exp: any) => ({
      ...exp,
      highlightedNote: params.q ? highlightMatches(exp.note || "", params.q!) : exp.note,
      queryTime,
    }));

    return NextResponse.json({
      success: true,
      data: highlightedExpenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      performance: {
        queryTimeMs: queryTime,
        meetsTarget: queryTime < 500,
      },
      query: {
        searchTerm: params.q,
        filters: {
          categoryId: params.categoryId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          amountMin: params.amountMin,
          amountMax: params.amountMax,
        },
        booleanOperator: params.booleanOperator,
      },
    });
  } catch (error: any) {
    console.error("Error searching expenses:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
