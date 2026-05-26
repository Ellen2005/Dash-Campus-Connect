import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ notifications }, { status: 200 });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to load notifications. ${msg}`.trim() }, { status: 500 });
  }
}

