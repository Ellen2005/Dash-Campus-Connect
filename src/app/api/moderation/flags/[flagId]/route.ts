import { prisma } from "@/lib/prisma";
import { requireAdminOrStudentAdmin } from "@/lib/require-admin-or-student-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "DISMISSED"]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { flagId: string } }
) {
  const { errorResponse } = await requireAdminOrStudentAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { flagId } = await params;
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const flag = await prisma.moderatorFlag.update({
      where: { id: flagId },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ flag, success: true });
  } catch (error) {
    console.error("[moderation/flags/[flagId]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update flag" },
      { status: 500 }
    );
  }
}