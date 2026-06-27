import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  if (!auth.dbUser.schoolId) {
    return NextResponse.json({ error: "No school assigned to your account." }, { status: 400 });
  }

  try {
    const resolvedSchoolId = auth.dbUser.schoolId;
    const resolvedUserId = auth.userId;

    const communities = await prisma.community.findMany({
      where: { schoolId: resolvedSchoolId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, posts: true } },
        members: { where: { userId: resolvedUserId }, select: { id: true } },
      },
    });

    return NextResponse.json({
      communities: communities.map(c => ({
        ...c,
        isMember: c.members.length > 0,
        members: undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  if (!auth.dbUser.schoolId) {
    return NextResponse.json({ error: "No school assigned to your account." }, { status: 400 });
  }

  const community = await prisma.community.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      schoolId: auth.dbUser.schoolId,
      creatorId: auth.userId,
      type: "STUDENT_CREATED",
    },
  });

  // Auto-join creator
  await prisma.communityMember.create({
    data: { userId: auth.userId, communityId: community.id, role: "OWNER" },
  });

  return NextResponse.json({ community }, { status: 201 });
}