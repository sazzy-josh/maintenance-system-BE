"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.getComments = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../utils/AppError");
const socket_1 = require("../../sockets/socket");
const getComments = async (requestId, userId, role) => {
    const request = await db_1.prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: { assignments: { where: { status: 'ACTIVE' } } },
    });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    const isOwner = request.requesterId === userId;
    const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId);
    if (role !== 'ADMIN' && !isOwner && !isAssigned) {
        throw new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    const comments = await db_1.prisma.comment.findMany({
        where: {
            requestId,
            ...(role === 'REQUESTER' ? { isInternal: false } : {}),
        },
        include: { author: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'asc' },
    });
    return comments;
};
exports.getComments = getComments;
const addComment = async (requestId, authorId, role, body, isInternal) => {
    const request = await db_1.prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: { assignments: { where: { status: 'ACTIVE' } } },
    });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    const isOwner = request.requesterId === authorId;
    const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === authorId);
    if (role === 'REQUESTER' && !isOwner)
        throw new AppError_1.AppError(403, 'Can only comment on own requests', 'FORBIDDEN');
    if (role === 'OFFICER' && !isAssigned)
        throw new AppError_1.AppError(403, 'Not assigned to this request', 'FORBIDDEN');
    // Requesters can't create internal comments
    const internal = role === 'REQUESTER' ? false : isInternal;
    const comment = await db_1.prisma.comment.create({
        data: { requestId, authorId, body, isInternal: internal },
        include: { author: { select: { id: true, fullName: true, role: true } } },
    });
    (0, socket_1.emitToRequest)(requestId, 'comment:added', { requestId, comment });
    // Notify requester if comment from officer/admin
    if (role !== 'REQUESTER' && !internal) {
        await db_1.prisma.notification.create({
            data: {
                userId: request.requesterId,
                title: 'New comment on your request',
                body: `${body.substring(0, 80)}...`,
                link: `/requests/${requestId}`,
            },
        });
    }
    return comment;
};
exports.addComment = addComment;
//# sourceMappingURL=comments.service.js.map