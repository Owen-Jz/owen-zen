import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { ACHIEVEMENTS, getEarnedIdsFromStats, getNewAchievements } from "@/lib/achievements";
import type { UserStats } from "@/lib/achievements";

// POST — check achievements and award any newly earned ones
export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const stats: UserStats = body.stats ?? {};
  const previouslyEarned: string[] = body.earned ?? [];

  const newOnes = getNewAchievements(stats, previouslyEarned);

  for (const def of newOnes) {
    await Notification.findOneAndUpdate(
      { userId: "default", title: def.title },
      {
        userId: "default",
        title: def.title,
        message: def.description,
        type: "success",
        link: "/?tab=analytics",
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  return NextResponse.json({ success: true, newlyEarned: newOnes.map(a => a.id) });
}

// GET — load all earned achievement IDs from DB
export async function GET() {
  await dbConnect();
  const docs = await Notification.find({ userId: "default", type: "success", link: "/?tab=analytics" });
  const earned: string[] = [];
  docs.forEach(d => {
    const match = ACHIEVEMENTS.find(a => a.title === (d as any).title);
    if (match) earned.push(match.id);
  });
  return NextResponse.json({ success: true, earned });
}
