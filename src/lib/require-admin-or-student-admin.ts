import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function requireAdminOrStudentAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication not configured" },
        { status: 500 }
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Check if user is admin or student admin
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        isStudentAdmin: true,
      },
    });

    if (!dbUser) {
      return {
        session,
        user: session.user,
        errorResponse: NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        ),
      };
    }

    const isAdmin = dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN";
    const isStudentAdmin = dbUser.isStudentAdmin;

    if (!isAdmin && !isStudentAdmin) {
      return {
        session,
        user: session.user,
        errorResponse: NextResponse.json(
          { error: "Admin or student admin access required" },
          { status: 403 }
        ),
      };
    }

    return {
      session,
      user: session.user,
      isAdmin,
      isStudentAdmin,
      errorResponse: null,
    };
  } catch (e) {
    console.error("[requireAdminOrStudentAdmin] Error:", e);
    return {
      session,
      user: session.user,
      errorResponse: NextResponse.json(
        { error: "Failed to verify permissions" },
        { status: 500 }
      ),
    };
  }
}