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
  await prisma.community.create({
    data: {
      name: `Level ${levelName}`,
      description: `Community for all students in Level ${levelName}`,
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
 * Ensure auto-assigned communities exist for a user's field and level,
 * then add the student to their 3 auto-assigned communities upon approval.
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

  // Guard against null relations - TypeScript strict mode requires this
  const fieldOfStudy = user.fieldOfStudy;
  const level = user.level;
  if (!fieldOfStudy || !level) {
    throw new Error('User field of study or level data is missing');
  }

  // Ensure field-only community exists
  let fieldCommunity = await prisma.community.findFirst({
    where: {
      schoolId: user.schoolId,
      fieldOfStudyId: user.fieldOfStudyId,
      levelId: null,
      type: 'FIELD_ONLY',
    },
  });
  if (!fieldCommunity) {
    fieldCommunity = await prisma.community.create({
      data: {
        name: `${fieldOfStudy.name} Students`,
        description: `Community for all ${fieldOfStudy.name} students`,
        type: 'FIELD_ONLY',
        schoolId: user.schoolId,
        fieldOfStudyId: user.fieldOfStudyId,
        isAutoAssigned: true,
      },
    });
  }

  // Ensure level-only community exists
  let levelCommunity = await prisma.community.findFirst({
    where: {
      schoolId: user.schoolId,
      fieldOfStudyId: null,
      levelId: user.levelId,
      type: 'LEVEL_ONLY',
    },
  });
  if (!levelCommunity) {
    levelCommunity = await prisma.community.create({
      data: {
        name: `Level ${level.name}`,
        description: `Community for all students in Level ${level.name}`,
        type: 'LEVEL_ONLY',
        schoolId: user.schoolId,
        levelId: user.levelId,
        isAutoAssigned: true,
      },
    });
  }

  // Ensure field+level community exists
  let fieldLevelCommunity = await prisma.community.findFirst({
    where: {
      schoolId: user.schoolId,
      fieldOfStudyId: user.fieldOfStudyId,
      levelId: user.levelId,
      type: 'FIELD_AND_LEVEL',
    },
  });
  if (!fieldLevelCommunity) {
    fieldLevelCommunity = await prisma.community.create({
      data: {
        name: `${fieldOfStudy.name} - ${level.name}`,
        description: `Community for ${fieldOfStudy.name} students in ${level.name}`,
        type: 'FIELD_AND_LEVEL',
        schoolId: user.schoolId,
        fieldOfStudyId: user.fieldOfStudyId,
        levelId: user.levelId,
        isAutoAssigned: true,
      },
    });
  }

  const communities = [fieldCommunity, levelCommunity, fieldLevelCommunity];

  // Add user to each community
  for (const community of communities) {
    // Check if already member
    const existing = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
    });

    if (!existing) {
      await prisma.communityMember.create({
        data: {
          userId,
          communityId: community.id,
          role: 'MEMBER',
        },
      });
    }
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
