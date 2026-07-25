import { Request, Response } from 'express'
import * as notificationsService from './notifications.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success } from '../../utils/response'

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await notificationsService.getNotifications(
    req.user!.id,
    Number(req.query.page || 1),
    Number(req.query.limit || 20)
  )
  return success(res, data, 'Notifications retrieved', 200, meta)
})

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationsService.getUnreadCount(req.user!.id)
  return success(res, { count })
})

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markRead(req.params.id, req.user!.id)
  return success(res, null, 'Marked as read')
})

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllRead(req.user!.id)
  return success(res, null, 'All marked as read')
})
