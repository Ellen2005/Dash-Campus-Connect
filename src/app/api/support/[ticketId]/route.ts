import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, username: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"]).optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const data: any = { ...parsed.data };
  if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") {
    data.resolvedAt = new Date();
  }

  const ticket = await prisma.supportTicket.update({ where: { id: ticketId }, data });
  return NextResponse.json({ ticket });
}
