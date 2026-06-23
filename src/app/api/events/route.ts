import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-user';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'



const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().positive().optional(),
  organizerId: z.string(),
  groupId: z.string().optional(),
  isFree: z.boolean().default(true),
  ticketPrice: z.number().positive().optional(),
  bannerImageUrl: z.string().url().optional(),
  category: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Filters
    const category = searchParams.get('category') // upcoming, past, today
    const status = searchParams.get('status') // PENDING, APPROVED, REJECTED
    const groupId = searchParams.get('groupId')
    const organizerId = searchParams.get('organizerId')
    const isFree = searchParams.get('isFree') === 'true' ? true : searchParams.get('isFree') === 'false' ? false : undefined
    const search = searchParams.get('search')

    let where: any = {}

    // Status filtering (overrides default APPROVED)
    const currentUserId = searchParams.get('currentUserId')
    if (status) {
      where.approvalStatus = status
    } else {
      // Show approved events AND the user's own pending/rejected events
      where.OR = [
        { approvalStatus: 'APPROVED' },
        ...(currentUserId ? [{ organizerId: currentUserId }] : [])
      ]
    }

    // Date filtering
    const now = new Date()
    if (category === 'upcoming') {
      where.date = { gte: now }
    } else if (category === 'past') {
      where.date = { lt: now }
    } else if (category === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      where.date = { gte: startOfDay, lt: endOfDay }
    }

    // Other filters
    if (groupId) where.groupId = groupId
    if (organizerId) where.organizerId = organizerId
    if (isFree !== undefined) where.isFree = isFree

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const events = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'asc' },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        attendees: {
          select: {
            id: true,
            userId: true,
            status: true,
            checkedIn: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    })

    const total = await prisma.event.count({ where })

    return NextResponse.json({
      events: events.map((event) => ({
        ...event,
        bannerImageUrl: event.bannerImage || event.qrCheckIn || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json()
    const eventData = CreateEventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        date: new Date(eventData.date),
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        location: eventData.location,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        capacity: eventData.capacity,
        organizerId: eventData.organizerId,
        groupId: eventData.groupId,
        isFree: eventData.isFree,
        ticketPrice: eventData.ticketPrice,
      approvalStatus: 'PENDING',
        bannerImage: eventData.bannerImageUrl,
        category: eventData.category,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

