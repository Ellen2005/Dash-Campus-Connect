import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Use a real-looking domain that Supabase accepts
// Format: studentid.schoolid@dash-campus.app
function toSyntheticEmail(studentId: string, schoolId: string): string {
  const cleanId = studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSchool = schoolId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanId}.${cleanSchool}@dash-campus.app`;
}

const RegisterSchema = z.object({
  studentId:     z.string().min(2).max(50),
  schoolId:      z.string().min(1).max(50),
  password:      z.string().min(6),
  fullName:      z.string().min(2).max(100),
  username:      z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers and underscores"),
  faculty:       z.string().optional(),
  year:          z.string().optional(),
  fieldOfStudyId: z.string().optional(),
  levelId:       z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server auth is not configured. Contact the administrator." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await request.json();
    const { studentId, schoolId, password, fullName, username, faculty, year, fieldOfStudyId, levelId } = RegisterSchema.parse(body);

    const email = toSyntheticEmail(studentId, schoolId);

    // Check if already registered
    const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) {
      return NextResponse.json({ error: `Unable to validate account uniqueness: ${listError.message}` }, { status: 503 });
    }
    const alreadyExists = existing?.users?.some(u => u.email === email);
    if (alreadyExists) {
      return NextResponse.json(
        { error: "This Student ID is already registered for this school. Try signing in instead." },
        { status: 409 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        student_id: studentId.trim().toUpperCase(),
        full_name:  fullName,
        username:   username.toLowerCase(),
        school_id:  schoolId,
        faculty:    faculty ?? "",
        year:       year ?? "",
        field_of_study_id: fieldOfStudyId ?? "",
        level_id:       levelId ?? "",
        role:       "student",
        status:     "pending",
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? "Failed to create account.";
      const isDuplicate = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate");
      return NextResponse.json(
        { error: isDuplicate ? "This Student ID is already registered. Try signing in instead." : msg },
        { status: isDuplicate ? 409 : 400 }
      );
    }

    // Create DB profile (non-fatal if DB not connected)
    try {
      await prisma.user.create({
        data: {
          id:             authData.user.id,
          email,
          name:           fullName,
          username:       username.toLowerCase(),
          schoolId:       schoolId || undefined,
          fieldOfStudyId: fieldOfStudyId || undefined,
          levelId:        levelId || undefined,
          approvalStatus: 'PENDING',
        },
      });
    } catch (dbErr) {
      console.warn("[Register] DB profile creation failed (non-fatal):", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Registration submitted. Awaiting admin approval.",
      studentId: studentId.trim().toUpperCase(),
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const msg = (error as any)?.message?.toString?.() ?? "";
    const isDns = msg.includes("EAI_AGAIN") || msg.includes("getaddrinfo");
    if (isDns) {
      return NextResponse.json(
        { error: "Temporary network/DNS error while contacting Supabase. Please retry." },
        { status: 503 }
      );
    }
    console.error("[Register API]", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
