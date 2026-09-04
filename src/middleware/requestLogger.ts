import type { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'
import { incrementRequests, incrementErrors } from '../lib/metrics.js'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - start
    incrementRequests(durationMs)
    if (res.statusCode >= 500) incrementErrors()

    logger.info(
      {
        correlationId: req.correlationId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs,
      },
      `${req.method} ${req.originalUrl} ${res.statusCode}`,
    )
  })

  next()
}
