import { Router } from 'express'
import * as notificationsController from './notifications.controller'
import { authenticate } from '../../middleware/authenticate'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get own notifications (paginated)
 *     tags: [Notifications]
 *     responses:
 *       200: { description: Notifications list }
 */
router.get('/', notificationsController.getNotifications)

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     responses:
 *       200: { description: Count }
 */
router.get('/unread-count', notificationsController.getUnreadCount)

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Marked read }
 */
router.patch('/:id/read', notificationsController.markRead)

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200: { description: All marked read }
 */
router.patch('/read-all', notificationsController.markAllRead)

export default router
