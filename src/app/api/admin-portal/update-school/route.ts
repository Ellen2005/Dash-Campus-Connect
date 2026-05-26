import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  name: z.string().min(3).max(120).optional(),
  allowedDomain: z.string().max(120).optional().nullable(),
  requireApproval: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  const data = parsed.data;
  if (data.name === undefined && data.allowedDomain === undefined && data.requireApproval === undefined) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  let updated;
  try {
    updated = await prisma.school.update({
      where: { id: session.admin.schoolId },
      data: {
        name: data.name?.trim() ?? undefined,
        allowedDomain: data.allowedDomain === undefined ? undefined : (data.allowedDomain ? data.allowedDomain.trim() : null),
        requireApproval: data.requireApproval,
      },
      select: { id: true, name: true, allowedDomain: true, requireApproval: true },
    });
  } catch {
    return NextResponse.json({ error: "Database not configured. Set DATABASE_URL and run Prisma migrations." }, { status: 500 });
  }

  return NextResponse.json({ success: true, school: updated }, { status: 200 });
}

