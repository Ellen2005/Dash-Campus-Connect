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
          listing: {
            select: {
              id: true, title: true, price: true, isFree: true, images: true,
              status: true, condition: true, category: true, description: true,
              seller: { select: { id: true, name: true, username: true, profilePhoto: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ items: cart?.items ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json().catch(() => null);
  const parsed = z.object({
    listingId: z.string().min(1),
    quantity: z.number().int().min(1).default(1),
  }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data. listingId required." }, { status: 400 });
  }

  const { listingId, quantity } = parsed.data;

  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, sellerId: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing is no longer available." }, { status: 400 });
    }

    let cart = await prisma.shoppingCart.findUnique({ where: { userId: auth.userId } });
    if (!cart) {
      cart = await prisma.shoppingCart.create({ data: { userId: auth.userId } });
    }

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_listingId: { cartId: cart.id, listingId } },
    });

    if (existing) {
      const item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      return NextResponse.json({ item }, { status: 200 });
    }

    const item = await prisma.cartItem.create({
      data: { cartId: cart.id, listingId, quantity },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: "Failed to add to cart." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json({ error: "listingId required." }, { status: 400 });
  }

  try {
    const cart = await prisma.shoppingCart.findUnique({ where: { userId: auth.userId } });
    if (!cart) return NextResponse.json({ success: true });

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, listingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove item." }, { status: 500 });
  }
}
