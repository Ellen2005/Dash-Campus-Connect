import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'



const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  authorId: z.string(),
  images: z.array(z.string()).optional(),
  video: z.string().optional(),
  location: z.string().optional(),
  audience: z.enum(['EVERYONE', 'DEPARTMENT', 'FRIENDS_ONLY', 'SPECIFIC_GROUP']).default('EVERYONE'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        },
        comments: {
          take: 3,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        likes: {
          select: {
            userId: true,
            reaction: true,
          },
        },
      },
    })

    const total = await prisma.post.count()

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, authorId, images, video, location, audience } = CreatePostSchema.parse(body)

    const post = await prisma.post.create({
      data: {
        content,
        authorId,
        images: images || [],
        video,
        location,
        audience,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

