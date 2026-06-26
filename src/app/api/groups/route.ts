import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-user';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { GroupType } from '@prisma/client'



const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  photo: z.string().optional(),
  type: z.enum(['AUTO_ASSIGNED_DEPARTMENT', 'AUTO_ASSIGNED_YEAR', 'OFFICIAL', 'STUDENT_CREATED', 'COURSE']).default('STUDENT_CREATED'),
  department: z.string().optional(),
  year: z.string().optional(),
  courseCode: z.string().optional(),
  creatorId: z.string(),
  isPublic: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Try cookie auth for school isolation, but allow unauthenticated access for public data
    let schoolId: string | undefined;
    try {
      const result = await requireUser();
      if (!result.errorResponse && result.dbUser) {
        schoolId = result.dbUser.schoolId ?? undefined;
      }
    } catch {
      // Allow unauthenticated access - groups are public data
    }
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Filters
    const typeParam = searchParams.get('type');
    const type = typeParam && ['AUTO_ASSIGNED_DEPARTMENT', 'AUTO_ASSIGNED_YEAR', 'OFFICIAL', 'STUDENT_CREATED', 'COURSE'].includes(typeParam)
      ? typeParam as GroupType
      : undefined;
    const department = searchParams.get('department')
    const year = searchParams.get('year')
    const isPublic = searchParams.get('isPublic') === 'true' ? true : searchParams.get('isPublic') === 'false' ? false : undefined
    const search = searchParams.get('search')
    const creatorId = searchParams.get('creatorId')

    let AND: any[] = []

    // Multi-tenant isolation: Only fetch groups from the same school
    if (schoolId) {
      AND.push({
        OR: [
          { creator: { schoolId: schoolId } },
          { members: { some: { user: { schoolId: schoolId } } } }
        ]
      })
    }

    // Type filter
    if (type) AND.push({ type })

    // Other filters
    if (department) AND.push({ department })
    if (year) AND.push({ year })
    if (isPublic !== undefined) AND.push({ isPublic })
    if (creatorId) AND.push({ creatorId })

    // Search
    if (search) {
      AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      })
    }
    
    let where: any = {}
    if (AND.length > 0) {
      where.AND = AND
    }

    const groups = await prisma.group.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        members: {
          take: 5, // Show first 5 members
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
            events: true,
          },
        },
      },
    })

    const total = await prisma.group.count({ where })

    return NextResponse.json({
      groups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json()
    const groupData = CreateGroupSchema.parse(body)

    const group = await prisma.group.create({
      data: {
        name: groupData.name,
        description: groupData.description,
        photo: groupData.photo,
        type: groupData.type,
        department: groupData.department,
        year: groupData.year,
        courseCode: groupData.courseCode,
        creatorId: groupData.creatorId,
        isPublic: groupData.isPublic,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
    })

    // Auto-add creator as member with OWNER role
    await prisma.groupMember.create({
      data: {
        userId: groupData.creatorId,
        groupId: group.id,
        role: 'OWNER',
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}

