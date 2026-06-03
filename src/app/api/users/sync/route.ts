import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SyncUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  fullName: z.string().min(1),
  username: z.string().min(1),
  faculty: z.string().optional(),
  year: z.string().optional(),
  avatar: z.string().optional(),
  schoolId: z.string().optional(),
  fieldOfStudyId: z.string().optional(),
  levelId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = SyncUserSchema.parse(body);

    const email = data.email ?? `${data.username}@dash-campus.app`;

    const user = await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email,
        name: data.fullName,
        username: data.username,
        profilePhoto: data.avatar ?? undefined,
        schoolId: data.schoolId || undefined,
        fieldOfStudyId: data.fieldOfStudyId || undefined,
        levelId: data.levelId || undefined,
      },
      create: {
        id: data.id,
        email,
        name: data.fullName,
        username: data.username,
        profilePhoto: data.avatar ?? undefined,
        schoolId: data.schoolId || undefined,
        fieldOfStudyId: data.fieldOfStudyId || undefined,
        levelId: data.levelId || undefined,
        approvalStatus: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        profilePhoto: true,
        schoolId: true,
        fieldOfStudyId: true,
        levelId: true,
        fieldOfStudy: {
          select: { name: true },
        },
        level: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error syncing user profile:", error);
    return NextResponse.json({ error: "Failed to sync user profile" }, { status: 500 });
  }
}
