import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { asyncHandler } from '../../utils/asyncHandler'
import { success } from '../../utils/response'
import { prisma } from '../../config/db'
import { getPagination, getMeta } from '../../utils/pagination'

const router = Router()
router.use(authenticate, authorize('ADMIN'))

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Get audit log (admin only)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: actorId
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: entityType
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated audit log }
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', actorId, action, entityType, dateFrom, dateTo } = req.query as Record<string, string>
  const { skip, take } = getPagination(Number(page), Number(limit))

  const where: Record<string, unknown> = {}
  if (actorId) where.actorId = actorId
  if (action) where.action = { contains: action, mode: 'insensitive' }
  if (entityType) where.entityType = entityType
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      include: { actor: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ])

  return success(res, logs, 'Audit log retrieved', 200, getMeta(total, Number(page), Number(limit)))
}))

export default router
