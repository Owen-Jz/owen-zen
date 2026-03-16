import dbConnect from "@/lib/db";
import ContentPost from "@/models/ContentPost";
import { NextResponse } from "next/server";

// GET /api/content-calendar/[id] - Get single post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const post = await ContentPost.findOne({ _id: id, isDeleted: false }).lean();

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error("GET /api/content-calendar/[id] error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

// PUT /api/content-calendar/[id] - Update single post
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const {
      network,
      caption,
      mediaUrls,
      notes,
      scheduledAt,
      status
    } = body;

    // Validate network if provided
    if (network) {
      const validNetworks = ['instagram', 'twitter', 'linkedin'];
      if (!validNetworks.includes(network)) {
        return NextResponse.json(
          { success: false, error: "Invalid network" },
          { status: 400 }
        );
      }
    }

    // Validate caption length if provided
    if (caption) {
      const charLimits = { twitter: 2200, instagram: 10000, linkedin: 10000 };
      const targetNetwork = network || (await ContentPost.findById(id))?.network;
      if (targetNetwork && caption.length > charLimits[targetNetwork as keyof typeof charLimits]) {
        return NextResponse.json(
          { success: false, error: `Caption exceeds character limit for ${targetNetwork}` },
          { status: 400 }
        );
      }
    }

    // Validate media if provided
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

    // Build update object
    const updateData: any = {};
    if (network !== undefined) updateData.network = network;
    if (caption !== undefined) updateData.caption = caption;
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (status !== undefined) updateData.status = status;

    const post = await ContentPost.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error("PUT /api/content-calendar/[id] error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

// DELETE /api/content-calendar/[id] - Soft delete post (or hard delete for super-admin)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get('hard') === 'true';

    await dbConnect();

    let post;

    if (hardDelete) {
      // Hard delete - only for super admin
      // For now, we'll allow it but in production would check for admin role
      post = await ContentPost.findByIdAndDelete(id);
    } else {
      // Soft delete (default)
      post = await ContentPost.findByIdAndUpdate(
        id,
        { $set: { isDeleted: true } },
        { new: true }
      );
    }

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
      message: hardDelete ? "Post permanently deleted" : "Post moved to trash"
    });
  } catch (error) {
    console.error("DELETE /api/content-calendar/[id] error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
