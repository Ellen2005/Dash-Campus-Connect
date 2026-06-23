import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params

    // Ensure the comment exists and belongs to the post
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, authorId: true },
    })

    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    if (comment.postId !== postId) return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 })

    // TODO: authorize (only author or admin) — currently deletes unconditionally
    await prisma.comment.delete({ where: { id: commentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
