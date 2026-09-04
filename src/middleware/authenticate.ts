import type { NextFunction, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET_RAW = process.env.JWT_SECRET
if (!JWT_SECRET_RAW) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET: string = JWT_SECRET_RAW

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  // Try to get token from Authorization header first
  let token = req.headers.authorization?.split(' ')[1]

  // If not in header, try cookie
  if (!token && req.cookies) {
    token = req.cookies.token
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email?: string
      role?: string
    }
    req.userId = payload.userId

    // Attach user info for RBAC
    ;(req as any).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role ?? 'user',
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
