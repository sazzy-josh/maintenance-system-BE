import { Router } from 'express'
import * as assignmentsController from './assignments.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Assign a request to an officer (admin only)
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId, officerId]
 *             properties:
 *               requestId: { type: string }
 *               officerId: { type: string }
 *               note: { type: string }
 *     responses:
 *       201: { description: Assigned }
 *       400: { description: Invalid officer }
 */
router.post('/', authorize('ADMIN'), assignmentsController.assignRequest)

/**
 * @swagger
 * /assignments/{id}/reassign:
 *   patch:
 *     summary: Reassign to a different officer (admin only)
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reassigned }
 */
router.patch('/:id/reassign', authorize('ADMIN'), assignmentsController.reassignRequest)

/**
 * @swagger
 * /assignments/my:
 *   get:
 *     summary: Get officer's active assignments
 *     tags: [Assignments]
 *     responses:
 *       200: { description: My assignments }
 */
router.get('/my', authorize('OFFICER'), assignmentsController.getMyAssignments)

/**
 * @swagger
 * /assignments/request/{requestId}:
 *   get:
 *     summary: Get assignment history for a request
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Assignment history }
 */
router.get('/request/:requestId', assignmentsController.getRequestAssignments)

export default router
