import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  const userId = new URL(req.url).searchParams.get("userId");

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      _count: { select: { members: true, posts: true } },
      members: userId ? { where: { userId }, select: { id: true, role: true } } : false,
      fieldOfStudy: { select: { name: true } },
      level: { select: { name: true } },
    },
  });

  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });

  return NextResponse.json({
    community: {
      ...community,
      isMember: userId ? community.members.length > 0 : false,
      memberRole: userId && community.members.length > 0 ? community.members[0].role : null,
      members: undefined,
    },
  });
}
