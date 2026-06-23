import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const currentUserId = searchParams.get("currentUserId");

    const where: any = { status: "PUBLISHED" };
    if (schoolId) {
      // For now, announcements are global. In future, add schoolId to Announcement model.
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        publishedAt: true,
      },
    });

    // Filter out dismissed announcements for this user (if we had a dismissal table)
    // For now, return all published announcements
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("[announcements] Error:", error);
    return NextResponse.json({ announcements: [] });
  }
}