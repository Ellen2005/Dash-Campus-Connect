import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    content: z.string().min(1).max(5000),
    senderId: z.string().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const message = await prisma.ticketMessage.create({
    data: { ticketId, content: parsed.data.content, senderId: parsed.data.senderId },
  });

  // Auto-set to IN_PROGRESS when admin replies
  if (parsed.data.senderId) {
    await prisma.supportTicket.updateMany({
      where: { id: ticketId, status: "OPEN" },
      data: { status: "IN_PROGRESS" },
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}
