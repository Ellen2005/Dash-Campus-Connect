import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'


const CheckInSchema = z.object({
  userId: z.string(),
  qrCode: z.string().optional(), // For QR code validation
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()
    const { userId, qrCode } = CheckInSchema.parse(body)

    // Check if user is RSVP'd to the event
    const attendee = await prisma.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    if (!attendee) {
      return NextResponse.json({ error: 'User is not RSVP\'d to this event' }, { status: 400 })
    }

    // Check QR code if provided
    if (qrCode) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { qrCheckIn: true },
      })

      if (!event?.qrCheckIn || event.qrCheckIn !== qrCode) {
        return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
      }
    }

    // Update check-in status
    const updatedAttendee = await prisma.eventAttendee.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: {
        checkedIn: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      attendee: updatedAttendee,
      message: 'Successfully checked in to event',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error checking in to event:', error)
    return NextResponse.json({ error: 'Failed to check in to event' }, { status: 500 })
  }
}
