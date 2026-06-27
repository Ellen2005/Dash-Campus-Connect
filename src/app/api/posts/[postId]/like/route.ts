import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/require-user'


const LikeSchema = z.object({
  reaction: z.string().default('👍'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { postId } = await params
    const body = await request.json()
    const { reaction } = LikeSchema.parse(body)

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: auth.userId,
          postId,
        },
      },
    })

    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: auth.userId,
            postId,
          },
        },
      })

      return NextResponse.json({
        success: true,
        action: 'unliked',
        message: 'Post unliked successfully',
      })
    } else {
      const like = await prisma.like.create({
        data: {
          userId: auth.userId,
          postId,
          reaction,
        },
        include: {
          user: {
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
        action: 'liked',
        like,
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error liking/unliking post:', error)
    return NextResponse.json({ error: 'Failed to like/unlike post' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { postId } = await params

    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: auth.userId,
          postId,
        },
      },
    })

    return NextResponse.json({ liked: !!like, reaction: like?.reaction })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 })
  }
}
