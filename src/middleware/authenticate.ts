import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db'
import { AppError } from '../utils/AppError'

export interface JwtPayload {
  sub: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        roleId: string
      }
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'))
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    })
    if (!user) {
      return next(new AppError(401, 'User not found', 'UNAUTHENTICATED'))
    }
    if (!user.isActive) {
      return next(new AppError(403, 'Account is inactive', 'INACTIVE_ACCOUNT'))
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
    }
    next()
  } catch {
    return next(new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'))
  }
}
