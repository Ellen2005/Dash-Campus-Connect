import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
            bio: true,
            major: true,
            year: true,
          },
        },
      },
    })

    const total = await prisma.follow.count({
      where: { followingId: userId },
    })

    return NextResponse.json({
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching followers:', error)
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 })
  }
}
