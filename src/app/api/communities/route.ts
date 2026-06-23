import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  schoolId: z.string().min(1),
  creatorId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const userId = searchParams.get("userId");

    // Try cookie auth first, fall back to query params for backward compatibility
    let resolvedSchoolId = schoolId;
    let resolvedUserId = userId;
    
    if (!resolvedSchoolId || !resolvedUserId) {
      const { user } = await requireUser();
      resolvedSchoolId = resolvedSchoolId ?? user.dbUser.schoolId;
      resolvedUserId = resolvedUserId ?? user.userId;
    }

    if (!resolvedSchoolId) return NextResponse.json({ error: "schoolId required." }, { status: 400 });

    const communities = await prisma.community.findMany({
      where: { schoolId: resolvedSchoolId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, posts: true } },
        members: resolvedUserId ? { where: { userId: resolvedUserId }, select: { id: true } } : false,
      },
    });

    return NextResponse.json({
      communities: communities.map(c => ({
        ...c,
        isMember: resolvedUserId ? c.members.length > 0 : false,
        members: undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

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