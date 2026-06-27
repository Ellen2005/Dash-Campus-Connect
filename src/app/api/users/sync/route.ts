import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SyncUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  fullName: z.string().min(1),
  username: z.string().min(1),
  studentId: z.string().optional(),
  faculty: z.string().optional(),
  year: z.string().optional(),
  fieldOfStudyId: z.string().optional(),
  levelId: z.string().optional(),
  avatar: z.string().optional(),
  schoolId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Require authentication — this API creates/updates user records
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = SyncUserSchema.parse(body);

    // Only allow syncing your own user record (security: prevent mass-create via sync)
    if (data.id !== authUser.id) {
      return NextResponse.json({ error: "You can only sync your own user record" }, { status: 403 });
    }

    const email = data.email ?? `${data.username}@dash-campus.app`;

    let fieldOfStudyId: string | undefined = data.fieldOfStudyId;
    let levelId: string | undefined = data.levelId;

    // Only auto-create fields/levels if explicitly provided (no silent creation)
    if (data.schoolId && data.faculty && !fieldOfStudyId) {
      const existingField = await prisma.fieldOfStudy.findFirst({
        where: {
          schoolId: data.schoolId,
          name: { contains: data.faculty, mode: 'insensitive' }
        }
      });
      if (existingField) {
        fieldOfStudyId = existingField.id;
      }
    }

    if (data.schoolId && data.year && !levelId) {
      const existingLevel = await prisma.level.findFirst({
        where: {
          schoolId: data.schoolId,
          name: { contains: data.year, mode: 'insensitive' }
        }
      });
      if (existingLevel) {
        levelId = existingLevel.id;
      }
    }

    const user = await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email,
        name: data.fullName,
        username: data.username,
        studentId: data.studentId?.trim().toUpperCase(),
        profilePhoto: data.avatar ?? undefined,
        schoolId: data.schoolId ?? undefined,
        fieldOfStudyId,
        levelId,
      },
      create: {
        id: data.id,
        email,
        name: data.fullName,
        username: data.username,
        studentId: data.studentId?.trim().toUpperCase(),
        profilePhoto: data.avatar ?? undefined,
        schoolId: data.schoolId,
        fieldOfStudyId,
        levelId,
      },
      include: {
        fieldOfStudy: { select: { name: true } },
        level: { select: { name: true } },
      },
    });

    return NextResponse.json({ 
      user: {
        ...user,
        major: user.fieldOfStudy?.name,
        year: user.level?.name,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error syncing user profile:", error);
    return NextResponse.json({ error: "Failed to sync user profile" }, { status: 500 });
  }
}