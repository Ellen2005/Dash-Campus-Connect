import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrStudentAdmin } from "@/lib/require-admin-or-student-admin";

const BodySchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await requireAdminOrStudentAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  const { eventId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  // School isolation: only approve events within your school
  const eventOrganizer = await prisma.user.findUnique({
    where: { id: event.organizerId },
    select: { schoolId: true },
  });
  if (!eventOrganizer || eventOrganizer.schoolId !== auth.schoolId) {
    return NextResponse.json({ error: "You can only approve events for your school." }, { status: 403 });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { approvalStatus: parsed.data.action },
  });

  // Notify the organizer
  await prisma.notification.create({
    data: {
      userId: event.organizerId,
      type: parsed.data.action === "APPROVED" ? "EVENT_APPROVED" : "EVENT_REJECTED",
      title: `Event ${parsed.data.action === "APPROVED" ? "Approved" : "Rejected"}`,
      message: `Your event "${event.title}" has been ${parsed.data.action === "APPROVED" ? "approved" : "rejected"}.`,
      actionUrl: `/main/events/${eventId}`,
    },
  });

  return NextResponse.json({ event: updated });
}
