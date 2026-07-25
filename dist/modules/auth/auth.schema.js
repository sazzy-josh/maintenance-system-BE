"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
exports.registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    matricOrStaffId: zod_1.z.string().min(6).max(20).regex(/^[a-zA-Z0-9]+$/, 'Alphanumeric only'),
    phone: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    password: zod_1.z.string().regex(passwordRegex, 'Password must be at least 8 chars with uppercase, lowercase, digit, and symbol'),
    confirmPassword: zod_1.z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().regex(passwordRegex, 'Password must be at least 8 chars with uppercase, lowercase, digit, and symbol'),
    confirmPassword: zod_1.z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().regex(passwordRegex, 'Password must be at least 8 chars with uppercase, lowercase, digit, and symbol'),
});
//# sourceMappingURL=auth.schema.js.map