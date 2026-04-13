import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'


const FollowSchema = z.object({
  followerId: z.string(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: followingId } = await params
    const body = await request.json()
    const { followerId } = FollowSchema.parse(body)

    // Cannot follow yourself
    if (followerId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if both users exist
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId }, select: { id: true, name: true } }),
      prisma.user.findUnique({ where: { id: followingId }, select: { id: true, name: true } }),
    ])

    if (!follower || !following) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
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
      // Follow
      const follow = await prisma.follow.create({
        data: {
          followerId,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error following/unfollowing user:', error)
    return NextResponse.json({ error: 'Failed to follow/unfollow user' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: followingId } = await params
    const { searchParams } = new URL(request.url)
    const followerId = searchParams.get('followerId')

    if (!followerId) {
      return NextResponse.json({ error: 'followerId parameter required' }, { status: 400 })
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
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
