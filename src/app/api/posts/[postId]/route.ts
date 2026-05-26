import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, name: true, profilePhoto: true, username: true },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, profilePhoto: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        likes: { select: { userId: true, reaction: true } },
      },
    })

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    // TODO: authorize (only author or admin) — currently deletes unconditionally
    await prisma.post.delete({ where: { id: postId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
