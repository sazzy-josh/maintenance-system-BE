import { Request } from 'express'
import { prisma } from '../config/db'

export const auditLog = async (
  actorId: string | undefined | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        entityType,
        entityId,
        metadata: (metadata ?? {}) as object,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      },
    })
  } catch (err) {
    console.error('Audit log error:', err)
  }
}
