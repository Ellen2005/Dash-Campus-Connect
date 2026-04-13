import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }

    let messages
    let conversation

    // Check if it's a direct conversation (format: direct-userId)
    if (conversationId.startsWith('direct-')) {
      const otherUserId = conversationId.replace('direct-', '')

      // Verify the conversation exists (user has messaged this person)
      const hasConversation = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, recipient: otherUserId },
            { senderId: otherUserId, recipient: userId },
          ],
        },
      })

      if (!hasConversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Get messages
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipient: otherUserId },
            { senderId: otherUserId, recipient: userId },
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

      // Get conversation info
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
      // Group conversation
      const group = await prisma.chatGroup.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
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
          },
        },
      })

      if (!group) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      if (!group.members.includes(userId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      messages = group.messages
      conversation = {
        id: group.id,
        type: 'group',
        name: group.name || 'Group Chat',
        photo: group.photo,
        members: group.members,
      }
    }

    const total = messages.length // For simplicity, not calculating total for pagination

    return NextResponse.json({
      conversation,
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}
