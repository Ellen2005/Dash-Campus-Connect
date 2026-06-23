import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json({ stats: { students: 0, communities: 0, eventsThisWeek: 0 } });
    }

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [studentsCount, communitiesCount, eventsThisWeek] = await Promise.all([
      prisma.user.count({
        where: {
          schoolId,
          approvalStatus: "APPROVED",
        },
      }),
      prisma.community.count({
        where: { schoolId },
      }),
      prisma.event.count({
        where: {
          date: {
            gte: now,
            lte: weekFromNow,
          },
          approvalStatus: "APPROVED",
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        students: studentsCount,
        communities: communitiesCount,
        eventsThisWeek: eventsThisWeek,
      },
    });
  } catch (error) {
    console.error("[campus-stats] Error:", error);
    return NextResponse.json({ stats: { students: 0, communities: 0, eventsThisWeek: 0 } });
  }
}