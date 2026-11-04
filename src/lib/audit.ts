import { prisma } from "@/lib/db";

export interface AuditInput {
  actorType: "ADMIN" | "PATIENT" | "SYSTEM";
  actorId?: number | null;
  actorName?: string | null;
  action: string;
  entity: string;
  entityId?: number | null;
  detail?: string | null;
}

/** Audit logging that never blocks the main flow. */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch {
    // ignore — audit must never break user flows
  }
}

