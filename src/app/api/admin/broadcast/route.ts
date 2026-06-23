import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(500),
  actionUrl: z.string().url().optional(),
  // Optional: if provided, we only deliver to these specific active users.
  targetUserIds: z.array(z.string().min(1)).optional(),
});

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase admin credentials are missing." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  const message = parsed.data.message.trim();
  const title = (parsed.data.title?.trim() || "School Announcement").slice(0, 200);
  const schoolId = session.admin.schoolId.trim().toLowerCase();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const activeUserIds: string[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const users = data?.users ?? [];
      for (const u of users) {
        const meta = (u.user_metadata ?? {}) as any;
        if ((meta.school_id ?? "").toString().trim().toLowerCase() !== schoolId) continue;
        if ((meta.status ?? "").toString().trim().toLowerCase() !== "active") continue;
        activeUserIds.push(u.id);
      }
      if (users.length < 200) break;
    }

    if (activeUserIds.length === 0) {
      return NextResponse.json({ success: true, delivered: 0 }, { status: 200 });
    }

    const targetUserIds = parsed.data.targetUserIds ?? null;
    const recipients =
      targetUserIds && targetUserIds.length > 0
        ? activeUserIds.filter((id) => targetUserIds.includes(id))
        : activeUserIds;

    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        type: "SYSTEM_ALERT",
        title,
        message,
        actionUrl: parsed.data.actionUrl,
      })),
    });

    return NextResponse.json({ success: true, delivered: recipients.length }, { status: 200 });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to broadcast announcement. ${msg}`.trim() }, { status: 500 });
  }
}

