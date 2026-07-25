"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const db_1 = require("../../config/db");
const pagination_1 = require("../../utils/pagination");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate, (0, authorize_1.authorize)('ADMIN'));
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
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '20', actorId, action, entityType, dateFrom, dateTo } = req.query;
    const { skip, take } = (0, pagination_1.getPagination)(Number(page), Number(limit));
    const where = {};
    if (actorId)
        where.actorId = actorId;
    if (action)
        where.action = { contains: action, mode: 'insensitive' };
    if (entityType)
        where.entityType = entityType;
    if (dateFrom || dateTo) {
        where.createdAt = {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
        };
    }
    const [logs, total] = await Promise.all([
        db_1.prisma.auditLog.findMany({
            where,
            skip,
            take,
            include: { actor: { select: { id: true, fullName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        db_1.prisma.auditLog.count({ where }),
    ]);
    return (0, response_1.success)(res, logs, 'Audit log retrieved', 200, (0, pagination_1.getMeta)(total, Number(page), Number(limit)));
}));
exports.default = router;
//# sourceMappingURL=audit.routes.js.map