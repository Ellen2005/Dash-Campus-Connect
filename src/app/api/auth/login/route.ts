import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

// Must match the format used in register
function toSyntheticEmail(studentId: string, schoolId: string): string {
  const cleanId = studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSchool = schoolId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanId}.${cleanSchool}@dash-campus.app`;
}

const LoginSchema = z.object({
  studentId: z.string().min(2).max(50),
  schoolId:  z.string().min(1).max(50),
  password:  z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, schoolId, password } = LoginSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const email = toSyntheticEmail(studentId, schoolId);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json(
        { error: "Incorrect Student ID or password. Please try again." },
        { status: 401 }
      );
    }

    const meta = data.user.user_metadata ?? {};
    if (meta.status === "suspended") {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Your account has been suspended. Contact your school admin." },
        { status: 403 }
      );
    }

    if (meta.status === "pending" || meta.status === "rejected") {
      await supabase.auth.signOut();
      const msg =
        meta.status === "rejected"
          ? "Your registration was not approved. Contact your school admin."
          : "Your account is pending admin approval. You will be notified when approved.";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { approvalStatus: true },
      });
      if (dbUser?.approvalStatus === "PENDING" || dbUser?.approvalStatus === "REJECTED") {
        await supabase.auth.signOut();
        const msg =
          dbUser.approvalStatus === "REJECTED"
            ? "Your registration was not approved. Contact your school admin."
            : "Your account is pending admin approval.";
        return NextResponse.json({ error: msg }, { status: 403 });
      }
      if (dbUser?.approvalStatus === "SUSPENDED") {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: "Your account has been suspended. Contact your school admin." },
          { status: 403 }
        );
      }
    } catch {
      // DB optional during login
    }

    return NextResponse.json({
      success: true,
      user: {
        id:        data.user.id,
        studentId: meta.student_id,
        fullName:  meta.full_name,
        username:  meta.username,
        schoolId:  meta.school_id,
        faculty:   meta.faculty,
        year:      meta.year,
        role:      meta.role ?? "student",
        status:    meta.status ?? "pending",
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
        user: data.session.user,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
    }
    console.error("[Login API]", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
