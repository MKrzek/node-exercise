import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../errors/AppError.js'
type RequestPart = 'body' | 'query' | 'params'

export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part])

    if (!result.success) {
      next(
        new AppError(
          'Validation failed',
          422,
          'VALIDATION_ERROR',
          result.error.flatten().fieldErrors,
        ),
      )
      return
    }

    // store parsed data in req.parsed instead of overwriting getter
    req.parsed ??= {}
    req.parsed[part] = result.data
    next()
  }
}
