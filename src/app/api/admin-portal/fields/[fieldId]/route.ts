import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;
  const { fieldId } = await params;

  const field = await prisma.fieldOfStudy.findFirst({ where: { id: fieldId, schoolId: session.admin.schoolId } });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const updated = await prisma.fieldOfStudy.update({ where: { id: fieldId }, data: parsed.data });
  return NextResponse.json({ field: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fieldId: string }> }) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;
  const { fieldId } = await params;

  const field = await prisma.fieldOfStudy.findFirst({ where: { id: fieldId, schoolId: session.admin.schoolId } });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  await prisma.fieldOfStudy.delete({ where: { id: fieldId } });
  return NextResponse.json({ success: true });
}
