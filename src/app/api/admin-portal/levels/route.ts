import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createAutoCommunitiesForLevel } from "@/lib/communities";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).default(0),
});

export async function GET() {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const levels = await prisma.level.findMany({
    where: { schoolId: session.admin.schoolId },
    orderBy: { order: "asc" },
    include: { _count: { select: { students: true, communities: true } } },
  });
  return NextResponse.json({ levels });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const existing = await prisma.level.findUnique({
    where: { schoolId_name: { schoolId: session.admin.schoolId, name: parsed.data.name } },
  });
  if (existing) return NextResponse.json({ error: "Level already exists." }, { status: 409 });

  const level = await prisma.level.create({
    data: { name: parsed.data.name, description: parsed.data.description, order: parsed.data.order, schoolId: session.admin.schoolId },
  });

  try {
    await createAutoCommunitiesForLevel(session.admin.schoolId, level.id, level.name);
  } catch (e) {
    console.warn("[levels] Auto-community creation failed:", e);
  }

  return NextResponse.json({ level }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Level ID required." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  // Check if name is taken by another level
  const existing = await prisma.level.findFirst({
    where: { schoolId: session.admin.schoolId, name: parsed.data.name, NOT: { id } },
  });
  if (existing) return NextResponse.json({ error: "Level name already exists." }, { status: 409 });

  const level = await prisma.level.update({
    where: { id },
    data: { name: parsed.data.name, description: parsed.data.description, order: parsed.data.order },
  });

  return NextResponse.json({ level });
}

export async function DELETE(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Level ID required." }, { status: 400 });

  // Check if level has students
  const level = await prisma.level.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!level) return NextResponse.json({ error: "Level not found." }, { status: 404 });
  if (level._count.students > 0) {
    return NextResponse.json({ error: "Cannot delete level with enrolled students." }, { status: 400 });
  }

  await prisma.level.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
