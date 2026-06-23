import { prisma } from "@/lib/prisma";

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
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: details ?? {},
        schoolId,
      },
    });
  } catch (error) {
    console.error("[audit-log] Failed to write audit log:", error);
  }
}