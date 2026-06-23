import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = z.object({ userId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "userId required." }, { status: 400 });

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });
  if (community.isAutoAssigned) return NextResponse.json({ error: "Cannot manually join auto-assigned communities." }, { status: 403 });

  const existing = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: parsed.data.userId, communityId } },
  });
  if (existing) return NextResponse.json({ error: "Already a member." }, { status: 409 });

  await prisma.communityMember.create({ data: { userId: parsed.data.userId, communityId, role: "MEMBER" } });
  return NextResponse.json({ success: true });
}
