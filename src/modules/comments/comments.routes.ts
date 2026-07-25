import { Router } from 'express'
import * as commentsController from './comments.controller'
import { authenticate } from '../../middleware/authenticate'

// Mounted at /api/v1/requests/:id/comments
const router = Router({ mergeParams: true })
router.use(authenticate)

/**
 * @swagger
 * /requests/{id}/comments:
 *   get:
 *     summary: Get comments for a request
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Comments list }
 */
router.get('/', commentsController.getComments)

/**
 * @swagger
 * /requests/{id}/comments:
 *   post:
 *     summary: Add a comment to a request
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *               isInternal: { type: boolean }
 *     responses:
 *       201: { description: Comment added }
 */
router.post('/', commentsController.addComment)

export default router
