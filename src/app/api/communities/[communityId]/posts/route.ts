import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";

export async function GET(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  const page = parseInt(new URL(req.url).searchParams.get("page") ?? "1");
  const limit = 20;

  const posts = await prisma.communityPost.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      author: { select: { id: true, name: true, username: true, profilePhoto: true } },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { communityId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    content: z.string().min(1).max(5000),
    images: z.array(z.string()).optional(),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  // Verify membership
  const member = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: auth.userId, communityId } },
  });
  if (!member) return NextResponse.json({ error: "You must be a member to post." }, { status: 403 });

  const post = await prisma.communityPost.create({
    data: {
      content: parsed.data.content,
      communityId,
      authorId: auth.userId,
      images: parsed.data.images ?? [],
      attachmentUrl: parsed.data.attachmentUrl,
      attachmentName: parsed.data.attachmentName,
    },
    include: {
      author: { select: { id: true, name: true, username: true, profilePhoto: true } },
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}
