import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required." }, { status: 400 });

  const cart = await prisma.shoppingCart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          listing: { select: { id: true, title: true, price: true, isFree: true, images: true, status: true, seller: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  return NextResponse.json({ cart: cart ?? { userId, items: [] } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = z.object({
    userId: z.string().min(1),
    listingId: z.string().min(1),
    quantity: z.number().int().min(1).default(1),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const { userId, listingId, quantity } = parsed.data;

  let cart = await prisma.shoppingCart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.shoppingCart.create({ data: { userId } });

  const item = await prisma.cartItem.upsert({
    where: { cartId_listingId: { cartId: cart.id, listingId } },
    update: { quantity },
    create: { cartId: cart.id, listingId, quantity },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const listingId = searchParams.get("listingId");
  if (!userId || !listingId) return NextResponse.json({ error: "userId and listingId required." }, { status: 400 });

  const cart = await prisma.shoppingCart.findUnique({ where: { userId } });
  if (!cart) return NextResponse.json({ success: true });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, listingId } });
  return NextResponse.json({ success: true });
}
