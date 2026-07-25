"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestAssignments = exports.getMyAssignments = exports.reassignRequest = exports.assignRequest = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../utils/AppError");
const auditLogger_1 = require("../../middleware/auditLogger");
const socket_1 = require("../../sockets/socket");
const mailer_1 = require("../../config/mailer");
const assignRequest = async (adminId, data, req) => {
    const request = await db_1.prisma.serviceRequest.findUnique({ where: { id: data.requestId } });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    if (!['SUBMITTED', 'ASSIGNED'].includes(request.status)) {
        throw new AppError_1.AppError(409, 'Request cannot be assigned in its current status', 'INVALID_STATUS');
    }
    const officer = await db_1.prisma.user.findUnique({
        where: { id: data.officerId },
        include: { role: true },
    });
    if (!officer || officer.role.name !== 'OFFICER' || !officer.isActive) {
        throw new AppError_1.AppError(400, 'Invalid or inactive officer', 'INVALID_OFFICER');
    }
    // Reassign: mark existing active assignment as REASSIGNED
    await db_1.prisma.assignment.updateMany({
        where: { requestId: data.requestId, status: 'ACTIVE' },
        data: { status: 'REASSIGNED' },
    });
    const assignment = await db_1.prisma.assignment.create({
        data: {
            requestId: data.requestId,
            officerId: data.officerId,
            assignedById: adminId,
            note: data.note,
        },
    });
    await db_1.prisma.serviceRequest.update({
        where: { id: data.requestId },
        data: { status: 'ASSIGNED' },
    });
    await db_1.prisma.statusUpdate.create({
        data: {
            requestId: data.requestId,
            fromStatus: request.status,
            toStatus: 'ASSIGNED',
            note: data.note || `Assigned to ${officer.fullName}`,
            actorId: adminId,
        },
    });
    await (0, auditLogger_1.auditLog)(adminId, 'REQUEST_ASSIGNED', 'Assignment', assignment.id, {
        requestId: data.requestId,
        officerId: data.officerId,
    }, req);
    // Notify officer
    await db_1.prisma.notification.create({
        data: {
            userId: data.officerId,
            title: 'New job assigned',
            body: `${request.referenceNo}: ${request.title}`,
            link: `/officer/jobs/${data.requestId}`,
        },
    });
    (0, socket_1.emitToUser)(data.officerId, 'notification:new', { title: 'New job assigned', body: request.referenceNo });
    (0, socket_1.emitToUser)(data.officerId, 'request:assigned', { requestId: data.requestId });
    (0, socket_1.emitToRole)('ADMIN', 'request:statusChanged', { requestId: data.requestId, status: 'ASSIGNED' });
    // Notify requester
    await db_1.prisma.notification.create({
        data: {
            userId: request.requesterId,
            title: 'Request assigned',
            body: `${request.referenceNo} has been assigned to a maintenance officer`,
            link: `/requests/${data.requestId}`,
        },
    });
    try {
        await (0, mailer_1.sendMail)(officer.email, `New Job Assigned – ${request.referenceNo}`, mailer_1.emailTemplates.officerAssigned(request.referenceNo, request.title, data.note));
        const requester = await db_1.prisma.user.findUnique({ where: { id: request.requesterId } });
        if (requester) {
            await (0, mailer_1.sendMail)(requester.email, `Request Assigned – ${request.referenceNo}`, mailer_1.emailTemplates.requestAssigned(request.referenceNo, officer.fullName));
        }
    }
    catch { }
    return assignment;
};
exports.assignRequest = assignRequest;
const reassignRequest = async (assignmentId, adminId, data, req) => {
    const assignment = await db_1.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { request: true },
    });
    if (!assignment)
        throw new AppError_1.AppError(404, 'Assignment not found', 'NOT_FOUND');
    return (0, exports.assignRequest)(adminId, {
        requestId: assignment.requestId,
        officerId: data.officerId,
        note: data.note,
    }, req);
};
exports.reassignRequest = reassignRequest;
const getMyAssignments = async (officerId) => {
    return db_1.prisma.assignment.findMany({
        where: { officerId, status: 'ACTIVE' },
        include: {
            request: {
                include: {
                    category: true,
                    requester: { select: { id: true, fullName: true } },
                },
            },
        },
        orderBy: { assignedAt: 'desc' },
    });
};
exports.getMyAssignments = getMyAssignments;
const getRequestAssignments = async (requestId, userId, role) => {
    const request = await db_1.prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: { assignments: { where: { status: 'ACTIVE' } } },
    });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId);
    if (role !== 'ADMIN' && !isAssigned) {
        throw new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    return db_1.prisma.assignment.findMany({
        where: { requestId },
        include: {
            officer: { select: { id: true, fullName: true, specialization: true } },
            assignedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { assignedAt: 'desc' },
    });
};
exports.getRequestAssignments = getRequestAssignments;
//# sourceMappingURL=assignments.service.js.map