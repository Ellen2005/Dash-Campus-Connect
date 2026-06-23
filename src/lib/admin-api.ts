import { prisma } from './prisma';
import { z } from 'zod';

/**
 * Admin API Helper Functions
 */

// ============= Fields Management =============

export async function getFieldsBySchool(schoolId: string) {
  return prisma.fieldOfStudy.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createField(
  schoolId: string,
  name: string,
  description?: string
) {
  // Check for duplicates
  const existing = await prisma.fieldOfStudy.findFirst({
    where: { schoolId, name: { equals: name, mode: 'insensitive' } },
  });

  if (existing) {
    throw new Error('Field already exists');
  }

  const field = await prisma.fieldOfStudy.create({
    data: { schoolId, name, description },
  });

  // Auto-create communities
  const levels = await prisma.level.findMany({ where: { schoolId } });

  // Field-only community
  await prisma.community.create({
    data: {
      name: `${name} Students`,
      description: `Community for all ${name} students`,
      type: 'FIELD_ONLY',
      schoolId,
      fieldOfStudyId: field.id,
      isAutoAssigned: true,
    },
  });

  // Field+Level communities
  for (const level of levels) {
    await prisma.community.create({
      data: {
        name: `${name} - ${level.name}`,
        description: `Community for ${name} students in ${level.name}`,
        type: 'FIELD_AND_LEVEL',
        schoolId,
        fieldOfStudyId: field.id,
        levelId: level.id,
        isAutoAssigned: true,
      },
    });
  }

  return field;
}

export async function updateField(
  fieldId: string,
  schoolId: string,
  data: { name?: string; description?: string }
) {
  const field = await prisma.fieldOfStudy.findUnique({ where: { id: fieldId } });

  if (!field || field.schoolId !== schoolId) {
    throw new Error('Field not found');
  }

  return prisma.fieldOfStudy.update({
    where: { id: fieldId },
    data,
  });
}

export async function deleteField(fieldId: string, schoolId: string) {
  const field = await prisma.fieldOfStudy.findUnique({ where: { id: fieldId } });

  if (!field || field.schoolId !== schoolId) {
    throw new Error('Field not found');
  }

  // Delete communities and their members
  const communities = await prisma.community.findMany({
    where: { fieldOfStudyId: fieldId },
  });

  for (const community of communities) {
    await prisma.communityMember.deleteMany({
      where: { communityId: community.id },
    });
    await prisma.community.delete({ where: { id: community.id } });
  }

  return prisma.fieldOfStudy.delete({ where: { id: fieldId } });
}

// ============= Levels Management =============

export async function getLevelsBySchool(schoolId: string) {
  return prisma.level.findMany({
    where: { schoolId },
    orderBy: { order: 'asc', createdAt: 'asc' },
  });
}

export async function createLevel(
  schoolId: string,
  name: string,
  description?: string,
  order: number = 0
) {
  const existing = await prisma.level.findFirst({
    where: { schoolId, name: { equals: name, mode: 'insensitive' } },
  });

  if (existing) {
    throw new Error('Level already exists');
  }

  const level = await prisma.level.create({
    data: { schoolId, name, description, order },
  });

  // Auto-create communities
  const fields = await prisma.fieldOfStudy.findMany({ where: { schoolId } });

  // Level-only community
  await prisma.community.create({
    data: {
      name: `Level ${name}`,
      description: `Community for all students in Level ${name}`,
      type: 'LEVEL_ONLY',
      schoolId,
      levelId: level.id,
      isAutoAssigned: true,
    },
  });

  // Field+Level communities
  for (const field of fields) {
    await prisma.community.create({
      data: {
        name: `${field.name} - ${name}`,
        description: `Community for ${field.name} students in ${name}`,
        type: 'FIELD_AND_LEVEL',
        schoolId,
        fieldOfStudyId: field.id,
        levelId: level.id,
        isAutoAssigned: true,
      },
    });
  }

  return level;
}

export async function updateLevel(
  levelId: string,
  schoolId: string,
  data: { name?: string; description?: string; order?: number }
) {
  const level = await prisma.level.findUnique({ where: { id: levelId } });

  if (!level || level.schoolId !== schoolId) {
    throw new Error('Level not found');
  }

  return prisma.level.update({
    where: { id: levelId },
    data,
  });
}

export async function deleteLevel(levelId: string, schoolId: string) {
  const level = await prisma.level.findUnique({ where: { id: levelId } });

  if (!level || level.schoolId !== schoolId) {
    throw new Error('Level not found');
  }

  // Delete communities and their members
  const communities = await prisma.community.findMany({
    where: { levelId },
  });

  for (const community of communities) {
    await prisma.communityMember.deleteMany({
      where: { communityId: community.id },
    });
    await prisma.community.delete({ where: { id: community.id } });
  }

  return prisma.level.delete({ where: { id: levelId } });
}

// ============= Students Management =============

export async function filterStudents(
  schoolId: string,
  options?: {
    fieldOfStudyId?: string;
    levelId?: string;
    approvalStatus?: string;
  }
) {
  return prisma.user.findMany({
    where: {
      schoolId,
      ...(options?.fieldOfStudyId && { fieldOfStudyId: options.fieldOfStudyId }),
      ...(options?.levelId && { levelId: options.levelId }),
      ...(options?.approvalStatus && { approvalStatus: options.approvalStatus as any }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      fieldOfStudy: { select: { name: true } },
      level: { select: { name: true } },
      approvalStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStudentCount(
  schoolId: string,
  approvalStatus?: string
) {
  return prisma.user.count({
    where: {
      schoolId,
      ...(approvalStatus && { approvalStatus: approvalStatus as any }),
    },
  });
}

// ============= Validation Schemas =============

export const CreateFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  description: z.string().optional(),
});

export const UpdateFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const CreateLevelSchema = z.object({
  name: z.string().min(1, 'Level name is required'),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const UpdateLevelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
});

export type CreateFieldInput = z.infer<typeof CreateFieldSchema>;
export type UpdateFieldInput = z.infer<typeof UpdateFieldSchema>;
export type CreateLevelInput = z.infer<typeof CreateLevelSchema>;
export type UpdateLevelInput = z.infer<typeof UpdateLevelSchema>;
