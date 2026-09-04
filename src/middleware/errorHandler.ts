import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError.js'
import { logger } from '../lib/logger.js'

function isAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false

  return (
    err.name === 'AbortError' ||
    err.message === 'Operation aborted' ||
    err.message === 'Client disconnected' ||
    err.message === 'Request timed out'
  )
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // DEBUG LOGGING
  console.error("=== ERROR HANDLER DEBUG ===")
  console.error("Error:", err)
  console.error("Error name:", err instanceof Error ? err.name : 'not an Error')
  console.error("Error message:", err instanceof Error ? err.message : 'N/A')
  console.error("abortSignal.aborted:", req.abortSignal?.aborted)
  console.error("isAbortError:", isAbortError(err))
  console.error("===========================")
  
  if (isAbortError(err) || req.abortSignal?.aborted) {
    logger.warn(
      {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
      },
      'request aborted',
    )

    if (!res.headersSent) {
      res.status(499).json({
        code: 'REQUEST_ABORTED',
        message: 'Request was aborted',
        correlationId: req.correlationId,
      })
    }

    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code ?? 'APP_ERROR',
      message: err.message,
      details: err.details,
      correlationId: req.correlationId,
    })
    return
  }

  if (err instanceof Error) {
    logger.error(
      {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        error: err.message,
        stack: err.stack,
      },
      'request error',
    )

    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      correlationId: req.correlationId,
    })
    return
  }

  logger.error(
    {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      error: 'unknown',
    },
    'unknown error',
  )

  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong',
    correlationId: req.correlationId,
  })
}
