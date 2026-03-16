import dbConnect from "@/lib/db";
import ContentPost from "@/models/ContentPost";
import Calendar from "@/models/Calendar";
import { NextResponse } from "next/server";

// GET /api/content-calendar - Get posts with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const networks = searchParams.get('networks')?.split(',').filter(Boolean) || [];
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await dbConnect();

    // Build date filter
    let dateFilter = {};
    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = {
        scheduledAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        scheduledAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Build query
    const query: any = {
      isDeleted: false,
      ...dateFilter
    };

    if (networks.length > 0) {
      query.network = { $in: networks };
    }

    if (status) {
      query.status = status;
    }

    const posts = await ContentPost.find(query)
      .sort({ scheduledAt: 1 })
      .lean();

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("GET /api/content-calendar error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

// POST /api/content-calendar - Create a new post
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      network,
      caption,
      mediaUrls,
      notes,
      scheduledAt,
      status,
      calendarId
    } = body;

    // Validate required fields
    if (!network || !caption || !scheduledAt || !calendarId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: network, caption, scheduledAt, calendarId" },
        { status: 400 }
      );
    }

    // Validate network
    const validNetworks = ['instagram', 'twitter', 'linkedin'];
    if (!validNetworks.includes(network)) {
      return NextResponse.json(
        { success: false, error: "Invalid network. Must be one of: instagram, twitter, linkedin" },
        { status: 400 }
      );
    }

    // Validate caption length based on network
    const charLimits = { twitter: 2200, instagram: 10000, linkedin: 10000 };
    if (caption.length > charLimits[network as keyof typeof charLimits]) {
      return NextResponse.json(
        { success: false, error: `Caption exceeds ${charLimits[network as keyof typeof charLimits]} characters for ${network}` },
        { status: 400 }
      );
    }

    // Validate media
    if (mediaUrls?.length) {
      const images = mediaUrls.filter((m: any) => m.type === 'image').length;
      const videos = mediaUrls.filter((m: any) => m.type === 'video').length;
      if (images > 10) {
        return NextResponse.json(
          { success: false, error: "Maximum 10 images allowed" },
          { status: 400 }
        );
      }
      if (videos > 1) {
        return NextResponse.json(
          { success: false, error: "Maximum 1 video allowed" },
          { status: 400 }
        );
      }
    }

    // Verify calendar exists and belongs to user
    const calendar = await Calendar.findById(calendarId);
    if (!calendar || calendar.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Calendar not found" },
        { status: 404 }
      );
    }

    // Create the post
    const post = await ContentPost.create({
      calendarId,
      userId: calendar.userId,
      network,
      caption,
      mediaUrls: mediaUrls || [],
      notes: notes || '',
      scheduledAt: new Date(scheduledAt),
      status: status || 'draft'
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error("POST /api/content-calendar error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

// PUT /api/content-calendar - Bulk update posts
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { posts } = body;

    if (!Array.isArray(posts)) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Bulk update
    const bulkOps = posts.map((post: any) => ({
      updateOne: {
        filter: { _id: post._id },
        update: { $set: post }
      }
    }));

    const result = await ContentPost.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Updated ${result.modifiedCount} posts`
    });
  } catch (error) {
    console.error("PUT /api/content-calendar error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
