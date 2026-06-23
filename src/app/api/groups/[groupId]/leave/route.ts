import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'


const LeaveGroupSchema = z.object({
  userId: z.string(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { userId } = LeaveGroupSchema.parse(body)

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      include: {
        group: {
          select: {
            creatorId: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 400 })
    }

    // Prevent owner from leaving their own group
    if (membership.group.creatorId === userId) {
      return NextResponse.json({ error: 'Group owner cannot leave their own group' }, { status: 400 })
    }

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })

    return NextResponse.json({ success: true, message: 'Successfully left group' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error leaving group:', error)
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 })
  }
}
