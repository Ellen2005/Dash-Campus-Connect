import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { communityId } = await params;
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });
  if (community.isAutoAssigned) return NextResponse.json({ error: "Cannot manually join auto-assigned communities." }, { status: 403 });

  const existing = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: auth.userId, communityId } },
  });
  if (existing) return NextResponse.json({ error: "Already a member." }, { status: 409 });

  await prisma.communityMember.create({ data: { userId: auth.userId, communityId, role: "MEMBER" } });
  return NextResponse.json({ success: true });
}
