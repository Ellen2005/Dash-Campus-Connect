import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  try {
    const body = await req.json();
    const { userId, status } = body;
    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status required" }, { status: 400 });
    }

    const existing = await prisma.eventAttendee.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      await prisma.eventAttendee.update({
        where: { id: existing.id },
        data: { status: status as any },
      });
    } else {
      await prisma.eventAttendee.create({
        data: { userId, eventId, status: status as any },
      });

      // Create notification for event organizer
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true, title: true },
      });
      if (event && event.organizerId !== userId) {
        await prisma.notification.create({
          data: {
            userId: event.organizerId,
            type: "EVENT_REMINDER",
            title: "New RSVP",
            message: `Someone is ${status.toLowerCase()} to your event: ${event.title}`,
            actionUrl: `/main/events/${eventId}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[rsvp] Error:", error);
    return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  }
}