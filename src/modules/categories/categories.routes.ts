import { Router } from 'express'
import * as categoriesController from './categories.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { z } from 'zod'

const router = Router()
router.use(authenticate)

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  slaHours: z.number().int().positive().optional(),
})

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: Include inactive (admin only)
 *     responses:
 *       200: { description: Categories list }
 */
router.get('/', categoriesController.listCategories)

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     responses:
 *       201: { description: Category created }
 */
router.post('/', authorize('ADMIN'), validate(categorySchema), categoriesController.createCategory)

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category updated }
 */
router.patch('/:id', authorize('ADMIN'), categoriesController.updateCategory)

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete or deactivate a category (admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category deleted or deactivated }
 */
router.delete('/:id', authorize('ADMIN'), categoriesController.deleteCategory)

export default router
