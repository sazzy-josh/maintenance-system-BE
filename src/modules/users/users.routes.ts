import { Router } from 'express'
import * as usersController from './users.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { createUserSchema, updateUserSchema, changeRoleSchema, listUsersSchema } from './users.schema'

const router = Router()

router.use(authenticate)

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Forbidden }
 */
router.get('/', authorize('ADMIN'), validate(listUsersSchema, 'query'), usersController.listUsers)

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user with any role (admin only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, matricOrStaffId, password, role]
 *     responses:
 *       201: { description: User created }
 *       403: { description: Forbidden }
 */
router.post('/', authorize('ADMIN'), validate(createUserSchema), usersController.createUser)

/**
 * @swagger
 * /users/officers:
 *   get:
 *     summary: Get officers with active job counts (admin only)
 *     tags: [Users]
 *     responses:
 *       200: { description: Officers list }
 */
router.get('/officers', authorize('ADMIN'), usersController.getOfficers)

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User data }
 *       403: { description: Forbidden (non-admin accessing others) }
 *       404: { description: Not found }
 */
router.get('/:id', usersController.getUser)

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User updated }
 */
router.patch('/:id', validate(updateUserSchema), usersController.updateUser)

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Change user role (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Role changed }
 *       403: { description: Forbidden }
 */
router.patch('/:id/role', authorize('ADMIN'), validate(changeRoleSchema), usersController.changeRole)

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user (admin only)
 *     tags: [Users]
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Status changed }
 */
router.patch('/:id/status', authorize('ADMIN'), usersController.changeStatus)

export default router
