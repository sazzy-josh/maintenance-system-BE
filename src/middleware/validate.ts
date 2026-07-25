import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from '../utils/AppError'

export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors))
    }
    req[target] = result.data
    next()
  }
