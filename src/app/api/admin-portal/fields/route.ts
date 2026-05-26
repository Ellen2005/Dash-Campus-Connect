import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createAutoCommunitiesForField } from "@/lib/communities";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const fields = await prisma.fieldOfStudy.findMany({
    where: { schoolId: session.admin.schoolId },
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true, communities: true } } },
  });
  return NextResponse.json({ fields });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const existing = await prisma.fieldOfStudy.findUnique({
    where: { schoolId_name: { schoolId: session.admin.schoolId, name: parsed.data.name } },
  });
  if (existing) return NextResponse.json({ error: "Field already exists." }, { status: 409 });

  const field = await prisma.fieldOfStudy.create({
    data: { name: parsed.data.name, description: parsed.data.description, schoolId: session.admin.schoolId },
  });

  try {
    await createAutoCommunitiesForField(session.admin.schoolId, field.id, field.name);
  } catch (e) {
    console.warn("[fields] Auto-community creation failed:", e);
  }

  return NextResponse.json({ field }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Field ID required." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  // Check if name is taken by another field
  const existing = await prisma.fieldOfStudy.findFirst({
    where: { schoolId: session.admin.schoolId, name: parsed.data.name, NOT: { id } },
  });
  if (existing) return NextResponse.json({ error: "Field name already exists." }, { status: 409 });

  const field = await prisma.fieldOfStudy.update({
    where: { id },
    data: { name: parsed.data.name, description: parsed.data.description },
  });

  return NextResponse.json({ field });
}

export async function DELETE(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Field ID required." }, { status: 400 });

  // Check if field has students
  const field = await prisma.fieldOfStudy.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });
  if (field._count.students > 0) {
    return NextResponse.json({ error: "Cannot delete field with enrolled students." }, { status: 400 });
  }

  await prisma.fieldOfStudy.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
