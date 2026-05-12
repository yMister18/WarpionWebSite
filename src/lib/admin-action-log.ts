import { getPrismaClient } from '@/lib/prisma';

type LogAdminActionInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  actor: string;
  details?: unknown;
};

export async function logAdminAction({
  action,
  entityType,
  entityId,
  actor,
  details,
}: LogAdminActionInput) {
  const prisma = getPrismaClient();

  return prisma.adminActionLog.create({
    data: {
      action,
      entityType,
      entityId: entityId ?? null,
      actor,
      details: details ?? undefined,
    },
  });
}