import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/require-user';



const SendMessageSchema = z.object({
  recipient: z.string().optional(),
  chatGroupId: z.string().optional(),
  content: z.string().max(2000).optional(),
  images: z.array(z.string()).default([]),
  voiceUrl: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || auth.userId

    // Users can only view their own conversations
    if (userId !== auth.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all conversations for the user
    const [directMessages, groupChats] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
          chatGroupId: null,
        },
        select: {
          senderId: true,
          recipientId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.chatGroup.findMany({
        where: {
          members: {
            has: userId,
          },
        },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  profilePhoto: true,
                },
              },
            },
          },
        },
      }),
    ])

    const directConversations = new Map()

    directMessages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.recipientId : message.senderId
      if (otherUserId && !directConversations.has(otherUserId)) {
        directConversations.set(otherUserId, {
          type: 'direct',
          otherUserId,
          lastMessageAt: message.createdAt,
        })
      }
    })

    const directUserIds = Array.from(directConversations.keys())

    // Get user details for direct conversations
    const directConversationUsers = directUserIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: {
              in: directUserIds,
            },
          },
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        })
      : []

    // Compute unread counts per conversation
    const unreadDirectCounts = new Map<string, number>();
    if (directUserIds.length > 0) {
      const unreadDirectMessages = await prisma.message.groupBy({
        by: ['senderId'],
        where: {
          recipientId: userId,
          senderId: { in: directUserIds },
          isRead: false,
        },
        _count: { id: true },
      });
      unreadDirectMessages.forEach(entry => {
        unreadDirectCounts.set(entry.senderId, entry._count.id);
      });
    }

    const groupIds = groupChats.map(g => g.id);
    const unreadGroupCounts = new Map<string, number>();
    if (groupIds.length > 0) {
      const unreadGroupMessages = await prisma.message.groupBy({
        by: ['chatGroupId'],
        where: {
          chatGroupId: { in: groupIds },
          senderId: { not: userId },
          isRead: false,
        },
        _count: { id: true },
      });
      unreadGroupMessages.forEach(entry => {
        unreadGroupCounts.set(entry.chatGroupId!, entry._count.id);
      });
    }

    // Combine and format conversations
    const conversations = [
      // Direct conversations
      ...directConversationUsers.map(user => ({
        id: `direct-${user.id}`,
        type: 'direct' as const,
        name: user.name,
        photo: user.profilePhoto,
        username: user.username,
        otherUserId: user.id,
        lastMessageAt: directConversations.get(user.id)?.lastMessageAt,
        unreadCount: unreadDirectCounts.get(user.id) ?? 0,
      })),
      // Group conversations
      ...groupChats.map(group => ({
        id: group.id,
        type: 'group' as const,
        name: group.name || 'Group Chat',
        photo: group.photo,
        members: group.members,
        lastMessageAt: group.messages[0]?.createdAt,
        lastMessage: group.messages[0],
        unreadCount: unreadGroupCounts.get(group.id) ?? 0,
      })),
    ]

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return bTime - aTime
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json()
    const { recipient, chatGroupId, content, images, voiceUrl } = SendMessageSchema.parse(body)
    const trimmedContent = (content ?? '').trim()

    if (!recipient && !chatGroupId) {
      return NextResponse.json({ error: 'Either recipient or chatGroupId must be provided' }, { status: 400 })
    }

    if (recipient && chatGroupId) {
      return NextResponse.json({ error: 'Cannot specify both recipient and chatGroupId' }, { status: 400 })
    }

    if (!trimmedContent && images.length === 0 && !voiceUrl) {
      return NextResponse.json({ error: 'Message must contain text, attachment, or audio.' }, { status: 400 })
    }

    if (recipient) {
      const recipientUser = await prisma.user.findUnique({
        where: { id: recipient },
        select: { id: true },
      })

      if (!recipientUser) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
      }
    }

    if (chatGroupId) {
      const group = await prisma.chatGroup.findUnique({
        where: { id: chatGroupId },
        select: { id: true, members: true },
      })

      if (!group) {
        return NextResponse.json({ error: 'Chat group not found' }, { status: 404 })
      }

      if (!group.members.includes(auth.userId)) {
        return NextResponse.json({ error: 'User is not a member of this chat group' }, { status: 403 })
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: auth.userId,
        recipientId: recipient,
        chatGroupId,
        content: trimmedContent || '(attachment)',
        images,
        voiceUrl,
      },
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

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

