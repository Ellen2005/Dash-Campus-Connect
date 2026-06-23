import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = (searchParams.get("schoolId") ?? "").trim();
    const currentUserId = (searchParams.get("currentUserId") ?? "").trim();

    const postWhere = schoolId
      ? {
          author: { schoolId, approvalStatus: "APPROVED" as const },
        }
      : { author: { approvalStatus: "APPROVED" as const } };

    const recentPosts = await prisma.post.findMany({
      where: postWhere,
      take: 80,
      orderBy: { createdAt: "desc" },
      select: { content: true, likes: { select: { id: true } }, comments: { select: { id: true } } },
    });

    const tagCounts = new Map<string, number>();
    for (const post of recentPosts) {
      const tags = post.content.match(/#[\w-]+/g) ?? [];
      const engagement = post.likes.length + post.comments.length;
      for (const tag of tags) {
        const key = tag.toLowerCase();
        tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1 + engagement);
      }
    }

    const trending = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, posts: count }));

    const userWhere: {
      approvalStatus: "APPROVED";
      schoolId?: string;
      id?: { not: string };
    } = { approvalStatus: "APPROVED" };
    if (schoolId) userWhere.schoolId = schoolId;
    if (currentUserId) userWhere.id = { not: currentUserId };

    const suggestedUsers = await prisma.user.findMany({
      where: userWhere,
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        profilePhoto: true,
        role: true,
        isStudentAdmin: true,
      },
    });

    const announcements = await prisma.announcement.findMany({
      where: { status: "PUBLISHED" },
      take: 3,
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, content: true, priority: true, publishedAt: true },
    });

    return NextResponse.json({
      trending,
      suggested: suggestedUsers.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username ?? u.id.slice(0, 8),
        avatar: u.profilePhoto,
        verified: u.isStudentAdmin || u.role === "ADMIN" || u.role === "SUPER_ADMIN",
      })),
      announcements,
    });
  } catch (error) {
    console.error("[sidebar]", error);
    return NextResponse.json({ trending: [], suggested: [], announcements: [] });
  }
}
