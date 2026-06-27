import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limit: 30 searches per IP per minute
  const limiter = rateLimit(`search:${ipFromRequest(request)}`, 30, 60_000);
  if (!limiter.allowed) return limiter.response;

  try {
    // Authenticate to enforce school isolation
    const auth = await requireUser();
    if (auth.errorResponse) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const currentUserId = auth.userId;
    const currentUserSchoolId = auth.dbUser.schoolId;

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    const scopeGroupId = (searchParams.get("scopeGroupId") ?? "").trim();

    if (scopeGroupId) {
      if (!currentUserId) {
        return NextResponse.json({ error: "currentUserId is required for scoped search." }, { status: 400 });
      }
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId: scopeGroupId,
          },
        },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: "Access denied: you are not a member of this community." }, { status: 403 });
      }
    }

    // School isolation — only search within user's school
    const schoolFilter = currentUserSchoolId ? { schoolId: currentUserSchoolId } : {};

    const userWhere: any = {
      approvalStatus: "APPROVED",
      ...schoolFilter,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
              { studentId: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const groupWhere = {
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(scopeGroupId ? { id: scopeGroupId } : {}),
    };

    const eventWhere = {
      approvalStatus: "APPROVED" as const,
      ...(query ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ]
      } : {})
    };

    const [users, groups, events, communities] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          fieldOfStudy: { select: { name: true } },
          level: { select: { name: true } },
          _count: { select: { followers: true, following: true } },
          ...(currentUserId ? {
            followers: {
              where: { followerId: currentUserId },
              select: { id: true },
              take: 1,
            },
          } : {}),
        },
      }),
      prisma.group.findMany({
        where: groupWhere,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { members: true } },
          ...(currentUserId ? {
            members: {
              where: { userId: currentUserId },
              select: { id: true },
              take: 1,
            },
          } : {}),
        },
      }),
      prisma.event.findMany({
        where: eventWhere,
        take: 20,
        orderBy: { date: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          location: true,
          isFree: true,
        }
      }),
      prisma.community.findMany({
        where: query ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ]
        } : {},
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { members: true } },
        },
      })
    ]);

    const normalizedUsers = users.map((user) => {
      const isCurrentUser = currentUserId && user.id === currentUserId;
      const following = currentUserId ? user.followers.length > 0 : false;

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.profilePhoto,
        faculty: [user.fieldOfStudy?.name, user.level?.name].filter(Boolean).join(" · "),
        mutual: Math.min(user._count.followers, user._count.following),
        status: isCurrentUser ? "connected" : following ? "connected" : "none",
      };
    });

    const normalizedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      members: group._count.members,
      type: group.isPublic ? "public" : "private",
      joined: currentUserId ? group.members.length > 0 : false,
    }));

    const normalizedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      location: event.location,
      isFree: event.isFree,
    }));

    const normalizedCommunities = communities.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      members: c._count.members,
      type: c.type,
    }));

    return NextResponse.json({
      users: normalizedUsers,
      groups: normalizedGroups,
      events: normalizedEvents,
      communities: normalizedCommunities,
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
