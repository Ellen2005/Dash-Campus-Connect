import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let where: {
      resolved: boolean
      type?: 'LOST' | 'FOUND'
      OR?: Array<Record<string, unknown>>
    } = { resolved: false }

    if (type) where.type = type.toUpperCase() as 'LOST' | 'FOUND'
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const items = await prisma.lostFoundItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        poster: {
          select: { id: true, name: true, username: true, profilePhoto: true },
        },
      },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching lost & found items:', error)
    return NextResponse.json({ items: [], error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, description, location, category, photoUrl, posterId, schoolId } = body

    if (!title || !posterId) {
      return NextResponse.json({ error: 'Title and posterId are required' }, { status: 400 })
    }

    const item = await prisma.lostFoundItem.create({
      data: {
        type: type?.toUpperCase() === 'FOUND' ? 'FOUND' : 'LOST',
        title,
        description,
        location,
        category: category || 'Other',
        photoUrl,
        posterId,
        schoolId,
      },
      include: {
        poster: {
          select: { id: true, name: true, username: true, profilePhoto: true },
        },
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating lost & found item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
