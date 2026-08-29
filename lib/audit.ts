import "server-only";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

interface AuditParams {
  userId?: string;
  adminId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams) {
  try {
    const h = await headers();
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        adminId: params.adminId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as never,
        ip:
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          h.get("x-real-ip") ??
          undefined,
        userAgent: h.get("user-agent") ?? undefined,
      },
    });
  } catch {
    // Auditing must never break the primary flow.
  }
}
