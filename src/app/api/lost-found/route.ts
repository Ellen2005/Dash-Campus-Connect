import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateLostFoundSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["lost", "found"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z
    .string()
    .min(1)
    .max(50),
  location: z.string().min(1).max(200),
  date: z.string().datetime().optional(),
  images: z.array(z.string()).optional(),
});

function mapTypeToStatus(type: "lost" | "found") {
  return type === "lost" ? "LOST" : "FOUND";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? undefined;

  // userId is currently optional because UI passes it, but we don't strictly need it
  // if you want to show global items later.
  const where: any = userId ? { reporterId: userId } : {};


  const items = await prisma.lostFoundItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {},
  });

  // Normalize to UI model.
  const normalized = items.map((i) => {
    const type = i.status === "LOST" ? "lost" : "found";
    const resolved = i.status === "CLAIMED";

    return {
      id: i.id,
      type,
      title: i.title,
      description: i.description,
      location: i.location ?? "",
      date:
        (i.dateLost && i.status === "LOST" ? i.dateLost : i.dateFound) ?
          ((i.status === "LOST" ? i.dateLost : i.dateFound) as Date).toISOString().slice(0, 10)
        : new Date(i.createdAt).toISOString().slice(0, 10),
      category: i.category,
      resolved,
      imageUrl: i.images?.[0] ?? null,
    };
  });

  return NextResponse.json({ items: normalized });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateLostFoundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Map category into enum (prisma will validate). Accept UI string values.
  const category =
    [
      "ELECTRONICS",
      "CLOTHING",
      "ACCESSORIES",
      "DOCUMENTS",
      "KEYS",
      "OTHER",
    ].includes(data.category.toUpperCase())
      ? (data.category.toUpperCase() as any)
      : "OTHER";

  const status = mapTypeToStatus(data.type);

  const item = await prisma.lostFoundItem.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      category,
      status,
      location: data.location.trim(),
      dateLost: data.type === "lost" ? (data.date ? new Date(data.date) : undefined) : undefined,
      dateFound: data.type === "found" ? (data.date ? new Date(data.date) : undefined) : undefined,
      images: data.images ?? [],
      reporterId: data.userId,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

