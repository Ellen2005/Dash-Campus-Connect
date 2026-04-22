import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'



const SendMessageSchema = z.object({
  senderId: z.string(),
  recipient: z.string().optional(),
  chatGroupId: z.string().optional(),
  content: z.string().min(1).max(2000),
  images: z.array(z.string()).default([]),
  voiceUrl: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }

    // Get all conversations for the user
    // This includes both direct messages and group chats
    const [directMessages, groupChats] = await Promise.all([
      // Get unique recipients from direct messages
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { recipient: userId },
          ],
          chatGroupId: null, // Only direct messages
        },
        select: {
          senderId: true,
          recipient: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Get group chats the user is in
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

    // Process direct message conversations
    const directConversations = new Map()

    directMessages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.recipient : message.senderId
      if (otherUserId && !directConversations.has(otherUserId)) {
        directConversations.set(otherUserId, {
          type: 'direct',
          otherUserId,
          lastMessageAt: message.createdAt,
        })
      }
    })

    // Get user details for direct conversations
    const directConversationUsers = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(directConversations.keys()),
        },
      },
      select: {
        id: true,
        name: true,
        profilePhoto: true,
        username: true,
      },
    })

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
  try {
    const body = await request.json()
    const { senderId, recipient, chatGroupId, content, images, voiceUrl } = SendMessageSchema.parse(body)

    // Validate that either recipient or chatGroupId is provided
    if (!recipient && !chatGroupId) {
      return NextResponse.json({ error: 'Either recipient or chatGroupId must be provided' }, { status: 400 })
    }

    if (recipient && chatGroupId) {
      return NextResponse.json({ error: 'Cannot specify both recipient and chatGroupId' }, { status: 400 })
    }

    // For direct messages, check if recipient exists
    if (recipient) {
      const recipientUser = await prisma.user.findUnique({
        where: { id: recipient },
        select: { id: true },
      })

      if (!recipientUser) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
      }
    }

    // For group messages, check if group exists and user is a member
    if (chatGroupId) {
      const group = await prisma.chatGroup.findUnique({
        where: { id: chatGroupId },
        select: { id: true, members: true },
      })

      if (!group) {
        return NextResponse.json({ error: 'Chat group not found' }, { status: 404 })
      }

      if (!group.members.includes(senderId)) {
        return NextResponse.json({ error: 'User is not a member of this chat group' }, { status: 403 })
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        recipient,
        chatGroupId,
        content,
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

