import { Request, Response } from 'express'
import * as categoriesService from './categories.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success, created } from '../../utils/response'

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.all === 'true' && req.user?.role === 'ADMIN'
  const categories = await categoriesService.listCategories(includeInactive)
  return success(res, categories)
})

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.createCategory(req.body)
  return created(res, category, 'Category created')
})

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.updateCategory(req.params.id, req.body)
  return success(res, category, 'Category updated')
})

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoriesService.deleteCategory(req.params.id)
  if (result.deactivated) {
    return success(res, null, 'Category has requests — deactivated instead of deleted')
  }
  return success(res, null, 'Category deleted')
})
