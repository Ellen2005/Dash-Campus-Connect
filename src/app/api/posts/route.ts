import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-user';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'



const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  authorId: z.string(),
  images: z.array(z.string()).optional(),
  video: z.string().optional(),
  location: z.string().optional(),
  audience: z.enum(['EVERYONE', 'DEPARTMENT', 'FRIENDS_ONLY', 'SPECIFIC_GROUP']).default('EVERYONE'),
  groupPostId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Try auth for following feed, but allow public read for profile
    let currentUserId: string | undefined;
    let currentUserSchoolId: string | undefined;
    try {
      const result = await requireUser();
      if (!result.errorResponse && result.user) {
        currentUserId = result.user.userId;
        currentUserSchoolId = result.dbUser?.schoolId ?? undefined;
      }
    } catch {
      // Allow public access for profile/author queries
    }
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10'))) // Cap at 50 to prevent OOM
    const skip = (page - 1) * limit

    const authorId = searchParams.get('authorId')?.trim()
    const today = searchParams.get('today') === 'true'
    const groupPostId = searchParams.get('groupPostId')?.trim()
    const feedType = searchParams.get('feedType')?.trim() || 'following' // 'following' | 'trending'
    const userId = searchParams.get('userId')?.trim() || currentUserId

    const where: any = { isFlagged: false } // Hide flagged posts
    
    // Multi-tenant isolation: Only fetch posts from the same school if we aren't querying a specific author
    if (!authorId && currentUserSchoolId) {
      where.author = { schoolId: currentUserSchoolId };
    }

    if (authorId) where.authorId = authorId
    if (groupPostId) where.groupPostId = groupPostId
    if (today) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      where.createdAt = { gte: startOfDay }
    }

    // Following tab logic: filter by friends/followed users
    if (feedType === 'following' && userId) {
      const userWithFollowing = await prisma.user.findUnique({
        where: { id: userId },
        select: { following: { select: { followingId: true } } }
      });
      const followingIds = userWithFollowing?.following.map(f => f.followingId) || [];
      // Also include user's own posts
      followingIds.push(userId);
      
      if (!authorId) { // only apply if we aren't explicitly fetching a specific author
        where.authorId = { in: followingIds };
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    
    // Trending logic: sort by number of likes
    if (feedType === 'trending') {
      orderBy = [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { createdAt: 'desc' }
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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

    const total = await prisma.post.count({ where })

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
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json()
    const { content, images, video, location, audience, groupPostId } = CreatePostSchema.parse(body)

    // Validate group membership if posting to a group
    if (groupPostId) {
      const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.userId, groupId: groupPostId } },
      });
      if (!membership) {
        return NextResponse.json({ error: "You must be a member of this group to post." }, { status: 403 });
      }
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: user.userId,
        images: images || [],
        video,
        location,
        audience,
        groupPostId,
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

