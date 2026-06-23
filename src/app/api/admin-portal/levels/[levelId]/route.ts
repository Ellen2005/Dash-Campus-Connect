import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ levelId: string }> }) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;
  const { levelId } = await params;

  const level = await prisma.level.findFirst({ where: { id: levelId, schoolId: session.admin.schoolId } });
  if (!level) return NextResponse.json({ error: "Level not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const updated = await prisma.level.update({ where: { id: levelId }, data: parsed.data });
  return NextResponse.json({ level: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ levelId: string }> }) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;
  const { levelId } = await params;

  const level = await prisma.level.findFirst({ where: { id: levelId, schoolId: session.admin.schoolId } });
  if (!level) return NextResponse.json({ error: "Level not found." }, { status: 404 });

  await prisma.level.delete({ where: { id: levelId } });
  return NextResponse.json({ success: true });
}
