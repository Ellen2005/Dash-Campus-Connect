import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ count: 0 });
    }

    const dashUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!dashUser) {
      return NextResponse.json({ count: 0 });
    }

    // 1-on-1 unread messages where current user is the recipient
    const directUnread = await prisma.message.count({
      where: {
        recipientId: dashUser.id,
        isRead: false,
      },
    });

    // Group unread messages where current user is a member but not the sender
    const userGroups = await prisma.chatGroup.findMany({
      where: { members: { has: dashUser.id } },
      select: { id: true },
    });

    const groupIds = userGroups.map(g => g.id);
    const groupUnread = groupIds.length > 0
      ? await prisma.message.count({
          where: {
            chatGroupId: { in: groupIds },
            senderId: { not: dashUser.id },
            isRead: false,
          },
        })
      : 0;

    return NextResponse.json({ count: directUnread + groupUnread });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
