// src/utils/asyncHandler.js
import type { Request, Response, NextFunction, RequestHandler } from 'express'

type callbackFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response | any>

export function asyncHandler(fn: callbackFn): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
