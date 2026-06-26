import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { userId, errorResponse, dbUser } = await requireUser();
  if (errorResponse) return errorResponse;

  const { ticketId } = await params;

  // Verify access (must be admin/studentAdmin or the ticket creator)
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { userId: true },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN" || dbUser?.isStudentAdmin;
  if (!isAdmin && ticket.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId },
    include: {
      sender: {
        select: { id: true, name: true, profilePhoto: true, username: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { userId, errorResponse, dbUser } = await requireUser();
  if (errorResponse) return errorResponse;

  const { ticketId } = await params;

  // Verify access
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { userId: true, status: true, user: { select: { schoolId: true } } },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isFullAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";
  const isAuthor = ticket.userId === userId;

  if (!isFullAdmin && !isAuthor) {
    return NextResponse.json({ error: "Unauthorized to reply to this ticket" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.object({
    content: z.string().min(1).max(5000),
  }).safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const message = await prisma.ticketMessage.create({
    data: { 
      ticketId, 
      content: parsed.data.content, 
      senderId: userId,
      isAdmin: isFullAdmin,
    },
  });

  // Update ticket status and notify the other party
  if (isFullAdmin) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" },
    });

    // Notify the student that admin replied
    const { createNotification } = await import("@/lib/notifications");
    await createNotification({
      userId: ticket.userId,
      type: "SUPPORT_REPLY",
      title: "Support Ticket Update",
      message: "An admin has replied to your support ticket.",
      actionUrl: `/main/support/${ticketId}`,
    });
  } else if (isAuthor) {
    // Notify admins that student replied
    const ticketSchoolId = ticket.user?.schoolId;

    if (ticketSchoolId) {
      const adminsToNotify = await prisma.user.findMany({
        where: {
          schoolId: ticketSchoolId,
          OR: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }, { isStudentAdmin: true }],
        },
        select: { id: true },
      });

      if (adminsToNotify.length > 0) {
        const { createNotification } = await import("@/lib/notifications");
        await Promise.all(
          adminsToNotify.map((admin) =>
            createNotification({
              userId: admin.id,
              type: "SUPPORT_REPLY",
              title: "Support Ticket Reply",
              message: "A student replied to a support ticket.",
              actionUrl: `/main/support/${ticketId}`,
            })
          )
        );
      }
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}
