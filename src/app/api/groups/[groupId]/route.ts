import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
                username: true,
                fieldOfStudy: { select: { name: true } },
                level: { select: { name: true } },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
              },
            },
            comments: {
              take: 3,
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                  },
                },
              },
            },
            likes: {
              select: {
                userId: true,
                reaction: true,
              },
            },
          },
        },
        events: {
          take: 5,
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
              },
            },
            _count: {
              select: {
                attendees: true,
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

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()

    const group = await prisma.group.update({
      where: { id: groupId },
      data: body,
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

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params

    await prisma.group.delete({
      where: { id: groupId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
