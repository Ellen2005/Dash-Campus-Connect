import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      schoolId: session.admin.school.id,
      schoolName: session.admin.school.name,
      adminId: session.admin.id,
      adminName: session.admin.name,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}
