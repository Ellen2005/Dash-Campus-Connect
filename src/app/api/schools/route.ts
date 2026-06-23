import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ schools }, { status: 200 });
  } catch (e: any) {
    console.error("[schools] DB error:", e?.message);
    return NextResponse.json({ schools: [], error: "Failed to load schools." }, { status: 200 });
  }
}
