import { Request, Response } from 'express'
import * as usersService from './users.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success, created } from '../../utils/response'
import { AppError } from '../../utils/AppError'
import { auditLog } from '../../middleware/auditLogger'

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await usersService.listUsers(req.query as any)
  return success(res, data, 'Users retrieved', 200, meta)
})

export const getOfficers = asyncHandler(async (req: Request, res: Response) => {
  const officers = await usersService.getOfficers()
  return success(res, officers)
})

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'ADMIN' && req.user!.id !== req.params.id) {
    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
  }
  const user = await usersService.getUser(req.params.id)
  return success(res, user)
})

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body)
  await auditLog(req.user!.id, 'USER_CREATED', 'User', user.id, { role: user.role }, req)
  return created(res, user, 'User created successfully')
})

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'ADMIN' && req.user!.id !== req.params.id) {
    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
  }
  const user = await usersService.updateUser(req.params.id, req.body)
  return success(res, user, 'User updated')
})

export const changeRole = asyncHandler(async (req: Request, res: Response) => {
  await usersService.changeRole(req.params.id, req.body.role, req.body.specialization)
  await auditLog(req.user!.id, 'USER_ROLE_CHANGED', 'User', req.params.id, { role: req.body.role }, req)
  return success(res, null, 'Role updated')
})

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body
  await usersService.changeStatus(req.params.id, req.user!.id, isActive)
  await auditLog(req.user!.id, isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'User', req.params.id, {}, req)
  return success(res, null, `User ${isActive ? 'activated' : 'deactivated'}`)
})
