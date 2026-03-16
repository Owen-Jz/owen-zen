import dbConnect from "@/lib/db";
import ContentPost from "@/models/ContentPost";
import Calendar from "@/models/Calendar";
import { NextResponse } from "next/server";

// POST /api/content-calendar/seed - Seed sample posts for testing
export async function POST(req: Request) {
  try {
    await dbConnect();

    // Get or create calendar
    const userId = "default";
    let calendar = await Calendar.findOne({ userId, isDeleted: false });

    if (!calendar) {
      calendar = await Calendar.create({
        userId,
        name: "Content Calendar",
      });
    }

    // Sample posts data
    const today = new Date();
    const samplePosts = [
      {
        calendarId: calendar._id,
        userId,
        network: "instagram" as const,
        caption: "Excited to share our latest product launch! 🚀 Check out the link in bio for more details. #newproduct #startup",
        mediaUrls: [
          { url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800", type: "image" as const }
        ],
        notes: "Remember to engage with comments within 30 minutes of posting",
        scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0),
        status: "scheduled" as const,
      },
      {
        calendarId: calendar._id,
        userId,
        network: "twitter" as const,
        caption: "Just published our Q1 roadmap! Here's what we're working on: 1) New features 2) Better performance 3) Mobile-first design. Thread incoming 🧵",
        mediaUrls: [],
        notes: "",
        scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 30),
        status: "draft" as const,
      },
      {
        calendarId: calendar._id,
        userId,
        network: "linkedin" as const,
        caption: "Thrilled to announce our partnership with industry leaders! This collaboration will bring unprecedented value to our customers. Read more about our vision for the future in the comments. #business #partnership #growth",
        mediaUrls: [
          { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", type: "image" as const },
          { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800", type: "image" as const }
        ],
        notes: "CEO approved - ready to post",
        scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
        status: "scheduled" as const,
      },
      {
        calendarId: calendar._id,
        userId,
        network: "instagram" as const,
        caption: "Behind the scenes look at our team meeting today! 📸 #teamwork #bts",
        mediaUrls: [
          { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800", type: "image" as const }
        ],
        notes: "Cute photo from team meeting",
        scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 16, 0),
        status: "published" as const,
      },
      {
        calendarId: calendar._id,
        userId,
        network: "twitter" as const,
        caption: "Hot take: The best code is written with a cup of coffee and good music. ☕🎵 What's your coding soundtrack?",
        mediaUrls: [],
        notes: "",
        scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 11, 0),
        status: "draft" as const,
      },
      {
        calendarId: calendar._id,
        userId,
        network: "linkedin" as const,
        caption: "Proud to share that we've hit 10,000 users! Thank you to our amazing community for believing in our vision. This is just the beginning. #milestone #growth #startup",
        mediaUrls: [
          { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", type: "image" as const }
        ],
        notes: "Schedule for maximum engagement - morning hours",
        scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 8, 0),
        status: "scheduled" as const,
      },
    ];

    // Delete any existing sample posts
    await ContentPost.deleteMany({ calendarId: calendar._id });

    // Create sample posts
    const posts = await ContentPost.insertMany(samplePosts);

    return NextResponse.json({
      success: true,
      data: posts,
      message: `Seeded ${posts.length} sample posts`
    });
  } catch (error) {
    console.error("POST /api/content-calendar/seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
