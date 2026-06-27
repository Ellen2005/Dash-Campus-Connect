import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const cart = await prisma.shoppingCart.findUnique({
    where: { userId: auth.userId },
    include: {
      items: {
        include: {
          listing: { select: { id: true, title: true, price: true, isFree: true, images: true, status: true, seller: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  return NextResponse.json({ cart: cart ?? { userId: auth.userId, items: [] } });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = z.object({
    listingId: z.string().min(1),
    quantity: z.number().int().min(1).default(1),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const { listingId, quantity } = parsed.data;

  let cart = await prisma.shoppingCart.findUnique({ where: { userId: auth.userId } });
  if (!cart) cart = await prisma.shoppingCart.create({ data: { userId: auth.userId } });

  const item = await prisma.cartItem.upsert({
    where: { cartId_listingId: { cartId: cart.id, listingId } },
    update: { quantity },
    create: { cartId: cart.id, listingId, quantity },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required." }, { status: 400 });

  const cart = await prisma.shoppingCart.findUnique({ where: { userId: auth.userId } });
  if (!cart) return NextResponse.json({ success: true });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, listingId } });
  return NextResponse.json({ success: true });
}
