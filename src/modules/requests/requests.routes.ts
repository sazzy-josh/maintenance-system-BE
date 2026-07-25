import { Router } from 'express'
import * as requestsController from './requests.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { upload } from '../../middleware/upload'
import {
  createRequestSchema,
  updateRequestSchema,
  statusUpdateSchema,
  setPrioritySchema,
  ratingSchema,
  listRequestsSchema,
} from './requests.schema'
import commentsRouter from '../comments/comments.routes'

const router = Router()
router.use(authenticate)

// Mount comments sub-router
router.use('/:id/comments', commentsRouter)

/**
 * @swagger
 * /requests:
 *   post:
 *     summary: Submit a new service request
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, categoryId, location, description]
 *             properties:
 *               title: { type: string }
 *               categoryId: { type: string }
 *               location: { type: string }
 *               roomNumber: { type: string }
 *               description: { type: string }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201: { description: Request created }
 */
router.post(
  '/',
  authorize('REQUESTER', 'ADMIN'),
  upload.array('images', 3),
  validate(createRequestSchema),
  requestsController.createRequest
)

/**
 * @swagger
 * /requests:
 *   get:
 *     summary: List service requests (scoped by role)
 *     tags: [Requests]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated request list }
 */
router.get('/', validate(listRequestsSchema, 'query'), requestsController.listRequests)

/**
 * @swagger
 * /requests/stats:
 *   get:
 *     summary: Get role-scoped dashboard stats
 *     tags: [Requests]
 *     responses:
 *       200: { description: Stats object }
 */
router.get('/stats', requestsController.getStats)

/**
 * @swagger
 * /requests/{id}:
 *   get:
 *     summary: Get full request detail
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Request detail with timeline }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.get('/:id', requestsController.getRequest)

/**
 * @swagger
 * /requests/{id}:
 *   patch:
 *     summary: Edit a request (owner while SUBMITTED, or admin)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Request updated }
 */
router.patch('/:id', validate(updateRequestSchema), requestsController.updateRequest)

/**
 * @swagger
 * /requests/{id}/status:
 *   patch:
 *     summary: Transition request status
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Status transitioned }
 *       409: { description: Invalid transition }
 */
router.patch(
  '/:id/status',
  upload.array('images', 3),
  validate(statusUpdateSchema),
  requestsController.transitionStatus
)

/**
 * @swagger
 * /requests/{id}/priority:
 *   patch:
 *     summary: Set priority (admin only)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Priority updated }
 */
router.patch('/:id/priority', authorize('ADMIN'), validate(setPrioritySchema), requestsController.setPriority)

/**
 * @swagger
 * /requests/{id}/attachments:
 *   post:
 *     summary: Upload additional images to a request
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Attachments uploaded }
 */
router.post('/:id/attachments', upload.array('images', 3), requestsController.addAttachments)

/**
 * @swagger
 * /requests/{id}/attachments/{attId}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attachment deleted }
 */
router.delete('/:id/attachments/:attId', requestsController.deleteAttachment)

/**
 * @swagger
 * /requests/{id}/rating:
 *   post:
 *     summary: Rate a completed request
 *     tags: [Requests]
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
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               feedback: { type: string }
 *     responses:
 *       200: { description: Rating submitted }
 */
router.post('/:id/rating', validate(ratingSchema), requestsController.rateRequest)

export default router
