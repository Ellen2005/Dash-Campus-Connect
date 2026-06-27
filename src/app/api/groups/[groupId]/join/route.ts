import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { z } from 'zod'

const JOIN_REQUEST_TITLE = 'GROUP_JOIN_REQUEST';
const joinRequestToken = (groupId: string, userId: string) => `JOIN_REQ::${groupId}::${userId}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { groupId } = await params

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, isPublic: true, creatorId: true, name: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: auth.userId,
          groupId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    if (!group.isPublic) {
      if (!group.creatorId) {
        return NextResponse.json({ error: 'Private group has no owner configured.' }, { status: 500 })
      }

      const token = joinRequestToken(groupId, auth.userId)
      const existingRequest = await prisma.notification.findFirst({
        where: {
          userId: group.creatorId,
          type: 'SYSTEM_ALERT',
          title: JOIN_REQUEST_TITLE,
          message: { contains: token },
          isRead: false,
        },
        select: { id: true },
      })

      if (existingRequest) {
        return NextResponse.json({ success: true, requested: true, message: 'Join request already pending approval.' })
      }

      await prisma.notification.create({
        data: {
          userId: group.creatorId,
          type: 'SYSTEM_ALERT',
          title: JOIN_REQUEST_TITLE,
          message: `${token}::${group.name ?? 'Private group'}`,
        },
      })

      return NextResponse.json({ success: true, requested: true, message: 'Join request sent to group owner.' })
    }

    const membership = await prisma.groupMember.create({
      data: {
        userId: auth.userId,
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
