import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  creatorId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;

    const groups = await prisma.communityGroup.findMany({
      where: { communityId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true } },
        members: {
          take: 3,
          include: {
            user: { select: { id: true, name: true, profilePhoto: true } },
          },
        },
      },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error fetching community groups:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const body = await req.json();
    const parsed = CreateGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, description, isPrivate, creatorId } = parsed.data;

    const group = await prisma.communityGroup.create({
      data: {
        name,
        description,
        isPrivate,
        communityId,
        creatorId,
      },
    });

    // Auto-add creator as owner
    await prisma.communityGroupMember.create({
      data: {
        userId: creatorId,
        groupId: group.id,
        role: "OWNER",
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Error creating community group:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}