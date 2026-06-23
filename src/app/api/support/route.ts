import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(["TECHNICAL", "BEHAVIORAL", "INQUIRY", "BUG_REPORT", "FEATURE_REQUEST"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {};
  
  // Students see only their own tickets; admins/student admins can see all in their school
  if (user.dbUser.role === "ADMIN" || user.dbUser.role === "SUPER_ADMIN" || user.dbUser.isStudentAdmin) {
    if (status) where.status = status;
    if (user.dbUser.schoolId) {
      where.user = { schoolId: user.dbUser.schoolId };
    }
  } else {
    // Regular student: only their own tickets
    where.userId = user.userId;
    if (status) where.status = status;
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
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const ticket = await prisma.supportTicket.create({
    data: {
      ...parsed.data,
      userId: user.userId,
    },
  });

  // Fetch all admins and student admins in the author's school to notify them
  const author = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { schoolId: true, name: true }
  });

  if (author?.schoolId) {
    const adminsToNotify = await prisma.user.findMany({
      where: {
        schoolId: author.schoolId,
        OR: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }, { isStudentAdmin: true }]
      },
      select: { id: true }
    });

    if (adminsToNotify.length > 0) {
      const { createNotification } = await import("@/lib/notifications");
      await Promise.all(adminsToNotify.map(admin => 
        createNotification({
          userId: admin.id,
          type: "SUPPORT_REPLY",
          title: "New Support Ticket",
          message: `${author.name} submitted a new support ticket: ${parsed.data.title}`,
          actionUrl: `/main/support/${ticket.id}`
        })
      ));
    }
  }

  return NextResponse.json({ ticket }, { status: 201 });
}
