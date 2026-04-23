import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toSyntheticEmail(studentId: string, schoolId: string): string {
  const cleanId = studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSchool = schoolId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanId}@${cleanSchool}.dash.internal`;
}

const RegisterSchema = z.object({
  studentId:  z.string().min(2).max(50),
  schoolId:   z.string().min(1).max(50),
  password:   z.string().min(6),
  fullName:   z.string().min(2).max(100),
  username:   z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers and underscores"),
  faculty:    z.string().optional(),
  year:       z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, schoolId, password, fullName, username, faculty, year } = RegisterSchema.parse(body);

    const email = toSyntheticEmail(studentId, schoolId);

    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.some(u => u.email === email);
    if (alreadyExists) {
      return NextResponse.json(
        { error: "This Student ID is already registered. Try signing in instead." },
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
        role:       "student",
        status:     "pending",
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Failed to create account." },
        { status: 400 }
      );
    }

    try {
      await prisma.user.create({
        data: {
          id:       authData.user.id,
          email,
          name:     fullName,
          username: username.toLowerCase(),
          major:    faculty,
          year,
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
      const msg = error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("[Register API]", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
