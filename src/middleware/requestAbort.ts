import type { NextFunction, Request, Response } from 'express'

export function requestAbortMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const controller = new AbortController()

  req.abortController = controller
  req.abortSignal = controller.signal

  const abortWork = () => {
    if (!controller.signal.aborted) {
      controller.abort(new Error('Client disconnected'))
    }
  }

  req.on('close', abortWork)
  res.on('close', abortWork)

  const cleanup = () => {
    req.off('close', abortWork)
    res.off('close', abortWork)
  }

  res.on('finish', cleanup)
  res.on('close', cleanup)

  next()
}
