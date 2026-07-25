"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeStatus = exports.changeRole = exports.updateUser = exports.createUser = exports.getUser = exports.getOfficers = exports.listUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../../config/db");
const AppError_1 = require("../../utils/AppError");
const pagination_1 = require("../../utils/pagination");
const listUsers = async (query) => {
    const { skip, take } = (0, pagination_1.getPagination)(Number(query.page), Number(query.limit));
    const where = {};
    if (query.role) {
        const role = await db_1.prisma.role.findUnique({ where: { name: query.role } });
        if (role)
            where.roleId = role.id;
    }
    if (query.isActive !== undefined)
        where.isActive = query.isActive === 'true';
    if (query.search) {
        where.OR = [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { matricOrStaffId: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    const [users, total] = await Promise.all([
        db_1.prisma.user.findMany({
            where,
            skip,
            take,
            include: { role: true },
            orderBy: { createdAt: 'desc' },
        }),
        db_1.prisma.user.count({ where }),
    ]);
    const data = users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        matricOrStaffId: u.matricOrStaffId,
        phone: u.phone,
        department: u.department,
        role: u.role.name,
        specialization: u.specialization,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
    }));
    return { data, meta: (0, pagination_1.getMeta)(total, Number(query.page), Number(query.limit)) };
};
exports.listUsers = listUsers;
const getOfficers = async () => {
    const officerRole = await db_1.prisma.role.findUnique({ where: { name: 'OFFICER' } });
    if (!officerRole)
        return [];
    const officers = await db_1.prisma.user.findMany({
        where: { roleId: officerRole.id, isActive: true },
        include: {
            assignmentsAsOfficer: {
                where: { status: 'ACTIVE' },
                select: { id: true },
            },
        },
    });
    return officers.map((o) => ({
        id: o.id,
        fullName: o.fullName,
        email: o.email,
        specialization: o.specialization,
        activeJobCount: o.assignmentsAsOfficer.length,
    }));
};
exports.getOfficers = getOfficers;
const getUser = async (id) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id },
        include: { role: true },
    });
    if (!user)
        throw new AppError_1.AppError(404, 'User not found', 'NOT_FOUND');
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        matricOrStaffId: user.matricOrStaffId,
        phone: user.phone,
        department: user.department,
        role: user.role.name,
        specialization: user.specialization,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
    };
};
exports.getUser = getUser;
const createUser = async (data) => {
    const existing = await db_1.prisma.user.findFirst({
        where: { OR: [{ email: data.email }, { matricOrStaffId: data.matricOrStaffId }] },
    });
    if (existing)
        throw new AppError_1.AppError(409, 'Email or Matric/Staff ID already exists', 'DUPLICATE_ENTRY');
    const role = await db_1.prisma.role.findUnique({ where: { name: data.role } });
    if (!role)
        throw new AppError_1.AppError(400, 'Invalid role', 'INVALID_ROLE');
    const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
    const user = await db_1.prisma.user.create({
        data: {
            fullName: data.fullName,
            email: data.email,
            matricOrStaffId: data.matricOrStaffId,
            phone: data.phone,
            department: data.department,
            passwordHash,
            roleId: role.id,
            specialization: data.specialization,
        },
        include: { role: true },
    });
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.name,
        specialization: user.specialization,
    };
};
exports.createUser = createUser;
const updateUser = async (id, data) => {
    const user = await db_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        throw new AppError_1.AppError(404, 'User not found', 'NOT_FOUND');
    const updated = await db_1.prisma.user.update({
        where: { id },
        data,
        include: { role: true },
    });
    return { id: updated.id, fullName: updated.fullName, role: updated.role.name };
};
exports.updateUser = updateUser;
const changeRole = async (id, roleName, specialization) => {
    const role = await db_1.prisma.role.findUnique({ where: { name: roleName } });
    if (!role)
        throw new AppError_1.AppError(400, 'Invalid role', 'INVALID_ROLE');
    await db_1.prisma.user.update({
        where: { id },
        data: { roleId: role.id, specialization: specialization ?? null },
    });
};
exports.changeRole = changeRole;
const changeStatus = async (id, requestingUserId, isActive) => {
    if (id === requestingUserId)
        throw new AppError_1.AppError(400, 'Cannot deactivate your own account', 'SELF_DEACTIVATION');
    const user = await db_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        throw new AppError_1.AppError(404, 'User not found', 'NOT_FOUND');
    await db_1.prisma.user.update({ where: { id }, data: { isActive } });
};
exports.changeStatus = changeStatus;
//# sourceMappingURL=users.service.js.map