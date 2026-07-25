import { Response } from 'express'

interface Meta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

export const success = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200,
  meta?: Meta
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  })
}

export const created = (res: Response, data: unknown, message = 'Created') =>
  success(res, data, message, 201)

export const noContent = (res: Response) => res.status(204).send()
