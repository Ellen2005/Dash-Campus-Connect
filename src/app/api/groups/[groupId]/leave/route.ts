import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { groupId } = await params

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: auth.userId,
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
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 400 })
    }

    if (membership.group.creatorId === auth.userId) {
      return NextResponse.json({ error: 'Group owner cannot leave their own group' }, { status: 400 })
    }

    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: auth.userId,
          groupId,
        },
      },
    })

    return NextResponse.json({ success: true, message: 'Successfully left group' })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 })
  }
}
