import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/require-admin";

const BodySchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["student", "student_admin", "admin"]).optional(),
  status: z.enum(["pending", "active", "suspended"]).optional(),
});

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request data." }, { status: 400 });

  const { userId, role, status } = parsed.data;
  if (!role && !status) return NextResponse.json({ error: "No changes provided." }, { status: 400 });

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing, error: getErr } = await supabase.auth.admin.getUserById(userId);
  if (getErr || !existing?.user) {
    return NextResponse.json({ error: getErr?.message ?? "User not found." }, { status: 404 });
  }

  const currentMeta = (existing.user.user_metadata ?? {}) as Record<string, unknown>;
  const userSchoolId = (currentMeta.school_id ?? "").toString().trim().toLowerCase();
  if (userSchoolId !== session.admin.schoolId.trim().toLowerCase()) {
    return NextResponse.json({ error: "You can only update users for your school." }, { status: 403 });
  }

  const nextMeta: Record<string, unknown> = { ...currentMeta };
  if (role) nextMeta.role = role;
  if (status) nextMeta.status = status;

  const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, { user_metadata: nextMeta });
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 200 });
}

