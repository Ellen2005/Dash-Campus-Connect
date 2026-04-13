import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'


const JoinGroupSchema = z.object({
  userId: z.string(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { userId } = JoinGroupSchema.parse(body)

    // Check if group exists and is public
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, isPublic: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.isPublic) {
      return NextResponse.json({ error: 'This group is private' }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 })
    }

    // Add user to group
    const membership = await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    })

    return NextResponse.json(membership)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error joining group:', error)
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
  }
}
