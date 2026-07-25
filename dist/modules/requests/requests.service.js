"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateRequest = exports.deleteAttachment = exports.addAttachments = exports.setPriority = exports.transitionStatus = exports.updateRequest = exports.getRequest = exports.getRequestStats = exports.listRequests = exports.createRequest = exports.canTransition = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../utils/AppError");
const generateReference_1 = require("../../utils/generateReference");
const pagination_1 = require("../../utils/pagination");
const cloudinary_1 = require("../../config/cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const socket_1 = require("../../sockets/socket");
const auditLogger_1 = require("../../middleware/auditLogger");
const mailer_1 = require("../../config/mailer");
const TERMINAL_STATES = ['CLOSED', 'REJECTED', 'CANCELLED'];
const canTransition = (from, to, role, isOwner) => {
    if (TERMINAL_STATES.includes(from))
        return false;
    if (from === 'SUBMITTED') {
        if (role === 'ADMIN' && ['ASSIGNED', 'REJECTED'].includes(to))
            return true;
        if ((isOwner || role === 'ADMIN') && to === 'CANCELLED')
            return true;
        return false;
    }
    if (from === 'ASSIGNED') {
        if (role === 'ADMIN' && to === 'ASSIGNED')
            return true;
        if (['OFFICER', 'ADMIN'].includes(role) && to === 'IN_PROGRESS')
            return true;
        return false;
    }
    if (from === 'IN_PROGRESS') {
        if (['OFFICER', 'ADMIN'].includes(role) && ['ON_HOLD', 'COMPLETED'].includes(to))
            return true;
        return false;
    }
    if (from === 'ON_HOLD') {
        if (['OFFICER', 'ADMIN'].includes(role) && to === 'IN_PROGRESS')
            return true;
        return false;
    }
    if (from === 'COMPLETED') {
        if ((isOwner || role === 'ADMIN') && to === 'CLOSED')
            return true;
        if (role === 'ADMIN' && to === 'IN_PROGRESS')
            return true;
        return false;
    }
    return false;
};
exports.canTransition = canTransition;
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
            if (error || !result)
                return reject(error || new Error('Upload failed'));
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        streamifier_1.default.createReadStream(buffer).pipe(stream);
    });
};
const createRequest = async (requesterId, data, files, req) => {
    const category = await db_1.prisma.requestCategory.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive)
        throw new AppError_1.AppError(400, 'Invalid or inactive category', 'INVALID_CATEGORY');
    let referenceNo = (0, generateReference_1.generateReference)();
    let attempts = 0;
    while (attempts < 5) {
        const exists = await db_1.prisma.serviceRequest.findUnique({ where: { referenceNo } });
        if (!exists)
            break;
        referenceNo = (0, generateReference_1.generateReference)();
        attempts++;
    }
    const dueAt = new Date(Date.now() + category.slaHours * 60 * 60 * 1000);
    const serviceRequest = await db_1.prisma.serviceRequest.create({
        data: {
            referenceNo,
            title: data.title,
            categoryId: data.categoryId,
            location: data.location,
            roomNumber: data.roomNumber,
            description: data.description,
            requesterId,
            dueAt,
        },
        include: { category: true, requester: true },
    });
    // Upload images
    for (const file of files) {
        try {
            const { url, publicId } = await uploadToCloudinary(file.buffer, `fixit/evidence`);
            await db_1.prisma.attachment.create({
                data: {
                    requestId: serviceRequest.id,
                    url,
                    publicId,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    kind: 'EVIDENCE',
                    uploadedById: requesterId,
                },
            });
        }
        catch (err) {
            console.error('Image upload failed:', err);
        }
    }
    await db_1.prisma.statusUpdate.create({
        data: {
            requestId: serviceRequest.id,
            toStatus: 'SUBMITTED',
            note: 'Request submitted',
            actorId: requesterId,
        },
    });
    await (0, auditLogger_1.auditLog)(requesterId, 'REQUEST_CREATED', 'ServiceRequest', serviceRequest.id, { referenceNo }, req);
    // Notify admins
    const admins = await db_1.prisma.user.findMany({
        where: { role: { name: 'ADMIN' }, isActive: true },
    });
    for (const admin of admins) {
        await db_1.prisma.notification.create({
            data: {
                userId: admin.id,
                title: 'New maintenance request',
                body: `${serviceRequest.referenceNo}: ${serviceRequest.title}`,
                link: `/admin/requests/${serviceRequest.id}`,
            },
        });
        (0, socket_1.emitToUser)(admin.id, 'notification:new', { title: 'New maintenance request', body: serviceRequest.referenceNo });
    }
    (0, socket_1.emitToRole)('ADMIN', 'request:created', { id: serviceRequest.id, referenceNo });
    try {
        await (0, mailer_1.sendMail)(serviceRequest.requester.email, `Request Submitted – ${referenceNo}`, mailer_1.emailTemplates.requestSubmitted(referenceNo, serviceRequest.title));
    }
    catch { }
    return serviceRequest;
};
exports.createRequest = createRequest;
const listRequests = async (userId, role, query) => {
    const { skip, take } = (0, pagination_1.getPagination)(Number(query.page || 1), Number(query.limit || 10));
    const where = {};
    if (role === 'REQUESTER') {
        where.requesterId = userId;
    }
    else if (role === 'OFFICER') {
        where.assignments = { some: { officerId: userId, status: { in: ['ACTIVE', 'COMPLETED'] } } };
    }
    if (query.status)
        where.status = query.status;
    if (query.priority)
        where.priority = query.priority;
    if (query.category)
        where.categoryId = query.category;
    if (query.officerId && role === 'ADMIN') {
        where.assignments = { some: { officerId: query.officerId } };
    }
    if (query.search) {
        where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { referenceNo: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    if (query.dateFrom || query.dateTo) {
        where.createdAt = {
            ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
            ...(query.dateTo && { lte: new Date(query.dateTo) }),
        };
    }
    const orderBy = {};
    const validSortFields = ['createdAt', 'updatedAt', 'status', 'priority', 'dueAt'];
    const sortField = validSortFields.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
    orderBy[sortField] = query.order === 'asc' ? 'asc' : 'desc';
    const [requests, total] = await Promise.all([
        db_1.prisma.serviceRequest.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                category: true,
                requester: { select: { id: true, fullName: true, email: true } },
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: { officer: { select: { id: true, fullName: true, specialization: true } } },
                    take: 1,
                },
                _count: { select: { attachments: true, comments: true } },
            },
        }),
        db_1.prisma.serviceRequest.count({ where }),
    ]);
    return {
        data: requests,
        meta: (0, pagination_1.getMeta)(total, Number(query.page || 1), Number(query.limit || 10)),
    };
};
exports.listRequests = listRequests;
const getRequestStats = async (userId, role) => {
    if (role === 'REQUESTER') {
        const [total, open, inProgress, completed] = await Promise.all([
            db_1.prisma.serviceRequest.count({ where: { requesterId: userId } }),
            db_1.prisma.serviceRequest.count({ where: { requesterId: userId, status: 'SUBMITTED' } }),
            db_1.prisma.serviceRequest.count({ where: { requesterId: userId, status: 'IN_PROGRESS' } }),
            db_1.prisma.serviceRequest.count({ where: { requesterId: userId, status: 'COMPLETED' } }),
        ]);
        return { total, open, inProgress, completed };
    }
    if (role === 'OFFICER') {
        const [assigned, inProgress, completedToday, overdue] = await Promise.all([
            db_1.prisma.assignment.count({ where: { officerId: userId, status: 'ACTIVE' } }),
            db_1.prisma.serviceRequest.count({
                where: { assignments: { some: { officerId: userId, status: 'ACTIVE' } }, status: 'IN_PROGRESS' },
            }),
            db_1.prisma.assignment.count({
                where: {
                    officerId: userId,
                    status: 'COMPLETED',
                    completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            db_1.prisma.serviceRequest.count({
                where: {
                    assignments: { some: { officerId: userId, status: 'ACTIVE' } },
                    dueAt: { lt: new Date() },
                    status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] },
                },
            }),
        ]);
        return { assigned, inProgress, completedToday, overdue };
    }
    // ADMIN — rich stats for dashboard
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [totalRequests, openRequests, completedToday, slaBreaches, totalUsers, byStatusRaw, byCategoryRaw, resolvedWithTime] = await Promise.all([
        db_1.prisma.serviceRequest.count(),
        db_1.prisma.serviceRequest.count({ where: { status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] } } }),
        db_1.prisma.serviceRequest.count({ where: { status: { in: ['COMPLETED', 'CLOSED'] }, resolvedAt: { gte: todayStart } } }),
        db_1.prisma.serviceRequest.count({
            where: { dueAt: { lt: new Date() }, status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] } },
        }),
        db_1.prisma.user.count(),
        db_1.prisma.serviceRequest.groupBy({ by: ['status'], _count: { id: true } }),
        db_1.prisma.serviceRequest.groupBy({ by: ['categoryId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6 }),
        db_1.prisma.serviceRequest.findMany({ where: { resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true }, take: 200 }),
    ]);
    const avgResolutionHours = resolvedWithTime.length > 0
        ? Math.round(resolvedWithTime.reduce((acc, r) => acc + (r.resolvedAt.getTime() - r.createdAt.getTime()) / 3600000, 0) / resolvedWithTime.length * 10) / 10
        : 0;
    const requestsByStatus = byStatusRaw.map(s => ({ status: s.status, count: s._count.id }));
    const categoryIds = byCategoryRaw.map(r => r.categoryId);
    const categories = await db_1.prisma.requestCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } });
    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const requestsByCategory = byCategoryRaw.map(r => ({ category: catMap[r.categoryId] ?? r.categoryId, count: r._count.id }));
    // Last 7 days trend
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        const count = await db_1.prisma.serviceRequest.count({ where: { createdAt: { gte: d, lte: end } } });
        weeklyTrend.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }
    return { totalRequests, openRequests, completedToday, avgResolutionHours, slaBreaches, totalUsers, requestsByStatus, requestsByCategory, weeklyTrend };
};
exports.getRequestStats = getRequestStats;
const getRequest = async (requestId, userId, role) => {
    const request = await db_1.prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
            category: true,
            requester: { select: { id: true, fullName: true, email: true, department: true } },
            assignments: {
                include: {
                    officer: { select: { id: true, fullName: true, email: true, specialization: true } },
                    assignedBy: { select: { id: true, fullName: true } },
                },
                orderBy: { assignedAt: 'desc' },
            },
            statusUpdates: {
                include: { actor: { select: { id: true, fullName: true, role: true } } },
                orderBy: { createdAt: 'asc' },
            },
            attachments: { orderBy: { createdAt: 'asc' } },
            comments: {
                include: { author: { select: { id: true, fullName: true, role: true } } },
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    const isOwner = request.requesterId === userId;
    const isAssignedOfficer = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId && a.status === 'ACTIVE');
    if (role !== 'ADMIN' && !isOwner && !isAssignedOfficer) {
        throw new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    // Filter internal comments from requesters
    if (role === 'REQUESTER') {
        request.comments = request.comments.filter((c) => !c.isInternal);
    }
    return request;
};
exports.getRequest = getRequest;
const updateRequest = async (requestId, userId, role, data) => {
    const request = await db_1.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    if (role !== 'ADMIN') {
        if (request.requesterId !== userId)
            throw new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
        if (request.status !== 'SUBMITTED')
            throw new AppError_1.AppError(409, 'Can only edit while SUBMITTED', 'INVALID_STATUS');
    }
    return db_1.prisma.serviceRequest.update({ where: { id: requestId }, data });
};
exports.updateRequest = updateRequest;
const transitionStatus = async (requestId, userId, role, toStatus, note, files, req) => {
    const request = await db_1.prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
            requester: true,
            assignments: { where: { status: 'ACTIVE' }, include: { officer: true } },
        },
    });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    const isOwner = request.requesterId === userId;
    const isAssignedOfficer = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId);
    if (role === 'OFFICER' && !isAssignedOfficer) {
        throw new AppError_1.AppError(403, 'You are not assigned to this request', 'FORBIDDEN');
    }
    if (!(0, exports.canTransition)(request.status, toStatus, role, isOwner)) {
        throw new AppError_1.AppError(409, `Cannot transition from ${request.status} to ${toStatus}`, 'INVALID_TRANSITION');
    }
    if (toStatus === 'COMPLETED') {
        if (files.length === 0) {
            throw new AppError_1.AppError(400, 'At least one completion proof image is required', 'PROOF_REQUIRED');
        }
        for (const file of files) {
            const { url, publicId } = await uploadToCloudinary(file.buffer, 'fixit/completion');
            await db_1.prisma.attachment.create({
                data: {
                    requestId,
                    url,
                    publicId,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    kind: 'COMPLETION_PROOF',
                    uploadedById: userId,
                },
            });
        }
        // Mark assignment completed
        await db_1.prisma.assignment.updateMany({
            where: { requestId, status: 'ACTIVE' },
            data: { status: 'COMPLETED', completedAt: new Date() },
        });
    }
    const updateData = { status: toStatus };
    if (toStatus === 'COMPLETED')
        updateData.resolvedAt = new Date();
    if (toStatus === 'CLOSED')
        updateData.closedAt = new Date();
    const updated = await db_1.prisma.serviceRequest.update({
        where: { id: requestId },
        data: updateData,
    });
    await db_1.prisma.statusUpdate.create({
        data: {
            requestId,
            fromStatus: request.status,
            toStatus,
            note,
            actorId: userId,
        },
    });
    await (0, auditLogger_1.auditLog)(userId, 'STATUS_CHANGED', 'ServiceRequest', requestId, {
        from: request.status,
        to: toStatus,
    }, req);
    // Notifications
    const notifyUserId = request.requesterId;
    if (notifyUserId !== userId) {
        await db_1.prisma.notification.create({
            data: {
                userId: notifyUserId,
                title: `Request ${toStatus.replace('_', ' ')}`,
                body: `${request.referenceNo} status changed to ${toStatus}`,
                link: `/requests/${requestId}`,
            },
        });
        (0, socket_1.emitToUser)(notifyUserId, 'notification:new', { title: 'Status update', body: toStatus });
    }
    (0, socket_1.emitToRequest)(requestId, 'request:statusChanged', { requestId, status: toStatus });
    (0, socket_1.emitToRole)('ADMIN', 'request:statusChanged', { requestId, status: toStatus });
    try {
        await (0, mailer_1.sendMail)(request.requester.email, `Request Status Updated – ${request.referenceNo}`, mailer_1.emailTemplates.statusChanged(request.referenceNo, toStatus));
    }
    catch { }
    return updated;
};
exports.transitionStatus = transitionStatus;
const setPriority = async (requestId, priority) => {
    const request = await db_1.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    return db_1.prisma.serviceRequest.update({ where: { id: requestId }, data: { priority: priority } });
};
exports.setPriority = setPriority;
const addAttachments = async (requestId, userId, role, files) => {
    const request = await db_1.prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: { assignments: { where: { status: 'ACTIVE' } } },
    });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    const isOwner = request.requesterId === userId;
    const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId);
    if (!isOwner && !isAssigned && role !== 'ADMIN') {
        throw new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    const attachments = [];
    for (const file of files) {
        const { url, publicId } = await uploadToCloudinary(file.buffer, 'fixit/evidence');
        const att = await db_1.prisma.attachment.create({
            data: {
                requestId,
                url,
                publicId,
                fileName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                kind: 'EVIDENCE',
                uploadedById: userId,
            },
        });
        attachments.push(att);
    }
    return attachments;
};
exports.addAttachments = addAttachments;
const deleteAttachment = async (requestId, attId, userId, role) => {
    const att = await db_1.prisma.attachment.findFirst({ where: { id: attId, requestId } });
    if (!att)
        throw new AppError_1.AppError(404, 'Attachment not found', 'NOT_FOUND');
    if (att.uploadedById !== userId && role !== 'ADMIN') {
        throw new AppError_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    if (att.publicId) {
        try {
            await cloudinary_1.cloudinary.uploader.destroy(att.publicId);
        }
        catch { }
    }
    await db_1.prisma.attachment.delete({ where: { id: attId } });
};
exports.deleteAttachment = deleteAttachment;
const rateRequest = async (requestId, userId, rating, feedback) => {
    const request = await db_1.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request)
        throw new AppError_1.AppError(404, 'Request not found', 'NOT_FOUND');
    if (request.requesterId !== userId)
        throw new AppError_1.AppError(403, 'Only the requester can rate', 'FORBIDDEN');
    if (!['COMPLETED', 'CLOSED'].includes(request.status)) {
        throw new AppError_1.AppError(409, 'Can only rate completed or closed requests', 'INVALID_STATUS');
    }
    return db_1.prisma.serviceRequest.update({ where: { id: requestId }, data: { rating, feedback } });
};
exports.rateRequest = rateRequest;
//# sourceMappingURL=requests.service.js.map