import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
  try {
    const body = await request.json();
    const data = SyncUserSchema.parse(body);

    const email = data.email ?? `${data.username}@dash-campus.app`;

    let fieldOfStudyId: string | undefined = data.fieldOfStudyId;
    let levelId: string | undefined = data.levelId;

    if (data.schoolId && data.faculty && !fieldOfStudyId) {
      // Try to find existing field of study or create one
      const existingField = await prisma.fieldOfStudy.findFirst({
        where: {
          schoolId: data.schoolId,
          name: { contains: data.faculty, mode: 'insensitive' }
        }
      });

      if (existingField) {
        fieldOfStudyId = existingField.id;
      } else {
        const newField = await prisma.fieldOfStudy.create({
          data: {
            schoolId: data.schoolId,
            name: data.faculty,
          }
        });
        fieldOfStudyId = newField.id;
      }
    }

    if (data.schoolId && data.year && !levelId) {
      // Try to find existing level or create one
      const existingLevel = await prisma.level.findFirst({
        where: {
          schoolId: data.schoolId,
          name: { contains: data.year, mode: 'insensitive' }
        }
      });

      if (existingLevel) {
        levelId = existingLevel.id;
      } else {
        const newLevel = await prisma.level.create({
          data: {
            schoolId: data.schoolId,
            name: data.year,
            order: parseInt(data.year.replace(/\D/g, '')) || 0,
          }
        });
        levelId = newLevel.id;
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