import { prisma } from '../../config/db'
import { getPagination, getMeta } from '../../utils/pagination'

export const getNotifications = async (userId: string, page = 1, limit = 20) => {
  const { skip, take } = getPagination(page, limit)
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where: { userId } }),
  ])
  return { data: notifications, meta: getMeta(total, page, limit) }
}

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } })
}

export const markRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  })
}

export const markAllRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}
