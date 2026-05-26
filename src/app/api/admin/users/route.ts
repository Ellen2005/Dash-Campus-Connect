import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";

type ListedUser = {
  id: string;
  name: string;
  studentId: string;
  username?: string;
  faculty?: string;
  year?: string;
  role?: string;
  status?: string;
  joined?: string;
};

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  const schoolId = session.admin.schoolId.trim().toLowerCase();
  const statusFilter = (req.nextUrl.searchParams.get("status") ?? "").trim().toLowerCase();

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const users: ListedUser[] = [];
  const perPage = 200;

  try {
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const batch = data?.users ?? [];
      for (const u of batch) {
        const meta = (u.user_metadata ?? {}) as any;
        if ((meta.school_id ?? "").toString().trim().toLowerCase() !== schoolId) continue;
        const status = (meta.status ?? "").toString().trim().toLowerCase();
        if (statusFilter && status !== statusFilter) continue;
        if (!statusFilter && status === "pending") continue;

        users.push({
          id: u.id,
          name: meta.full_name ?? "Student",
          studentId: meta.student_id ?? "",
          username: meta.username,
          faculty: meta.faculty,
          year: meta.year,
          role: meta.role,
          status: meta.status,
          joined: u.created_at ? new Date(u.created_at).toLocaleString() : undefined,
        });
      }

      if (batch.length < perPage) break;
    }
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    const isDns = msg.includes("EAI_AGAIN") || msg.includes("getaddrinfo");
    return NextResponse.json(
      {
        error: isDns
          ? "Temporary network/DNS error while contacting Supabase. Please retry in a few seconds."
          : "Failed to load school users from Supabase.",
      },
      { status: 503 }
    );
  }

  users.sort((a, b) => (a.joined ?? "").localeCompare(b.joined ?? ""));
  return NextResponse.json({ users }, { status: 200 });
}

