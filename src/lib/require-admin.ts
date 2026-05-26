import { getAdminSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { session: null, errorResponse: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
    }
    return { session, errorResponse: null };
  } catch {
    return { session: null, errorResponse: NextResponse.json({ error: "Admin portal is not configured (database missing)." }, { status: 500 }) };
  }
}

