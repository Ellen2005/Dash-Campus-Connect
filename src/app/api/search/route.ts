import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    const currentUserId = (searchParams.get("currentUserId") ?? "").trim();
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

    const userWhere = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { username: { contains: query, mode: "insensitive" as const } },
            { major: { contains: query, mode: "insensitive" as const } },
          ],
          ...(scopeGroupId ? { groupMemberships: { some: { groupId: scopeGroupId } } } : {}),
        }
      : scopeGroupId
        ? { groupMemberships: { some: { groupId: scopeGroupId } } }
        : {};

    const groupWhere = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
          ...(scopeGroupId ? { id: scopeGroupId } : {}),
        }
      : scopeGroupId
        ? { id: scopeGroupId }
        : {};

    const [users, groups] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          followers: {
            select: { followerId: true, followingId: true },
          },
          following: {
            select: { followerId: true, followingId: true },
          },
        },
      }),
      prisma.group.findMany({
        where: groupWhere,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          members: {
            select: { userId: true },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
    ]);

    const normalizedUsers = users.map((user) => {
      const isCurrentUser = currentUserId && user.id === currentUserId;
      const following = currentUserId
        ? user.followers.some((follow) => follow.followerId === currentUserId)
        : false;

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.profilePhoto,
        faculty: [user.major, user.year].filter(Boolean).join(" '"),
        mutual: Math.min(user.followers.length, user.following.length),
        status: isCurrentUser ? "connected" : following ? "connected" : "none",
      };
    });

    const normalizedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      members: group._count.members,
      type: group.isPublic ? "public" : "private",
      joined: currentUserId ? group.members.some((member) => member.userId === currentUserId) : false,
    }));

    return NextResponse.json({
      users: normalizedUsers,
      groups: normalizedGroups,
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
