import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const JOIN_REQUEST_TITLE = "GROUP_JOIN_REQUEST";
const TOKEN_PREFIX = "JOIN_REQ::";

const ActSchema = z.object({
  ownerId: z.string(),
  groupId: z.string(),
  requesterId: z.string(),
  action: z.enum(["approve", "reject"]),
});

function parseJoinRequest(message: string) {
  // Format: JOIN_REQ::<groupId>::<requesterId>::<groupName>
  if (!message.startsWith(TOKEN_PREFIX)) return null;
  const parts = message.split("::");
  if (parts.length < 4) return null;
  return {
    groupId: parts[1],
    requesterId: parts[2],
    groupName: parts.slice(3).join("::"),
  };
}

export async function GET(request: NextRequest) {
  try {
    const ownerId = (request.nextUrl.searchParams.get("ownerId") ?? "").trim();
    if (!ownerId) {
      return NextResponse.json({ error: "ownerId is required." }, { status: 400 });
    }

    const rows = await prisma.notification.findMany({
      where: {
        userId: ownerId,
        type: "SYSTEM_ALERT",
        title: JOIN_REQUEST_TITLE,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const parsed = rows
      .map((row) => ({ row, parsed: parseJoinRequest(row.message) }))
      .filter((x) => !!x.parsed)
      .map((x) => ({
        id: x.row.id,
        groupId: x.parsed!.groupId,
        requesterId: x.parsed!.requesterId,
        groupName: x.parsed!.groupName,
        createdAt: x.row.createdAt,
      }));

    const requesterIds = Array.from(new Set(parsed.map((x) => x.requesterId)));
    const users = requesterIds.length
      ? await prisma.user.findMany({
          where: { id: { in: requesterIds } },
          select: { id: true, name: true, username: true, profilePhoto: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return NextResponse.json({
      requests: parsed.map((r) => ({
        ...r,
        requester: userMap.get(r.requesterId) ?? null,
      })),
    });
  } catch (e: any) {
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to load join requests. ${msg}`.trim() }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ActSchema.parse(body);

    const group = await prisma.group.findUnique({
      where: { id: parsed.groupId },
      select: { id: true, creatorId: true },
    });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });
    if (group.creatorId !== parsed.ownerId) {
      return NextResponse.json({ error: "Only the group owner can review requests." }, { status: 403 });
    }

    const token = `JOIN_REQ::${parsed.groupId}::${parsed.requesterId}`;
    const reqNotif = await prisma.notification.findFirst({
      where: {
        userId: parsed.ownerId,
        type: "SYSTEM_ALERT",
        title: JOIN_REQUEST_TITLE,
        message: { contains: token },
        isRead: false,
      },
      select: { id: true },
    });
    if (!reqNotif) {
      return NextResponse.json({ error: "Request not found or already handled." }, { status: 404 });
    }

    if (parsed.action === "approve") {
      const existing = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: parsed.requesterId, groupId: parsed.groupId } },
        select: { id: true },
      });
      if (!existing) {
        await prisma.groupMember.create({
          data: {
            userId: parsed.requesterId,
            groupId: parsed.groupId,
            role: "MEMBER",
          },
        });
      }
    }

    await prisma.notification.update({
      where: { id: reqNotif.id },
      data: { isRead: true, readAt: new Date() },
    });

    // Notify the requester
    const { createNotification } = await import("@/lib/notifications");
    await createNotification({
      userId: parsed.requesterId,
      type: "SYSTEM_ALERT",
      title: "Join Request " + (parsed.action === "approve" ? "Approved" : "Declined"),
      message: `Your request to join the group has been ${parsed.action === "approve" ? "approved! Welcome!" : "declined."}`,
      actionUrl: parsed.action === "approve" ? `/main/groups/${parsed.groupId}` : undefined,
    });

    return NextResponse.json({ success: true, action: parsed.action });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 });
    }
    const msg = (e?.message ?? "").toString();
    return NextResponse.json({ error: `Failed to process request. ${msg}`.trim() }, { status: 500 });
  }
}

