import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

const CreateStorySchema = z.object({
  mediaUrl: z.string().url().optional(),
  caption: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    const now = new Date();
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        ...(schoolId ? { author: { schoolId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, username: true, profilePhoto: true },
        },
      },
      take: 100,
    });

    return NextResponse.json({ stories });
  } catch (error) {
    console.error("[stories GET]", error);
    return NextResponse.json({ stories: [] });
  }
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const data = CreateStorySchema.parse(body);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        authorId: user.userId,
        mediaUrl: data.mediaUrl,
        caption: data.caption,
        expiresAt,
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, profilePhoto: true },
        },
      },
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[stories POST]", error);
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
  }
}
