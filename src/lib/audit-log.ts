import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type AuditAction =
  | "USER_APPROVED"
  | "USER_REJECTED"
  | "USER_SUSPENDED"
  | "POST_DELETED"
  | "POST_FLAGGED"
  | "EVENT_APPROVED"
  | "EVENT_REJECTED"
  | "GROUP_DELETED"
  | "COMMUNITY_DELETED"
  | "SETTINGS_UPDATED"
  | "DATA_EXPORTED";

export async function logAudit({
  actorId,
  action,
  targetType,
  targetId,
  details,
  schoolId,
}: {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  schoolId: string;
}) {
  try {
    // ActivityLog is the correct model name per schema.prisma
    await prisma.activityLog.create({
      data: {
        userId: actorId,
        action,
        resource: `${targetType}${targetId ? `:${targetId}` : ""}`,
      },
    });
  } catch (error) {
    console.error("[audit-log] Failed to write audit log:", error);
  }
}
