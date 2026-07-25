"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const db_1 = require("../config/db");
const auditLog = async (actorId, action, entityType, entityId, metadata, req) => {
    try {
        await db_1.prisma.auditLog.create({
            data: {
                actorId: actorId || null,
                action,
                entityType,
                entityId,
                metadata: (metadata ?? {}),
                ipAddress: req?.ip,
                userAgent: req?.headers['user-agent'],
            },
        });
    }
    catch (err) {
        console.error('Audit log error:', err);
    }
};
exports.auditLog = auditLog;
//# sourceMappingURL=auditLogger.js.map