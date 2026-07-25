import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export const authorize =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'))
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'))
    }
    next()
  }
