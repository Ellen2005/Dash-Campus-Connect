import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ schools }, { status: 200 });
  } catch {
    // If DB isn't configured yet, keep the UI usable with a small demo list.
    return NextResponse.json(
      {
        schools: [
          { id: "demo", name: "Demo University" },
          { id: "ubuea", name: "University of Buea" },
          { id: "uyd", name: "University of Yaoundé I" },
        ],
        warning: "Database not configured; returning demo schools.",
      },
      { status: 200 }
    );
  }
}

