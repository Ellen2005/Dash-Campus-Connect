import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  approverId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  // Verify approver is student-admin or admin
  const approver = await prisma.user.findUnique({ where: { id: parsed.data.approverId } });
  if (!approver || (!approver.isStudentAdmin && approver.role === "USER")) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { approvalStatus: parsed.data.action },
  });

  return NextResponse.json({ event: updated });
}
