import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const averageRating = listing.reviews.length > 0
      ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length
      : null

    return NextResponse.json({
      ...listing,
      averageRating,
    })
  } catch (error) {
    console.error('Error fetching marketplace listing:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { listingId } = await params

    const existing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })
    if (!existing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (existing.sellerId !== auth.userId && auth.dbUser.role !== 'ADMIN' && auth.dbUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const allowedFields = ['title', 'description', 'price', 'isFree', 'isTradeOnly', 'images', 'condition', 'category', 'preferredContact', 'expiresAt']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    const listing = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
    })

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error updating marketplace listing:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { listingId } = await params

    const existing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })
    if (!existing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (existing.sellerId !== auth.userId && auth.dbUser.role !== 'ADMIN' && auth.dbUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: 'REMOVED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting marketplace listing:', error)
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
}
