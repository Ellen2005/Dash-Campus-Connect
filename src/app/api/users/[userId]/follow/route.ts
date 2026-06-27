import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { userId: followingId } = await params

    if (auth.userId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const following = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true, name: true },
    })

    if (!following) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.userId,
          followingId,
        },
      },
    })

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: auth.userId,
            followingId,
          },
        },
      })

      return NextResponse.json({
        success: true,
        action: 'unfollowed',
        message: `Unfollowed ${following.name}`,
      })
    } else {
      const follow = await prisma.follow.create({
        data: {
          followerId: auth.userId,
          followingId,
        },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
          following: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        action: 'followed',
        follow,
      })
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error)
    return NextResponse.json({ error: 'Failed to follow/unfollow user' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { userId: followingId } = await params

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.userId,
          followingId,
        },
      },
    })

    return NextResponse.json({ following: !!follow })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 })
  }
}
