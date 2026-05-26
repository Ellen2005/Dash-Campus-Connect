import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(["TECHNICAL", "BEHAVIORAL", "INQUIRY", "BUG_REPORT", "FEATURE_REQUEST"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const schoolId = searchParams.get("schoolId"); // for student-admin view
  const status = searchParams.get("status");

  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  // If schoolId provided, filter by school's students
  if (schoolId && !userId) {
    where.user = { schoolId };
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, username: true } },
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const ticket = await prisma.supportTicket.create({ data: parsed.data });
  return NextResponse.json({ ticket }, { status: 201 });
}
