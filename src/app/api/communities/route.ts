import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  schoolId: z.string().min(1),
  creatorId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const userId = searchParams.get("userId");

  if (!schoolId) return NextResponse.json({ error: "schoolId required." }, { status: 400 });

  const communities = await prisma.community.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, posts: true } },
      members: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });

  return NextResponse.json({
    communities: communities.map(c => ({
      ...c,
      isMember: userId ? c.members.length > 0 : false,
      members: undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const community = await prisma.community.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      schoolId: parsed.data.schoolId,
      creatorId: parsed.data.creatorId,
      type: "STUDENT_CREATED",
    },
  });

  // Auto-join creator
  await prisma.communityMember.create({
    data: { userId: parsed.data.creatorId, communityId: community.id, role: "OWNER" },
  });

  return NextResponse.json({ community }, { status: 201 });
}
