import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { eventId } = await params;
  try {
    const body = await req.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status required" }, { status: 400 });
    }

    // Only allow RSVPing for yourself
    if (userId !== auth.userId) {
      return NextResponse.json({ error: "You can only RSVP for yourself" }, { status: 403 });
    }

    const existing = await prisma.eventAttendee.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (status === "NOT_GOING" || status === "CANCELLED") {
      if (existing) {
        await prisma.eventAttendee.delete({ where: { id: existing.id } });
      }
      return NextResponse.json({ success: true });
    }

    if (existing) {
      await prisma.eventAttendee.update({
        where: { id: existing.id },
        data: { status: status as any },
      });
    } else {
      await prisma.eventAttendee.create({
        data: { userId, eventId, status: status as any },
      });

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