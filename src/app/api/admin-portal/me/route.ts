import { getAdminSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ admin: null }, { status: 200 });

    return NextResponse.json(
      {
        admin: { id: session.admin.id, name: session.admin.name },
        school: {
          id: session.admin.school.id,
          name: session.admin.school.name,
          allowedDomain: session.admin.school.allowedDomain,
          requireApproval: session.admin.school.requireApproval,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ admin: null, error: "Database not configured." }, { status: 200 });
  }
}

