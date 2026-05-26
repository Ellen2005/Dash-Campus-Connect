import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  schoolId: z.string().optional(),
  authorId: z.string().optional(),
  priority: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).default("NORMAL"),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const status = searchParams.get("status") ?? "PUBLISHED";

  const announcements = await prisma.announcement.findMany({
    where: {
      status: status as any,
      ...(schoolId ? { schoolId } : {}),
    },
    orderBy: [{ priority: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const announcement = await prisma.announcement.create({
    data: {
      ...parsed.data,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : undefined,
    },
  });
  return NextResponse.json({ announcement }, { status: 201 });
}
