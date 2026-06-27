import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";

export async function GET(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { communityId } = await params;

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      _count: { select: { members: true, posts: true } },
      members: { where: { userId: auth.userId }, select: { id: true, role: true } },
      fieldOfStudy: { select: { name: true } },
      level: { select: { name: true } },
    },
  });

  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });

  // School isolation: only allow viewing communities in your school
  if (community.schoolId !== auth.dbUser.schoolId) {
    return NextResponse.json({ error: "Community not found." }, { status: 404 });
  }

  return NextResponse.json({
    community: {
      ...community,
      isMember: community.members.length > 0,
      memberRole: community.members.length > 0 ? community.members[0].role : null,
      members: undefined,
    },
  });
}
