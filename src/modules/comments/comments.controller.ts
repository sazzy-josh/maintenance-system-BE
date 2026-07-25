import { Request, Response } from 'express'
import * as commentsService from './comments.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success, created } from '../../utils/response'
import { z } from 'zod'
import { AppError } from '../../utils/AppError'

const commentSchema = z.object({
  body: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
})

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const comments = await commentsService.getComments(req.params.id, req.user!.id, req.user!.role)
  return success(res, comments)
})

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = commentSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR')
  const comment = await commentsService.addComment(
    req.params.id,
    req.user!.id,
    req.user!.role,
    parsed.data.body,
    parsed.data.isInternal
  )
  return created(res, comment, 'Comment added')
})
