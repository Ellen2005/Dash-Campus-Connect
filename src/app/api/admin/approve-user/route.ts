import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { assignStudentToCommunities } from "@/lib/communities";
import { createNotification } from "@/lib/notifications";

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
  try {
    body = await request.json();
  } catch {
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

  // Update Prisma DB first — if this fails, the auth update is never attempted
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: "APPROVED" },
    });
  } catch (e) {
    console.error("[approve-user] DB update failed:", e);
    return NextResponse.json({ error: "Database error. User not approved." }, { status: 500 });
  }

  // Then update auth metadata — this is authoritative for login checks
  const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...currentMeta, status: "active" },
  });
  if (updateErr) {
    // Rollback the DB update since auth update failed
    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: "PENDING" },
    }).catch(() => {});
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Assign communities (best-effort, non-fatal)
  try {
    await assignStudentToCommunities(userId);
  } catch (e) {
    console.error("[approve-user] Community assignment failed (non-fatal):", e);
  }

  // Send notification (best-effort)
  try {
    await createNotification({
      userId,
      type: "SYSTEM_ALERT",
      title: "Account approved",
      message: "Your student account has been approved. Welcome to Dash!",
      actionUrl: "/main",
    });
  } catch (e) {
    console.error("[approve-user] Notification failed (non-fatal):", e);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
