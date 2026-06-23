import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  const page = parseInt(new URL(req.url).searchParams.get("page") ?? "1");
  const limit = 20;

  const posts = await prisma.communityPost.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  const body = await req.json().catch(() => null);
  // Note: authorId is accepted but not stored (CommunityPost model doesn't have authorId field)
  const parsed = z.object({ content: z.string().min(1).max(5000), authorId: z.string().min(1).optional() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  // Verify membership if authorId is provided
  if (parsed.data.authorId) {
    const member = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: parsed.data.authorId, communityId } },
    });
    if (!member) return NextResponse.json({ error: "You must be a member to post." }, { status: 403 });
  }

  if (!parsed.data.authorId) {
    return NextResponse.json({ error: "authorId is required." }, { status: 400 });
  }

  const post = await prisma.communityPost.create({
    data: {
      content: parsed.data.content,
      communityId,
      authorId: parsed.data.authorId,
    },
    include: {
      author: { select: { id: true, name: true, username: true, profilePhoto: true } },
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}