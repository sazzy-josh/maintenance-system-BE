export class AppError extends Error {
  statusCode: number
  code: string
  errors?: { field: string; message: string }[]

  constructor(
    statusCode: number,
    message: string,
    code = 'INTERNAL_ERROR',
    errors?: { field: string; message: string }[]
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.errors = errors
    Error.captureStackTrace(this, this.constructor)
  }
}
