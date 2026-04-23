import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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
      return NextResponse.json(
        { error: "Your account has been suspended. Contact your school admin." },
        { status: 403 }
      );
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
      session: data.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
    }
    console.error("[Login API]", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
