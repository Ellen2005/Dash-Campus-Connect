import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const LookupQuerySchema = z.object({
  username: z.string().min(1).max(50),
  currentUserId: z.string().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = (searchParams.get("username") ?? "").trim();
    const currentUserIdRaw = (searchParams.get("currentUserId") ?? "").trim();
    const currentUserId = currentUserIdRaw ? currentUserIdRaw : undefined;

    const parsed = LookupQuerySchema.safeParse({ username, currentUserId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        profilePhoto: true,
        coverPhoto: true,
        fieldOfStudy: { select: { name: true } },
        level: { select: { name: true } },
        interests: true,
        hometown: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    const isFollowing = currentUserId
      ? await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
          select: { id: true },
        })
      : null;

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          bio: user.bio ?? "",
          profilePhoto: user.profilePhoto ?? "",
          coverPhoto: user.coverPhoto ?? "",
          major: user.fieldOfStudy?.name ?? "",
          year: user.level?.name ?? "",
          hometown: user.hometown ?? "",
          interests: user.interests ?? [],
          followersCount,
          followingCount,
          isFollowing: !!isFollowing,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to lookup user. ${msg}`.trim() }, { status: 500 });
  }
}

