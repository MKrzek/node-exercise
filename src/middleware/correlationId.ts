import type { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'node:crypto'

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  req.correlationId =
    (req.headers['x-request-id'] as string) ??
    (req.headers['x-correlation-id'] as string) ??
    randomUUID()
  res.setHeader('X-Correlation-Id', req.correlationId)
  next()
}
