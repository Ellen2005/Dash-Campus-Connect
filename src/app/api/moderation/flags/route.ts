import { prisma } from "@/lib/prisma";
import { requireAdminOrStudentAdmin } from "@/lib/require-admin-or-student-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, errorResponse, user } = await requireAdminOrStudentAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  try {
    const flags = await prisma.moderatorFlag.findMany({
      where: { status: status as any },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, name: true, username: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Transform to a normalized format
    const normalizedFlags = flags
      .filter((f) => f.post)
      .map((f) => ({
        id: f.id,
        reason: f.reason,
        status: f.status,
        reports: 1, // Each flag is one report
        content: f.post?.content?.substring(0, 200) || "",
        user: f.post?.author
          ? { name: f.post.author.name, username: f.post.author.username || "unknown" }
          : { name: "Unknown", username: "unknown" },
        createdAt: f.createdAt.toISOString(),
      }));

    return NextResponse.json({ flags: normalizedFlags });
  } catch (error) {
    console.error("[moderation/flags] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flagged content" },
      { status: 500 }
    );
  }
}