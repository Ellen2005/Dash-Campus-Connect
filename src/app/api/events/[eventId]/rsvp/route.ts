import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'


const RSVPSchema = z.object({
  userId: z.string(),
  status: z.enum(['INTERESTED', 'GOING', 'MAYBE', 'NOT_GOING']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()
    const { userId, status } = RSVPSchema.parse(body)

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, capacity: true, _count: { select: { attendees: true } } },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check capacity if trying to RSVP as GOING
    if (status === 'GOING' && event.capacity && event._count.attendees >= event.capacity) {
      return NextResponse.json({ error: 'Event is at capacity' }, { status: 400 })
    }

    // Upsert RSVP (create or update)
    const rsvp = await prisma.eventAttendee.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        eventId,
        status,
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

    return NextResponse.json(rsvp)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error RSVPing to event:', error)
    return NextResponse.json({ error: 'Failed to RSVP to event' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }

    const rsvp = await prisma.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    return NextResponse.json({ rsvp })
  } catch (error) {
    console.error('Error fetching RSVP:', error)
    return NextResponse.json({ error: 'Failed to fetch RSVP' }, { status: 500 })
  }
}
