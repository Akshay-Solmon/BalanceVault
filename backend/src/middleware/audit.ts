import { Request } from 'express';
import { prisma } from '../db.js';

export interface AuditParams {
  req?: Request;
  actorId?: string | null;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType: 'USER' | 'ONBOARDING' | 'ACCOUNT' | 'SYSTEM';
  targetId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, any>;
}

export async function recordAuditLog(params: AuditParams): Promise<void> {
  const req = params.req;
  const ipAddress = (req?.headers['x-forwarded-for'] as string) || req?.socket.remoteAddress || '127.0.0.1';
  const userAgent = (req?.headers['user-agent'] as string) || 'InternalSystem';

  const actorEmail = params.actorEmail || (req as any)?.user?.email || 'ANONYMOUS';
  const actorId = params.actorId !== undefined ? params.actorId : (req as any)?.user?.id || null;
  const actorRole = params.actorRole || (req as any)?.user?.role || 'ANONYMOUS';

  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        actorEmail,
        actorRole,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        outcome: params.outcome,
        ipAddress,
        userAgent,
        metadata: JSON.stringify(params.metadata || {}),
      },
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
}
