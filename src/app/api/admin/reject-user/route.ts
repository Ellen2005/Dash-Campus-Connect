import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server auth is not configured. Missing Supabase environment variables." },
      { status: 500 }
    );
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

  const { userId, reason } = parsed.data;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing, error: getErr } = await supabase.auth.admin.getUserById(userId);
  if (getErr || !existing?.user) {
    return NextResponse.json({ error: getErr?.message ?? "User not found." }, { status: 404 });
  }

  const currentMeta = (existing.user.user_metadata ?? {}) as Record<string, unknown>;
  const userSchoolId = (currentMeta.school_id ?? "").toString().trim().toLowerCase();
  if (userSchoolId !== session.admin.schoolId.trim().toLowerCase()) {
    return NextResponse.json({ error: "You can only reject users for your school." }, { status: 403 });
  }

  // 1. Update Prisma DB first — mark as REJECTED (keep the record for audit purposes)
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          approvalStatus: "REJECTED",
          approvalRejectedReason: reason ?? null,
        },
      });

      // Send a notification to the user explaining the rejection
      await tx.notification.create({
        data: {
          userId,
          type: "SYSTEM_ALERT",
          title: "Account registration not approved",
          message: reason
            ? `Your registration was not approved. Reason: ${reason}`
            : "Your registration was reviewed and was not approved at this time. Please contact your school administrator for more information.",
          actionUrl: "/",
        },
      });

      // Activity log
      await tx.activityLog.create({
        data: {
          userId,
          action: "STUDENT_REJECTED",
          resource: "user",
        },
      });
    });
  } catch (e) {
    console.error("[reject-user] DB update failed:", e);
    return NextResponse.json(
      { error: "Failed to update user status in the database." },
      { status: 500 }
    );
  }

  // 2. Delete the user from Supabase Auth so they cannot log in
  const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId);
  if (deleteErr) {
    // DB is already updated; log the auth deletion failure but don't block the response
    console.error("[reject-user] Supabase auth deletion failed:", deleteErr.message);
    return NextResponse.json(
      { error: `User marked as rejected in DB, but auth deletion failed: ${deleteErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
