"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController = __importStar(require("./auth.controller"));
const validate_1 = require("../../middleware/validate");
const authenticate_1 = require("../../middleware/authenticate");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 5 : 100,
    message: { success: false, message: 'Too many attempts, please try again in 15 minutes', code: 'RATE_LIMITED' },
    skip: () => process.env.NODE_ENV === 'development',
});
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new requester account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, matricOrStaffId, password, confirmPassword]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               matricOrStaffId: { type: string }
 *               phone: { type: string }
 *               department: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 *       400: { description: Validation error }
 *       409: { description: Email or ID already exists }
 */
router.post('/register', authLimiter, (0, validate_1.validate)(auth_schema_1.registerSchema), authController.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful with access token }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, (0, validate_1.validate)(auth_schema_1.loginSchema), authController.login);
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token and get new access token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: New access token issued }
 */
router.post('/refresh', authController.refresh);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authenticate_1.authenticate, authController.logout);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200: { description: Current user data }
 *       401: { description: Unauthenticated }
 */
router.get('/me', authenticate_1.authenticate, authController.me);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset email sent if registered }
 */
router.post('/forgot-password', authLimiter, (0, validate_1.validate)(auth_schema_1.forgotPasswordSchema), authController.forgotPassword);
/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired token }
 */
router.post('/reset-password/:token', (0, validate_1.validate)(auth_schema_1.resetPasswordSchema), authController.resetPassword);
/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change own password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.patch('/change-password', authenticate_1.authenticate, (0, validate_1.validate)(auth_schema_1.changePasswordSchema), authController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map