import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getSession() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const period = searchParams.get("period") || "weekly";

  try {
    // Determine date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "daily":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "all":
        startDate = new Date(0);
        break;
      case "weekly":
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const where = schoolId ? { schoolId } : {};
    const dateFilter = { gte: startDate };

    const [
      totalStudents,
      activeStudents,
      postsCount,
      commentsCount,
      eventsCount,
      newEvents,
      flagsCount,
      resolvedFlags,
      openTickets,
      resolvedTickets,
      ordersCount,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, updatedAt: dateFilter } }),
      prisma.post.count({ where: { createdAt: dateFilter } }),
      prisma.comment.count({ where: { createdAt: dateFilter } }),
      prisma.event.count(),
      prisma.event.count({ where: { createdAt: dateFilter } }),
      prisma.moderatorFlag.count({ where: { createdAt: dateFilter } }),
      prisma.moderatorFlag.count({ where: { status: "RESOLVED", resolvedAt: dateFilter } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "RESOLVED", resolvedAt: dateFilter } }),
      prisma.order.count({ where: { createdAt: dateFilter } }),
      prisma.order.aggregate({ where: { createdAt: dateFilter }, _sum: { totalPrice: true } }),
    ]);

    const data = {
      period,
      generatedAt: now.toISOString(),
      schoolId,
      summary: {
        totalStudents,
        activeStudents,
        postsCount,
        commentsCount,
        eventsCount,
        newEvents,
        flagsCount,
        resolvedFlags,
        openTickets,
        resolvedTickets,
        ordersCount,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
      },
      trends: {
        postEngagement: postsCount > 0 ? Math.round((commentsCount / postsCount) * 100) / 100 : 0,
        resolveRate: flagsCount > 0 ? Math.round((resolvedFlags / flagsCount) * 100) : 0,
        ticketCloseRate: openTickets + resolvedTickets > 0
          ? Math.round((resolvedTickets / (openTickets + resolvedTickets)) * 100)
          : 0,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[analytics/export] Error:", error);
    return NextResponse.json({ error: "Failed to export analytics" }, { status: 500 });
  }
}