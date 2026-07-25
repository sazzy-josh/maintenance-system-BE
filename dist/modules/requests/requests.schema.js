"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRequestsSchema = exports.ratingSchema = exports.setPrioritySchema = exports.statusUpdateSchema = exports.updateRequestSchema = exports.createRequestSchema = void 0;
const zod_1 = require("zod");
exports.createRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    categoryId: zod_1.z.string().uuid(),
    location: zod_1.z.string().min(2).max(200),
    roomNumber: zod_1.z.string().optional(),
    description: zod_1.z.string().min(20).max(5000),
});
exports.updateRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200).optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    location: zod_1.z.string().min(2).max(200).optional(),
    roomNumber: zod_1.z.string().optional(),
    description: zod_1.z.string().min(20).max(5000).optional(),
});
exports.statusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED']),
    note: zod_1.z.string().optional(),
});
exports.setPrioritySchema = zod_1.z.object({
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});
exports.ratingSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    feedback: zod_1.z.string().max(1000).optional(),
});
exports.listRequestsSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    officerId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().default('createdAt'),
    order: zod_1.z.enum(['asc', 'desc']).default('desc'),
    page: zod_1.z.string().default('1'),
    limit: zod_1.z.string().default('10'),
});
//# sourceMappingURL=requests.schema.js.map