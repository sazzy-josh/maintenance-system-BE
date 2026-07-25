"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.markRead = exports.getUnreadCount = exports.getNotifications = void 0;
const db_1 = require("../../config/db");
const pagination_1 = require("../../utils/pagination");
const getNotifications = async (userId, page = 1, limit = 20) => {
    const { skip, take } = (0, pagination_1.getPagination)(page, limit);
    const [notifications, total] = await Promise.all([
        db_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        db_1.prisma.notification.count({ where: { userId } }),
    ]);
    return { data: notifications, meta: (0, pagination_1.getMeta)(total, page, limit) };
};
exports.getNotifications = getNotifications;
const getUnreadCount = async (userId) => {
    return db_1.prisma.notification.count({ where: { userId, isRead: false } });
};
exports.getUnreadCount = getUnreadCount;
const markRead = async (notificationId, userId) => {
    return db_1.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
    });
};
exports.markRead = markRead;
const markAllRead = async (userId) => {
    return db_1.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
};
exports.markAllRead = markAllRead;
//# sourceMappingURL=notifications.service.js.map