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

    const count = await prisma.notification.count({
      where: { userId: dashUser.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}