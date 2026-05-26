import { clearAdminSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ success: true }, { status: 200 });
}

