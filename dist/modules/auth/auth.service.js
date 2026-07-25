"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = exports.generateTokens = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../config/db");
const AppError_1 = require("../../utils/AppError");
const mailer_1 = require("../../config/mailer");
const BCRYPT_ROUNDS = 12;
const generateTokens = async (userId, email, role) => {
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId, email, role }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') });
    const refreshTokenHash = await bcryptjs_1.default.hash(refreshToken, 10);
    await db_1.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const registerUser = async (data) => {
    const existing = await db_1.prisma.user.findFirst({
        where: { OR: [{ email: data.email }, { matricOrStaffId: data.matricOrStaffId }] },
    });
    if (existing) {
        if (existing.email === data.email)
            throw new AppError_1.AppError(409, 'Email already registered', 'DUPLICATE_ENTRY');
        throw new AppError_1.AppError(409, 'Matric/Staff ID already registered', 'DUPLICATE_ENTRY');
    }
    const requesterRole = await db_1.prisma.role.findUnique({ where: { name: 'REQUESTER' } });
    if (!requesterRole)
        throw new AppError_1.AppError(500, 'Role not configured', 'SETUP_ERROR');
    const passwordHash = await bcryptjs_1.default.hash(data.password, BCRYPT_ROUNDS);
    const user = await db_1.prisma.user.create({
        data: {
            fullName: data.fullName,
            email: data.email,
            matricOrStaffId: data.matricOrStaffId,
            phone: data.phone,
            department: data.department,
            passwordHash,
            roleId: requesterRole.id,
        },
        include: { role: true },
    });
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role.name };
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await db_1.prisma.user.findUnique({
        where: { email },
        include: { role: true },
    });
    if (!user)
        throw new AppError_1.AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    if (!user.isActive)
        throw new AppError_1.AppError(403, 'Account is deactivated', 'INACTIVE_ACCOUNT');
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw new AppError_1.AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    await db_1.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await (0, exports.generateTokens)(user.id, user.email, user.role.name);
    return {
        tokens,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role.name,
            department: user.department,
            phone: user.phone,
            specialization: user.specialization,
        },
    };
};
exports.loginUser = loginUser;
const refreshAccessToken = async (refreshToken) => {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    }
    catch {
        throw new AppError_1.AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }
    const user = await db_1.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
    });
    if (!user || !user.refreshTokenHash || !user.isActive) {
        throw new AppError_1.AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }
    const valid = await bcryptjs_1.default.compare(refreshToken, user.refreshTokenHash);
    if (!valid)
        throw new AppError_1.AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    return (0, exports.generateTokens)(user.id, user.email, user.role.name);
};
exports.refreshAccessToken = refreshAccessToken;
const logoutUser = async (userId) => {
    await db_1.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
};
exports.logoutUser = logoutUser;
const getMe = async (userId) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
    });
    if (!user)
        throw new AppError_1.AppError(404, 'User not found', 'NOT_FOUND');
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
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
exports.getMe = getMe;
const forgotPassword = async (email) => {
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return; // silently return to prevent user enumeration
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    // Store token hash in refreshTokenHash field temporarily (reuse)
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: `reset:${tokenHash}:${expires.getTime()}` },
    });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await (0, mailer_1.sendMail)(email, 'Password Reset Request – MIVA FixIt', `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Reset Your Password</h2>
      <p>You requested a password reset. Click the link below to set a new password.</p>
      <p><a href="${resetUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
      <p>This link expires in 30 minutes. If you did not request a reset, ignore this email.</p>
    </div>
    `);
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (token, newPassword) => {
    const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
    const users = await db_1.prisma.user.findMany({
        where: { refreshTokenHash: { startsWith: 'reset:' } },
    });
    const user = users.find((u) => {
        if (!u.refreshTokenHash)
            return false;
        const parts = u.refreshTokenHash.split(':');
        if (parts.length !== 3 || parts[0] !== 'reset')
            return false;
        if (parts[1] !== tokenHash)
            return false;
        return Date.now() < Number(parts[2]);
    });
    if (!user)
        throw new AppError_1.AppError(400, 'Invalid or expired reset token', 'INVALID_TOKEN');
    const passwordHash = await bcryptjs_1.default.hash(newPassword, BCRYPT_ROUNDS);
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, refreshTokenHash: null },
    });
};
exports.resetPassword = resetPassword;
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError_1.AppError(404, 'User not found', 'NOT_FOUND');
    const valid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!valid)
        throw new AppError_1.AppError(400, 'Current password is incorrect', 'INVALID_CREDENTIALS');
    const passwordHash = await bcryptjs_1.default.hash(newPassword, BCRYPT_ROUNDS);
    await db_1.prisma.user.update({ where: { id: userId }, data: { passwordHash, refreshTokenHash: null } });
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.service.js.map