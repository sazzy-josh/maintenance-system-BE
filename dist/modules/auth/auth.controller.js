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
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.me = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const authService = __importStar(require("./auth.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const auditLogger_1 = require("../../middleware/auditLogger");
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await authService.registerUser(req.body);
    await (0, auditLogger_1.auditLog)(user.id, 'USER_REGISTERED', 'User', user.id, { email: user.email }, req);
    return (0, response_1.created)(res, user, 'Registration successful');
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { tokens, user } = await authService.loginUser(req.body.email, req.body.password);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    await (0, auditLogger_1.auditLog)(user.id, 'LOGIN_SUCCESS', 'User', user.id, {}, req);
    return (0, response_1.success)(res, { accessToken: tokens.accessToken, user }, 'Login successful');
});
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'No refresh token', code: 'UNAUTHENTICATED' });
    }
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    return (0, response_1.success)(res, { accessToken: tokens.accessToken }, 'Token refreshed');
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user) {
        await authService.logoutUser(req.user.id);
        await (0, auditLogger_1.auditLog)(req.user.id, 'LOGOUT', 'User', req.user.id, {}, req);
    }
    res.clearCookie('refreshToken');
    return (0, response_1.success)(res, null, 'Logged out successfully');
});
exports.me = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    return (0, response_1.success)(res, user);
});
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    return (0, response_1.success)(res, null, 'If that email is registered, a reset link has been sent');
});
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.resetPassword(req.params.token, req.body.password);
    return (0, response_1.success)(res, null, 'Password reset successfully');
});
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    return (0, response_1.success)(res, null, 'Password changed successfully');
});
//# sourceMappingURL=auth.controller.js.map