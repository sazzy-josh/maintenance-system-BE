"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersSchema = exports.changeRoleSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
exports.createUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    matricOrStaffId: zod_1.z.string().min(6).max(20).regex(/^[a-zA-Z0-9]+$/),
    phone: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    password: zod_1.z.string().regex(passwordRegex),
    role: zod_1.z.enum(['REQUESTER', 'OFFICER', 'ADMIN']),
    specialization: zod_1.z.enum(['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'IT', 'GENERAL']).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(100).optional(),
    phone: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    specialization: zod_1.z.enum(['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'IT', 'GENERAL']).optional(),
});
exports.changeRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['REQUESTER', 'OFFICER', 'ADMIN']),
    specialization: zod_1.z.enum(['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'IT', 'GENERAL']).optional(),
});
exports.listUsersSchema = zod_1.z.object({
    role: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.string().optional(),
    page: zod_1.z.string().default('1'),
    limit: zod_1.z.string().default('10'),
});
//# sourceMappingURL=users.schema.js.map