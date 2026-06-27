import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || auth.userId

    if (userId !== auth.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    let messages
    let conversation

    let totalMessages = 0

    if (conversationId.startsWith('direct-')) {
      const otherUserId = conversationId.replace('direct-', '')

      totalMessages = await prisma.message.count({
        where: {
          OR: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId },
          ],
        },
      })

      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
              username: true,
            },
          },
        },
      })

      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          username: true,
        },
      })

      conversation = {
        id: conversationId,
        type: 'direct',
        name: otherUser?.name,
        photo: otherUser?.profilePhoto,
        username: otherUser?.username,
        otherUserId,
      }
    } else {
      totalMessages = await prisma.message.count({
        where: { chatGroupId: conversationId },
      })

      const group = await prisma.chatGroup.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          name: true,
          photo: true,
          members: true,
        },
      })

      if (!group) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      if (!group.members.includes(userId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      messages = await prisma.message.findMany({
        where: { chatGroupId: conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
              username: true,
            },
          },
        },
      })

      conversation = {
        id: group.id,
        type: 'group',
        name: group.name || 'Group Chat',
        photo: group.photo,
        members: group.members,
      }
    }

    // Mark unread messages as read
    const unreadIds = messages
      .filter(m => m.senderId !== userId && !m.isRead)
      .map(m => m.id);
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return NextResponse.json({
      conversation,
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}
