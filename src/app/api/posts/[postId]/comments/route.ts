import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/require-user'


const CreateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentCommentId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    const total = await prisma.comment.count({
      where: {
        postId,
        parentCommentId: null,
      },
    })

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { postId } = await params
    const body = await request.json()
    const { content, parentCommentId } = CreateCommentSchema.parse(body)

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { id: true, postId: true },
      })

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: 'Parent comment not found or does not belong to this post' }, { status: 400 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: auth.userId,
        postId,
        parentCommentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
