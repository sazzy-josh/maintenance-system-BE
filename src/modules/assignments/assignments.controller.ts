import { Request, Response } from 'express'
import * as assignmentsService from './assignments.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success, created } from '../../utils/response'
import { validate } from '../../middleware/validate'
import { z } from 'zod'

const assignSchema = z.object({
  requestId: z.string().uuid(),
  officerId: z.string().uuid(),
  note: z.string().optional(),
})

const reassignSchema = z.object({
  officerId: z.string().uuid(),
  note: z.string().optional(),
})

export const assignRequest = asyncHandler(async (req: Request, res: Response) => {
  const parsed = assignSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' })
  const assignment = await assignmentsService.assignRequest(req.user!.id, parsed.data, req)
  return created(res, assignment, 'Request assigned successfully')
})

export const reassignRequest = asyncHandler(async (req: Request, res: Response) => {
  const parsed = reassignSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' })
  const assignment = await assignmentsService.reassignRequest(req.params.id, req.user!.id, parsed.data, req)
  return success(res, assignment, 'Request reassigned successfully')
})

export const getMyAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assignmentsService.getMyAssignments(req.user!.id)
  return success(res, assignments)
})

export const getRequestAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assignmentsService.getRequestAssignments(req.params.requestId, req.user!.id, req.user!.role)
  return success(res, assignments)
})
