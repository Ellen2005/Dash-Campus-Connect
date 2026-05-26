import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateOrderSchema = z.object({
  buyerId: z.string().min(1),
  paymentMethod: z.enum(["MOBILE_MONEY", "ORANGE_MONEY"]).default("MOBILE_MONEY"),
  items: z.array(z.object({
    listingId: z.string().min(1),
    quantity: z.number().int().min(1),
    pricePerUnit: z.number().min(0),
  })).min(1),
});

export async function GET(req: NextRequest) {
  const buyerId = new URL(req.url).searchParams.get("buyerId");
  if (!buyerId) return NextResponse.json({ error: "buyerId required." }, { status: 400 });

  const orders = await prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { listing: { select: { id: true, title: true, images: true } } },
      },
    },
  });
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const { buyerId, paymentMethod, items } = parsed.data;
  const totalPrice = items.reduce((sum, i) => sum + i.pricePerUnit * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      buyerId,
      totalPrice,
      paymentMethod,
      items: { create: items },
    },
    include: { items: true },
  });

  // Clear cart after order
  const cart = await prisma.shoppingCart.findUnique({ where: { userId: buyerId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return NextResponse.json({ order }, { status: 201 });
}
