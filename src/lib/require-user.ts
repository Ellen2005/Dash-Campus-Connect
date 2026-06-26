/**
 * Shared server-side auth middleware for all protected API routes.
 * Always verifies session from cookies — never trusts client-provided userId.
 */
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AuthResult {
  userId: string;
  dbUser: {
    id: string;
    role: string;
    isStudentAdmin: boolean;
    approvalStatus: string;
    schoolId: string | null;
  };
  user: {
    userId: string;
    dbUser: AuthResult["dbUser"];
  };
  errorResponse: null;
}

export interface AuthError {
  userId: null;
  dbUser: null;
  user: null;
  errorResponse: NextResponse;
}

export async function requireUser(): Promise<AuthResult | AuthError> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        userId: null,
        dbUser: null,
        user: null,
        errorResponse: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

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
        userId: null,
        dbUser: null,
        user: null,
        errorResponse: NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        ),
      };
    }

    if (dbUser.approvalStatus === "SUSPENDED") {
      return {
        userId: null,
        dbUser: null,
        user: null,
        errorResponse: NextResponse.json(
          { error: "Account suspended. Contact your school admin." },
          { status: 403 }
        ),
      };
    }

    if (dbUser.approvalStatus !== "APPROVED") {
      return {
        userId: null,
        dbUser: null,
        user: null,
        errorResponse: NextResponse.json(
          { error: "Account pending approval" },
          { status: 403 }
        ),
      };
    }

    return { 
      userId: user.id, 
      dbUser, 
      user: { userId: user.id, dbUser },
      errorResponse: null 
    };
  } catch (e) {
    console.error("[requireUser] Error:", e);
    return {
      userId: null,
      dbUser: null,
      user: null,
      errorResponse: NextResponse.json(
        { error: "Failed to verify authentication" },
        { status: 500 }
      ),
    };
  }
}
