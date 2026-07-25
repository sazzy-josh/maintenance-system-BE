import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'
import { Prisma } from '@prisma/client'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.errors && { errors: err.errors }),
    })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[]
      const field = Array.isArray(target) ? target[0] : 'field'
      return res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists`,
        code: 'DUPLICATE_ENTRY',
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
      })
    }
  }

  console.error(`[${req.headers['x-request-id']}]`, err)

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  })
}
