import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { MarketplaceCategory, Condition } from '@prisma/client'
import { requireUser } from '@/lib/require-user';



const CreateListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.enum(['TEXTBOOKS', 'ELECTRONICS', 'FURNITURE', 'HOUSING', 'SERVICES', 'TICKETS', 'OTHER']),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  price: z.number().positive().optional(),
  isFree: z.boolean().default(false),
  isTradeOnly: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  preferredContact: z.enum(['chat', 'phone', 'email']).optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const categoryParam = searchParams.get('category');
    const category = categoryParam && ['TEXTBOOKS', 'ELECTRONICS', 'FURNITURE', 'HOUSING', 'SERVICES', 'TICKETS', 'OTHER'].includes(categoryParam)
      ? categoryParam as MarketplaceCategory
      : undefined;
    
    const conditionParam = searchParams.get('condition');
    const condition = conditionParam && ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'].includes(conditionParam)
      ? conditionParam as Condition
      : undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const isFree = searchParams.get('isFree') === 'true'
    const search = searchParams.get('search')
    const sellerId = searchParams.get('sellerId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let where: Record<string, unknown> = {
      status: 'ACTIVE',
    }

    if (category) where.category = category
    if (condition) where.condition = condition

    if (isFree) {
      where.isFree = true
    } else {
      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceFilter: Record<string, number> = {}
        if (minPrice !== undefined) priceFilter.gte = minPrice
        if (maxPrice !== undefined) priceFilter.lte = maxPrice
        where.price = priceFilter
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (sellerId) where.sellerId = sellerId

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sortBy === 'price') {
      orderBy = { price: sortOrder }
    } else if (sortBy === 'title') {
      orderBy = { title: sortOrder }
    }

    const listings = await prisma.marketplaceListing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
    })

    const listingsWithRating = listings.map(listing => ({
      ...listing,
      averageRating: listing.reviews.length > 0
        ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length
        : null,
    }))

    const total = await prisma.marketplaceListing.count({ where })

    return NextResponse.json({
      listings: listingsWithRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching marketplace listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json()
    const listingData = CreateListingSchema.parse(body)

    const listing = await prisma.marketplaceListing.create({
      data: {
        title: listingData.title,
        description: listingData.description,
        sellerId: auth.userId,
        category: listingData.category,
        condition: listingData.condition,
        price: listingData.price,
        isFree: listingData.isFree,
        isTradeOnly: listingData.isTradeOnly,
        images: listingData.images,
        preferredContact: listingData.preferredContact,
        expiresAt: listingData.expiresAt ? new Date(listingData.expiresAt) : null,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating marketplace listing:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
