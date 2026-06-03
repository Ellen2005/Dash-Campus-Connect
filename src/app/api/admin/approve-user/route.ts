import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { assignStudentToCommunities } from "@/lib/communities";

const BodySchema = z.object({ userId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request data." }, { status: 400 });

  const { userId } = parsed.data;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing, error: getErr } = await supabase.auth.admin.getUserById(userId);
  if (getErr || !existing?.user) {
    return NextResponse.json({ error: getErr?.message ?? "User not found." }, { status: 404 });
  }

  const currentMeta = (existing.user.user_metadata ?? {}) as Record<string, unknown>;
  const userSchoolId = (currentMeta.school_id ?? "").toString().trim().toLowerCase();
  if (userSchoolId !== session.admin.schoolId.trim().toLowerCase()) {
    return NextResponse.json({ error: "You can only approve users for your school." }, { status: 403 });
  }

  const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...currentMeta, status: "active" },
  });
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Run all DB changes in a single transaction so partial failures don't leave the system in a broken state.
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Approve the user
      await tx.user.update({
        where: { id: userId },
        data: { approvalStatus: "APPROVED" },
      });

      // 2. Send a notification so the student knows they're in.
      await tx.notification.create({
        data: {
          userId,
          type: "SYSTEM_ALERT",
          title: "🎉 Your account has been approved!",
          message:
            "Welcome to Dash! You now have full access to the platform, your communities, and all features.",
          actionUrl: "/main",
        },
      });

      // 3. Activity log entry
      await tx.activityLog.create({
        data: {
          userId,
          action: "STUDENT_APPROVED",
          resource: "user",
        },
      });
    });

    // 4. Assign communities (manages its own idempotent upserts outside the tx)
    await assignStudentToCommunities(userId);
  } catch (e) {
    console.error("[approve-user] DB transaction failed:", e);
    return NextResponse.json(
      {
        error:
          "Approval succeeded in auth, but the database update failed. Please contact support.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
