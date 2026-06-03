import { prisma } from './prisma';

/**
 * Auto-create communities when a field is created
 * Creates 3 types of communities:
 * 1. Field-only community (all students in field)
 * 2. Level-only communities are already created separately
 * 3. Field+Level communities (students in specific field and level combo)
 */
export async function createAutoCommunitiesForField(
  schoolId: string,
  fieldId: string,
  fieldName: string
) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new Error('School not found');

  // Get all existing levels for this school
  const levels = await prisma.level.findMany({ where: { schoolId } });

  // Create field-only community
  await prisma.community.create({
    data: {
      name: `${fieldName} Students`,
      description: `Community for all ${fieldName} students`,
      type: 'FIELD_ONLY',
      schoolId,
      fieldOfStudyId: fieldId,
      isAutoAssigned: true,
    },
  });

  // Create field+level communities
  for (const level of levels) {
    await prisma.community.create({
      data: {
        name: `${fieldName} - ${level.name}`,
        description: `Community for ${fieldName} students in ${level.name}`,
        type: 'FIELD_AND_LEVEL',
        schoolId,
        fieldOfStudyId: fieldId,
        levelId: level.id,
        isAutoAssigned: true,
      },
    });
  }
}

/**
 * Auto-create communities when a level is created
 * Creates 2 types of communities:
 * 1. Level-only community (all students in level)
 * 2. Field+Level communities (for each existing field)
 */
export async function createAutoCommunitiesForLevel(
  schoolId: string,
  levelId: string,
  levelName: string
) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new Error('School not found');

  // Get all existing fields for this school
  const fields = await prisma.fieldOfStudy.findMany({ where: { schoolId } });

  // Create level-only community
  const displayName = levelName.toLowerCase().startsWith('level') ? levelName : `Level ${levelName}`;
  await prisma.community.create({
    data: {
      name: displayName,
      description: `Community for all students in ${displayName}`,
      type: 'LEVEL_ONLY',
      schoolId,
      levelId,
      isAutoAssigned: true,
    },
  });

  // Create field+level communities
  for (const field of fields) {
    await prisma.community.create({
      data: {
        name: `${field.name} - ${levelName}`,
        description: `Community for ${field.name} students in ${levelName}`,
        type: 'FIELD_AND_LEVEL',
        schoolId,
        fieldOfStudyId: field.id,
        levelId,
        isAutoAssigned: true,
      },
    });
  }
}

/**
 * Add student to their 3 auto-assigned communities upon approval
 * Communities:
 * 1. Field-only community
 * 2. Level-only community
 * 3. Field+Level community
 */
export async function assignStudentToCommunities(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { fieldOfStudy: true, level: true },
  });

  if (!user || !user.schoolId || !user.fieldOfStudyId || !user.levelId) {
    throw new Error('User must have school, field, and level assigned');
  }

  const [fieldCommunity, levelCommunity, fieldLevelCommunity] = await Promise.all([
    prisma.community.findFirst({
      where: {
        schoolId: user.schoolId,
        fieldOfStudyId: user.fieldOfStudyId,
        levelId: null,
        type: 'FIELD_ONLY',
      },
    }),
    prisma.community.findFirst({
      where: {
        schoolId: user.schoolId,
        fieldOfStudyId: null,
        levelId: user.levelId,
        type: 'LEVEL_ONLY',
      },
    }),
    prisma.community.findFirst({
      where: {
        schoolId: user.schoolId,
        fieldOfStudyId: user.fieldOfStudyId,
        levelId: user.levelId,
        type: 'FIELD_AND_LEVEL',
      },
    }),
  ]);

  const communities = [fieldCommunity, levelCommunity, fieldLevelCommunity].filter(Boolean) as Array<
    typeof fieldCommunity
  >;

  // Idempotent membership assignment (no duplicates)
  for (const community of communities) {
    await prisma.communityMember.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId: community!.id,
        },
      },
      create: {
        userId,
        communityId: community!.id,
        role: 'MEMBER',
      },
      update: {},
    });
  }
}


/**
 * Remove student from auto-assigned communities (when user is deleted or rejected)
 */
export async function removeStudentFromAutoCommunities(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { communityMemberships: { include: { community: true } } },
  });

  if (!user) return;

  // Find all auto-assigned communities the user is member of
  const autoAssignedMemberships = user.communityMemberships.filter(
    (m) => m.community.isAutoAssigned
  );

  // Remove from those communities
  for (const membership of autoAssignedMemberships) {
    await prisma.communityMember.delete({
      where: { id: membership.id },
    });
  }
}
