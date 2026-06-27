import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { postId, commentId } = await params

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, authorId: true },
    })

    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    if (comment.postId !== postId) return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 })

    if (comment.authorId !== auth.userId && auth.dbUser.role !== 'ADMIN' && auth.dbUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
    }

    await prisma.comment.delete({ where: { id: commentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
