import { prisma } from "@/lib/prisma";
import { requireAdminOrStudentAdmin } from "@/lib/require-admin-or-student-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Get or create the admin chat group for a school
async function getOrCreateChatGroup(schoolId: string) {
  let group = await prisma.adminChatGroup.findFirst({ where: { schoolId } });
  if (!group) {
    group = await prisma.adminChatGroup.create({ data: { schoolId, name: "Admin Channel" } });
  }
  return group;
}

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAdminOrStudentAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId") ?? user.dbUser.schoolId;

  if (!schoolId) return NextResponse.json({ error: "schoolId required." }, { status: 400 });

  const group = await getOrCreateChatGroup(schoolId);
  const messages = await prisma.adminChatMessage.findMany({
    where: { chatGroupId: group.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ groupId: group.id, messages });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAdminOrStudentAdmin();
  if (errorResponse) return errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = z.object({
    content: z.string().min(1).max(2000),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const schoolId = user.dbUser.schoolId;
  if (!schoolId) return NextResponse.json({ error: "No school assigned." }, { status: 400 });

  const group = await getOrCreateChatGroup(schoolId);
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { name: true, role: true, isStudentAdmin: true },
  });

  const senderRole = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN" ? "admin" : "student_admin";

  const message = await prisma.adminChatMessage.create({
    data: {
      chatGroupId: group.id,
      senderId: user.userId,
      senderName: dbUser?.name ?? "Admin",
      senderRole,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
