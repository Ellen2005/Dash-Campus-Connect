import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/require-user'


const UpdateUserSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  profilePhoto: z.string().optional(),
  coverPhoto: z.string().optional(),
  fieldOfStudyId: z.string().optional(),
  levelId: z.string().optional(),
  interests: z.array(z.string()).optional(),
  phone: z.string().optional(),
  secondaryEmail: z.string().email().optional(),
  hometown: z.string().optional(),
  privacyPublic: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const userQuery = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        studentId: true,
        bio: true,
        tourCompletedAt: true,
        profilePhoto: true,
        coverPhoto: true,
        schoolId: true,
        fieldOfStudyId: true,
        levelId: true,
        interests: true,
        phone: true,
        secondaryEmail: true,
        hometown: true,
        privacyPublic: true,
        onlyFriendsCanSeePosts: true,
        hideFromMarketplace: true,
        role: true,
        isStudentAdmin: true,
        approvalStatus: true,
        approvalRejectedReason: true,
        createdAt: true,
        updatedAt: true,
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        notificationPrefs: true,
        followers: true,
        following: true,
      },
    })

    if (!userQuery) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(userQuery)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireUser();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { userId } = await params

    if (userId !== auth.userId) {
      return NextResponse.json({ error: 'You can only update your own profile' }, { status: 403 })
    }

    const body = await request.json()
    const updateData = UpdateUserSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    const { password, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
