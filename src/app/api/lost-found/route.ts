import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { z } from 'zod'

const CreateSchema = z.object({
  type: z.enum(['LOST', 'FOUND']).default('LOST'),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  category: z.string().default('Other'),
  photoUrl: z.string().optional(),
})

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
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (!auth.dbUser.schoolId) {
      return NextResponse.json({ error: 'No school assigned to your account.' }, { status: 400 })
    }

    const item = await prisma.lostFoundItem.create({
      data: {
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        category: parsed.data.category,
        photoUrl: parsed.data.photoUrl,
        posterId: auth.userId,
        schoolId: auth.dbUser.schoolId,
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
