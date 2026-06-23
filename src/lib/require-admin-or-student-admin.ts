import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function requireAdminOrStudentAdmin() {
  try {
    // Use cookie-based server client — reads session from httpOnly cookies
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        session: null,
        user: null,
        errorResponse: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    // Verify role in the database — never trust client-provided userId
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        isStudentAdmin: true,
        approvalStatus: true,
        schoolId: true,
      },
    });

    if (!dbUser) {
      return {
        session: null,
        user: null,
        errorResponse: NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        ),
      };
    }

    if (dbUser.approvalStatus === "SUSPENDED") {
      return {
        session: null,
        user: null,
        errorResponse: NextResponse.json(
          { error: "Account suspended" },
          { status: 403 }
        ),
      };
    }

    const isAdmin = dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN";
    const isStudentAdmin = dbUser.isStudentAdmin;

    if (!isAdmin && !isStudentAdmin) {
      return {
        session: null,
        user,
        errorResponse: NextResponse.json(
          { error: "Admin or student admin access required" },
          { status: 403 }
        ),
      };
    }

    return {
      session: { user },
      user,
      dbUser,
      isAdmin,
      isStudentAdmin,
      schoolId: dbUser.schoolId,
      errorResponse: null,
    };
  } catch (e) {
    console.error("[requireAdminOrStudentAdmin] Error:", e);
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json(
        { error: "Failed to verify permissions" },
        { status: 500 }
      ),
    };
  }
}