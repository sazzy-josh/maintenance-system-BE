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
exports.markAllRead = exports.markRead = exports.getUnreadCount = exports.getNotifications = void 0;
const notificationsService = __importStar(require("./notifications.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
exports.getNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { data, meta } = await notificationsService.getNotifications(req.user.id, Number(req.query.page || 1), Number(req.query.limit || 20));
    return (0, response_1.success)(res, data, 'Notifications retrieved', 200, meta);
});
exports.getUnreadCount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const count = await notificationsService.getUnreadCount(req.user.id);
    return (0, response_1.success)(res, { count });
});
exports.markRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await notificationsService.markRead(req.params.id, req.user.id);
    return (0, response_1.success)(res, null, 'Marked as read');
});
exports.markAllRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await notificationsService.markAllRead(req.user.id);
    return (0, response_1.success)(res, null, 'All marked as read');
});
//# sourceMappingURL=notifications.controller.js.map