import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

export const requestId = (_req: Request, res: Response, next: NextFunction) => {
  const id = uuidv4()
  res.setHeader('X-Request-Id', id)
  next()
}
