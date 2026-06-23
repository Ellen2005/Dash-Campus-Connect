import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Verify user is an attendee
    const attendee = await prisma.eventAttendee.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!attendee) {
      return NextResponse.json({ error: "User is not an attendee of this event" }, { status: 403 });
    }

    if (attendee.checkedIn) {
      return NextResponse.json({ success: true, alreadyCheckedIn: true });
    }

    await prisma.eventAttendee.update({
      where: { id: attendee.id },
      data: { checkedIn: true },
    });

    // Log the check-in
    await prisma.activityLog.create({
      data: {
        userId,
        action: "EVENT_CHECKIN",
        resource: `event:${eventId}`,
      },
    });

    return NextResponse.json({ success: true, alreadyCheckedIn: false });
  } catch (error) {
    console.error("[checkin] Error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  try {
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId, checkedIn: true },
      include: {
        user: {
          select: { id: true, name: true, username: true, profilePhoto: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const count = await prisma.eventAttendee.count({
      where: { eventId, checkedIn: true },
    });

    return NextResponse.json({ checkedIn: attendees, count });
  } catch (error) {
    console.error("[checkin GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}