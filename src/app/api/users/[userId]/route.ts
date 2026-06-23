import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'


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
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Fetch user with explicit field selection to avoid column mismatch
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
  try {
    const { userId } = await params
    const body = await request.json()
    const updateData = UpdateUserSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Don't return password
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
