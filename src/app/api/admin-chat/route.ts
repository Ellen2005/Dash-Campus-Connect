import { prisma } from "@/lib/prisma";
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
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const senderId = searchParams.get("senderId");
  const senderRole = searchParams.get("senderRole");

  if (!schoolId) return NextResponse.json({ error: "schoolId required." }, { status: 400 });

  // Only admins and student-admins can access
  if (!senderId || !["admin", "student_admin"].includes(senderRole ?? "")) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  const group = await getOrCreateChatGroup(schoolId);
  const messages = await prisma.adminChatMessage.findMany({
    where: { chatGroupId: group.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ groupId: group.id, messages });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    schoolId: z.string().min(1),
    senderId: z.string().min(1),
    senderName: z.string().min(1),
    senderRole: z.enum(["admin", "student_admin"]),
    content: z.string().min(1).max(2000),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const group = await getOrCreateChatGroup(parsed.data.schoolId);
  const message = await prisma.adminChatMessage.create({
    data: {
      chatGroupId: group.id,
      senderId: parsed.data.senderId,
      senderName: parsed.data.senderName,
      senderRole: parsed.data.senderRole,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
